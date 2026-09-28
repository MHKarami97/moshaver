import { Link } from "react-router-dom";
import {
  Activity,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ChevronLeft,
  FileQuestion,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../auth";
import { Badge, Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { fa } from "../../../shared/lib/utils";
import type { AttentionStudent, RoleDashboardData } from "../model/dashboard.types";
import { quickActionsForRole } from "../model/role-experience";
import { AttentionInbox } from "./AttentionInbox";
import { getRoleConfig } from "../model/role-config";
import { DashboardQuickActions } from "./DashboardQuickActions";

type Metric = {
  label: string;
  value: number | string;
  hint: string;
  icon: LucideIcon;
  tone: "green" | "blue" | "amber" | "red";
};
const roleCopy: Record<string, { title: string; description: string }> = {
  GUARDIAN: {
    title: "نمای خانواده",
    description: "برنامه، پیشرفت و ارتباط با تیم آموزشی فرزندتان",
  },
  ADVISOR: {
    title: "میز کار مشاور",
    description: "پیگیری برنامه‌ها، درخواست‌ها و دانش‌آموزان نیازمند توجه",
  },
  TEACHER: { title: "میز کار دبیر", description: "کلاس‌ها، آزمون‌ها و الگوهای خطای دانش‌آموزان" },
  MENTOR: { title: "میز کار منتور", description: "هدف‌ها، روند روزانه و گفت‌وگوهای دانش‌آموزان" },
  CONTENT_MANAGER: {
    title: "استودیوی محتوای آموزشی",
    description: "درس‌ها، سؤال‌ها، آزمون‌ها و آزمونک‌های در حال انتشار",
  },
  ORGANIZATION_ADMIN: {
    title: "مدیریت سازمان",
    description: "اعضا، کارکنان، دانش‌آموزان و سلامت عملیاتی سازمان",
  },
  PLATFORM_ADMIN: {
    title: "فرماندهی پلتفرم",
    description: "سازمان‌ها، کاربران، امنیت و نسخه‌های در حال اجرا",
  },
};
const n = (value: unknown) => (typeof value === "number" ? value : 0);

export function roleDashboardMetrics(data: RoleDashboardData): Metric[] {
  const common: Metric[] = [
    {
      label: "دانش‌آموز تحت پوشش",
      value: n(data.assignedStudents),
      hint: "در محدوده نقش فعال",
      icon: UsersRound,
      tone: "green",
    },
    {
      label: "پیام خوانده‌نشده",
      value: n(data.unreadConversations),
      hint: "گفت‌وگوهای نیازمند پاسخ",
      icon: MessageSquare,
      tone: "blue",
    },
  ];
  switch (data.context) {
    case "GUARDIAN":
      return [
        {
          label: "فرزندان",
          value: n(data.children),
          hint: "پروفایل‌های متصل و تأییدشده",
          icon: UsersRound,
          tone: "green",
        },
        common[1],
      ];
    case "ADVISOR":
      return [
        ...common,
        {
          label: "نیازمند توجه",
          value: n(data.attentionStudents),
          hint: "دانش‌آموز با پیگیری باز",
          icon: Activity,
          tone: "red",
        },
        {
          label: "درخواست بازیابی",
          value: n(data.recoveryRequests),
          hint: "در انتظار تصمیم",
          icon: RefreshCw,
          tone: "amber",
        },
        {
          label: "مسئله فعالیت",
          value: n(data.taskIssues),
          hint: "گزارش باز دانش‌آموز",
          icon: CalendarDays,
          tone: "amber",
        },
        {
          label: "تلاش مجدد",
          value: n(data.retryRequests),
          hint: "درخواست آزمون",
          icon: BookOpenCheck,
          tone: "blue",
        },
      ];
    case "TEACHER":
      return [
        ...common,
        {
          label: "درس فعال",
          value: Array.isArray(data.subjects) ? data.subjects.length : 0,
          hint: "درس‌های تخصیص‌یافته",
          icon: BookOpenCheck,
          tone: "blue",
        },
        {
          label: "خطای باز",
          value: n(data.studentsNeedingAttention),
          hint: "نیازمند مرور آموزشی",
          icon: Activity,
          tone: "red",
        },
        {
          label: "بانک سؤال",
          value: n(data.contentTasks?.questions),
          hint: "سؤال‌های آماده",
          icon: FileQuestion,
          tone: "amber",
        },
      ];
    case "MENTOR":
      return [
        ...common,
        {
          label: "برنامه امروز",
          value: n(data.recentProgress?.plans),
          hint: "برنامه‌های تحت پیگیری",
          icon: CalendarDays,
          tone: "green",
        },
        {
          label: "هدف پیش‌رو",
          value: data.upcomingGoals?.length || 0,
          hint: "آزمون و هدف آینده",
          icon: BookOpenCheck,
          tone: "amber",
        },
      ];
    case "CONTENT_MANAGER":
      return [
        {
          label: "درس",
          value: n(data.subjects),
          hint: "درس‌های فعال",
          icon: BookOpenCheck,
          tone: "green",
        },
        {
          label: "سؤال",
          value: n(data.questions),
          hint: "بانک محتوای آزمون",
          icon: FileQuestion,
          tone: "blue",
        },
        {
          label: "آزمونک",
          value: n(data.quizzes),
          hint: `${fa(n(data.draftCount))} پیش‌نویس`,
          icon: BookOpenCheck,
          tone: "amber",
        },
        {
          label: "آزمون",
          value: n(data.exams),
          hint: "محتوای ارزیابی",
          icon: CalendarDays,
          tone: "red",
        },
      ];
    case "ORGANIZATION_ADMIN":
      return [
        {
          label: "اعضای فعال",
          value: n(data.members),
          hint: "عضویت معتبر سازمان",
          icon: UsersRound,
          tone: "green",
        },
        {
          label: "دانش‌آموز",
          value: n(data.students),
          hint: "حساب آموزشی",
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: "کارکنان",
          value: n(data.staff),
          hint: "تیم سازمان",
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: "کاربر غیرفعال",
          value: n(data.inactiveUsers),
          hint: "نیازمند بررسی حساب",
          icon: Activity,
          tone: "red",
        },
      ];
    case "PLATFORM_ADMIN":
      return [
        {
          label: "سازمان",
          value: n(data.organizations),
          hint: "محدوده‌های پلتفرم",
          icon: Building2,
          tone: "green",
        },
        {
          label: "کاربر",
          value: n(data.users),
          hint: "تمام حساب‌های سامانه",
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: "رویداد امنیتی",
          value: n(data.auditSummary?.events24h),
          hint: "در ۲۴ ساعت گذشته",
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: "ورود قفل‌شده",
          value: n(data.auditSummary?.lockedLogins),
          hint: "محدودیت فعال ورود",
          icon: Activity,
          tone: "red",
        },
      ];
    default:
      return common;
  }
}
const metrics = roleDashboardMetrics;

export function RoleDashboard({
  data,
  loading,
  error,
  refreshing,
  attention,
  attentionLoading,
  attentionError,
  onRefresh,
  onRetry,
  onRetryAttention,
}: {
  data?: RoleDashboardData;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  attention: AttentionStudent[];
  attentionLoading: boolean;
  attentionError: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onRetryAttention: () => void;
}) {
  const auth = useAuth(),
    copy = roleCopy[data?.context || auth.activeRole || ""] || {
      title: "داشبورد",
      description: "نمای کلی فضای کاری شما",
    };

  const role = data?.context; // "PLATFORM_ADMIN" | "TEACHER" | ...
  const { tone, icon: Icon, label } = getRoleConfig(role);

  if (loading) return <LoadingState label="در حال آماده‌سازی میز کار نقش فعال…" />;
  if (error || !data)
    return (
      <EmptyState
        title="داشبورد این نقش دریافت نشد."
        action={
          <Button variant="soft" onClick={onRetry}>
            <RefreshCw size={16} />
            تلاش دوباره
          </Button>
        }
      />
    );
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-10">
      {/* ============= */}
      {/* Left column (3/10 on lg) */}
      {/* ============= */}
      <div className="flex flex-col gap-6 md:col-span-1 lg:col-span-3">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Badge tone={tone} title={label}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </Badge>
              <h1 className="truncate text-xl font-black text-ink sm:text-2xl">{copy.title}</h1>
            </div>

            <Button
              variant="soft"
              size="sm"
              loading={refreshing}
              onClick={onRefresh}
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
            </Button>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {copy.description}
          </p>
        </div>
        {/* Metrics */}
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {metrics(data).map((item) => {
              const MetricIcon = item.icon;
              return (
                <li
                  key={item.label}
                  className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/60"
                >
                  <MetricIcon
                    size={16}
                    strokeWidth={1.75}
                    className="shrink-0 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200"
                    aria-hidden="true"
                  />

                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>

                  {item.hint ? (
                    <span className="hidden shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400 md:inline">
                      {item.hint}
                    </span>
                  ) : null}

                  <strong className="min-w-[3.5rem] shrink-0 text-right text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                    {typeof item.value === "number" ? fa(item.value) : item.value}
                  </strong>
                </li>
              );
            })}
          </ul>
        </section>

        <DashboardQuickActions />
      </div>

      {/* ============= */}
      {/* Right column (7/10 on lg) */}
      {/* ============= */}
      <div className="md:col-span-1 lg:col-span-7">
        {auth.can("student.live.read") ? (
          <AttentionInbox
            students={attention}
            loading={attentionLoading}
            error={attentionError}
            onRetry={onRetryAttention}
          />
        ) : null}
      </div>
    </div>
  );
}
