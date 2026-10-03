import type { UseQueryResult } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { DatePicker } from "../../../shared/ui/date-picker";
import { ManagementStat } from "../../../shared/ui/management-workspace";
import { Button, Card } from "../../../shared/ui/ui";
import type { EducationOperationsOverview } from "../api/education-catalog.api";
import type { EducationOperationsFilters } from "../model/education-operations";

const remediationLabels = {
  incompleteProfiles: "پرونده ناقص",
  withoutPlan: "بدون برنامه",
  withoutResources: "بدون منبع",
  withoutExam: "بدون آزمون",
  withoutReport: "بدون گزارش",
} as const;

export function EducationOperationsPanel({
  filters,
  onFiltersChange,
  operations,
  onExport,
}: {
  filters: EducationOperationsFilters;
  onFiltersChange: (filters: EducationOperationsFilters) => void;
  operations: Pick<
    UseQueryResult<EducationOperationsOverview>,
    "data" | "isError" | "isLoading" | "refetch"
  >;
  onExport: (overview: EducationOperationsOverview) => void;
}) {
  const clearFilters = () => onFiltersChange({ periodFrom: "", periodTo: "", cohortGrade: "" });
  const hasFilters = Boolean(filters.periodFrom || filters.periodTo || filters.cohortGrade);

  return (
    <Card className="grid gap-3 p-3" aria-labelledby="education-operations-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="education-operations-title" className="text-sm font-black text-ink">
            پایش پوشش آموزشی
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            بازه و پایه را انتخاب کنید، موارد نیازمند رسیدگی را باز کنید و نتیجه را برای پیگیری صادر
            کنید.
          </p>
        </div>
        <Button
          variant="soft"
          size="sm"
          disabled={!operations.data}
          onClick={() => operations.data && onExport(operations.data)}
          title="دریافت فایل CSV شاخص‌های فعلی"
        >
          <Download size={14} aria-hidden="true" />
          دریافت CSV
        </Button>
      </div>
      <div
        className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900/60"
        aria-label="فیلترهای پوشش آموزشی"
      >
        <label className="grid w-40 gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>از تاریخ</span>
          <DatePicker
            value={filters.periodFrom}
            max={filters.periodTo}
            onChange={(periodFrom) => onFiltersChange({ ...filters, periodFrom })}
          />
        </label>
        <label className="grid w-40 gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>تا تاریخ</span>
          <DatePicker
            value={filters.periodTo}
            min={filters.periodFrom}
            onChange={(periodTo) => onFiltersChange({ ...filters, periodTo })}
          />
        </label>
        <label className="grid w-32 gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>پایه</span>
          <select
            aria-label="پایه آموزشی"
            className="h-11 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.cohortGrade}
            onChange={(event) => onFiltersChange({ ...filters, cohortGrade: event.target.value })}
          >
            <option value="">همه</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
              <option key={grade} value={grade}>
                پایه {grade.toLocaleString("fa-IR")}
              </option>
            ))}
          </select>
        </label>
        <Button variant="ghost" size="sm" disabled={!hasFilters} onClick={clearFilters}>
          پاک‌سازی فیلترها
        </Button>
      </div>
      {Boolean(filters.periodFrom) !== Boolean(filters.periodTo) ? (
        <p role="status" className="text-xs text-amber-700">
          برای اعمال بازه، هر دو تاریخ را وارد کنید؛ تا آن زمان همه زمان‌ها نمایش داده می‌شود.
        </p>
      ) : null}
      {operations.isLoading ? (
        <p role="status" className="text-sm text-slate-500">
          در حال محاسبه شاخص‌های آموزشی…
        </p>
      ) : null}
      {operations.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700">
          <span>شاخص‌های آموزشی دریافت نشد.</span>
          <Button variant="soft" size="sm" onClick={() => void operations.refetch()}>
            <RefreshCw size={14} aria-hidden="true" />
            تلاش دوباره
          </Button>
        </div>
      ) : null}
      {operations.data ? (
        <>
          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="پوشش آموزشی">
            <ManagementStat
              label="پرونده کامل"
              value={operations.data.students.complete}
              tone="success"
            />
            <ManagementStat
              label="بدون برنامه"
              value={operations.data.coverage.withoutPlan}
              tone="muted"
            />
            <ManagementStat
              label="بدون منبع"
              value={operations.data.coverage.withoutResources}
              tone="muted"
            />
            <ManagementStat
              label="میانگین آزمون"
              value={operations.data.trends.averageExamPercentage ?? 0}
              tone="brand"
            />
          </section>
          <details className="group rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
            <summary className="cursor-pointer text-sm font-bold text-ink">
              جزئیات پوشش و صف‌های پیگیری
            </summary>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="grid gap-1.5">
                {operations.data.distribution.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-900"
                  >
                    <span>{item.label}</span>
                    <strong>{item.count.toLocaleString("fa-IR")}</strong>
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                {Object.entries(operations.data.remediation).map(([key, rows]) => (
                  <div key={key} className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                    <h3 className="text-xs font-bold">
                      {rows[0]?.reason || remediationLabels[key as keyof typeof remediationLabels]}
                    </h3>
                    {rows.length ? (
                      rows.slice(0, 3).map((student) => (
                        <Link
                          key={student.id}
                          to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}
                          className="mt-1 flex justify-between rounded px-1 text-xs hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <span>{student.name}</span>
                          <span className="text-slate-500">
                            پایه {student.grade?.toLocaleString("fa-IR") || "—"}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="mt-1 text-xs text-emerald-700">موردی ندارد.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </>
      ) : null}
    </Card>
  );
}
