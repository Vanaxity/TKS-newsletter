-- Articles: members read published ones; non-members only get the first half through public_article().
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create table public.articles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  youtube_video_id text not null unique check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  source text not null check (source in ('channel', 'submission', 'written')),
  status text not null default 'draft' check (status in ('draft', 'published', 'rejected')),
  headline text not null check (char_length(headline) between 1 and 200),
  dek text not null check (char_length(dek) between 1 and 400),
  body_md text not null,
  preview_md text not null,
  tags text[] not null check (cardinality(tags) between 1 and 3),
  read_minutes int not null check (read_minutes > 0),
  video_title text,
  channel_name text,
  video_minutes numeric,
  shared_by_slack_id text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index articles_tags_idx on public.articles using gin (tags);
create index articles_status_published_idx on public.articles (status, published_at desc);

-- Every tag must be one of the interests.
create function public.check_article_tags()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from unnest(new.tags) t where t not in (select slug from public.interests)) then
    raise exception 'unknown article tag';
  end if;
  return new;
end;
$$;
create trigger check_article_tags
  before insert or update of tags on public.articles
  for each row execute function public.check_article_tags();

alter table public.articles enable row level security;

create policy "members read published articles"
  on public.articles for select to authenticated
  using (status = 'published' or (select public.is_admin()));
create policy "admins add articles"
  on public.articles for insert to authenticated
  with check ((select public.is_admin()));
create policy "admins edit articles"
  on public.articles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- The first half of a published article, for anyone (shared links). Never the body or who shared it.
create function public.public_article(p_slug text)
returns table (
  slug text,
  headline text,
  dek text,
  tags text[],
  read_minutes int,
  youtube_video_id text,
  preview_md text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.slug, a.headline, a.dek, a.tags, a.read_minutes, a.youtube_video_id, a.preview_md, a.published_at
  from public.articles a
  where a.slug = p_slug and a.status = 'published';
$$;
revoke execute on function public.public_article(text) from public;
grant execute on function public.public_article(text) to anon, authenticated;
