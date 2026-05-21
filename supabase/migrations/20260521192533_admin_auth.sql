-- Auto-create a profiles row whenever an auth user is created.
create function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- True when the current request is from an admin (has a profiles row).
create function is_admin() returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;
