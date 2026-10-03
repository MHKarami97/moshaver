import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  ChevronLeft,
  CircleGauge,
  Clock3,
  Radio,
  UserRoundSearch,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { cn, fa } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import type { AttentionSeverity, AttentionStudent } from "../model/dashboard.types";

type Filter = "all" | "red" | "yellow";

const reasonIcons = {
  overdue_reviews: BookOpenCheck,
  weak_exam_performance: CircleGauge,
  no_recent_activity: Clock3,
} as const;

function severityTone(severity: AttentionSeverity) {
  return severity === "red" ? "red" : severity === "yellow" ? "amber" : "green";
}

export function AttentionInbox({
  students,
  loading,
  error,
  onRetry,
}: {
  students: AttentionStudent[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const { formatDateTime } = useLocale();

  const filtered = useMemo(
    () => students.filter((student) => filter === "all" || student.severity === filter),
    [filter, students],
  );

  const critical = students.filter((student) => student.severity === "red").length;
  const warning = students.filter((student) => student.severity === "yellow").length;

  return (
    <Card id="attention-queue" className="scroll-mt-24 p-0">
      <header className="flex flex-col gap-3 border-b border-[rgb(var(--border-subtle))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white">دانش‌آموزان نیازمند توجه</h3>
            <Badge tone={critical ? "red" : warning ? "amber" : "green"}>
              {fa(students.length)}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            بر اساس مرورهای عقب‌افتاده، عملکرد آزمون و آخرین فعالیت واقعی.
          </p>
        </div>

        <SegmentedControl
          ariaLabel="فیلتر شدت توجه"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: <>همه {fa(students.length)}</> },
            { value: "red", label: <>بحرانی {fa(critical)}</> },
            { value: "yellow", label: <>هشدار {fa(warning)}</> },
          ]}
        />
      </header>

      {loading ? (
        <div className="grid gap-2 p-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-lg bg-[rgb(var(--surface-muted))]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-4">
          <EmptyState
            title="فهرست توجه دریافت نشد."
            action={
              <Button variant="soft" onClick={onRetry}>
                تلاش دوباره
              </Button>
            }
          />
        </div>
      ) : filtered.length ? (
        <div className="divide-y divide-[rgb(var(--border-subtle))]">
          {filtered.slice(0, 12).map((student) => {
            const online = Boolean(student.presence?.online);
            return (
              <article
                key={student.id}
                className="grid gap-3 px-4 py-3 transition hover:bg-[rgb(var(--surface-muted))] lg:grid-cols-[minmax(180px,.7fr)_minmax(0,1.5fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        student.severity === "red" ? "bg-rose-500" : "bg-amber-500",
                      )}
                    />
                    <strong className="truncate text-sm text-slate-900 dark:text-white">
                      {student.name}
                    </strong>
                    <Badge tone={severityTone(student.severity)}>
                      {student.severity === "red" ? "بحرانی" : "هشدار"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                    <span>
                      {[student.grade, student.major].filter(Boolean).join(" · ") ||
                        "پروفایل آموزشی"}
                    </span>
                    <span className="flex items-center gap-1">
                      {online ? (
                        <Radio size={10} className="text-emerald-500" />
                      ) : (
                        <Activity size={10} />
                      )}
                      {online
                        ? "آنلاین"
                        : student.lastSeenAt
                          ? `آخرین فعالیت ${formatDateTime(student.lastSeenAt)}`
                          : "بدون فعالیت ثبت‌شده"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(student.reasons ?? []).map((reason) => {
                    const Icon =
                      reasonIcons[reason.code as keyof typeof reasonIcons] || AlertTriangle;
                    return (
                      <span
                        key={`${reason.code}-${reason.value}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--surface-muted))] px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <Icon size={13} />
                        {reason.label}
                        <b className="tabular-nums">
                          {fa(reason.value)}
                          {reason.code === "weak_exam_performance" ? "%" : ""}
                        </b>
                      </span>
                    );
                  })}
                  {student.remainingTasks > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                      <Clock3 size={13} />
                      {fa(student.remainingTasks)} فعالیت باقی‌مانده
                    </span>
                  ) : null}
                </div>

                <div className="flex gap-2 lg:justify-end">
                  <Link
                    to={`/admin/communication/notifications?studentId=${encodeURIComponent(student.id)}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white transition hover:brightness-90"
                  >
                    پیگیری
                    <ChevronLeft size={14} />
                  </Link>
                  <Link
                    to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}
                    className="grid size-9 place-items-center rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-slate-500 transition hover:border-brand/30 hover:text-brand dark:text-slate-300"
                    aria-label={`بازکردن پروفایل ${student.name}`}
                    title="پروفایل دانش‌آموز"
                  >
                    <UserRoundSearch size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <EmptyState
            title={
              filter === "all"
                ? "دانش‌آموزی با هشدار فعال وجود ندارد."
                : "موردی در این سطح هشدار وجود ندارد."
            }
          />
        </div>
      )}
    </Card>
  );
}
