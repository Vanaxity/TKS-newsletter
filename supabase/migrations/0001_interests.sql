-- Interest topics. Every article tag and every member's interests come from this list.
-- Keep in sync with src/lib/interests.ts (tests/interests.test.ts checks it).
create table public.interests (
  slug text primary key,
  label text not null,
  sort int not null
);

alter table public.interests enable row level security;

create policy "interests are readable by everyone"
  on public.interests for select
  to anon, authenticated
  using (true);

insert into public.interests (slug, label, sort) values
  ('math', 'Math', 1),
  ('physics', 'Physics', 2),
  ('chemistry', 'Chemistry', 3),
  ('biology', 'Biology', 4),
  ('neuroscience', 'Neuroscience', 5),
  ('robotics', 'Robotics', 6),
  ('ai', 'AI', 7),
  ('computer-science', 'Computer science', 8),
  ('space', 'Space', 9),
  ('energy', 'Energy', 10),
  ('climate', 'Climate', 11),
  ('medicine', 'Medicine', 12),
  ('engineering', 'Engineering', 13),
  ('business', 'Business', 14),
  ('design', 'Design', 15);
