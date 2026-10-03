import { Card, EmptyState } from "../../../shared/ui/ui";
import type { LivePanel, LiveStudent } from "../model/live.types";
import { StudentDetail } from "./StudentDetail";

export function StudentDetailPanel({
  panel,
  student,
  now,
  formatDateTime,
}: {
  panel: LivePanel;
  student?: LiveStudent;
  now: number;
  formatDateTime: (value?: string | Date) => string;
}) {
  return (
    <Card
      className={[
        panel === "details" ? "flex" : "hidden lg:flex",
        "min-h-0 flex-col overflow-hidden p-0",
      ].join(" ")}
    >
      <div className="border-b px-3 py-2">
        <strong>کنترل سریع</strong>

        <p className="text-xs text-slate-500">جزئیات فقط برای مورد انتخاب‌شده</p>
      </div>

      {student ? (
        <StudentDetail student={student} now={now} formatDateTime={formatDateTime} />
      ) : (
        <EmptyState title="یک دانش‌آموز را انتخاب کنید." />
      )}
    </Card>
  );
}
