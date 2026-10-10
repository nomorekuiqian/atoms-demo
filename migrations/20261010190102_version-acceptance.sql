alter table public.versions add column acceptance jsonb not null default '{"items":[]}';
alter table public.versions add column parent_version_id uuid references public.versions(id) on delete set null;
-- Client snapshots cannot forge provenance/contracts. Existing allowed fields stay compatible.
revoke insert on public.versions from authenticated;
grant insert(project_id,number,files,summary) on public.versions to authenticated;

create function public.finish_generation_v3(p_id uuid,p_user uuid,p_lease uuid,p_files jsonb,p_summary text,p_title text,p_messages jsonb,p_usage jsonb,p_acceptance jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare outcome jsonb; r public.generation_requests; vid uuid;
begin
  perform 1 from public.projects where id=(select project_id from public.generation_requests where id=p_id and user_id=p_user) and owner_id=p_user for update;
  select * into r from public.generation_requests where id=p_id and user_id=p_user;
  if not found then raise exception 'Unknown request' using errcode='42501'; end if;
  outcome:=public.finish_generation(p_id,p_user,p_lease,p_files,p_summary,p_title,p_messages,p_usage);
  vid:=(outcome->'version'->>'id')::uuid;
  if vid is not null and r.status<>'complete' then
    update public.versions set acceptance=coalesce(p_acceptance,'{"items":[]}'::jsonb),parent_version_id=r.expected_version_id where id=vid;
  end if;
  return outcome;
end; $$;
revoke all on function public.finish_generation_v3(uuid,uuid,uuid,jsonb,text,text,jsonb,jsonb,jsonb) from public,anon,authenticated;

create table public.acceptance_observations (
  id uuid primary key,
  version_id uuid not null references public.versions(id) on delete cascade,
  criterion_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  digest text not null,
  kind text not null check(kind in ('manual','automatic')),
  status text not null check(status in ('passed','failed','inconclusive')),
  evidence jsonb not null,
  created_at timestamptz not null default now(),
  sequence bigint generated always as identity
);
alter table public.acceptance_observations enable row level security;
revoke all on public.acceptance_observations from public,anon,authenticated;
grant select on public.acceptance_observations to authenticated;
create policy acceptance_read_owner on public.acceptance_observations for select to authenticated using (
  user_id=(select auth.uid()) and exists(select 1 from public.versions v where v.id=version_id and public.owns_project(v.project_id))
);
create index acceptance_version_sequence_idx on public.acceptance_observations(version_id,sequence desc);

create or replace function public.restore_snapshot(p_project uuid,p_user uuid,p_source uuid,p_expected uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.projects; source public.versions; v public.versions; mid uuid;
begin
  select * into p from public.projects where id=p_project and owner_id=p_user for update;
  if not found then raise exception 'Project not found' using errcode='42501'; end if;
  if p.current_version_id is distinct from p_expected then return jsonb_build_object('conflict', 'Project changed. Reload before restoring.'); end if;
  select * into source from public.versions where id=p_source and project_id=p.id;
  if not found then return jsonb_build_object('conflict', 'Version not found'); end if;
  insert into public.versions(project_id,number,files,summary,acceptance,parent_version_id)
    select p.id,coalesce(max(number),0)+1,source.files,'Restored from v'||source.number,source.acceptance,p.current_version_id from public.versions where project_id=p.id returning * into v;
  update public.projects set current_version_id=v.id where id=p.id;
  insert into public.messages(project_id,role,content,meta,version_id) values(p.id,'system',v.summary,jsonb_build_object('kind','restore','from',source.number),v.id) returning id into mid;
  return jsonb_build_object('version',to_jsonb(v)-'files','files',v.files,'messageId',mid);
end; $$;

-- One bounded query for latest evidence per criterion/type; RLS applies to every read.
create function public.read_acceptance_evidence(p_version uuid)
returns jsonb language sql stable security invoker set search_path=pg_catalog,public,pg_temp as $$
  with v as (select id,parent_version_id,acceptance from public.versions where id=p_version),
  current_rows as (
    select distinct on(o.criterion_id,o.kind) o.* from public.acceptance_observations o join v on v.id=o.version_id order by o.criterion_id,o.kind,o.sequence desc
  ), baseline_rows as (
    select distinct on(o.criterion_id) o.* from public.acceptance_observations o join v on v.parent_version_id=o.version_id
    join public.versions p on p.id=v.parent_version_id
    where o.kind='automatic' and exists(
      select 1 from jsonb_array_elements(v.acceptance->'items') ci
      join jsonb_array_elements(p.acceptance->'items') pi on ci=pi where ci->>'id'=o.criterion_id
    ) order by o.criterion_id,o.sequence desc
  ) select jsonb_build_object('observations',coalesce((select jsonb_agg(to_jsonb(c)-'user_id') from current_rows c),'[]'::jsonb),'baseline',coalesce((select jsonb_agg(to_jsonb(b)-'user_id') from baseline_rows b),'[]'::jsonb));
$$;
revoke all on function public.read_acceptance_evidence(uuid) from public,anon;
grant execute on function public.read_acceptance_evidence(uuid) to authenticated;
