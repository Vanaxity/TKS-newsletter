-- Accounts: cohorts, profiles, interests per member, the join code, and avatars.
-- The join code itself is never in this file (the repo is public). Set it with:
--   insert into public.settings (join_code) values ('...');

-- Cohorts (admins manage the list later; placeholders until Sam sends the real names)
create table public.cohorts (
  id int generated always as identity primary key,
  name text not null,
  type text not null check (type in ('global', 'in_person')),
  sort int not null default 0,
  active boolean not null default true
);
alter table public.cohorts enable row level security;
create policy "active cohorts are readable by everyone"
  on public.cohorts for select to anon, authenticated using (active);

insert into public.cohorts (name, type, sort) values
  ('Global cohort 1', 'global', 1),
  ('Global cohort 2', 'global', 2),
  ('In-person cohort 1', 'in_person', 3),
  ('In-person cohort 2', 'in_person', 4);

-- Profiles (one per auth user, created by the trigger below)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  first_name text check (char_length(first_name) between 1 and 50),
  last_name text check (char_length(last_name) between 1 and 50),
  avatar_path text,
  cohort_id int references public.cohorts (id),
  city text check (char_length(city) between 1 and 80),
  role text not null default 'member' check (role in ('member', 'admin')),
  onboarding_step text not null default 'profile' check (onboarding_step in ('profile', 'interests', 'done')),
  created_at timestamptz not null default now(),
  constraint profile_complete_after_step_one check (
    onboarding_step = 'profile'
    or (username is not null and first_name is not null and last_name is not null
        and cohort_id is not null and city is not null)
  )
);
alter table public.profiles enable row level security;

create policy "members see their own profile and finished profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or onboarding_step = 'done');

-- Members may edit only these columns of their own row (never role or id).
revoke update on public.profiles from anon, authenticated;
grant update (username, first_name, last_name, avatar_path, cohort_id, city, onboarding_step)
  on public.profiles to authenticated;
create policy "members update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create index profiles_cohort_id_idx on public.profiles (cohort_id);

-- Interests per member
create table public.profile_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  interest_slug text not null references public.interests (slug),
  primary key (profile_id, interest_slug)
);
alter table public.profile_interests enable row level security;
create policy "member interests are readable by members"
  on public.profile_interests for select to authenticated using (true);
create policy "members add their own interests"
  on public.profile_interests for insert to authenticated
  with check (profile_id = (select auth.uid()));
create policy "members remove their own interests"
  on public.profile_interests for delete to authenticated
  using (profile_id = (select auth.uid()));

create index profile_interests_interest_slug_idx on public.profile_interests (interest_slug);

-- Site settings: one row. RLS on with no policies, so only the database itself reads it.
create table public.settings (
  id boolean primary key default true check (id),
  join_code text not null
);
alter table public.settings enable row level security;

-- Lets the sign-up form say "wrong code" without exposing the code.
create function public.join_code_is_valid(code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.settings
    where upper(trim(join_code)) = upper(trim(coalesce(code, '')))
  );
$$;
revoke execute on function public.join_code_is_valid(text) from public;
grant execute on function public.join_code_is_valid(text) to anon, authenticated;

-- The real gate: no join code, no account, however the sign-up arrives.
create function public.check_join_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.join_code_is_valid(new.raw_user_meta_data ->> 'join_code') then
    raise exception 'invalid join code';
  end if;
  new.raw_user_meta_data := new.raw_user_meta_data - 'join_code';
  return new;
end;
$$;
revoke execute on function public.check_join_code() from public, anon, authenticated;

create trigger check_join_code
  before insert on auth.users
  for each row execute function public.check_join_code();

create function public.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
revoke execute on function public.create_profile() from public, anon, authenticated;

create trigger create_profile
  after insert on auth.users
  for each row execute function public.create_profile();

-- Avatars: private bucket, members read, each member writes only their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/webp', 'image/jpeg', 'image/png']);

create policy "members read avatars"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars');
create policy "members upload their own avatar"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "members replace their own avatar"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "members delete their own avatar"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
