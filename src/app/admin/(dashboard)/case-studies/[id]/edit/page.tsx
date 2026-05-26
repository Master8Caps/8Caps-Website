import { notFound } from "next/navigation";
import { CaseStudyForm } from "@/components/admin/CaseStudyForm";
import { DeleteCaseStudyButton } from "@/components/admin/DeleteCaseStudyButton";
import { getCaseStudyForEdit } from "@/lib/data/admin";
import { updateCaseStudy, deleteCaseStudy } from "../../actions";
import type { CaseStudyFormValues } from "@/types/case-study";

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseStudy = await getCaseStudyForEdit(id);
  if (!caseStudy) notFound();

  // Map admin shape to form shape (timestamp → boolean).
  const initial: CaseStudyFormValues = {
    clientName: caseStudy.clientName,
    slug: caseStudy.slug,
    clientSector: caseStudy.clientSector ?? "",
    year: caseStudy.year,
    logoUrl: caseStudy.logoUrl,
    brandColour: caseStudy.brandColour ?? "",
    outcomeHeadline: caseStudy.outcomeHeadline,
    storyProblem: caseStudy.storyProblem,
    storySolution: caseStudy.storySolution,
    testimonialQuote: caseStudy.testimonialQuote,
    testimonialAuthor: caseStudy.testimonialAuthor,
    testimonialRole: caseStudy.testimonialRole ?? "",
    techStack: caseStudy.techStack,
    services: caseStudy.services,
    publishStatus: caseStudy.publishStatus,
    isFeatured: caseStudy.isFeatured,
    sortOrder: caseStudy.sortOrder,
    testimonialApproved: caseStudy.testimonialApprovedAt !== null,
  };

  async function handleUpdate(values: CaseStudyFormValues) {
    "use server";
    return updateCaseStudy(id, values);
  }

  async function handleDelete() {
    "use server";
    return deleteCaseStudy(id);
  }

  return (
    <div>
      <div className="flex items-center justify-between px-8 pt-8">
        <h1 className="text-2xl font-bold text-ink">Edit case study</h1>
        <DeleteCaseStudyButton onDelete={handleDelete} />
      </div>
      <CaseStudyForm initial={initial} onSubmit={handleUpdate} />
    </div>
  );
}
