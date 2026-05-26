-- Admin full access to case_studies + case_study_services. The original
-- migration (20260525200001) only added the public-read policy (published +
-- approved). Without these admin policies, the new /admin/case-studies UI
-- sees zero rows because RLS hides everything from logged-in users too.
-- Mirrors the pattern already used for sites in 20260521192808_admin_rls.sql.

-- case_studies
create policy "admins read all case studies" on case_studies
  for select using (is_admin());
create policy "admins insert case studies" on case_studies
  for insert with check (is_admin());
create policy "admins update case studies" on case_studies
  for update using (is_admin());
create policy "admins delete case studies" on case_studies
  for delete using (is_admin());

-- case_study_services (M2M)
create policy "admins read all case_study_services" on case_study_services
  for select using (is_admin());
create policy "admins write case_study_services" on case_study_services
  for all using (is_admin()) with check (is_admin());
