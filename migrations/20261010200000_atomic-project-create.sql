-- New projects and remixes are created in one transaction, so a failed second
-- write can no longer leave an empty project behind.
-- Called with the admin key only after the server has authenticated p_user.

create function public.create_project_with_prompt(p_user uuid, p_title text, p_prompt text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare pid uuid;
begin
  if p_user is null then raise exception 'Not signed in' using errcode='42501'; end if;
  if char_length(btrim(coalesce(p_prompt,''))) not between 1 and 4000 then
    raise exception 'Invalid prompt' using errcode='22023';
  end if;
  insert into public.projects(owner_id,title) values(p_user,p_title) returning id into pid;
  insert into public.messages(project_id,role,content) values(pid,'user',p_prompt);
  return pid;
end; $$;
revoke all on function public.create_project_with_prompt(uuid,text,text) from public,anon,authenticated;

create function public.remix_published(p_user uuid, p_slug text)
returns uuid language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare source public.projects; snapshot public.versions; pid uuid; vid uuid; label text;
begin
  if p_user is null then raise exception 'Not signed in' using errcode='42501'; end if;
  select * into source from public.projects where published_slug=p_slug and published_version_id is not null;
  if not found then return null; end if;
  select * into snapshot from public.versions where id=source.published_version_id and project_id=source.id;
  if not found then return null; end if;
  label:='Remixed from '||source.title;
  insert into public.projects(owner_id,title,remixed_from)
    values(p_user,left(source.title||' remix',120),source.id) returning id into pid;
  -- Code only: the source's chat, contract and provenance stay with the source.
  insert into public.versions(project_id,number,files,summary)
    values(pid,1,snapshot.files,label) returning id into vid;
  update public.projects set current_version_id=vid where id=pid;
  insert into public.messages(project_id,role,content,meta,version_id)
    values(pid,'system',label,jsonb_build_object('kind','remix','slug',p_slug),vid);
  return pid;
end; $$;
revoke all on function public.remix_published(uuid,text) from public,anon,authenticated;
