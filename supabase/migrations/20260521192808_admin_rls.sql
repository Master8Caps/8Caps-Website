-- Admin full access. Plan 1's public-read policies are left untouched;
-- these are additive (Postgres ORs multiple permissive policies).

-- sites
create policy "admins read all sites" on sites
  for select using (is_admin());
create policy "admins insert sites" on sites
  for insert with check (is_admin());
create policy "admins update sites" on sites
  for update using (is_admin());
create policy "admins delete sites" on sites
  for delete using (is_admin());

-- services
create policy "admins read all services" on services
  for select using (is_admin());
create policy "admins write services" on services
  for all using (is_admin()) with check (is_admin());

-- screenshots
create policy "admins read all screenshots" on screenshots
  for select using (is_admin());
create policy "admins write screenshots" on screenshots
  for all using (is_admin()) with check (is_admin());

-- site_tags
create policy "admins read all site_tags" on site_tags
  for select using (is_admin());
create policy "admins write site_tags" on site_tags
  for all using (is_admin()) with check (is_admin());

-- categories
create policy "admins write categories" on categories
  for all using (is_admin()) with check (is_admin());

-- tags
create policy "admins write tags" on tags
  for all using (is_admin()) with check (is_admin());

-- enquiries (the inbox is Plan 3, but admins need read/update/delete)
create policy "admins read enquiries" on enquiries
  for select using (is_admin());
create policy "admins update enquiries" on enquiries
  for update using (is_admin());
create policy "admins delete enquiries" on enquiries
  for delete using (is_admin());

-- profiles
create policy "admins read profiles" on profiles
  for select using (is_admin());
