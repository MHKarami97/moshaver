import { AlertTriangle, Target } from "lucide-react";
import type { ReportRow } from "../api/reports.api";
import { reportAccuracy, reportNumber } from "../report-utils";
import { fa } from "../../../shared/lib/utils";
import { AdminDataTable } from "../../../shared/ui/admin-data-table";

export function ReportCompactList({
  reports,
  formatDate,
}: {
  reports: ReportRow[];
  formatDate: (value?: string | Date) => string;
}) {
  return (
    <AdminDataTable
      rows={reports}
      rowId={(row) => String(row.id ?? `${row.plan_date ?? row.planDate}-${row.created_at ?? ""}`)}
      label="گزارش‌های روزانه"
      mobileCard={(row) => {
        const date = row.plan_date ?? row.planDate;
        const accuracy = reportAccuracy(row);
        return (
          <div className="grid gap-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <strong>{date ? formatDate(String(date)) : "—"}</strong>
              <span className="text-xs text-slate-500">
                دقت: {accuracy === null ? "—" : `${fa(accuracy)}٪`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Metric
                label="مطالعه"
                value={`${fa(reportNumber(row.study_hours ?? row.studyHours))} ساعت`}
              />
              <Metric label="تست" value={fa(reportNumber(row.tests))} />
              <Metric label="تمرکز" value={`${fa(reportNumber(row.focus))}/۱۰`} />
            </div>
            {row.problem || row.tomorrow ? (
              <div className="grid gap-1 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                {row.problem ? (
                  <span className="text-rose-700">مسئله: {String(row.problem)}</span>
                ) : null}
                {row.tomorrow ? (
                  <span className="text-indigo-700">فردا: {String(row.tomorrow)}</span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      }}
      columns={[
        {
          id: "date",
          header: "تاریخ",
          cell: (row) => {
            const date = row.plan_date ?? row.planDate;
            return (
              <span className="whitespace-nowrap font-semibold">
                {date ? formatDate(String(date)) : "—"}
              </span>
            );
          },
        },
        {
          id: "study",
          header: "مطالعه",
          cell: (row) => `${fa(reportNumber(row.study_hours ?? row.studyHours))} ساعت`,
        },
        { id: "tests", header: "تست", cell: (row) => fa(reportNumber(row.tests)) },
        {
          id: "accuracy",
          header: "دقت",
          cell: (row) => {
            const accuracy = reportAccuracy(row);
            return accuracy === null ? "—" : `${fa(accuracy)}٪`;
          },
        },
        { id: "focus", header: "تمرکز", cell: (row) => `${fa(reportNumber(row.focus))}/۱۰` },
        {
          id: "motivation",
          header: "انگیزه",
          cell: (row) => `${fa(reportNumber(row.motivation))}/۱۰`,
        },
        { id: "fatigue", header: "خستگی", cell: (row) => `${fa(reportNumber(row.fatigue))}/۱۰` },
        {
          id: "note",
          header: "یادداشت",
          className: "max-w-[260px]",
          cell: (row) => (
            <div className="flex min-w-0 gap-2">
              {row.problem ? (
                <span
                  title={String(row.problem)}
                  className="inline-flex min-w-0 items-center gap-1 text-rose-700"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span className="truncate">{String(row.problem)}</span>
                </span>
              ) : null}
              {row.tomorrow ? (
                <span
                  title={String(row.tomorrow)}
                  className="inline-flex min-w-0 items-center gap-1 text-indigo-700"
                >
                  <Target size={14} className="shrink-0" />
                  <span className="truncate">{String(row.tomorrow)}</span>
                </span>
              ) : null}
              {!row.problem && !row.tomorrow ? "—" : null}
            </div>
          ),
        },
      ]}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-900">
      <b className="block text-slate-800 dark:text-slate-100">{value}</b>
      <span className="mt-1 block text-slate-500">{label}</span>
    </span>
  );
}
