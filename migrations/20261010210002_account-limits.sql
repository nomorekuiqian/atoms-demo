-- Review follow-ups to 20261010210001:
-- 1. Per-account concurrency lives in account_limits (rows written by operators with the admin key),
--    so the route no longer special-cases the demo account by email. p_concurrency is the default.
-- 2. One staleness window: a request lock and a concurrency slot both expire after 5 minutes
--    (the generate route's maxDuration is 300s).
-- 3. Project creation accepts the same 8000-character prompt as the app (MAX_PROMPT_CHARS).

create table public.account_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  concurrency int not null check (concurrency between 1 and 20)
);
alter table public.account_limits enable row level security;
-- No policies: only security definer functions and the admin key read or write it.

create or replace function public.claim_generation_v3(p_id uuid,p_project uuid,p_user uuid,p_expected uuid,p_fingerprint text,p_lease uuid,p_concurrency int default 2)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare r public.generation_requests; outcome jsonb; active bigint; slots int;
begin
  if p_concurrency < 1 then raise exception 'Invalid concurrency'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  if not exists(select 1 from public.projects where id=p_project and owner_id=p_user) then raise exception 'Project not found' using errcode='42501'; end if;
  select * into r from public.generation_requests where id=p_id;
  if found and r.status='complete' then
    return public.claim_generation(p_id,p_project,p_user,p_expected,p_fingerprint,p_lease);
  end if;
  slots:=coalesce((select concurrency from public.account_limits where user_id=p_user),p_concurrency);
  select count(*) into active from public.generation_attempts where user_id=p_user and status='running' and started_at>now()-interval '5 minutes';
  if active>=slots then
    return jsonb_build_object('busy',true,'message',format('%s builds are already running on this account. Wait for one to finish.',slots));
  end if;
  outcome:=public.claim_generation(p_id,p_project,p_user,p_expected,p_fingerprint,p_lease);
  if coalesce((outcome->>'claimed')::boolean,false) then
    insert into public.generation_attempts(id,request_id,user_id,project_id,mock) values(p_lease,p_id,p_user,p_project,false);
  end if;
  return outcome;
end; $$;
revoke all on function public.claim_generation_v3(uuid,uuid,uuid,uuid,text,uuid,int) from public,anon,authenticated;

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
    if r.status = 'running' and r.updated_at > now() - interval '5 minutes' then
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

create or replace function public.create_project_with_prompt(p_user uuid, p_title text, p_prompt text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare pid uuid;
begin
  if p_user is null then raise exception 'Not signed in' using errcode='42501'; end if;
  if char_length(btrim(coalesce(p_prompt,''))) not between 1 and 8000 then
    raise exception 'Invalid prompt' using errcode='22023';
  end if;
  insert into public.projects(owner_id,title) values(p_user,p_title) returning id into pid;
  insert into public.messages(project_id,role,content) values(pid,'user',p_prompt);
  return pid;
end; $$;
revoke all on function public.create_project_with_prompt(uuid,text,text) from public,anon,authenticated;
