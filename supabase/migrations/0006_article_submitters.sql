-- Who shared a video is private: it moves out of `articles` (readable by every member) into an
-- admin-only table, before any real Slack submissions land.
create table public.article_submitters (
  article_id bigint primary key references public.articles (id) on delete cascade,
  shared_by_slack_id text not null
);
alter table public.article_submitters enable row level security;
create policy "admins read submitters"
  on public.article_submitters for select to authenticated using ((select public.is_admin()));
create policy "admins add submitters"
  on public.article_submitters for insert to authenticated with check ((select public.is_admin()));

insert into public.article_submitters (article_id, shared_by_slack_id)
select id, shared_by_slack_id from public.articles where shared_by_slack_id is not null;

alter table public.articles drop column shared_by_slack_id;
