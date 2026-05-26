-- Project-type enum used by the contact form.
create type enquiry_project_type as enum (
  'custom_software',
  'ai',
  'automation',
  'not_sure'
);

alter table enquiries
  add column company text,
  add column project_type enquiry_project_type,
  add column heard_about text;
