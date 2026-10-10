-- Generations no longer have a daily per-account allowance, and every run uses a real model.
-- Idempotent replay, run conflicts and the per-account concurrency guard are unchanged.
-- claim_generation_v2 stays until the previous deployment is replaced.

create function public.claim_generation_v3(p_id uuid,p_project uuid,p_user uuid,p_expected uuid,p_fingerprint text,p_lease uuid,p_concurrency int default 2)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare r public.generation_requests; outcome jsonb; active bigint;
begin
  if p_concurrency < 1 then raise exception 'Invalid concurrency'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  if not exists(select 1 from public.projects where id=p_project and owner_id=p_user) then raise exception 'Project not found' using errcode='42501'; end if;
  select * into r from public.generation_requests where id=p_id;
  if found and r.status='complete' then
    return public.claim_generation(p_id,p_project,p_user,p_expected,p_fingerprint,p_lease);
  end if;
  select count(*) into active from public.generation_attempts where user_id=p_user and status='running' and started_at>now()-interval '6 minutes';
  if active>=p_concurrency then return jsonb_build_object('busy',true,'message','Two builds are already running. Wait for one to finish.'); end if;
  outcome:=public.claim_generation(p_id,p_project,p_user,p_expected,p_fingerprint,p_lease);
  if coalesce((outcome->>'claimed')::boolean,false) then
    insert into public.generation_attempts(id,request_id,user_id,project_id,mock) values(p_lease,p_id,p_user,p_project,false);
  end if;
  return outcome;
end; $$;
revoke all on function public.claim_generation_v3(uuid,uuid,uuid,uuid,text,uuid,int) from public,anon,authenticated;
