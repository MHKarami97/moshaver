import {
  CheckCircle2,
  FilePenLine,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { Exam } from "../../../shared/types/domain";
import { Badge, Button, Card, Input, Select } from "../../../shared/ui/ui";
import type { ExamFilterStatus, ExamVisibilityFilter } from "../model/exam.types";

export function ExamFilters({
  exams,
  pendingRetryCount,
  search,
  status,
  visibility,
  selectedCount,
  onSearchChange,
  onStatusChange,
  onVisibilityChange,
  onClear,
  onBulk,
}: {
  exams: Exam[];
  pendingRetryCount: number;
  search: string;
  status: ExamFilterStatus;
  visibility: ExamVisibilityFilter;
  selectedCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ExamFilterStatus) => void;
  onVisibilityChange: (value: ExamVisibilityFilter) => void;
  onClear: () => void;
  onBulk: (action: "publish" | "draft" | "delete") => void;
}) {
  const hasFilters = Boolean(search || status !== "all" || visibility !== "all");

  const publishedCount = exams.filter((exam) => exam.published).length;
  const draftCount = exams.length - publishedCount;
  const withoutQuestionsCount = exams.filter(
    (exam) => exam.published && !exam.delivery?.questionCount,
  ).length;

  return (
    <Card className="sticky top-16 z-20 overflow-hidden border-slate-200/80 bg-white/95 p-0 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85 dark:border-slate-800 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/85">
      <div className="border-b border-slate-200/80 p-3 sm:p-4 dark:border-slate-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <SlidersHorizontal size={17} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">فیلتر آزمون‌ها</p>
              <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                جست‌وجو، وضعیت انتشار و وضعیت برگزاری
              </p>
            </div>
          </div>

          {hasFilters ? (
            <Button className="h-8 gap-1.5 px-2.5 text-xs" variant="ghost" onClick={onClear}>
              <RotateCcw size={14} />
              پاک‌کردن فیلترها
            </Button>
          ) : null}
        </div>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
            />
            <Input
              type="search"
              aria-label="جست‌وجوی آزمون‌ها"
              placeholder="جست‌وجوی نام، درس یا تاریخ…"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pr-9"
            />
          </div>

          <Select
            aria-label="فیلتر وضعیت آزمون"
            value={status}
            onChange={(event) => onStatusChange(event.target.value as ExamFilterStatus)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="upcoming">آینده</option>
            <option value="active">فعال</option>
            <option value="completed">تمام‌شده</option>
            <option value="cancelled">لغوشده</option>
          </Select>

          <Select
            aria-label="فیلتر انتشار آزمون"
            value={visibility}
            onChange={(event) => onVisibilityChange(event.target.value as ExamVisibilityFilter)}
          >
            <option value="all">منتشر و پیش‌نویس</option>
            <option value="published">منتشرشده</option>
            <option value="draft">پیش‌نویس</option>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs sm:px-4">
        <Badge tone="blue">{exams.length} کل</Badge>
        <Badge tone="green">{publishedCount} منتشر</Badge>
        <Badge tone="amber">{draftCount} پیش‌نویس</Badge>

        {withoutQuestionsCount ? <Badge tone="red">{withoutQuestionsCount} بدون سؤال</Badge> : null}

        {pendingRetryCount ? <Badge tone="amber">{pendingRetryCount} درخواست مجدد</Badge> : null}
      </div>

      {selectedCount ? (
        <div className="border-t border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/70 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs text-white dark:bg-slate-100 dark:text-slate-900">
                {selectedCount}
              </span>
              آزمون انتخاب شده
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-8 gap-1.5 px-2.5 text-xs"
                variant="soft"
                onClick={() => onBulk("publish")}
              >
                <CheckCircle2 size={14} />
                انتشار
              </Button>

              <Button
                className="h-8 gap-1.5 px-2.5 text-xs"
                variant="soft"
                onClick={() => onBulk("draft")}
              >
                <FilePenLine size={14} />
                پیش‌نویس
              </Button>

              <Button
                className="h-8 gap-1.5 px-2.5 text-xs"
                variant="danger"
                onClick={() => onBulk("delete")}
              >
                <Trash2 size={14} />
                حذف
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
