import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Plus,
  Search,
  Share2,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { Plan, PlanTask, Student } from "../../../shared/types/domain";
import { useStudentSelection } from "../../../shared/hooks/useStudentSelection";
import {
  addDays,
  educationLabel,
  fa,
  normalizePersianText,
  todayIso,
} from "../../../shared/lib/utils";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { DataTransferWorkspace } from "../../../shared/ui/data-transfer";
import { DatePicker } from "../../../shared/ui/date-picker";
import { useLocale } from "../../../shared/ui/locale";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import {
  createPlan,
  deletePlan,
  deletePlannerTask,
  duplicatePlan,
  getPlanForDate,
  getPlanShareHistory,
  getPlannerExams,
  getPlannerEducationBooks,
  getPlans,
  movePlannerTask,
  publishPlanRange,
  previewPlanRange,
  savePlannerTask,
  sharePlanRange,
  updatePlan,
} from "../api/planner.api";
import { PlannerCanvas } from "../components/PlannerCanvas";
import {
  DateAction,
  PlanForm,
  TaskDrawer,
  TaskForm,
  toPlanDraft,
  toTaskDraft,
} from "../components/PlannerForms";
import { CommandPalette, ViewSwitch } from "../components/PlannerMenus";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import {
  addMinutes,
  comparePlanTasks,
  errorMessage,
  filterLabel,
  filterPlans,
  minutesBetween,
  optimisticMove,
  parseFilter,
  parseMode,
  planWarnings,
  plannerRange,
  replacePlan,
  shiftView,
  sortPlanTasks,
  summarizePlans,
} from "../lib/planner-model";
import type { PlannerMode, TaskDraft, TaskFilter } from "../model/planner.types";
import { PlannerMoreMenu } from "../components/PlannerMoreMenu";
import { PlanTemplateLibrary } from "../components/PlanTemplateLibrary";
import { TemplateOrganizationPicker } from "../components/TemplateOrganizationPicker";
import { PlannerFilterPopover } from "../components/PlannerFilterPopover";
import { useAuth } from "../../auth";
import { listOrganizations } from "../../access/api/access.api";

export function PlannerPage() {
  const auth = useAuth();
  const isPlatformAdmin = auth.hasRole("PLATFORM_ADMIN");
  const canCreatePlan = auth.can("plans.create");
  const canUpdatePlan = auth.can("plans.update");
  const canCreateTask = auth.can("tasks.create");
  const canUpdateTask = auth.can("tasks.update");
  const canDeleteTask = auth.can("tasks.delete");
  const canDeletePlan = auth.can("plans.delete");
  const canPublish = auth.can("plans.publish");
  const canPlanSettings = canCreatePlan || canUpdatePlan;
  // A quick-add creates a plan when the day is empty, so both capabilities are
  // required. Keeping this conservative prevents a visible action from ending
  // in a server-side 403 for restricted staff roles.
  const canQuickAdd = canCreatePlan && canCreateTask;
  const canManage = canQuickAdd && canUpdateTask;
  const canShare = auth.can("education.share") && auth.can("plans.create");
  const canHistory = auth.can("education.share");
  const canTransfer =
    auth.can("import.preview") || auth.can("import.commit") || auth.can("export.read");
  const organizationId = auth.context?.activeOrganization?.id;
  const organizations = useQuery({
    queryKey: ["organizations", "plan-templates"],
    queryFn: listOrganizations,
    enabled: isPlatformAdmin && auth.can("plan_templates.read") && !organizationId,
  });
  const canTemplateRead =
    auth.can("plan_templates.read") && (Boolean(organizationId) || isPlatformAdmin);
  const canTemplateManage = auth.can("plan_templates.manage");
  const canTemplatePublish = auth.can("plan_templates.publish");
  const students = useStudentSelection(),
    modal = useModal(),
    qc = useQueryClient(),
    { profile } = useLocale(),
    [params, setParams] = useSearchParams();
  const [date, setDateState] = useState(params.get("date") || todayIso());
  const [mode, setModeState] = useState<PlannerMode>(parseMode(params.get("view")));
  const [search, setSearch] = useState(params.get("q") || "");
  const [filter, setFilter] = useState<TaskFilter>(parseFilter(params.get("filter")));
  const [_filtersOpen, setFiltersOpen] = useState(false),
    [summaryOpen, setSummaryOpen] = useState(true),
    [warningsOpen, setWarningsOpen] = useState(true),
    [_moreOpen, setMoreOpen] = useState(false),
    [paletteOpen, setPaletteOpen] = useState(false);
  const [drawer, setDrawer] = useState<{ plan: Plan; task?: PlanTask } | null>(null);
  const deferredSearch = useDebouncedValue(search, 220);
  function syncUrl(next: {
    date?: string;
    mode?: PlannerMode;
    filter?: TaskFilter;
    search?: string;
  }) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next.date !== undefined) copy.set("date", next.date);
        if (next.mode !== undefined) copy.set("view", next.mode);
        if (students.studentId) copy.set("studentId", students.studentId);
        if (next.filter !== undefined)
          next.filter === "all" ? copy.delete("filter") : copy.set("filter", next.filter);
        if (next.search !== undefined) next.search ? copy.set("q", next.search) : copy.delete("q");
        return copy;
      },
      { replace: true },
    );
  }
  const setDate = (next: string) => {
    setDateState(next);
    syncUrl({ date: next });
  };
  const setMode = (next: PlannerMode) => {
    setModeState(next);
    syncUrl({ mode: next });
  };
  const openDay = (next: string) => {
    setDateState(next);
    setModeState("day");
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        copy.set("date", next);
        copy.set("view", "day");
        if (students.studentId) copy.set("studentId", students.studentId);
        return copy;
      },
      { replace: true },
    );
  };
  const setTaskFilter = (next: TaskFilter) => {
    setFilter(next);
    syncUrl({ filter: next });
  };
  useEffect(() => {
    setDateState(params.get("date") || todayIso());
    setModeState(parseMode(params.get("view")));
    setSearch(params.get("q") || "");
    setFilter(parseFilter(params.get("filter")));
  }, [params]);
  const range = useMemo(
    () => plannerRange(date, mode, profile.locale, profile.calendar),
    [date, mode, profile.calendar, profile.locale],
  );
  const plansKey = ["plans", students.studentId, range.from, range.to, deferredSearch, filter];
  const plans = useQuery({
    queryKey: plansKey,
    enabled: !!students.studentId,
    queryFn: () => getPlans(students.studentId, range.from, range.to, deferredSearch, filter),
    select: sortPlanTasks,
  });
  useEffect(() => {
    if (!students.studentId) return;
    [-1, 1].forEach((direction) => {
      const adjacentDate = shiftView(date, mode, direction, profile.locale, profile.calendar),
        adjacent = plannerRange(adjacentDate, mode, profile.locale, profile.calendar);
      void qc.prefetchQuery({
        queryKey: ["plans", students.studentId, adjacent.from, adjacent.to, deferredSearch, filter],
        queryFn: () =>
          getPlans(students.studentId, adjacent.from, adjacent.to, deferredSearch, filter),
        staleTime: 60000,
      });
    });
  }, [
    date,
    deferredSearch,
    filter,
    mode,
    profile.calendar,
    profile.locale,
    qc,
    students.studentId,
  ]);
  const exams = useQuery({
    queryKey: ["exams", students.studentId],
    enabled: !!students.studentId && canManage && auth.can("exams.read"),
    queryFn: () => getPlannerExams(students.studentId),
  });
  const educationBooks = useQuery({
    queryKey: [
      "planner-education-books",
      students.selectedStudent?.gradeId,
      students.selectedStudent?.educationTypeId,
      students.selectedStudent?.trackId,
    ],
    enabled: Boolean(
      students.selectedStudent?.gradeId && students.selectedStudent?.educationTypeId,
    ),
    queryFn: () => getPlannerEducationBooks(students.selectedStudent || {}),
    staleTime: 5 * 60_000,
  });
  const visiblePlans = useMemo(
    () => filterPlans(plans.data ?? [], deferredSearch, filter),
    [deferredSearch, filter, plans.data],
  );
  const totals = summarizePlans(visiblePlans),
    warnings = planWarnings(plans.data ?? []),
    refresh = () => qc.invalidateQueries({ queryKey: ["plans"] });
  const savePlan = useMutation({
    mutationFn: (body: ReturnType<typeof toPlanDraft>) => createPlan(students.studentId, body),
    onSuccess: refresh,
  });
  const patchPlan = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ReturnType<typeof toPlanDraft>> }) =>
      updatePlan(id, body),
    onSuccess: refresh,
  });
  const removePlan = useMutation({
    mutationFn: deletePlan,
    onSuccess: refresh,
  });
  const duplicate = useMutation({
    mutationFn: ({ id, planDate }: { id: string; planDate: string }) => duplicatePlan(id, planDate),
    onSuccess: refresh,
  });
  const share = useMutation({
    mutationFn: ({
      id,
      targetStudentIds,
      sourceFrom,
      sourceTo,
      targetStartDate,
      conflictPolicy,
    }: {
      id: string;
      targetStudentIds: string[];
      sourceFrom: string;
      sourceTo: string;
      targetStartDate: string;
      conflictPolicy: "skip" | "overwrite";
    }) =>
      sharePlanRange(id, {
        targetStudentIds,
        sourceFrom,
        sourceTo,
        targetStartDate,
        conflictPolicy,
      }),
    onSuccess: (result) =>
      notify(
        `${fa(result.copied)} برنامه برای ${fa(result.targetCount)} دانش‌آموز کپی شد${result.skipped ? `؛ ${fa(result.skipped)} مورد موجود بدون تغییر ماند` : ""}.`,
        "success",
      ),
  });
  const saveTask = useMutation({
    mutationFn: ({ planId, task }: { planId: string; task: TaskDraft & { id?: string } }) =>
      savePlannerTask(planId, task),
    onMutate: async ({ planId, task }) => {
      const key = plansKey;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Plan[]>(key);
      qc.setQueryData<Plan[]>(key, (current) =>
        current?.map((plan) =>
          plan.id !== planId
            ? plan
            : {
                ...plan,
                tasks: task.id
                  ? plan.tasks
                      .map((item) => (item.id === task.id ? { ...item, ...task } : item))
                      .sort(comparePlanTasks)
                  : [...plan.tasks, { ...task, id: `optimistic-${Date.now()}` } as PlanTask].sort(
                      comparePlanTasks,
                    ),
              },
        ),
      );
      return { previous, key };
    },
    onSuccess: (updated) => {
      if (updated && typeof updated === "object" && "id" in updated)
        qc.setQueryData<Plan[]>(plansKey, (current) => replacePlan(current, updated as Plan));
      else refresh();
    },
    onError: (_e, _v, c) => {
      if (c?.previous) qc.setQueryData(c.key, c.previous);
    },
    onSettled: refresh,
  });
  const removeTask = useMutation({
    mutationFn: deletePlannerTask,
    onMutate: async (id) => {
      const key = plansKey;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Plan[]>(key);
      qc.setQueryData<Plan[]>(key, (current) =>
        current?.map((p) => ({
          ...p,
          tasks: p.tasks.filter((t) => t.id !== id),
        })),
      );
      return { previous, key };
    },
    onError: (_e, _id, c) => {
      if (c?.previous) qc.setQueryData(c.key, c.previous);
    },
    onSettled: refresh,
  });
  const moveTask = useMutation({
    mutationFn: ({
      taskId,
      planId,
      start,
      end,
    }: {
      taskId: string;
      planId: string;
      start: string;
      end: string;
    }) => movePlannerTask(taskId, planId, start, end),
    onMutate: async (move) => {
      const key = plansKey;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Plan[]>(key);
      qc.setQueryData<Plan[]>(key, (current) => optimisticMove(current || [], move));
      return { previous, key };
    },
    onError: (_e, _m, c) => {
      if (c?.previous) qc.setQueryData(c.key, c.previous);
    },
    onSettled: refresh,
    meta: { successMessage: "زمان فعالیت جابه‌جا شد." },
  });
  const publishRange = useMutation({
    mutationFn: (published: boolean) =>
      publishPlanRange(students.studentId, range.from, range.to, published),
    onSuccess: refresh,
  });
  function openPlan(planDate: string, plan?: Plan) {
    modal.open({
      title: plan ? "ویرایش مشخصات روز" : "ساخت برنامه روز",
      size: "lg",
      content: (
        <PlanForm
          initial={toPlanDraft(planDate, plan)}
          lockDate={Boolean(plan)}
          busy={savePlan.isPending || patchPlan.isPending}
          onCancel={modal.close}
          onSubmit={(body) =>
            (plan ? patchPlan.mutateAsync({ id: plan.id, body }) : savePlan.mutateAsync(body)).then(
              modal.close,
            )
          }
        />
      ),
    });
  }
  function openDuplicate(plan: Plan) {
    modal.open({
      title: "کپی برنامه به روز دیگر",
      content: (
        <DateAction
          initial={addDays(plan.planDate, 1)}
          onCancel={modal.close}
          onSubmit={(planDate) =>
            duplicate.mutateAsync({ id: plan.id, planDate }).then(() => {
              setDate(planDate);
              modal.close();
            })
          }
        />
      ),
    });
  }
  async function openShare() {
    const source =
      plans.data?.find((plan) => plan.planDate === date) ||
      (await getPlanForDate(students.studentId, date));
    if (!source) {
      notify("برای این روز برنامه‌ای برای اشتراک‌گذاری وجود ندارد.", "error");
      return;
    }
    modal.open({
      title: "اشتراک برنامه با دانش‌آموز",
      content: (
        <SharePlanForm
          sourceStudentId={students.studentId}
          students={students.students}
          sourceDate={date}
          initialRange={range}
          busy={share.isPending}
          onCancel={modal.close}
          onSubmit={(body) => share.mutateAsync({ id: source.id, ...body }).then(modal.close)}
          onPreview={(body) => previewPlanRange(source.id, body)}
        />
      ),
    });
  }
  async function openPlanSettings(planDate: string) {
    try {
      const existing =
        plans.data?.find((p) => p.planDate === planDate) ||
        (await getPlanForDate(students.studentId, planDate));
      if ((existing && !canUpdatePlan) || (!existing && !canCreatePlan)) {
        notify("دسترسی لازم برای تغییر تنظیمات این روز را ندارید.", "error");
        return;
      }
      openPlan(planDate, existing || undefined);
    } catch (reason) {
      notify(errorMessage(reason, "دریافت برنامه روز انجام نشد."), "error");
    }
  }
  async function ensurePlan(planDate: string) {
    const existing = plans.data?.find((p) => p.planDate === planDate);
    if (existing) return existing;
    const stored = await getPlanForDate(students.studentId, planDate);
    if (stored) return stored;
    return savePlan.mutateAsync(toPlanDraft(planDate));
  }
  async function quickAdd(planDate: string, start = "08:00") {
    const plan = await ensurePlan(planDate);
    setDrawer({
      plan,
      task: {
        id: "",
        start,
        end: addMinutes(start, 60),
        type: "study",
        title: "",
        subject: "",
        pages: "",
        testCount: 0,
        note: "",
        sortOrder: plan.tasks.length + 1,
      } as PlanTask,
    });
  }
  function requestQuickAdd(planDate: string, start = "08:00") {
    void quickAdd(planDate, start).catch((reason) =>
      notify(errorMessage(reason, "ساخت فعالیت انجام نشد."), "error"),
    );
  }
  function confirmDelete(title: string, description: string, action: () => void) {
    void modal
      .confirm({ title, description, tone: "danger", confirmLabel: "حذف" })
      .then((ok) => ok && action());
  }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input,textarea,select,[contenteditable=true]")) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key.toLowerCase() === "n" && canQuickAdd) {
        event.preventDefault();
        requestQuickAdd(date);
      } else if (event.key.toLowerCase() === "t") setDate(todayIso());
      else if (event.key === "ArrowRight")
        setDate(shiftView(date, mode, -1, profile.locale, profile.calendar));
      else if (event.key === "ArrowLeft")
        setDate(shiftView(date, mode, 1, profile.locale, profile.calendar));
      else if (event.key === "Escape") {
        setFiltersOpen(false);
        setMoreOpen(false);
        setPaletteOpen(false);
        setDrawer(null);
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  return (
    <div className="grid gap-3">
      <header className="sticky top-0 z-20 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44 shrink-0">
            <StudentPicker
              students={students.students}
              value={students.studentId}
              onChange={students.selectStudent}
            />
          </div>
          <div className="flex items-center rounded-lg bg-slate-100 p-1">
            <Button
              className="h-8 px-2"
              variant="ghost"
              aria-label="بازه قبل"
              onClick={() => setDate(shiftView(date, mode, -1, profile.locale, profile.calendar))}
            >
              <ChevronRight size={16} />
            </Button>
            <DatePicker
              className="h-8 w-36 border-0 bg-transparent"
              value={date}
              onChange={setDate}
            />
            <Button
              className="h-8 px-2"
              variant="ghost"
              aria-label="بازه بعد"
              onClick={() => setDate(shiftView(date, mode, 1, profile.locale, profile.calendar))}
            >
              <ChevronLeft size={16} />
            </Button>
          </div>
          <Button className="h-9 px-3" variant="soft" onClick={() => setDate(todayIso())}>
            امروز
          </Button>
          <ViewSwitch value={mode} onChange={setMode} />
          <label className="flex h-9 min-w-44 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3">
            <Search size={15} />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                syncUrl({ search: e.target.value });
              }}
              placeholder="جستجوی فعالیت…"
            />
            <kbd className="hidden rounded bg-white px-1 text-[10px] text-slate-400 lg:inline">
              ⌘K
            </kbd>
          </label>
          <PlannerFilterPopover
            value={filter}
            onChange={(value) => {
              setTaskFilter(value);
            }}
          />
          {canQuickAdd ? (
            <Button
              className="h-9"
              disabled={!students.studentId}
              onClick={() => requestQuickAdd(date)}
            >
              <Plus size={16} />
              فعالیت جدید
            </Button>
          ) : null}
          {canPlanSettings || canPublish || canTransfer || canHistory || canTemplateRead ? (
            <PlannerMoreMenu
              onClose={() => setMoreOpen(false)}
              onPlan={() => {
                setMoreOpen(false);
                void openPlanSettings(date);
              }}
              onPublish={(published) => {
                setMoreOpen(false);
                void modal
                  .confirm({
                    title: published ? "انتشار برنامه‌های بازه؟" : "پیش‌نویس کردن بازه؟",
                    description: `${range.from} تا ${range.to}`,
                  })
                  .then((ok) => ok && publishRange.mutate(published));
              }}
              onTransfer={() => {
                setMoreOpen(false);
                modal.open({
                  title: "ورود و خروج Excel",
                  size: "xl",
                  content: (
                    <DataTransferWorkspace
                      studentId={students.studentId}
                      scope="all"
                      title="انتقال برنامه‌ها و آزمون‌های مرتبط"
                      description="ورود، اعتبارسنجی و خروجی استاندارد بازه"
                      exportFrom={range.from}
                      exportTo={range.to}
                      showPlanReplacement
                      showExamReplacement
                      canImport={auth.can("import.preview")}
                      canCommit={auth.can("import.commit")}
                      canExport={auth.can("export.read")}
                      onImported={() => void refresh()}
                    />
                  ),
                });
              }}
              onHistory={() => {
                setMoreOpen(false);
                modal.open({
                  title: "تاریخچه اشتراک‌گذاری برنامه",
                  size: "lg",
                  content: <PlanShareHistory onClose={modal.close} />,
                });
              }}
              onTemplates={() => {
                const openLibrary = (selectedOrganizationId: string) =>
                  modal.open({
                    title: "کتابخانه الگوهای برنامه",
                    size: "lg",
                    content: (
                      <PlanTemplateLibrary
                        organizationId={selectedOrganizationId}
                        plans={visiblePlans}
                        students={students.students}
                        canManage={canTemplateManage}
                        canPublish={canTemplatePublish}
                        canApply={canCreatePlan}
                        onClose={modal.close}
                      />
                    ),
                  });
                if (organizationId) {
                  openLibrary(organizationId);
                  return;
                }
                if (organizations.isLoading) {
                  notify("در حال دریافت سازمان‌ها…");
                  return;
                }
                modal.open({
                  title: "انتخاب سازمان برای الگوها",
                  size: "sm",
                  content: (
                    <TemplateOrganizationPicker
                      organizations={organizations.data ?? []}
                      onSelect={openLibrary}
                      onClose={modal.close}
                    />
                  ),
                });
              }}
              canPlan={canPlanSettings}
              canPublish={canPublish}
              canTransfer={canTransfer}
              canHistory={canHistory}
              canTemplates={canTemplateRead}
            />
          ) : null}
          {canShare ? (
            <Button
              className="h-9"
              variant="soft"
              disabled={!students.studentId}
              onClick={() => void openShare()}
            >
              <Share2 size={16} />
              اشتراک برنامه
            </Button>
          ) : null}
        </div>
        {filter !== "all" ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">فیلتر فعال:</span>
            <button
              className="flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-brand"
              onClick={() => setTaskFilter("all")}
            >
              {filterLabel(filter)}
              <X size={12} />
            </button>
          </div>
        ) : null}
      </header>
      <section className="flex min-h-10 flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <button
          className="flex items-center gap-2 text-xs font-bold"
          onClick={() => setSummaryOpen((v) => !v)}
        >
          <ChevronsUpDown size={14} />
          خلاصه بازه
        </button>
        {summaryOpen ? (
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span>
              <b>{fa(visiblePlans.length)}</b> روز
            </span>
            <span>
              <b>{fa(totals.tasks)}</b> فعالیت
            </span>
            <span>
              <b>{fa(Math.round((totals.minutes / 60) * 10) / 10)}</b> ساعت
            </span>
            <span>
              <b>{fa(totals.tests)}</b> تست
            </span>
          </div>
        ) : null}
        {warnings.length && warningsOpen ? (
          <button
            className="mr-auto flex max-w-full items-center gap-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800"
            onClick={() => setWarningsOpen(false)}
          >
            <AlertTriangle size={14} />
            <span className="truncate">{warnings[0]}</span>
            {warnings.length > 1 ? <Badge tone="amber">+{fa(warnings.length - 1)}</Badge> : null}
            <X size={12} />
          </button>
        ) : null}
      </section>
      {plans.isError ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          role="alert"
        >
          <span>برنامه‌های این بازه دریافت نشدند؛ داده قبلی، در صورت وجود، حفظ شده است.</span>
          <Button className="h-8" variant="danger" onClick={() => void plans.refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : null}
      <Card className="h-[calc(100vh-235px)] min-h-[480px] overflow-hidden p-0">
        {!students.studentId ? (
          <div className="grid h-full place-items-center p-6">
            <EmptyState
              title="دانش‌آموزی انتخاب نشده است"
              action={
                <p className="text-sm text-slate-500">
                  برای مشاهده یا ساخت برنامه، ابتدا دانش‌آموز را از نوار بالا انتخاب کنید.
                </p>
              }
            />
          </div>
        ) : (
          <PlannerCanvas
            readOnly={!canManage}
            mode={mode}
            date={date}
            range={range}
            plans={visiblePlans}
            loading={plans.isLoading}
            onSelectDay={(next) => {
              openDay(next);
            }}
            onCreate={openPlan}
            onQuickAdd={requestQuickAdd}
            onEditTask={(plan, task) => setDrawer({ plan, task })}
            onDeleteTask={(task) => {
              if (!canDeleteTask) {
                notify("دسترسی حذف فعالیت را ندارید.", "error");
                return;
              }
              confirmDelete("حذف فعالیت؟", "این فعالیت از برنامه دانش‌آموز حذف می‌شود.", () =>
                removeTask.mutate(task.id),
              );
            }}
            onDuplicateTask={(plan, task) => {
              if (!canCreateTask) {
                notify("دسترسی ساخت فعالیت را ندارید.", "error");
                return;
              }
              const start = addMinutes(task.start || "08:00", 30);
              const duration = Math.max(
                15,
                minutesBetween(
                  task.start || "08:00",
                  task.end || addMinutes(task.start || "08:00", 60),
                ),
              );
              void saveTask
                .mutateAsync({
                  planId: plan.id,
                  task: {
                    start,
                    end: addMinutes(start, duration),
                    type: task.type,
                    title: task.title || "",
                    subject: task.subject || "",
                    pages: task.pages || "",
                    testCount: task.testCount || 0,
                    note: task.note || "",
                    examId: task.examId || "",
                    sortOrder: (task.sortOrder || plan.tasks.length) + 1,
                  },
                })
                .then(() => notify("فعالیت ۳۰ دقیقه بعد تکثیر شد.", "success"))
                .catch((reason) =>
                  notify(errorMessage(reason, "تکثیر فعالیت انجام نشد."), "error"),
                );
            }}
            onMoveTask={(taskId, planDate, start, end) =>
              void ensurePlan(planDate)
                .then((plan) => moveTask.mutateAsync({ taskId, planId: plan.id, start, end }))
                .catch((reason) =>
                  notify(
                    errorMessage(reason, "جابجایی فعالیت ذخیره نشد و بازگردانده شد."),
                    "error",
                  ),
                )
            }
            onEditPlan={(plan) => openPlan(plan.planDate, plan)}
            onDuplicatePlan={openDuplicate}
            onDeletePlan={(plan) => {
              if (!canDeletePlan) {
                notify("دسترسی حذف برنامه را ندارید.", "error");
                return;
              }
              confirmDelete("حذف برنامه روز؟", "همه فعالیت‌های این روز حذف می‌شوند.", () =>
                removePlan.mutate(plan.id),
              );
            }}
          />
        )}
      </Card>
      {drawer && canManage ? (
        <TaskDrawer
          title={drawer.task?.id ? "ویرایش فعالیت" : "فعالیت جدید"}
          onClose={() => setDrawer(null)}
          onDelete={
            drawer.task?.id
              ? () =>
                  confirmDelete("حذف فعالیت؟", "این فعالیت از برنامه حذف می‌شود.", () => {
                    removeTask.mutate(drawer.task!.id);
                    setDrawer(null);
                  })
              : undefined
          }
        >
          <TaskForm
            initial={toTaskDraft(
              drawer.task?.id ? drawer.task : undefined,
              drawer.plan.tasks.length,
            )}
            exams={exams.data ?? []}
            books={educationBooks.data ?? []}
            studentId={students.studentId}
            busy={saveTask.isPending}
            onCancel={() => setDrawer(null)}
            onSubmit={(body) =>
              saveTask
                .mutateAsync({
                  planId: drawer.plan.id,
                  task: { ...body, id: drawer.task?.id || undefined },
                })
                .then(() => setDrawer(null))
            }
          />
        </TaskDrawer>
      ) : null}
      {paletteOpen ? (
        <CommandPalette
          plans={plans.data ?? []}
          onClose={() => setPaletteOpen(false)}
          onDate={(next) => {
            setDate(next);
            setPaletteOpen(false);
          }}
          onView={(next) => {
            setMode(next);
            setPaletteOpen(false);
          }}
          onTask={(plan, task) => {
            if (canManage) setDrawer({ plan, task });
            else {
              setDate(plan.planDate);
              setMode("day");
            }
            setPaletteOpen(false);
          }}
          onCreate={
            canManage
              ? () => {
                  requestQuickAdd(date);
                  setPaletteOpen(false);
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}

function PlanShareHistory({ onClose }: { onClose: () => void }) {
  const history = useQuery({
    queryKey: ["planner-share-history"],
    queryFn: getPlanShareHistory,
  });
  if (history.isLoading)
    return (
      <p role="status" className="p-4 text-center text-sm text-slate-500">
        در حال دریافت تاریخچه…
      </p>
    );
  if (history.isError)
    return (
      <div className="grid gap-3 p-3 text-center">
        <p role="alert" className="text-sm text-rose-700">
          دریافت تاریخچه اشتراک‌گذاری انجام نشد.
        </p>
        <Button variant="soft" onClick={() => void history.refetch()}>
          تلاش دوباره
        </Button>
      </div>
    );
  if (!history.data?.length)
    return (
      <div className="grid gap-3 p-3 text-center">
        <p className="text-sm text-slate-500">هنوز اشتراک‌گذاری گروهی ثبت نشده است.</p>
        <Button variant="ghost" onClick={onClose}>
          بستن
        </Button>
      </div>
    );
  return (
    <div className="grid max-h-[65vh] gap-2 overflow-y-auto p-1">
      {history.data.map((entry) => {
        const metadata = entry.metadata || {};
        const targets = Array.isArray(metadata.targetStudentIds)
          ? metadata.targetStudentIds.length
          : 0;
        return (
          <article
            key={entry.id}
            className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>
                {metadata.sourceFrom || "—"} تا {metadata.sourceTo || "—"}
              </strong>
              <time className="text-xs text-slate-500">
                {new Intl.DateTimeFormat("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(entry.createdAt))}
              </time>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {fa(targets)} دانش‌آموز · {fa(Number(metadata.copied || 0))} کپی ·{" "}
              {fa(Number(metadata.skipped || 0))} بدون تغییر
              {metadata.conflictPolicy === "overwrite" ? " · جایگزینی مجاز" : " · حفظ برنامه موجود"}
            </p>
          </article>
        );
      })}
      <div className="pt-2 text-left">
        <Button variant="ghost" onClick={onClose}>
          بستن
        </Button>
      </div>
    </div>
  );
}

function SharePlanForm({
  sourceStudentId,
  students,
  sourceDate,
  initialRange,
  busy,
  onCancel,
  onSubmit,
  onPreview,
}: {
  sourceStudentId: string;
  students: Student[];
  sourceDate: string;
  initialRange: { from: string; to: string };
  busy: boolean;
  onCancel(): void;
  onSubmit(body: {
    targetStudentIds: string[];
    sourceFrom: string;
    sourceTo: string;
    targetStartDate: string;
    conflictPolicy: "skip" | "overwrite";
  }): Promise<unknown>;
  onPreview(body: {
    targetStudentIds: string[];
    sourceFrom: string;
    sourceTo: string;
    targetStartDate: string;
    conflictPolicy: "skip" | "overwrite";
  }): Promise<{
    summary: {
      targetCount: number;
      copiedPlanCount: number;
      existingPlanCount: number;
      emptyDestinationDayCount: number;
      timeConflictCount: number;
      examCollisionCount: number;
      overCapacityDayCount: number;
      proposedMinutes: number;
    };
  }>;
}) {
  const choices = students.filter(
    (student) =>
      student.id !== sourceStudentId &&
      student.accountStatus !== "inactive" &&
      student.accountStatus !== "archived" &&
      student.active !== false &&
      student.active !== 0,
  );
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState("");
  const [educationType, setEducationType] = useState("");
  const [track, setTrack] = useState("");
  const [organization, setOrganization] = useState("");
  const [sourceFrom, setSourceFrom] = useState(initialRange.from);
  const [sourceTo, setSourceTo] = useState(initialRange.to);
  const [targetStartDate, setTargetStartDate] = useState(initialRange.from);
  const [conflictPolicy, setConflictPolicy] = useState<"skip" | "overwrite">("skip");
  const [overwriteAcknowledged, setOverwriteAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{
    summary: {
      targetCount: number;
      copiedPlanCount: number;
      existingPlanCount: number;
      emptyDestinationDayCount: number;
      timeConflictCount: number;
      examCollisionCount: number;
      overCapacityDayCount: number;
      proposedMinutes: number;
    };
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const filterValues = (key: "grade" | "educationType" | "track" | "organization") => [
    ...new Set(
      choices
        .map((student) =>
          key === "grade"
            ? student.grade || String(student.gradeId || "")
            : key === "educationType"
              ? student.educationTypeId || ""
              : key === "track"
                ? student.trackId || student.major || ""
                : student.organization?.name ||
                  student.organizations?.map((item) => item.name).join("، ") ||
                  "",
        )
        .filter(Boolean),
    ),
  ];
  const visibleChoices = choices.filter(
    (student) =>
      normalizePersianText(
        `${student.name} ${student.grade || ""} ${student.major || ""} ${student.username || student.user?.username || ""}`,
      ).includes(normalizePersianText(query)) &&
      (!grade || (student.grade || String(student.gradeId || "")) === grade) &&
      (!educationType || student.educationTypeId === educationType) &&
      (!track || (student.trackId || student.major || "") === track) &&
      (!organization ||
        (student.organization?.name ||
          student.organizations?.map((item) => item.name).join("، ") ||
          "") === organization),
  );
  const toggle = (id: string) =>
    setTargetStudentIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  const allVisibleSelected =
    visibleChoices.length > 0 &&
    visibleChoices.every((student) => targetStudentIds.includes(student.id));
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        void onSubmit({
          targetStudentIds,
          sourceFrom,
          sourceTo,
          targetStartDate,
          conflictPolicy,
        }).catch((reason) => setError(errorMessage(reason, "اشتراک‌گذاری برنامه انجام نشد.")));
      }}
    >
      <section className="grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div>
            <strong className="text-sm">دانش‌آموزان مقصد</strong>
            <p className="text-xs text-slate-500">
              فقط دانش‌آموزان در محدوده دسترسی نقش شما نمایش داده می‌شوند.
            </p>
          </div>
          <span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand">
            {fa(targetStudentIds.length)} انتخاب
          </span>
        </div>
        <input
          aria-label="جستجوی دانش‌آموزان مقصد"
          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جستجو بر اساس نام، پایه یا رشته…"
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [grade, setGrade, "پایه", "grade"],
            [educationType, setEducationType, "نوع آموزش", "educationType"],
            [track, setTrack, "رشته / مسیر", "track"],
            [organization, setOrganization, "سازمان", "organization"],
          ].map(([value, setValue, label, key]) => (
            <label
              key={String(key)}
              className="grid gap-1 text-xs text-slate-600 dark:text-slate-300"
            >
              {String(label)}
              <select
                value={String(value)}
                onChange={(event) => (setValue as (value: string) => void)(event.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">همه</option>
                {filterValues(key as "grade" | "educationType" | "track" | "organization").map(
                  (item) => (
                    <option key={item} value={item}>
                      {key === "educationType" || key === "track" ? educationLabel(item) : item}
                    </option>
                  ),
                )}
              </select>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="font-bold text-brand"
            onClick={() =>
              setTargetStudentIds(
                allVisibleSelected
                  ? (current) =>
                      current.filter((id) => !visibleChoices.some((student) => student.id === id))
                  : (current) => [
                      ...new Set([...current, ...visibleChoices.map((student) => student.id)]),
                    ],
              )
            }
          >
            {allVisibleSelected ? "برداشتن انتخاب‌های نمایش‌داده‌شده" : "انتخاب همه نمایش‌داده‌شده"}
          </button>
          {targetStudentIds.length ? (
            <button
              type="button"
              className="text-slate-500"
              onClick={() => setTargetStudentIds([])}
            >
              پاک کردن
            </button>
          ) : null}
        </div>
        <div
          className="max-h-52 overflow-y-auto rounded-lg bg-slate-50 p-1 dark:bg-slate-800/60"
          role="group"
          aria-label="دانش‌آموزان مقصد"
        >
          {visibleChoices.map((student) => (
            <label
              key={student.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-white dark:hover:bg-slate-900"
            >
              <input
                type="checkbox"
                checked={targetStudentIds.includes(student.id)}
                onChange={() => toggle(student.id)}
              />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{student.name}</strong>
                <small className="block truncate text-xs text-slate-500">
                  {[student.grade, student.major, student.user?.username || student.username]
                    .filter(Boolean)
                    .join(" · ") || "پروفایل آموزشی"}
                </small>
              </span>
            </label>
          ))}
          {!visibleChoices.length ? (
            <p className="p-3 text-center text-sm text-slate-500">دانش‌آموزی پیدا نشد.</p>
          ) : null}
        </div>
        {targetStudentIds.length ? (
          <div className="flex flex-wrap gap-1" aria-label="دانش‌آموزان انتخاب‌شده">
            {targetStudentIds.map((id) => {
              const student = choices.find((item) => item.id === id);
              return student ? (
                <button
                  key={id}
                  type="button"
                  className="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand hover:bg-brand/20"
                  onClick={() => toggle(id)}
                  aria-label={`حذف ${student.name} از انتخاب`}
                >
                  {student.name} ×
                </button>
              ) : null;
            })}
          </div>
        ) : null}
      </section>
      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div>
          <strong className="text-sm">بازه و تعارض</strong>
          <p className="text-xs text-slate-500">
            روزهای برنامه با همان فاصله زمانی به تاریخ مقصد منتقل می‌شوند.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="بازه آماده اشتراک‌گذاری">
          <Button
            type="button"
            size="sm"
            variant="soft"
            onClick={() => {
              setSourceFrom(sourceDate);
              setSourceTo(sourceDate);
              setTargetStartDate(sourceDate);
            }}
          >
            فقط همین روز
          </Button>
          <Button
            type="button"
            size="sm"
            variant="soft"
            onClick={() => {
              setSourceFrom(initialRange.from);
              setSourceTo(initialRange.to);
              setTargetStartDate(initialRange.from);
            }}
          >
            بازه نمایش‌داده‌شده
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold">
            از برنامه مبدأ
            <DatePicker value={sourceFrom} onChange={setSourceFrom} />
          </label>
          <label className="grid gap-1 text-sm font-bold">
            تا برنامه مبدأ
            <DatePicker value={sourceTo} onChange={setSourceTo} />
          </label>
          <label className="grid gap-1 text-sm font-bold sm:col-span-2">
            شروع بازه مقصد
            <DatePicker value={targetStartDate} onChange={setTargetStartDate} />
          </label>
        </div>
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
          <input
            type="checkbox"
            checked={conflictPolicy === "overwrite"}
            onChange={(event) => {
              setConflictPolicy(event.target.checked ? "overwrite" : "skip");
              setOverwriteAcknowledged(false);
            }}
          />
          <span>
            <strong>جایگزینی برنامه‌های موجود</strong>
            <small className="mt-1 block">
              به‌صورت پیش‌فرض برنامه موجود حفظ می‌شود. این گزینه فعالیت‌های برنامه مقصد را جایگزین
              می‌کند.
            </small>
          </span>
        </label>
        {conflictPolicy === "overwrite" ? (
          <label className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-sm text-rose-900">
            <input
              type="checkbox"
              checked={overwriteAcknowledged}
              onChange={(event) => setOverwriteAcknowledged(event.target.checked)}
            />
            <span>
              <strong>متوجه هستم که برنامه‌های موجود مقصد جایگزین می‌شوند.</strong>
              <small className="mt-1 block">
                فعالیت‌های انجام‌شده همچنان توسط سرور محافظت می‌شوند و جایگزین نخواهند شد.
              </small>
            </span>
          </label>
        ) : null}
      </section>
      {!choices.length ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          دانش‌آموز دیگری در محدوده نقش فعال شما وجود ندارد.
        </p>
      ) : null}
      {preview ? (
        <section
          className="grid gap-1 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100"
          aria-live="polite"
        >
          <strong>پیش‌نمایش اشتراک‌گذاری</strong>
          <span>
            {fa(preview.summary.targetCount)} دانش‌آموز · {fa(preview.summary.copiedPlanCount)}{" "}
            برنامه مقصد
          </span>
          <span>
            {fa(preview.summary.existingPlanCount)} برنامه موجود ·{" "}
            {fa(preview.summary.emptyDestinationDayCount)} روز خالی
          </span>
          <span>
            {fa(preview.summary.timeConflictCount)} تداخل زمانی ·{" "}
            {fa(preview.summary.examCollisionCount)} تداخل آزمون ·{" "}
            {fa(preview.summary.overCapacityDayCount)} روز فراتر از ظرفیت
          </span>
          <span>
            بار پیشنهادی: {fa(Math.round((preview.summary.proposedMinutes / 60) * 10) / 10)} ساعت
          </span>
          {preview.summary.existingPlanCount ? (
            <small>در حالت پیش‌فرض، برنامه‌های موجود بدون تغییر باقی می‌مانند.</small>
          ) : null}
        </section>
      ) : null}
      {sourceFrom > sourceTo ? (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          تاریخ شروع بازه باید پیش از تاریخ پایان باشد.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
        <Button
          type="button"
          variant="soft"
          loading={previewing}
          disabled={!targetStudentIds.length || sourceFrom > sourceTo}
          onClick={() => {
            setError("");
            setPreviewing(true);
            void onPreview({
              targetStudentIds,
              sourceFrom,
              sourceTo,
              targetStartDate,
              conflictPolicy,
            })
              .then(setPreview)
              .catch((reason) =>
                setError(errorMessage(reason, "پیش‌نمایش اشتراک‌گذاری انجام نشد.")),
              )
              .finally(() => setPreviewing(false));
          }}
        >
          پیش‌نمایش
        </Button>
        <Button
          type="submit"
          disabled={
            busy ||
            !targetStudentIds.length ||
            sourceFrom > sourceTo ||
            (conflictPolicy === "overwrite" && !overwriteAcknowledged)
          }
        >
          {busy ? "در حال اشتراک…" : "اشتراک برنامه"}
        </Button>
      </div>
    </form>
  );
}
