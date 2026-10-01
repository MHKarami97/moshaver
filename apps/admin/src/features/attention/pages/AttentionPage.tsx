import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge, Button } from "../../../shared/ui/ui";
import { getAttentionQueue, type AttentionItem } from "../api/attention.api";
import { useMemo, useState } from "react";

const priorityLabels = { urgent: "فوری", high: "بالا", normal: "عادی" } as const;
const priorityTones = { urgent: "red", high: "amber", normal: "blue" } as const;
export const attentionStatusLabels = { open: "باز" } as const;

export function formatAttentionDueDate(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(value.length > 10 ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

const typeLabels: Record<AttentionItem["type"], string> = {
  recovery: "بازیابی",
  task_issue: "مسئله فعالیت",
  retry_request: "تلاش مجدد",
  unread_chat: "گفت‌وگو",
  sync_failure: "همگام‌سازی",
  inactive_user: "حساب",
};

export function AttentionPage() {
  const queue = useQuery({ queryKey: ["attention-queue"], queryFn: () => getAttentionQueue() });
  const [priority, setPriority] = useState<"all" | AttentionItem["priority"]>("all");
  const items = useMemo(
    () =>
      (queue.data?.items ?? []).filter((item) => priority === "all" || item.priority === priority),
    [priority, queue.data?.items],
  );

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-bold text-brand">عملیات یکپارچه</p>
        <h1 className="text-xl font-black">نیازمند توجه</h1>
        <p className="mt-1 text-sm text-slate-500">
          فقط کارهایی را می‌بینید که در نقش و محدوده کاری فعلی شما مجاز هستند.
        </p>
      </div>
      <AdminList
        label="صف رسیدگی"
        description="درخواست‌ها، خطاها و پیام‌های باز با اولویت بالاتر در ابتدای صف قرار می‌گیرند."
        items={items}
        loading={queue.isLoading}
        error={queue.isError}
        errorTitle="صف نیازمند توجه دریافت نشد."
        onRetry={() => void queue.refetch()}
        toolbar={
          <div className="flex flex-wrap gap-2" aria-label="فیلتر اولویت">
            {(["all", "urgent", "high", "normal"] as const).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={priority === value ? "primary" : "ghost"}
                onClick={() => setPriority(value)}
              >
                {value === "all" ? "همه" : priorityLabels[value]}
              </Button>
            ))}
          </div>
        }
        actions={
          <Button
            size="sm"
            variant="soft"
            loading={queue.isFetching}
            onClick={() => void queue.refetch()}
          >
            <RefreshCw size={15} />
            به‌روزرسانی
          </Button>
        }
        emptyTitle={
          priority === "all" ? "مورد بازی برای رسیدگی ندارید." : "موردی با این اولویت وجود ندارد."
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}
        </div>
      </AdminList>
    </section>
  );
}

export function AttentionCard({ item }: { item: AttentionItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={priorityTones[item.priority]}>
            <AlertTriangle size={13} />
            {priorityLabels[item.priority]}
          </Badge>
          <h2 className="mt-2 font-black text-ink">{item.title}</h2>
        </div>
        <Badge tone="neutral">{typeLabels[item.type]}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {item.description}
      </p>
      <dl className="mt-4 grid gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <UserRound size={14} />
          <dt className="sr-only">مالک</dt>
          <dd>{item.owner.label}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CircleDot size={14} />
          <dt>وضعیت</dt>
          <dd>{attentionStatusLabels[item.status]}</dd>
        </div>
        {item.dueAt ? (
          <div className="flex items-center gap-2">
            <CalendarClock size={14} />
            <dt>سررسید</dt>
            <dd>{formatAttentionDueDate(item.dueAt)}</dd>
          </div>
        ) : null}
        {item.student ? (
          <div>
            <dt className="sr-only">دانش‌آموز</dt>
            <dd>دانش‌آموز: {item.student.name}</dd>
          </div>
        ) : null}
      </dl>
      <Link
        to={item.deepLink}
        className="mt-4 inline-flex h-9 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-bold text-white outline-none transition hover:bg-brand/90 focus-visible:ring-4 focus-visible:ring-brand/20"
      >
        باز کردن مورد <ArrowUpRight size={14} />
      </Link>
    </article>
  );
}
