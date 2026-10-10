-- Expected concurrency conflicts are protocol results, not retryable SQL serialization failures.
create or replace function public.claim_generation(p_id uuid, p_project uuid, p_user uuid, p_expected uuid, p_fingerprint text, p_lease uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p public.projects; r public.generation_requests;
begin
  select * into p from public.projects where id = p_project and owner_id = p_user for update;
  if not found then raise exception 'Project not found' using errcode = '42501'; end if;
  select * into r from public.generation_requests where id = p_id;
  if found then
    if r.project_id <> p_project or r.user_id <> p_user or r.fingerprint <> p_fingerprint then
      return jsonb_build_object('conflict', 'Request identifier already used for different input');
    end if;
    if r.status = 'complete' then return jsonb_build_object('cached', r.result); end if;
    if r.status = 'running' and r.updated_at > now() - interval '6 minutes' then
      return jsonb_build_object('conflict', 'This request is still running. Try again shortly.');
    end if;
  end if;
  if p.current_version_id is distinct from p_expected then
    return jsonb_build_object('conflict', 'The project changed. Reload before building.');
  end if;
  insert into public.generation_requests(id, project_id, user_id, fingerprint, expected_version_id, lease, status)
    values(p_id,p_project,p_user,p_fingerprint,p_expected,p_lease,'running')
    on conflict(id) do update set lease=p_lease,status='running',updated_at=now();
  return jsonb_build_object('claimed', true);
end; $$;

create or replace function public.finish_generation(p_id uuid, p_user uuid, p_lease uuid, p_files jsonb, p_summary text, p_title text, p_messages jsonb, p_usage jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.generation_requests; p public.projects; v public.versions; m jsonb; outcome jsonb;
begin
  -- Same lock order as claim: project, then ledger.
  select * into r from public.generation_requests where id=p_id and user_id=p_user;
  if not found then raise exception 'Unknown request' using errcode='42501'; end if;
  select * into p from public.projects where id=r.project_id and owner_id=p_user for update;
  if not found then raise exception 'Project not found' using errcode='42501'; end if;
  select * into r from public.generation_requests where id=p_id for update;
  if r.status='complete' then return r.result; end if;
  if r.lease<>p_lease or r.status<>'running' then return jsonb_build_object('conflict', 'Expired request'); end if;
  if p.current_version_id is distinct from r.expected_version_id then return jsonb_build_object('conflict', 'The project changed. Reload before building.'); end if;
  if p_files is not null then
    insert into public.versions(project_id,number,files,summary)
      select p.id,coalesce(max(number),0)+1,p_files,p_summary from public.versions where project_id=p.id returning * into v;
    update public.projects set current_version_id=v.id,title=coalesce(nullif(p_title,''),title) where id=p.id;
  end if;
  for m in select * from jsonb_array_elements(p_messages) loop
    if m->>'role' = 'user' and r.result is not null then continue; end if;
    insert into public.messages(project_id,role,content,meta,version_id)
      values(p.id,m->>'role',m->>'content',coalesce(m->'meta','{}'::jsonb),case when m->>'role' in ('alex','system') then v.id else null end);
  end loop;
  if p_usage is not null then
    insert into public.usage_logs(user_id,project_id,model,input_tokens,output_tokens)
      values(p_user,p.id,p_usage->>'model',(p_usage->>'input')::int,(p_usage->>'output')::int);
  end if;
  outcome := jsonb_build_object('version',case when v.id is null then null else to_jsonb(v) end,'files',p_files);
  update public.generation_requests set status=case when v.id is null then 'failed' else 'complete' end,result=outcome,updated_at=now() where id=p_id;
  return outcome;
end; $$;

create or replace function public.restore_snapshot(p_project uuid,p_user uuid,p_source uuid,p_expected uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.projects; source public.versions; v public.versions; mid uuid;
begin
  select * into p from public.projects where id=p_project and owner_id=p_user for update;
  if not found then raise exception 'Project not found' using errcode='42501'; end if;
  if p.current_version_id is distinct from p_expected then return jsonb_build_object('conflict', 'Project changed. Reload before restoring.'); end if;
  select * into source from public.versions where id=p_source and project_id=p.id;
  if not found then return jsonb_build_object('conflict', 'Version not found'); end if;
  insert into public.versions(project_id,number,files,summary)
    select p.id,coalesce(max(number),0)+1,source.files,'Restored from v'||source.number from public.versions where project_id=p.id returning * into v;
  update public.projects set current_version_id=v.id where id=p.id;
  insert into public.messages(project_id,role,content,meta,version_id) values(p.id,'system',v.summary,jsonb_build_object('kind','restore','from',source.number),v.id) returning id into mid;
  return jsonb_build_object('version',to_jsonb(v)-'files','files',v.files,'messageId',mid);
end; $$;
