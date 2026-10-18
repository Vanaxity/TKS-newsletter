-- The newest published headlines for the homepage. Same fields a shared link already shows;
-- never the article body, the preview or who shared the video.
create function public.latest_articles(p_limit int default 6)
returns table (
  slug text,
  headline text,
  dek text,
  tags text[],
  read_minutes int,
  youtube_video_id text,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select a.slug, a.headline, a.dek, a.tags, a.read_minutes, a.youtube_video_id, a.published_at
  from public.articles a
  where a.status = 'published'
  order by a.published_at desc nulls last
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;
revoke execute on function public.latest_articles(int) from public;
grant execute on function public.latest_articles(int) to anon, authenticated;
