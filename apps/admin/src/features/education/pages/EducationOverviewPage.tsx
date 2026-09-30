import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CircleHelp, FilePlus2, RotateCcw, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { educationNavigation } from "../../../app/layout/admin-navigation";
import { DatePicker } from "../../../shared/ui/date-picker";
import { ManagementStat } from "../../../shared/ui/management-workspace";
import { Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { useAuth } from "../../auth";
import { getExams, getRetryRequests } from "../../exams/api/exams.api";
import { educationMetrics, subjectDistribution } from "../model/education-overview";
import { EducationSections } from "../components/EducationSection";
import { EducationCatalogPanel } from "../components/EducationCatalogPanel";
import { getEducationOperations, type EducationOperationsOverview } from "../api/education-catalog.api";

const actions = [
  { to: "/admin/exams", label: "ساخت آزمون", capability: "exams.create", icon: FilePlus2 },
  { to: "/admin/questions", label: "ساخت سؤال", capability: "questions.create", icon: CircleHelp },
  { to: "/admin/questions", label: "ورود سؤال", capability: "import.preview", icon: ArrowLeft },
  { to: "/admin/quizzes", label: "ساخت آزمونک", capability: "quizzes.create", icon: Sparkles },
  {
    to: "/admin/exams",
    label: "درخواست های بازیابی",
    capability: "retry_requests.read",
    icon: RotateCcw,
  },
] as const;

function downloadOperationsCsv(overview: EducationOperationsOverview) {
  const rows = [
    ["شاخص", "مقدار"],
    ["محدوده", overview.scope],
    ["گروه پایه", overview.cohort?.grade ?? "همه"],
    ["از تاریخ", overview.period?.from ?? "همه زمان‌ها"],
    ["تا تاریخ", overview.period?.to ?? "همه زمان‌ها"],
    ["دانش‌آموزان", overview.students.total],
    ["پرونده کامل", overview.students.complete],
    ["بدون برنامه", overview.coverage.withoutPlan],
    ["بدون منبع", overview.coverage.withoutResources],
    ["میانگین آزمون", overview.trends.averageExamPercentage ?? ""],
    ["تلاش آزمون نهایی", overview.trends.submittedAttempts],
    ["ساعت مطالعه", overview.trends.totalStudyHours],
  ].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${rows}`], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "moshaver-education-operations.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function EducationOverviewPage() {
  const auth = useAuth();
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [cohortGrade, setCohortGrade] = useState("");
  const period = periodFrom && periodTo ? { from: periodFrom, to: periodTo } : null;
  const canReadExams = auth.can("exams.read");
  const exams = useQuery({ queryKey: ["exams"], queryFn: getExams, enabled: canReadExams });
  const canReadRetries = auth.can("retry_requests.read");
  const retries = useQuery({
    queryKey: ["exam-retry"],
    queryFn: getRetryRequests,
    enabled: canReadRetries,
  });
  const canReadOperations = auth.can("education.operations.read");
  const operations = useQuery({ queryKey: ["education-catalog", "operations", period?.from || "all", period?.to || "all", cohortGrade || "all"], queryFn: () => getEducationOperations({ period, grade: cohortGrade ? Number(cohortGrade) : null }), enabled: canReadOperations });
  const metrics = educationMetrics(exams.data || [], retries.data || []);
  const subjects = subjectDistribution(exams.data || []);
  const visibleActions = actions.filter((action) => auth.can(action.capability));
  const visibleSections = educationNavigation.filter((section) => auth.can(section.capability));

  return (
    <div className="grid gap-4">
      <EducationSections sections={visibleSections} />
      {canReadOperations ? (
        <Card className="grid gap-3 p-3">
          <div className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900/60">
            <label className="grid w-40 gap-1 text-xs text-slate-600 dark:text-slate-300"><span>از تاریخ</span><DatePicker value={periodFrom} max={periodTo} onChange={setPeriodFrom} /></label>
            <label className="grid w-40 gap-1 text-xs text-slate-600 dark:text-slate-300"><span>تا تاریخ</span><DatePicker value={periodTo} min={periodFrom} onChange={setPeriodTo} /></label>
            <label className="grid w-32 gap-1 text-xs text-slate-600 dark:text-slate-300"><span>پایه</span><select className="h-11 rounded-xl border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={cohortGrade} onChange={(event) => setCohortGrade(event.target.value)}><option value="">همه</option>{Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>پایه {grade.toLocaleString("fa-IR")}</option>)}</select></label>
            <div className="flex items-center gap-1 pb-0.5">
              <Button variant="ghost" size="sm" disabled={!periodFrom && !periodTo && !cohortGrade} onClick={() => { setPeriodFrom(""); setPeriodTo(""); setCohortGrade(""); }}>پاک‌سازی</Button>
              <Button variant="soft" size="sm" disabled={!operations.data} onClick={() => operations.data && downloadOperationsCsv(operations.data)}>CSV</Button>
            </div>
          </div>
          {Boolean(periodFrom) !== Boolean(periodTo) ? <span className="text-xs text-amber-700">برای اعمال بازه، هر دو تاریخ را وارد کنید.</span> : null}
          {operations.isLoading ? <p className="text-sm text-slate-500">در حال محاسبه شاخص‌های آموزشی…</p> : null}
          {operations.isError ? <p className="text-sm text-red-700">شاخص‌های آموزشی دریافت نشد.</p> : null}
          {operations.data ? <>
            <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="پوشش آموزشی">
              <ManagementStat label="پرونده کامل" value={operations.data.students.complete} tone="success" />
              <ManagementStat label="بدون برنامه" value={operations.data.coverage.withoutPlan} tone="muted" />
              <ManagementStat label="بدون منبع" value={operations.data.coverage.withoutResources} tone="muted" />
              <ManagementStat label="میانگین آزمون" value={operations.data.trends.averageExamPercentage ?? 0} tone="brand" />
            </section>
            <details className="group rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
              <summary className="cursor-pointer text-sm font-bold text-ink">جزئیات پوشش و صف‌های پیگیری</summary>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="grid gap-1.5">{operations.data.distribution.map((item) => <div key={item.label} className="flex justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-900"><span>{item.label}</span><strong>{item.count.toLocaleString("fa-IR")}</strong></div>)}</div>
                <div className="grid gap-2">{Object.entries(operations.data.remediation).map(([key, rows]) => <div key={key} className="rounded-md bg-slate-50 p-2 dark:bg-slate-900"><h3 className="text-xs font-bold">{rows[0]?.reason || ({ incompleteProfiles: "پرونده ناقص", withoutPlan: "بدون برنامه", withoutResources: "بدون منبع", withoutExam: "بدون آزمون", withoutReport: "بدون گزارش" } as const)[key as keyof typeof operations.data.remediation]}</h3>{rows.length ? rows.slice(0, 3).map((student) => <Link key={student.id} to={`/admin/students?studentId=${encodeURIComponent(student.id)}`} className="mt-1 flex justify-between rounded px-1 text-xs hover:bg-brand/5"><span>{student.name}</span><span className="text-slate-500">پایه {student.grade?.toLocaleString("fa-IR") || "—"}</span></Link>) : <p className="mt-1 text-xs text-emerald-700">موردی ندارد.</p>}</div>)}</div>
              </div>
            </details>
          </> : null}
        </Card>
      ) : null}

      {canReadExams ? exams.isLoading ? <LoadingState label="در حال دریافت نمای آزمون…" /> : exams.isError ? <EmptyState title="دریافت نمای آزمون ناموفق بود." action={<Button variant="soft" onClick={() => void exams.refetch()}>تلاش دوباره</Button>} /> : <>
        <section className="flex flex-wrap gap-2" aria-label="شاخص‌های آزمون">{metrics.map((metric) => <ManagementStat key={metric.key} label={metric.label} value={metric.value} tone={metric.tone} />)}</section>
        <section className="grid gap-3 lg:grid-cols-2">
          <Card className="p-3"><h2 className="text-sm font-black text-ink">موضوع‌های پرتکرار</h2>{subjects.length ? <div className="mt-2 grid gap-1">{subjects.slice(0, 5).map((item) => <div key={item.subject} className="flex justify-between border-b border-slate-100 py-1.5 text-xs dark:border-slate-800"><span>{item.subject}</span><strong>{item.count.toLocaleString("fa-IR")} آزمون</strong></div>)}</div> : <p className="mt-2 text-xs text-slate-500">موضوعی ثبت نشده است.</p>}</Card>
          <Card className="p-3"><h2 className="text-sm font-black text-ink">نیازمند توجه</h2><div className="mt-2 grid gap-1">{(exams.data || []).filter((exam) => !exam.published || !exam.delivery?.questionCount).slice(0, 4).map((exam) => <Link className="flex justify-between rounded-md px-2 py-1.5 text-xs hover:bg-brand/5" key={exam.id} to="/admin/exams"><span className="truncate">{exam.title}</span><span className="text-amber-700">{!exam.delivery?.questionCount ? "بدون سؤال" : "پیش‌نویس"}</span></Link>)}{!(exams.data || []).some((exam) => !exam.published || !exam.delivery?.questionCount) ? <p className="text-xs text-emerald-700">موردی ندارد.</p> : null}</div></Card>
        </section>
        {visibleActions.length ? <div className="flex flex-wrap gap-2">{visibleActions.map((action) => <Link key={`${action.to}-${action.label}`} to={action.to}><Button variant="soft" size="sm"><action.icon size={14} />{action.label}</Button></Link>)}</div> : null}
      </> : null}

      {auth.can("education.catalog.read") ? <details className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3"><summary className="cursor-pointer text-sm font-black text-ink">کاتالوگ کتاب‌های درسی و ورود گروهی</summary><div className="mt-3"><EducationCatalogPanel canManage={auth.can("education.catalog.manage")} canPublish={auth.can("education.catalog.publish")} /></div></details> : null}
    </div>
  );
}
