-- The public "is this code right?" function let anyone guess join codes without any rate limit.
-- The sign-up trigger is the only check now; Supabase rate-limits sign-ups, and the app turns the
-- trigger's error into a friendly message.
create or replace function public.check_join_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.settings
    where upper(trim(join_code)) = upper(trim(coalesce(new.raw_user_meta_data ->> 'join_code', '')))
  ) then
    raise exception 'invalid join code';
  end if;
  new.raw_user_meta_data := new.raw_user_meta_data - 'join_code';
  return new;
end;
$$;

drop function public.join_code_is_valid(text);
