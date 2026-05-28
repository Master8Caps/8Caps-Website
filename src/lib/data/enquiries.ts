import { createServerSupabase } from "@/lib/supabase/server";
import type { ProjectType } from "@/lib/contact-form";
import type { AdminEnquiry, EnquiryStatus } from "@/types/domain";

const COLUMNS =
  "id, name, email, company, project_type, heard_about, message, status, created_at";

interface EnquiryRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  project_type: ProjectType | null;
  heard_about: string | null;
  message: string;
  status: EnquiryStatus;
  created_at: string;
}

function toEnquiry(row: EnquiryRow): AdminEnquiry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company,
    projectType: row.project_type,
    heardAbout: row.heard_about,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** All enquiries, newest first. Optionally filtered to a single status.
 *  RLS restricts reads to admins. */
export async function getAdminEnquiries(filter?: {
  status?: EnquiryStatus;
}): Promise<AdminEnquiry[]> {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("enquiries")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (filter?.status) query = query.eq("status", filter.status);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load enquiries: ${error.message}`);
  return ((data ?? []) as unknown as EnquiryRow[]).map(toEnquiry);
}

/** A single enquiry by id, or null if not found. */
export async function getEnquiryById(id: string): Promise<AdminEnquiry | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("enquiries")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load enquiry: ${error.message}`);
  return data ? toEnquiry(data as unknown as EnquiryRow) : null;
}

/** Count of unread (status='new') enquiries — for the sidebar badge and the
 *  dashboard callout. */
export async function getNewEnquiryCount(): Promise<number> {
  const supabase = await createServerSupabase();
  const { count, error } = await supabase
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  if (error) throw new Error(`Failed to count new enquiries: ${error.message}`);
  return count ?? 0;
}
