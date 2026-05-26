-- Enum: which service pillar a case study slots into.
create type case_study_service as enum (
  'custom_software',
  'ai',
  'automation',
  'lead_gen',
  'ecommerce'
);

-- case_studies: one row per published client project.
create table case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  client_name text not null,
  client_sector text,
  year int,
  logo_url text,
  brand_colour text,                          -- optional hex, used to tint the card
  outcome_headline text not null,
  story_problem text not null,
  story_solution text not null,
  testimonial_quote text not null,
  testimonial_author text not null,
  testimonial_role text,
  testimonial_approved_at timestamptz,        -- NULL = unapproved, must not be public
  tech_stack text[] not null default '{}',
  publish_status publish_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index case_studies_publish_status_idx on case_studies (publish_status);
create index case_studies_is_featured_idx on case_studies (is_featured);

-- Reuse the existing updated-at trigger function from the sites table.
create trigger case_studies_set_updated_at
  before update on case_studies
  for each row execute function set_updated_at();

-- case_study_services: which service pillars a case study belongs to.
create table case_study_services (
  case_study_id uuid not null references case_studies (id) on delete cascade,
  service case_study_service not null,
  primary key (case_study_id, service)
);
create index case_study_services_service_idx on case_study_services (service);
