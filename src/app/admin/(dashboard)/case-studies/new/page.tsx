import { CaseStudyForm } from "@/components/admin/CaseStudyForm";
import { createCaseStudy } from "../actions";

export default function NewCaseStudyPage() {
  return (
    <div>
      <h1 className="px-8 pt-8 text-2xl font-bold text-ink">Add a case study</h1>
      <CaseStudyForm onSubmit={createCaseStudy} />
    </div>
  );
}
