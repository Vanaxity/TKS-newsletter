-- Each member stores exactly one avatar file, at <their id>/avatar.webp, and their profile can
-- only point at that file (not at another student's photo).
alter table public.profiles
  add constraint avatar_path_is_own
  check (avatar_path is null or avatar_path = id::text || '/avatar.webp');

drop policy "members upload their own avatar" on storage.objects;
drop policy "members replace their own avatar" on storage.objects;

create policy "members upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.webp');
create policy "members replace their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.webp')
  with check (bucket_id = 'avatars' and name = (select auth.uid())::text || '/avatar.webp');

-- Supabase rewrites the user row right after sign-up (e.g. to confirm it), which put the join code
-- back into the user's metadata. Strip it on every write, not just the first insert.
create function public.strip_join_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ? 'join_code' then
    new.raw_user_meta_data := new.raw_user_meta_data - 'join_code';
  end if;
  return new;
end;
$$;
revoke execute on function public.strip_join_code() from public, anon, authenticated;

create trigger strip_join_code
  before update on auth.users
  for each row execute function public.strip_join_code();
