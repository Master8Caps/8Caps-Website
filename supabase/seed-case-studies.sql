-- Seed: seven real client case studies. All start with
-- testimonial_approved_at = NULL so RLS hides them until each client has
-- signed off on the wording in writing.
--
-- Story / outcome / testimonial text is placeholder until James fills in real
-- copy. Logos are placeholders.

-- North Bar — Custom Software · Automation · Lead Gen — Obi
insert into case_studies (id, slug, client_name, client_sector, year, logo_url,
                          outcome_headline, story_problem, story_solution,
                          testimonial_quote, testimonial_author, testimonial_role,
                          tech_stack, publish_status, is_featured, sort_order)
values
  ('44444444-4444-4444-4444-444444444401', 'north-bar', 'North Bar', 'Hospitality', 2024,
   'https://placehold.co/200x80?text=North+Bar',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Obi', 'Owner',
   array['Next.js', 'Supabase', 'Make.com'], 'published', true, 0),

  ('44444444-4444-4444-4444-444444444402', 'hull-mag', 'Hull Mag / Bestey', 'Publishing', 2024,
   'https://placehold.co/200x80?text=Hull+Mag',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Jane Gough', 'Editor',
   array['Make.com', 'Claude API', 'Mailchimp'], 'published', true, 1),

  ('44444444-4444-4444-4444-444444444403', 'store-more', 'Store More', 'Self-storage', 2024,
   'https://placehold.co/200x80?text=Store+More',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Dean Booty', 'Director',
   array['Claude API', 'Voice agent', 'Make.com'], 'published', false, 2),

  ('44444444-4444-4444-4444-444444444404', 'frame-sfs', 'Frame SFS', 'Picture framing', 2024,
   'https://placehold.co/200x80?text=Frame+SFS',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Alex Stark', 'Owner',
   array['Next.js', 'Supabase', 'Make.com'], 'published', false, 3),

  ('44444444-4444-4444-4444-444444444405', 'de-lacy-salons', 'De Lacy Salons', 'Beauty', 2024,
   'https://placehold.co/200x80?text=De+Lacy+Salons',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Kirsty Reader', 'Owner',
   array['Next.js', 'Claude API', 'Supabase'], 'published', true, 4),

  ('44444444-4444-4444-4444-444444444406', 'de-lacy-at-home', 'De Lacy at Home', 'E-commerce', 2024,
   'https://placehold.co/200x80?text=De+Lacy+at+Home',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Kerris Lacy', 'Owner',
   array['Shopify', 'Make.com', 'Etsy API'], 'published', false, 5),

  ('44444444-4444-4444-4444-444444444407', 'castle-sunset', 'Castle Sunset', 'Holiday lets', 2024,
   'https://placehold.co/200x80?text=Castle+Sunset',
   'Outcome headline (to fill).',
   'Problem paragraph (to fill).',
   'Solution paragraph (to fill).',
   'Testimonial quote (to fill).',
   'Rebecca Curley', 'Owner',
   array['Claude API', 'Voice agent', 'Make.com'], 'published', true, 6);

-- Service pillar tags per case study.
insert into case_study_services (case_study_id, service) values
  ('44444444-4444-4444-4444-444444444401', 'custom_software'),
  ('44444444-4444-4444-4444-444444444401', 'automation'),
  ('44444444-4444-4444-4444-444444444401', 'lead_gen'),
  ('44444444-4444-4444-4444-444444444402', 'automation'),
  ('44444444-4444-4444-4444-444444444402', 'ai'),
  ('44444444-4444-4444-4444-444444444403', 'ai'),
  ('44444444-4444-4444-4444-444444444403', 'automation'),
  ('44444444-4444-4444-4444-444444444404', 'custom_software'),
  ('44444444-4444-4444-4444-444444444404', 'automation'),
  ('44444444-4444-4444-4444-444444444404', 'lead_gen'),
  ('44444444-4444-4444-4444-444444444405', 'custom_software'),
  ('44444444-4444-4444-4444-444444444405', 'ai'),
  ('44444444-4444-4444-4444-444444444405', 'automation'),
  ('44444444-4444-4444-4444-444444444406', 'automation'),
  ('44444444-4444-4444-4444-444444444406', 'ecommerce'),
  ('44444444-4444-4444-4444-444444444407', 'ai'),
  ('44444444-4444-4444-4444-444444444407', 'automation'),
  ('44444444-4444-4444-4444-444444444407', 'lead_gen');
