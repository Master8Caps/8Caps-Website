-- Enable RLS on every table
alter table profiles    enable row level security;
alter table categories  enable row level security;
alter table tags        enable row level security;
alter table sites       enable row level security;
alter table services    enable row level security;
alter table screenshots enable row level security;
alter table site_tags   enable row level security;
alter table enquiries   enable row level security;

-- A site is publicly visible when published AND public.
-- Public (anon) read access:
create policy "public reads published public sites" on sites
  for select using (publish_status = 'published' and visibility = 'public');

create policy "public reads categories" on categories
  for select using (true);

create policy "public reads tags" on tags
  for select using (true);

create policy "public reads services of visible sites" on services
  for select using (
    exists (
      select 1 from sites s
      where s.id = services.site_id
        and s.publish_status = 'published'
        and s.visibility = 'public'
    )
  );

create policy "public reads screenshots of visible sites" on screenshots
  for select using (
    exists (
      select 1 from sites s
      where s.id = screenshots.site_id
        and s.publish_status = 'published'
        and s.visibility = 'public'
    )
  );

create policy "public reads site_tags of visible sites" on site_tags
  for select using (
    exists (
      select 1 from sites s
      where s.id = site_tags.site_id
        and s.publish_status = 'published'
        and s.visibility = 'public'
    )
  );

-- enquiries: anyone may submit; nobody may read via the anon key.
create policy "public inserts enquiries" on enquiries
  for insert with check (true);

-- profiles, and all write access for admins, are added in Plan 2.
