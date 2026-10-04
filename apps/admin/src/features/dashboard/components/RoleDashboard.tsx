import {
  Activity,
  BookOpenCheck,
  Building2,
  CalendarDays,
  FileQuestion,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../auth";
import { Badge, Button, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { AttentionStudent, RoleDashboardData } from "../model/dashboard.types";
import { dashboardCopy } from "../model/dashboard-copy";
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
const n = (value: unknown) => (typeof value === "number" ? value : 0);

export function roleDashboardMetrics(
  data: RoleDashboardData,
  language: "fa" | "en" = "fa",
): Metric[] {
  const copy = dashboardCopy[language];
  const common: Metric[] = [
    {
      label: copy.assignedStudents,
      value: n(data.assignedStudents),
      hint: copy.assignedStudentsHint,
      icon: UsersRound,
      tone: "green",
    },
    {
      label: copy.unreadMessages,
      value: n(data.unreadConversations),
      hint: copy.unreadMessagesHint,
      icon: MessageSquare,
      tone: "blue",
    },
  ];
  switch (data.context) {
    case "GUARDIAN":
      return [
        {
          label: copy.children,
          value: n(data.children),
          hint: copy.childrenHint,
          icon: UsersRound,
          tone: "green",
        },
        common[1],
      ];
    case "ADVISOR":
      return [
        ...common,
        {
          label: copy.needsAttention,
          value: n(data.attentionStudents),
          hint: copy.needsAttentionHint,
          icon: Activity,
          tone: "red",
        },
        {
          label: copy.recoveryRequests,
          value: n(data.recoveryRequests),
          hint: copy.recoveryRequestsHint,
          icon: RefreshCw,
          tone: "amber",
        },
        {
          label: copy.taskIssues,
          value: n(data.taskIssues),
          hint: copy.taskIssuesHint,
          icon: CalendarDays,
          tone: "amber",
        },
        {
          label: copy.retryRequests,
          value: n(data.retryRequests),
          hint: copy.retryRequestsHint,
          icon: BookOpenCheck,
          tone: "blue",
        },
      ];
    case "TEACHER":
      return [
        ...common,
        {
          label: copy.activeSubjects,
          value: Array.isArray(data.subjects) ? data.subjects.length : 0,
          hint: copy.activeSubjectsHint,
          icon: BookOpenCheck,
          tone: "blue",
        },
        {
          label: copy.openIssues,
          value: n(data.studentsNeedingAttention),
          hint: copy.openIssuesHint,
          icon: Activity,
          tone: "red",
        },
        {
          label: copy.questionBank,
          value: n(data.contentTasks?.questions),
          hint: copy.questionBankHint,
          icon: FileQuestion,
          tone: "amber",
        },
      ];
    case "MENTOR":
      return [
        ...common,
        {
          label: copy.todayPlansMetric,
          value: n(data.recentProgress?.plans),
          hint: copy.todayPlansHint,
          icon: CalendarDays,
          tone: "green",
        },
        {
          label: copy.upcomingGoalsMetric,
          value: data.upcomingGoals?.length || 0,
          hint: copy.upcomingGoalsHint,
          icon: BookOpenCheck,
          tone: "amber",
        },
      ];
    case "CONTENT_MANAGER":
      return [
        {
          label: copy.subjectsMetric,
          value: n(data.subjects),
          hint: copy.subjectsHint,
          icon: BookOpenCheck,
          tone: "green",
        },
        {
          label: copy.questionsMetric,
          value: n(data.questions),
          hint: copy.questionsHint,
          icon: FileQuestion,
          tone: "blue",
        },
        {
          label: copy.quizzesMetric,
          value: n(data.quizzes),
          hint: `${n(data.draftCount).toLocaleString(language === "en" ? "en-US" : "fa-IR")} ${copy.quizzesHint}`,
          icon: BookOpenCheck,
          tone: "amber",
        },
        {
          label: copy.examsMetric,
          value: n(data.exams),
          hint: copy.examsHint,
          icon: CalendarDays,
          tone: "red",
        },
      ];
    case "ORGANIZATION_ADMIN":
      return [
        {
          label: copy.activeMembers,
          value: n(data.members),
          hint: copy.activeMembersHint,
          icon: UsersRound,
          tone: "green",
        },
        {
          label: copy.studentsMetric,
          value: n(data.students),
          hint: copy.studentsHint,
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: copy.staffMetric,
          value: n(data.staff),
          hint: copy.staffHint,
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: copy.inactiveUsers,
          value: n(data.inactiveUsers),
          hint: copy.inactiveUsersHint,
          icon: Activity,
          tone: "red",
        },
      ];
    case "PLATFORM_ADMIN":
      return [
        {
          label: copy.organizationsMetric,
          value: n(data.organizations),
          hint: copy.organizationsHint,
          icon: Building2,
          tone: "green",
        },
        {
          label: copy.usersMetric,
          value: n(data.users),
          hint: copy.usersHint,
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: copy.securityEvents,
          value: n(data.auditSummary?.events24h),
          hint: copy.securityEventsHint,
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: copy.lockedLogins,
          value: n(data.auditSummary?.lockedLogins),
          hint: copy.lockedLoginsHint,
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
  const auth = useAuth();
  const { language, profile } = useLocale();
  const dashboard = dashboardCopy[language];
  const roleKey = data?.context || auth.activeRole || "";
  const roleCopy = {
    GUARDIAN: {
      title: dashboard.guardianWorkspaceTitle,
      description: dashboard.guardianWorkspaceDescription,
    },
    ADVISOR: {
      title: dashboard.advisorWorkspaceTitle,
      description: dashboard.advisorWorkspaceDescription,
    },
    TEACHER: {
      title: dashboard.teacherWorkspaceTitle,
      description: dashboard.teacherWorkspaceDescription,
    },
    MENTOR: {
      title: dashboard.mentorWorkspaceTitle,
      description: dashboard.mentorWorkspaceDescription,
    },
    CONTENT_MANAGER: {
      title: dashboard.contentManagerWorkspaceTitle,
      description: dashboard.contentManagerWorkspaceDescription,
    },
    ORGANIZATION_ADMIN: {
      title: dashboard.organizationAdminWorkspaceTitle,
      description: dashboard.organizationAdminWorkspaceDescription,
    },
    PLATFORM_ADMIN: {
      title: dashboard.platformAdminWorkspaceTitle,
      description: dashboard.platformAdminWorkspaceDescription,
    },
  }[roleKey] || {
    title: dashboard.defaultWorkspaceTitle,
    description: dashboard.defaultWorkspaceDescription,
  };

  const role = data?.context; // "PLATFORM_ADMIN" | "TEACHER" | ...
  const { tone, icon: Icon, label } = getRoleConfig(role);

  if (loading) return <LoadingState label={dashboard.workspaceLoading} />;
  if (error || !data)
    return (
      <EmptyState
        title={dashboard.workspaceUnavailable}
        action={
          <Button variant="soft" onClick={onRetry}>
            <RefreshCw size={16} />
            {dashboard.retry}
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
              <h1 className="truncate text-xl font-black text-ink sm:text-2xl">{roleCopy.title}</h1>
            </div>

            <Button
              variant="soft"
              size="sm"
              loading={refreshing}
              onClick={onRefresh}
              aria-label={dashboard.refreshWorkspace}
              title={dashboard.refreshWorkspace}
            >
              <RefreshCw size={16} />
            </Button>
          </div>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {roleCopy.description}
          </p>
        </div>
        {/* Metrics */}
        <section className="overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {metrics(data, language).map((item) => {
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

                  <strong className="min-w-[3.5rem] shrink-0 text-end text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                    {typeof item.value === "number"
                      ? item.value.toLocaleString(profile.locale)
                      : item.value}
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
