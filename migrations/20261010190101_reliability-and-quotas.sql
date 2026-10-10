-- Stable ordering, including deterministic ordering of historical transaction ties.
create sequence public.message_sequence;
alter table public.messages add column sequence bigint;
with ordered as (
  select id, row_number() over(order by created_at,
    case role when 'user' then 0 when 'mike' then 1 when 'emma' then 2 when 'bob' then 3 when 'alex' then 4 else 5 end, id) as n
  from public.messages
) update public.messages m set sequence=o.n from ordered o where m.id=o.id;
select setval('public.message_sequence', greatest(coalesce((select max(sequence) from public.messages),0)+1,1),false);
alter table public.messages alter column sequence set default nextval('public.message_sequence');
alter table public.messages alter column sequence set not null;
alter sequence public.message_sequence owned by public.messages.sequence;
create unique index messages_sequence_idx on public.messages(sequence);
create index messages_project_sequence_idx on public.messages(project_id,sequence desc);
grant usage on sequence public.message_sequence to authenticated;
-- Clients cannot supply a forged ordering key.
revoke insert on public.messages from authenticated;
grant insert(project_id,role,content,meta,version_id) on public.messages to authenticated;

-- Each lease is a paid attempt, even when a request is retried or its project is deleted.
create table public.generation_attempts (
  id uuid primary key,
  request_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  mock boolean not null,
  status text not null default 'running' check(status in ('running','finished')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  usage_reported boolean not null default false
);
alter table public.generation_attempts enable row level security;
revoke all on public.generation_attempts from public,anon,authenticated;
create index generation_attempts_user_time_idx on public.generation_attempts(user_id,started_at);
alter table public.usage_logs add column attempt_id uuid references public.generation_attempts(id);
create unique index usage_logs_attempt_idx on public.usage_logs(attempt_id);

create function public.claim_generation_v2(p_id uuid,p_project uuid,p_user uuid,p_expected uuid,p_fingerprint text,p_lease uuid,p_limit int,p_mock boolean,p_concurrency int default 2)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare r public.generation_requests; outcome jsonb; used bigint; active bigint;
begin
  if p_limit < 1 or p_concurrency < 1 then raise exception 'Invalid quota'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
  if not exists(select 1 from public.projects where id=p_project and owner_id=p_user) then raise exception 'Project not found' using errcode='42501'; end if;
  select * into r from public.generation_requests where id=p_id;
  if found and r.status='complete' then
    return public.claim_generation(p_id,p_project,p_user,p_expected,p_fingerprint,p_lease);
  end if;
  if not p_mock then
    select count(*) into used from public.generation_attempts where user_id=p_user and not mock and started_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
    used := used + (select count(*) from public.usage_logs where user_id=p_user and attempt_id is null and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC');
    if used>=p_limit then return jsonb_build_object('quota',true,'message','Today''s build allowance is used up. It resets at 00:00 UTC.'); end if;
  end if;
  select count(*) into active from public.generation_attempts where user_id=p_user and status='running' and started_at>now()-interval '6 minutes';
  if active>=p_concurrency then return jsonb_build_object('busy',true,'message','Two builds are already running. Wait for one to finish.'); end if;
  outcome:=public.claim_generation(p_id,p_project,p_user,p_expected,p_fingerprint,p_lease);
  if coalesce((outcome->>'claimed')::boolean,false) then
    insert into public.generation_attempts(id,request_id,user_id,project_id,mock) values(p_lease,p_id,p_user,p_project,p_mock);
  end if;
  return outcome;
end; $$;
revoke all on function public.claim_generation_v2(uuid,uuid,uuid,uuid,text,uuid,int,boolean,int) from public,anon,authenticated;

-- Separate transaction from saving the version: paid work survives failed commits.
create function public.settle_generation_attempt(p_lease uuid,p_user uuid,p_usage jsonb)
returns void language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare a public.generation_attempts;
begin
  select * into a from public.generation_attempts where id=p_lease and user_id=p_user for update;
  if not found then raise exception 'Unknown attempt' using errcode='42501'; end if;
  if not a.mock and p_usage is not null then
    insert into public.usage_logs(user_id,project_id,model,input_tokens,output_tokens,attempt_id)
      values(p_user,a.project_id,p_usage->>'model',(p_usage->>'input')::int,(p_usage->>'output')::int,a.id)
      on conflict(attempt_id) do nothing;
  end if;
  update public.generation_attempts set status='finished',finished_at=coalesce(finished_at,now()),usage_reported=usage_reported or p_usage is not null where id=a.id;
end; $$;
revoke all on function public.settle_generation_attempt(uuid,uuid,jsonb) from public,anon,authenticated;
