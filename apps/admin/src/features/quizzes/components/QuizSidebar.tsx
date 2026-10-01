import { CalendarClock, CircleHelp, Plus, RotateCcw, Search } from "lucide-react";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge, Button, Input, Select } from "../../../shared/ui/ui";
import type { Quiz } from "../model/quiz.types";

type Props = {
  quizzes: Quiz[];
  loading: boolean;
  error: boolean;
  selectedId: string;
  search: string;
  status: string;
  onNew: () => void;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onClear: () => void;
  canCreate: boolean;
};

export function QuizSidebar({
  quizzes,
  loading,
  error,
  selectedId,
  search,
  status,
  onNew,
  onSearch,
  onStatus,
  onSelect,
  onRetry,
  onClear,
  canCreate,
}: Props) {
  return (
    <AdminList
      label="آزمونک‌ها"
      description="برای ویرایش محتوا یا مخاطبان، یک آزمونک را انتخاب کنید."
      items={quizzes}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={
        search || status !== "all"
          ? "آزمونکی با این فیلتر پیدا نشد."
          : "هنوز آزمونکی ثبت نشده است."
      }
      emptyAction={
        search || status !== "all" ? (
          <Button variant="ghost" onClick={onClear}>
            <RotateCcw size={15} />
            پاک‌کردن فیلترها
          </Button>
        ) : canCreate ? (
          <Button onClick={onNew}>
            <Plus size={15} />
            ساخت اولین آزمونک
          </Button>
        ) : undefined
      }
      toolbar={
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_190px_auto] lg:items-end">
        <div className="relative">
          <Search
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            className="pr-9"
            type="search"
            placeholder="جست‌وجو بر اساس نام یا درس…"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
        <Select
          aria-label="فیلتر وضعیت آزمونک"
          value={status}
          onChange={(event) => onStatus(event.target.value)}
        >
          <option value="all">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </Select>
        {canCreate ? (
          <Button onClick={onNew}>
            <Plus size={16} />
            آزمونک جدید
          </Button>
        ) : null}
      </div>
      }
      actions={
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge tone="blue">{quizzes.length.toLocaleString("fa-IR")} نتیجه</Badge>
        </div>
      }
    >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`grid min-h-36 content-between gap-3 rounded-xl border p-4 text-right transition focus:outline-none focus:ring-2 focus:ring-brand ${selectedId === item.id ? "border-brand bg-brand/5 shadow-sm" : "border-slate-200 bg-white hover:border-brand/50 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  <CircleHelp size={17} />
                </span>
                <Badge tone={item.active ? "green" : "neutral"}>
                  {item.active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
              <div className="min-w-0">
                <strong className="block truncate text-sm">{item.title}</strong>
                <p className="mt-1 truncate text-xs text-slate-500">{item.subject || "بدون درس"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>{item.questions?.length.toLocaleString("fa-IR") || "۰"} سؤال</span>
                <span>{item.durationMinutes.toLocaleString("fa-IR")} دقیقه</span>
                {item.openAt ? (
                  <span className="flex items-center gap-1">
                    <CalendarClock size={12} />
                    زمان‌بندی‌شده
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
    </AdminList>
  );
}
