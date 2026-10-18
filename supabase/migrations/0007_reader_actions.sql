-- Ratings, saves and reposts. Members write only their own rows; counters on articles stay exact
-- through triggers, so feeds can rank by reposts without reading anyone's rows.
alter table public.articles
  add column repost_count int not null default 0 check (repost_count >= 0),
  add column rating_sum int not null default 0 check (rating_sum >= 0),
  add column rating_count int not null default 0 check (rating_count >= 0);

create table public.ratings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_id bigint not null references public.articles (id) on delete cascade,
  score int not null check (score between 1 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create table public.saves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_id bigint not null references public.articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create table public.reposts (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  article_id bigint not null references public.articles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create index ratings_article_idx on public.ratings (article_id);
create index saves_article_idx on public.saves (article_id);
create index reposts_article_idx on public.reposts (article_id);

alter table public.ratings enable row level security;
alter table public.saves enable row level security;
alter table public.reposts enable row level security;

create policy "members manage their own ratings" on public.ratings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- A rating can change its score, never move to another article or member (that would skew the counters).
revoke update on public.ratings from anon, authenticated;
grant update (score, updated_at) on public.ratings to authenticated;

create policy "members manage their own saves" on public.saves for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "members see reposts" on public.reposts for select to authenticated using (true);
create policy "members add their own reposts" on public.reposts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "members remove their own reposts" on public.reposts for delete to authenticated
  using (user_id = (select auth.uid()));

-- Counter upkeep. SECURITY DEFINER so members can move the counters only through these rows.
create function public.count_repost()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set repost_count = repost_count + 1 where id = new.article_id;
  else
    update public.articles set repost_count = greatest(repost_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$;
create trigger count_repost after insert or delete on public.reposts
  for each row execute function public.count_repost();

create function public.count_rating()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    update public.articles set rating_sum = rating_sum + new.score, rating_count = rating_count + 1 where id = new.article_id;
  elsif tg_op = 'UPDATE' then
    update public.articles set rating_sum = rating_sum - old.score + new.score where id = new.article_id;
  else
    update public.articles set rating_sum = greatest(rating_sum - old.score, 0), rating_count = greatest(rating_count - 1, 0)
      where id = old.article_id;
  end if;
  return null;
end;
$$;
create trigger count_rating after insert or update of score or delete on public.ratings
  for each row execute function public.count_rating();

revoke execute on function public.count_repost() from public, anon, authenticated;
revoke execute on function public.count_rating() from public, anon, authenticated;

-- Members still can't edit articles (admin-only update policy); the counters move only via the triggers.
