-- Atoms Lite initial schema (PRD §5.4)
-- Ownership: projects.owner_id; child tables inherit access through their project.
-- Server-only fields (published_*, remixed_from) are written with the admin key.

-- ── tables ──────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled' check (char_length(title) between 1 and 120),
  current_version_id uuid,
  published_slug text unique
    check (published_slug ~ '^[a-z0-9][a-z0-9-]{4,28}[a-z0-9]$'),
  published_version_id uuid,
  remixed_from uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  number int not null check (number > 0),
  files jsonb not null,
  summary text,
  created_at timestamptz not null default now(),
  unique (project_id, number)
);

alter table public.projects
  add constraint projects_current_version_fk
    foreign key (current_version_id) references public.versions(id) on delete set null,
  add constraint projects_published_version_fk
    foreign key (published_version_id) references public.versions(id) on delete set null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'mike', 'emma', 'bob', 'alex', 'system')),
  content text not null default '',
  meta jsonb not null default '{}',
  version_id uuid references public.versions(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.usage_logs (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  model text,
  input_tokens int,
  output_tokens int,
  created_at timestamptz not null default now()
);

create index projects_owner_updated_idx on public.projects (owner_id, updated_at desc);
create index messages_project_created_idx on public.messages (project_id, created_at);
create index usage_logs_user_created_idx on public.usage_logs (user_id, created_at);

-- ── integrity ───────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- current/published version must belong to the same project
create or replace function public.check_project_version_refs()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.current_version_id is not null and not exists (
    select 1 from public.versions v
    where v.id = new.current_version_id and v.project_id = new.id
  ) then
    raise exception 'current_version_id does not belong to project %', new.id;
  end if;
  if new.published_version_id is not null and not exists (
    select 1 from public.versions v
    where v.id = new.published_version_id and v.project_id = new.id
  ) then
    raise exception 'published_version_id does not belong to project %', new.id;
  end if;
  return new;
end;
$$;

create trigger projects_check_version_refs
  before insert or update of current_version_id, published_version_id on public.projects
  for each row execute function public.check_project_version_refs();

-- ── access control ──────────────────────────────────────────────────────

-- SECURITY DEFINER so child-table policies don't re-enter projects RLS
create or replace function public.owns_project(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.owner_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.versions enable row level security;
alter table public.messages enable row level security;
alter table public.usage_logs enable row level security;

-- Nothing is public: published apps are served server-side with the admin key.
revoke all on public.profiles, public.projects, public.versions, public.messages, public.usage_logs from anon;
revoke all on public.profiles, public.projects, public.versions, public.messages, public.usage_logs from authenticated;
revoke all on sequence public.usage_logs_id_seq from anon, authenticated;

grant usage on schema public to authenticated;

-- profiles: own row
grant select, insert, update (display_name) on public.profiles to authenticated;
create policy profiles_own on public.profiles for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- projects: own rows; publishing/remix fields are server-only
grant select, insert (title), update (title, current_version_id), delete on public.projects to authenticated;
create policy projects_select_own on public.projects for select to authenticated
  using (owner_id = (select auth.uid()));
create policy projects_insert_own on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy projects_update_own on public.projects for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy projects_delete_own on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- versions: immutable snapshots
grant select, insert on public.versions to authenticated;
create policy versions_select_own on public.versions for select to authenticated
  using (public.owns_project(project_id));
create policy versions_insert_own on public.versions for insert to authenticated
  with check (public.owns_project(project_id));

-- messages: agents update status/meta while streaming
grant select, insert, update (content, meta, version_id) on public.messages to authenticated;
create policy messages_select_own on public.messages for select to authenticated
  using (public.owns_project(project_id));
create policy messages_insert_own on public.messages for insert to authenticated
  with check (public.owns_project(project_id));
create policy messages_update_own on public.messages for update to authenticated
  using (public.owns_project(project_id))
  with check (public.owns_project(project_id));

-- usage_logs: append-only, so users can't reset their daily quota
grant select, insert (project_id, model, input_tokens, output_tokens) on public.usage_logs to authenticated;
grant usage on sequence public.usage_logs_id_seq to authenticated;
create policy usage_logs_select_own on public.usage_logs for select to authenticated
  using (user_id = (select auth.uid()));
create policy usage_logs_insert_own on public.usage_logs for insert to authenticated
  with check (user_id = (select auth.uid()) and (project_id is null or public.owns_project(project_id)));
