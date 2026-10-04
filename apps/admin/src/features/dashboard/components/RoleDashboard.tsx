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
import { Link, useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useAuth } from "../../auth";
import { Badge, Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { DashboardWorkspace } from "../../../shared/ui/dashboard-workspace";
import type { DashboardWorkItem, RoleDashboardData } from "../model/dashboard.types";
import { dashboardCopy } from "../model/dashboard-copy";
import { DashboardWorkQueue } from "./DashboardWorkQueue";
import { getRoleConfig } from "../model/role-config";
import { DashboardQuickActions } from "./DashboardQuickActions";
import { PlatformHealthPanel } from "./PlatformHealthPanel";
import { DashboardSchedule } from "./DashboardSchedule";
import { DashboardPlanHealth } from "./DashboardPlanHealth";
import {
  createRoleDashboardView,
  dashboardSearchForView,
  dashboardViewFromSearch,
  hasDashboardViewSearch,
  useRoleDashboardView,
  visibleRoleDashboardWidgets,
} from "../model/dashboard-layout";
import { quickActionsForRole } from "../model/role-experience";

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
          label: copy.noPlanMetric,
          value: n(data.studentHealthSummary?.noPlan),
          hint: copy.noPlanMetricHint,
          icon: CalendarDays,
          tone: "amber",
        },
        {
          label: copy.studentsMetric,
          value: n(data.students),
          hint: copy.studentsHint,
          icon: UsersRound,
          tone: "blue",
        },
        {
          label: copy.noAdvisorMetric,
          value: n(data.studentHealthSummary?.noAdvisor),
          hint: copy.noAdvisorMetricHint,
          icon: ShieldCheck,
          tone: "amber",
        },
        {
          label: copy.noReportMetric,
          value: n(data.studentHealthSummary?.noReport),
          hint: copy.noReportMetricHint,
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
  workItems,
  workLoading,
  workError,
  onRefresh,
  onRetry,
  onRetryWork,
}: {
  data?: RoleDashboardData;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  workItems: DashboardWorkItem[];
  workLoading: boolean;
  workError: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onRetryWork: () => void;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultView = useMemo(() => createRoleDashboardView(role), [role]);
  const sharedView = useMemo(
    () =>
      hasDashboardViewSearch(searchParams)
        ? dashboardViewFromSearch(defaultView, searchParams)
        : undefined,
    [defaultView, searchParams],
  );
  const syncViewToUrl = useCallback(
    (nextView: ReturnType<typeof createRoleDashboardView>) => {
      setSearchParams((current) => dashboardSearchForView(current, nextView, defaultView), {
        replace: true,
      });
    },
    [defaultView, setSearchParams],
  );
  const { tone, icon: Icon, label } = getRoleConfig(role);
  const { view, setDensity, setWidgetVisible, reset } = useRoleDashboardView(role, {
    sharedView,
    onChange: syncViewToUrl,
  });

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
  const metricItems = metrics(data, language);
  const visibleWidget = (id: string) =>
    visibleRoleDashboardWidgets(view).some((widget) => widget.id === id);
  const showPlatformHealth = data.context === "PLATFORM_ADMIN" && visibleWidget("platform-health");
  const showNextActions =
    visibleWidget("next-actions") &&
    quickActionsForRole(auth.activeRole, auth.capabilities, language).length > 0;
  const supportsSchedule = ["ADVISOR", "TEACHER", "MENTOR"].includes(data.context);
  const showSchedule = visibleWidget("upcoming-schedule") && supportsSchedule;
  const supportsPlanHealth = ["ADVISOR", "MENTOR", "ORGANIZATION_ADMIN"].includes(data.context);
  const showPlanHealth = visibleWidget("plan-health") && supportsPlanHealth;
  const showStudentHealth =
    data.context === "ORGANIZATION_ADMIN" && visibleWidget("student-health");
  const showWeeklyPlanHealth =
    data.context === "ORGANIZATION_ADMIN" && visibleWidget("weekly-plan-health");
  const generatedAt = data.generatedAt
    ? dashboard.refreshedAt +
      " · " +
      new Intl.DateTimeFormat(profile.locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(data.generatedAt),
      )
    : undefined;

  return (
    <DashboardWorkspace
      title={roleCopy.title}
      description={roleCopy.description}
      freshness={
        <span className="inline-flex items-center gap-1.5">
          <Badge tone={tone} title={label}>
            <Icon className="size-3.5" aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </Badge>
          {generatedAt}
        </span>
      }
      density={view.density}
      onDensityChange={setDensity}
      densityLabels={{
        label: dashboard.dashboardDensity,
        comfortable: dashboard.comfortableDensity,
        compact: dashboard.compactDensity,
      }}
      preferences={{
        label: dashboard.dashboardLayout,
        visibleWidgetsLabel: dashboard.visibleWidgets,
        resetLabel: dashboard.resetDashboardLayout,
        widgets: [
          {
            id: "next-actions",
            label: dashboard.nextActionsWidget,
            visible: visibleWidget("next-actions"),
          },
          ...(supportsSchedule
            ? [
                {
                  id: "upcoming-schedule",
                  label: dashboard.upcomingScheduleWidget,
                  visible: visibleWidget("upcoming-schedule"),
                },
              ]
            : []),
          ...(supportsPlanHealth
            ? [
                {
                  id: "plan-health",
                  label: dashboard.planHealthWidget,
                  visible: visibleWidget("plan-health"),
                },
              ]
            : []),
          ...(data.context === "PLATFORM_ADMIN"
            ? [
                {
                  id: "platform-health",
                  label: dashboard.platformHealthWidget,
                  visible: visibleWidget("platform-health"),
                },
              ]
            : []),
          ...(data.context === "ORGANIZATION_ADMIN"
            ? [
                {
                  id: "student-health",
                  label: dashboard.studentHealthWidget,
                  visible: visibleWidget("student-health"),
                },
                {
                  id: "weekly-plan-health",
                  label: dashboard.weeklyPlanHealthWidget,
                  visible: visibleWidget("weekly-plan-health"),
                },
              ]
            : []),
        ],
        onVisibilityChange: setWidgetVisible,
        onReset: reset,
      }}
      actions={
        <>
          {auth.capabilities.includes("exams.read") ? (
            <Link
              to="/admin/exams"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[rgb(var(--border-subtle))] px-2.5 text-xs font-semibold text-ink transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <BookOpenCheck size={15} aria-hidden="true" />
              {dashboard.openAssessments}
            </Link>
          ) : null}
          <Button
            variant="soft"
            size="sm"
            loading={refreshing}
            onClick={onRefresh}
            aria-label={dashboard.refreshWorkspace}
            title={dashboard.refreshWorkspace}
          >
            <RefreshCw size={16} />
            {dashboard.refresh}
          </Button>
        </>
      }
      summary={
        <DashboardMetricGrid
          items={metricItems}
          locale={profile.locale}
          density={view.density}
          label={dashboard.defaultWorkspaceTitle}
        />
      }
      primary={
        <DashboardWorkQueue
          items={workItems}
          loading={workLoading}
          error={workError}
          onRetry={onRetryWork}
        />
      }
      secondary={
        showPlatformHealth || showSchedule || showPlanHealth || showStudentHealth || showWeeklyPlanHealth || showNextActions ? (
          <>
            {showSchedule ? <DashboardSchedule data={data} /> : null}
            {showPlanHealth ? (
              <DashboardPlanHealth
                value={data.todayPlanHealth ?? data.recentProgress}
                href={auth.capabilities.includes("plans.read") ? "/admin/planner" : undefined}
              />
            ) : null}
            {showPlatformHealth ? <PlatformHealthPanel data={data} /> : null}
            {showStudentHealth ? <OrganizationStudentHealth data={data} /> : null}
            {showWeeklyPlanHealth ? (
              <DashboardPlanHealth
                value={data.weeklyPlanHealth}
                href={auth.capabilities.includes("plans.read") ? "/admin/planner" : undefined}
                title={dashboard.weeklyPlanHealthTitle}
                description={dashboard.weeklyPlanHealthDescription}
              />
            ) : null}
            {showNextActions ? <DashboardQuickActions /> : null}
          </>
        ) : undefined
      }
    />
  );
}

function OrganizationStudentHealth({ data }: { data: RoleDashboardData }) {
  const { language, profile } = useLocale();
  const auth = useAuth();
  const copy = dashboardCopy[language];
  const students = data.studentHealth || [];
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-ink">{copy.studentHealthTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{copy.studentHealthDescription}</p>
        </div>
        <span className="flex shrink-0 items-center gap-3 text-xs font-bold text-brand">
          {auth.capabilities.includes("organization.members.manage") ? <Link to="/admin/organizations" className="hover:underline">{copy.openPeopleAccess}</Link> : null}
          <Link to="/admin/students" className="hover:underline">{copy.openStudents}</Link>
        </span>
      </div>
      {students.length ? (
        <ul className="mt-3 divide-y divide-[rgb(var(--border-subtle))]" aria-label={copy.studentHealthTitle}>
          {students.map((student) => {
            const reasons = [
              student.plansToday === 0 ? copy.noPlanToday : student.completedToday === 0 && student.tasksToday > 0 ? copy.noCompletionToday : null,
              !student.reportSubmitted ? copy.noReportToday : null,
              student.syncStatus === "failed" ? copy.syncFailed : null,
              student.openIssues ? copy.openStudentIssue : null,
              student.pendingRecoveries ? copy.pendingRecovery : null,
              !student.advisorAssigned ? copy.noAdvisor : null,
            ].filter(Boolean);
            return <li key={student.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0"><Link to={`/admin/students?studentId=${encodeURIComponent(student.id)}&tab=activity`} className="block truncate text-xs font-bold text-ink hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">{student.name}</Link><span className="mt-0.5 block truncate text-[11px] text-amber-700 dark:text-amber-300">{reasons.join(" · ")}</span></div>
              <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500">{student.completedToday.toLocaleString(profile.locale)}/{student.tasksToday.toLocaleString(profile.locale)}</span>
            </li>;
          })}
        </ul>
      ) : <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{copy.noStudentHealth}</p>}
      <section className="mt-4 border-t border-[rgb(var(--border-subtle))] pt-3" aria-labelledby="advisor-coverage-title">
        <h3 id="advisor-coverage-title" className="text-xs font-black text-ink">{copy.advisorCoverageTitle}</h3>
        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{copy.advisorCoverageDescription}</p>
        {data.advisorCoverage?.length ? (
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label={copy.advisorCoverageTitle}>
            {data.advisorCoverage.map((advisor) => <li key={advisor.id} className="min-w-28 rounded-md bg-[rgb(var(--surface-muted))] px-2.5 py-2"><strong className="block truncate text-xs text-ink">{advisor.name}</strong><span className="mt-0.5 block text-[11px] text-slate-500">{copy.assignedStudentsCount.replace("{count}", advisor.assignedStudents.toLocaleString(profile.locale))}</span></li>)}
          </ul>
        ) : <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{copy.noAdvisorCoverage}</p>}
      </section>
    </Card>
  );
}

function DashboardMetricGrid({
  items,
  locale,
  density,
  label,
}: {
  items: Metric[];
  locale: string;
  density: "comfortable" | "compact";
  label: string;
}) {
  return (
    <section aria-label={label} className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      {items.map((item) => {
        const MetricIcon = item.icon;
        return (
          <Card key={item.label} className={density === "compact" ? "p-3" : "p-4"}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <strong className="mt-2 block text-2xl font-black tabular-nums tracking-tight text-ink">
                  {typeof item.value === "number" ? item.value.toLocaleString(locale) : item.value}
                </strong>
              </div>
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-md ${metricToneClass[item.tone]}`}
              >
                <MetricIcon size={18} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.hint}</p>
          </Card>
        );
      })}
    </section>
  );
}

const metricToneClass = {
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  blue: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  red: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
} as const;
