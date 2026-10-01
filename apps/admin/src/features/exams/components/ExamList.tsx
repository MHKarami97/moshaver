import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Clock3,
  Edit3,
  FileQuestion,
  Grid2X2,
  List,
  RefreshCcw,
  Send,
  Trash2,
  UserRoundCheck,
} from "lucide-react";

import type { Exam } from "../../../shared/types/domain";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import { ExamCard } from "./ExamCard";

type ViewMode = "grid" | "list";

export function ExamList({
  exams,
  filtered,
  selected,
  studentId,
  loading,
  error,
  toggleBusyId,
  onRetry,
  onSelectAll,
  onCheck,
  onEdit,
  onDelete,
  onToggle,
  onAddSyllabus,
  onDeleteSyllabus,
  showQuestions = false,
  onManageAssignments,
  onAnalytics,
}: {
  exams: Exam[];
  filtered: Exam[];
  selected: string[];
  studentId: string;
  loading: boolean;
  error: boolean;
  toggleBusyId?: string;
  onRetry: () => void;
  onSelectAll?: (checked: boolean) => void;
  onCheck?: (examId: string, checked: boolean) => void;
  onEdit?: (exam: Exam) => void;
  onDelete?: (exam: Exam) => void;
  onToggle?: (exam: Exam) => void;
  onAddSyllabus?: (exam: Exam) => void;
  onDeleteSyllabus?: (id: string) => void;
  showQuestions?: boolean;
  onManageAssignments?: (exam: Exam) => void;
  onAnalytics?: (exam: Exam) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const allSelected =
    Boolean(filtered.length) && filtered.every((exam) => selected.includes(exam.id));

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white p-0 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-3 py-3 sm:px-4 dark:border-slate-800">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {onSelectAll ? (
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onSelectAll(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600 dark:border-slate-700"
              />
              <span>انتخاب همه نتایج</span>
            </label>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">فهرست آزمون‌ها</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">مدیریت و مشاهده آزمون‌ها</p>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Badge tone="blue">{filtered.length} نتیجه</Badge>
            {filtered.length !== exams.length ? <span>از {exams.length} آزمون</span> : null}
          </div>

          {selected.length ? (
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
              {selected.length} انتخاب شده
            </span>
          ) : null}
        </div>

        <div
          className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900"
          aria-label="نوع نمایش آزمون‌ها"
        >
          <button
            type="button"
            title="نمایش لیستی"
            aria-label="نمایش لیستی"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
            ].join(" ")}
          >
            <List size={17} />
          </button>

          <button
            type="button"
            title="نمایش شبکه‌ای"
            aria-label="نمایش شبکه‌ای"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              viewMode === "grid"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:bg-white/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
            ].join(" ")}
          >
            <Grid2X2 size={17} />
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {loading ? (
          viewMode === "grid" ? (
            <div
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
              aria-label="در حال دریافت آزمون‌ها"
            >
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-48 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2" aria-label="در حال دریافت آزمون‌ها">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
                />
              ))}
            </div>
          )
        ) : error ? (
          <div className="py-8">
            <EmptyState
              title="دریافت آزمون‌ها ناموفق بود؛ اتصال را بررسی و دوباره تلاش کنید."
              action={
                <Button className="gap-1.5" variant="soft" onClick={onRetry}>
                  <RefreshCcw size={15} />
                  تلاش دوباره
                </Button>
              }
            />
          </div>
        ) : !filtered.length ? (
          <div className="py-8">
            <EmptyState title="آزمونی با این فیلتر پیدا نشد." />
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                checked={selected.includes(exam.id)}
                onCheck={onCheck ? (checked) => onCheck(exam.id, checked) : undefined}
                onEdit={onEdit ? () => onEdit(exam) : undefined}
                onDelete={onDelete ? () => onDelete(exam) : undefined}
                onToggle={onToggle ? () => onToggle(exam) : undefined}
                toggleBusy={toggleBusyId === exam.id}
                onAddSyllabus={onAddSyllabus ? () => onAddSyllabus(exam) : undefined}
                onDeleteSyllabus={onDeleteSyllabus}
                studentId={studentId}
                showQuestions={showQuestions}
              onManageAssignments={
                  onManageAssignments ? () => onManageAssignments(exam) : undefined
              }
              onAnalytics={onAnalytics ? () => onAnalytics(exam) : undefined}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filtered.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  checked={selected.includes(exam.id)}
                  onCheck={onCheck ? (checked) => onCheck(exam.id, checked) : undefined}
                  onEdit={onEdit ? () => onEdit(exam) : undefined}
                  onDelete={onDelete ? () => onDelete(exam) : undefined}
                  onToggle={onToggle ? () => onToggle(exam) : undefined}
                  toggleBusy={toggleBusyId === exam.id}
                  onAddSyllabus={onAddSyllabus ? () => onAddSyllabus(exam) : undefined}
                  onDeleteSyllabus={onDeleteSyllabus}
                  studentId={studentId}
                  showQuestions={showQuestions}
                  onManageAssignments={
                    onManageAssignments ? () => onManageAssignments(exam) : undefined
                  }
                  onAnalytics={onAnalytics ? () => onAnalytics(exam) : undefined}
                />
              ))}
            </div>
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 md:block">
              <div className="overflow-x-auto">
              <div className="min-w-[1060px]">
                <div className="grid grid-cols-[40px_minmax(240px,2fr)_130px_130px_110px_90px_minmax(330px,1fr)] items-center gap-3 border-b border-slate-200 bg-slate-50/90 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                  <span aria-hidden="true" />
                  <span>آزمون</span>
                  <span>وضعیت</span>
                  <span>تاریخ</span>
                  <span>مدت</span>
                  <span>سؤال</span>
                  <span>عملیات</span>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((exam) => {
                    const isSelected = selected.includes(exam.id);
                    const questionCount =
                      exam.delivery?.questionCount ?? exam.questions?.length ?? 0;

                    return (
                      <div
                        key={exam.id}
                        className={[
                          "grid grid-cols-[40px_minmax(240px,2fr)_130px_130px_110px_90px_minmax(330px,1fr)] items-center gap-3 px-3 py-3 text-sm transition-colors",
                          isSelected
                            ? "bg-teal-50/70 dark:bg-teal-950/20"
                            : "bg-white hover:bg-slate-50/80 dark:bg-slate-950 dark:hover:bg-slate-900/70",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-center">
                          {onCheck ? (
                            <input
                              type="checkbox"
                              aria-label={`انتخاب آزمون ${exam.title}`}
                              checked={isSelected}
                              onChange={(event) => onCheck(exam.id, event.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 accent-teal-600 dark:border-slate-700"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                              {exam.title}
                            </p>

                            {exam.organization?.name ? (
                              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                {exam.organization.name}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            {exam.subject ? <span>{exam.subject}</span> : null}
                            {exam.subjects?.length ? <span>{exam.subjects.join("، ")}</span> : null}
                            {exam.maxAttempts ? <span>{exam.maxAttempts} تلاش</span> : null}

                            {exam.delivery?.assignmentCount !== undefined ? (
                              <span>{exam.delivery.assignmentCount} تخصیص</span>
                            ) : null}

                            {exam.delivery?.attemptCount !== undefined ? (
                              <span>{exam.delivery.attemptCount} پاسخ</span>
                            ) : null}
                          </div>

                          {exam.note ? (
                            <p className="mt-1.5 truncate text-xs text-slate-400 dark:text-slate-500">
                              {exam.note}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col items-start gap-1.5">
                          <Badge tone={exam.published ? "green" : "amber"}>
                            {exam.published ? "منتشرشده" : "پیش‌نویس"}
                          </Badge>

                          {exam.status ? (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {exam.status}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <CalendarDays size={14} className="shrink-0 text-slate-400" />
                          <span>
                            {exam.persianDate ?? new Date(exam.isoDate).toLocaleDateString("fa-IR")}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <Clock3 size={14} className="shrink-0 text-slate-400" />
                          <span>
                            {exam.durationMinutes ? `${exam.durationMinutes} دقیقه` : "—"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                          <FileQuestion size={14} className="shrink-0 text-slate-400" />
                          <span>{questionCount}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {onToggle ? (
                            <Button
                              size="sm"
                              variant="soft"
                              disabled={toggleBusyId === exam.id}
                              onClick={() => onToggle(exam)}
                              className="gap-1"
                            >
                              <Send size={13} />
                              {exam.published ? "لغو انتشار" : "انتشار"}
                            </Button>
                          ) : null}

                          {onEdit ? (
                            <Button
                              size="sm"
                              variant="soft"
                              onClick={() => onEdit(exam)}
                              className="gap-1"
                            >
                              <Edit3 size={13} />
                              ویرایش
                            </Button>
                          ) : null}

                          {onAddSyllabus ? (
                            <Button
                              size="sm"
                              variant="soft"
                              onClick={() => onAddSyllabus(exam)}
                              className="gap-1"
                            >
                              <BookOpen size={13} />
                              بودجه‌بندی
                            </Button>
                          ) : null}

                          {onManageAssignments ? (
                            <Button
                              size="sm"
                              variant="soft"
                              onClick={() => onManageAssignments(exam)}
                              className="gap-1"
                            >
                              <UserRoundCheck size={13} />
                              تخصیص
                            </Button>
                          ) : null}

                          {onDelete ? (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => onDelete(exam)}
                              className="gap-1"
                            >
                              <Trash2 size={13} />
                              حذف
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
