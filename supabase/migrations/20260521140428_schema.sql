-- Enums
create type publish_status as enum ('draft', 'published', 'archived');
create type site_lifecycle as enum ('live', 'coming_soon');
create type site_visibility as enum ('public', 'private');
create type enquiry_status as enum ('new', 'read', 'archived');

-- profiles: admin users (1 row per admin). Used by Plan 2; created here so RLS can reference it.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

-- categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- tags
create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
);

-- sites
create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  url text not null,
  logo_url text,
  short_summary text not null,
  full_overview text,
  target_audience text,
  category_id uuid references categories (id) on delete set null,
  publish_status publish_status not null default 'draft',
  lifecycle site_lifecycle not null default 'live',
  visibility site_visibility not null default 'public',
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sites_category_id_idx on sites (category_id);
create index sites_publish_status_idx on sites (publish_status);

-- services (offered by a site)
create table services (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0
);
create index services_site_id_idx on services (site_id);

-- screenshots
create table screenshots (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0
);
create index screenshots_site_id_idx on screenshots (site_id);

-- site_tags join table
create table site_tags (
  site_id uuid not null references sites (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (site_id, tag_id)
);

-- enquiries (contact form submissions; write path built in Plan 2)
create table enquiries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references sites (id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  status enquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

-- keep sites.updated_at fresh
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sites_set_updated_at
  before update on sites
  for each row execute function set_updated_at();
