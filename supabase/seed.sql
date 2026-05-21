-- Seed data for the 8Caps directory. Applied to the hosted project via the
-- Supabase MCP; kept here for the record and for local `supabase db reset`.

-- Categories
insert into categories (id, name, slug, description) values
  ('11111111-1111-1111-1111-111111111101', 'Automation',      'automation',      'Tools that automate repetitive business work.'),
  ('11111111-1111-1111-1111-111111111102', 'Lead Generation', 'lead-generation', 'Platforms that find and qualify leads.'),
  ('11111111-1111-1111-1111-111111111103', 'Property',        'property',        'Property and real-estate services.'),
  ('11111111-1111-1111-1111-111111111104', 'Marketing',       'marketing',       'Marketing tools and services.'),
  ('11111111-1111-1111-1111-111111111105', 'AI Tools',        'ai-tools',        'AI-powered products.'),
  ('11111111-1111-1111-1111-111111111106', 'Data Services',   'data-services',   'Data sourcing and enrichment.');

-- Tags
insert into tags (id, name, slug) values
  ('22222222-2222-2222-2222-222222222201', 'SaaS',    'saas'),
  ('22222222-2222-2222-2222-222222222202', 'B2B',     'b2b'),
  ('22222222-2222-2222-2222-222222222203', 'No-code', 'no-code'),
  ('22222222-2222-2222-2222-222222222204', 'UK',      'uk');

-- Sites
insert into sites (id, name, slug, url, logo_url, short_summary, full_overview, target_audience,
                   category_id, publish_status, lifecycle, visibility, is_featured,
                   seo_title, seo_description) values
  ('33333333-3333-3333-3333-333333333301', 'Automated Panda', 'automated-panda',
   'https://automatedpanda.com', 'https://placehold.co/200x200?text=Panda',
   'Workflow automation for small businesses.',
   'Automated Panda builds no-code automations that connect the tools small businesses already use, removing hours of manual data entry every week.',
   'Small business owners and operations managers.',
   '11111111-1111-1111-1111-111111111101', 'published', 'live', 'public', true,
   'Automated Panda — Workflow Automation', 'No-code workflow automation for small businesses.'),

  ('33333333-3333-3333-3333-333333333302', 'LeadHarbour', 'leadharbour',
   'https://leadharbour.example.com', 'https://placehold.co/200x200?text=Lead',
   'Find and qualify B2B leads on autopilot.',
   'LeadHarbour continuously sources B2B leads, enriches them with verified contact data, and scores them so sales teams only talk to people worth talking to.',
   'B2B sales teams and founders doing outbound.',
   '11111111-1111-1111-1111-111111111102', 'published', 'live', 'public', true,
   'LeadHarbour — B2B Lead Generation', 'Automated B2B lead sourcing and qualification.'),

  ('33333333-3333-3333-3333-333333333303', 'PropToolkit', 'proptoolkit',
   'https://proptoolkit.example.com', 'https://placehold.co/200x200?text=Prop',
   'Property analysis tools for UK investors.',
   'PropToolkit gives UK property investors instant area analysis, yield calculations, and deal comparisons in one dashboard.',
   'UK buy-to-let and property investors.',
   '11111111-1111-1111-1111-111111111103', 'published', 'coming_soon', 'public', false,
   'PropToolkit — UK Property Analysis', 'Property analysis tools for UK investors.'),

  -- Draft site: must NOT appear on the public site.
  ('33333333-3333-3333-3333-333333333304', 'Stealth Project', 'stealth-project',
   'https://stealth.example.com', null,
   'An unreleased internal project.',
   'Internal only.', 'Internal.',
   '11111111-1111-1111-1111-111111111105', 'draft', 'live', 'public', false,
   null, null);

-- Services
insert into services (site_id, name, description, sort_order) values
  ('33333333-3333-3333-3333-333333333301', 'Workflow Builder',  'Visually connect apps and automate steps.', 0),
  ('33333333-3333-3333-3333-333333333301', 'Data Sync',         'Keep records consistent across tools.',      1),
  ('33333333-3333-3333-3333-333333333302', 'Lead Sourcing',     'Continuously discover new B2B leads.',        0),
  ('33333333-3333-3333-3333-333333333302', 'Contact Enrichment','Add verified emails and phone numbers.',     1);

-- Screenshots
insert into screenshots (site_id, image_url, alt_text, sort_order) values
  ('33333333-3333-3333-3333-333333333301', 'https://placehold.co/1200x750?text=Dashboard', 'Automated Panda dashboard', 0),
  ('33333333-3333-3333-3333-333333333301', 'https://placehold.co/1200x750?text=Builder',   'Workflow builder screen',  1);

-- Tag links
insert into site_tags (site_id, tag_id) values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222203'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222204');
