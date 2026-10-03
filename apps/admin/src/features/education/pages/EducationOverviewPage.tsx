import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CircleHelp, FilePlus2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { educationNavigation } from "../../../app/layout/admin-navigation";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Button } from "../../../shared/ui/ui";
import { useAuth } from "../../auth";
import { getExams, getRetryRequests } from "../../exams/api/exams.api";
import {
  getEducationOperations,
  type EducationOperationsOverview,
} from "../api/education-catalog.api";
import { EducationCatalogPanel } from "../components/EducationCatalogPanel";
import { EducationExamSnapshot } from "../components/EducationExamSnapshot";
import { EducationOperationsPanel } from "../components/EducationOperationsPanel";
import { EducationSections } from "../components/EducationSection";
import {
  educationOperationsCsv,
  educationOperationsFiltersToRequest,
  educationOperationsQueryKey,
  type EducationOperationsFilters,
} from "../model/education-operations";

const actions = [
  { to: "/admin/exams", label: "ساخت آزمون", capability: "exams.create", icon: FilePlus2 },
  { to: "/admin/questions", label: "ساخت سؤال", capability: "questions.create", icon: CircleHelp },
  { to: "/admin/questions", label: "ورود سؤال", capability: "import.preview", icon: ArrowLeft },
  { to: "/admin/quizzes", label: "ساخت آزمونک", capability: "quizzes.create", icon: Sparkles },
  {
    to: "/admin/exams",
    label: "درخواست‌های بازیابی",
    capability: "retry_requests.read",
    icon: RotateCcw,
  },
] as const;

function downloadOperationsCsv(overview: EducationOperationsOverview) {
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${educationOperationsCsv(overview)}`], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "moshaver-education-operations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function EducationOverviewPage() {
  const auth = useAuth();
  const [filters, setFilters] = useState<EducationOperationsFilters>({
    periodFrom: "",
    periodTo: "",
    cohortGrade: "",
  });
  const canReadExams = auth.can("exams.read");
  const canReadRetries = auth.can("retry_requests.read");
  const canReadOperations = auth.can("education.operations.read");
  const exams = useQuery({ queryKey: ["exams"], queryFn: getExams, enabled: canReadExams });
  const retries = useQuery({
    queryKey: ["exam-retry"],
    queryFn: getRetryRequests,
    enabled: canReadRetries,
  });
  const operations = useQuery({
    queryKey: educationOperationsQueryKey(filters),
    queryFn: () => getEducationOperations(educationOperationsFiltersToRequest(filters)),
    enabled: canReadOperations,
  });
  const visibleActions = actions.filter((action) => auth.can(action.capability));
  const visibleSections = educationNavigation.filter((section) => auth.can(section.capability));

  return (
    <div className="grid gap-4">
      <ManagementPageHeader
        eyebrow="آموزش"
        title="مرکز آموزش"
        description="وضعیت پوشش آموزشی را بررسی کنید، موارد نیازمند رسیدگی را به دانش‌آموز متصل کنید و سپس آزمون یا محتوای لازم را تکمیل کنید."
      />
      <EducationSections sections={visibleSections} />
      {canReadOperations ? (
        <EducationOperationsPanel
          filters={filters}
          onFiltersChange={setFilters}
          operations={operations}
          onExport={downloadOperationsCsv}
        />
      ) : null}
      {canReadExams ? <EducationExamSnapshot exams={exams} retries={retries} /> : null}
      {visibleActions.length ? (
        <section aria-label="اقدام‌های آموزشی" className="flex flex-wrap gap-2">
          {visibleActions.map((action) => (
            <Link key={`${action.to}-${action.label}`} to={action.to}>
              <Button variant="soft" size="sm">
                <action.icon size={14} aria-hidden="true" />
                {action.label}
              </Button>
            </Link>
          ))}
        </section>
      ) : null}
      {auth.can("education.catalog.read") ? (
        <details className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3">
          <summary className="cursor-pointer text-sm font-black text-ink">
            کاتالوگ کتاب‌های درسی و ورود گروهی
          </summary>
          <p className="mt-1 text-xs text-slate-500">
            پس از آماده‌سازی کاتالوگ، پیش‌نمایش ورود را بررسی کنید و پیش‌نویس‌ها را ثبت کنید.
          </p>
          <div className="mt-3">
            <EducationCatalogPanel
              canManage={auth.can("education.catalog.manage")}
              canPublish={auth.can("education.catalog.publish")}
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
