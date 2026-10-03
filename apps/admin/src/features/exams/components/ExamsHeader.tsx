import { History, Plus, Upload } from "lucide-react";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { Button } from "../../../shared/ui/ui";

export function ExamsHeader({
  students,
  studentId,
  onStudentChange,
  onCreate,
  onHistory,
  onMore,
}: {
  students: Parameters<typeof StudentPicker>[0]["students"];
  studentId: string;
  onStudentChange: (id: string) => void;
  onCreate?: () => void;
  onHistory: () => void;
  onMore?: () => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-[var(--shadow-surface)] sm:p-4">
      <div className="min-w-0 flex-1 sm:max-w-sm">
        <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">
          زمینه دانش‌آموز
        </label>
        <div className="min-w-0">
          <StudentPicker students={students} value={studentId} onChange={onStudentChange} />
          <p className="mt-1 text-xs text-slate-500">اختیاری؛ برای تخصیص سریع و مشاهده سابقه.</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
        {onCreate ? (
          <Button onClick={onCreate}>
            <Plus size={16} />
            آزمون
          </Button>
        ) : null}

        {studentId ? (
          <Button variant="soft" onClick={onHistory}>
            <History size={16} />
            سابقه
          </Button>
        ) : null}

        {onMore ? (
          <Button className="col-span-2 sm:col-span-1" variant="ghost" onClick={onMore}>
            <Upload size={16} />
            ورود / خروجی
          </Button>
        ) : null}
      </div>
    </header>
  );
}
