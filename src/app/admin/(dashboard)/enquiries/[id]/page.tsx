import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnquiryById } from "@/lib/data/enquiries";
import { getAdminBasePath } from "@/lib/admin-paths.server";
import { adminPath } from "@/lib/admin-paths";
import { PROJECT_TYPE_LABELS } from "@/lib/contact-form";
import {
  ENQUIRY_STATUS_LABEL,
  ENQUIRY_STATUS_STYLE,
  formatEnquiryDate,
} from "@/lib/enquiries";
import { EnquiryActions } from "@/components/admin/EnquiryActions";
import { MarkEnquiryRead } from "@/components/admin/MarkEnquiryRead";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{children}</dd>
    </div>
  );
}

export default async function EnquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [enquiry, basePath] = await Promise.all([
    getEnquiryById(id),
    getAdminBasePath(),
  ]);

  if (!enquiry) notFound();

  const replyHref = `mailto:${enquiry.email}?subject=${encodeURIComponent(
    "Re: your enquiry to 8Caps",
  )}`;

  return (
    <div className="p-8">
      <MarkEnquiryRead id={enquiry.id} status={enquiry.status} />

      <Link
        href={adminPath(basePath, "/enquiries")}
        className="text-sm text-ink-muted hover:text-accent"
      >
        ← Back to enquiries
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {enquiry.name}
            {enquiry.company ? (
              <span className="text-ink-muted"> · {enquiry.company}</span>
            ) : null}
          </h1>
          <a
            href={`mailto:${enquiry.email}`}
            className="text-sm text-accent hover:underline"
          >
            {enquiry.email}
          </a>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${ENQUIRY_STATUS_STYLE[enquiry.status]}`}
        >
          {ENQUIRY_STATUS_LABEL[enquiry.status]}
        </span>
      </div>

      <div
        className="mt-6 rounded-card border bg-surface p-6"
        style={{ borderColor: "var(--color-hairline)" }}
      >
        <dl className="grid gap-4 sm:grid-cols-3">
          <Field label="Project type">
            {enquiry.projectType
              ? PROJECT_TYPE_LABELS[enquiry.projectType]
              : "—"}
          </Field>
          <Field label="Heard about us">{enquiry.heardAbout || "—"}</Field>
          <Field label="Received">{formatEnquiryDate(enquiry.createdAt)}</Field>
        </dl>

        <div className="mt-6">
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Message
          </dt>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {enquiry.message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <a href={replyHref} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white">
          Reply by email
        </a>
        <EnquiryActions id={enquiry.id} status={enquiry.status} />
      </div>
    </div>
  );
}
