-- Enable RLS on the new tables.
alter table case_studies         enable row level security;
alter table case_study_services  enable row level security;

-- A case study is publicly visible only when it is published AND its
-- testimonial has been approved in writing. The approval gate enforces the
-- ASA rule structurally — an unapproved testimonial cannot accidentally leak.
create policy "public reads approved published case studies" on case_studies
  for select using (
    publish_status = 'published'
    and testimonial_approved_at is not null
  );

-- Services rows are visible whenever their parent case study is visible.
create policy "public reads services of visible case studies" on case_study_services
  for select using (
    exists (
      select 1 from case_studies cs
      where cs.id = case_study_services.case_study_id
        and cs.publish_status = 'published'
        and cs.testimonial_approved_at is not null
    )
  );
