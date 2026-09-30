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
