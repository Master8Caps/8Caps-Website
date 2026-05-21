-- Public bucket for site logos and screenshots.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Anyone may read; only admins may write.
create policy "public read site-media" on storage.objects
  for select using (bucket_id = 'site-media');

create policy "admins insert site-media" on storage.objects
  for insert with check (bucket_id = 'site-media' and is_admin());

create policy "admins update site-media" on storage.objects
  for update using (bucket_id = 'site-media' and is_admin());

create policy "admins delete site-media" on storage.objects
  for delete using (bucket_id = 'site-media' and is_admin());
