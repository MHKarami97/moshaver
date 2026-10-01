import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Plan } from "../../../shared/types/domain";
import { StudentAllocationControl } from "../../../shared/ui/student-allocation-control";
import { Button, EmptyState } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { listClasses } from "../../education/api/classes.api";
import {
  applyPlanTemplate,
  createPlanTemplate,
  getPlanTemplates,
  publishPlanTemplate,
  type PlanTemplate,
} from "../api/plan-templates.api";

type Props = {
  organizationId: string;
  plans: Plan[];
  students: Parameters<typeof StudentAllocationControl>[0]["students"];
  canManage: boolean;
  canPublish: boolean;
  canApply: boolean;
  onClose: () => void;
  showClose?: boolean;
};

function templateDays(plans: Plan[]) {
  return plans
    .slice()
    .sort((left, right) => left.planDate.localeCompare(right.planDate))
    .map((plan, offset) => ({
      offset,
      title: plan.title || "برنامه روز",
      motivationText: plan.motivationText || "",
      tasks: plan.tasks.map(
        ({ id: _id, completedAt: _completedAt, completion: _completion, ...task }) => task,
      ),
    }));
}

function stateLabel(state: PlanTemplate["state"]) {
  return {
    DRAFT: "پیش‌نویس",
    IN_REVIEW: "در انتظار بررسی",
    PUBLISHED: "منتشرشده",
    ARCHIVED: "بایگانی",
  }[state];
}

export function PlanTemplateLibrary({
  organizationId,
  plans,
  students,
  canManage,
  canPublish,
  canApply,
  onClose,
  showClose = true,
}: Props) {
  const client = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [targetStartDate, setTargetStartDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const templates = useQuery({
    queryKey: ["plan-templates", organizationId],
    queryFn: () => getPlanTemplates(organizationId),
  });
  const snapshot = useMemo(() => templateDays(plans), [plans]);
  const classes = useQuery({
    queryKey: ["classes", "plan-template-apply"],
    queryFn: () => listClasses(organizationId),
    enabled: canApply,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ["plan-templates", organizationId] });
  const create = useMutation({
    mutationFn: () =>
      createPlanTemplate({
        organizationId,
        title,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        days: snapshot,
      }),
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setTags("");
      void refresh();
    },
  });
  const publish = useMutation({
    mutationFn: publishPlanTemplate,
    onSuccess: refresh,
  });
  const apply = useMutation({
    mutationFn: () =>
      applyPlanTemplate(selectedTemplate!.id, { targetStudentIds, targetStartDate }),
    onSuccess: (result) => {
      notify(
        `${result.created.length.toLocaleString("fa-IR")} برنامه ایجاد شد.${result.skipped.length ? ` ${result.skipped.length.toLocaleString("fa-IR")} برنامهٔ موجود بدون تغییر ماند.` : ""}`,
      );
      setTargetStudentIds([]);
      setSelectedTemplate(null);
      void client.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "اعمال الگو ناموفق بود.", "error"),
  });

  return (
    <div className="grid gap-5" dir="rtl">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        الگوها فقط برای سازمان فعال ذخیره می‌شوند. پیش‌نویس زیر از {snapshot.length} روزِ بازهٔ فعلی
        ساخته می‌شود و وضعیت انجام فعالیت‌ها را کپی نمی‌کند.
      </p>
      {canManage ? (
        <form
          className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) create.mutate();
          }}
        >
          <label className="grid gap-1 text-sm font-medium">
            عنوان الگو
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={180}
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            توضیح (اختیاری)
            <textarea
              className="min-h-20 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={4000}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            برچسب‌ها (با ویرگول جدا کنید)
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              maxLength={2400}
              placeholder="پایه دهم، ریاضی"
            />
          </label>
          {create.isError ? (
            <p className="text-sm text-rose-700" role="alert">
              ذخیره الگو انجام نشد. دوباره تلاش کنید.
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={!title.trim() || create.isPending || snapshot.length === 0}
          >
            {create.isPending ? "در حال ذخیره…" : "ساخت پیش‌نویس از بازه فعلی"}
          </Button>
          {snapshot.length === 0 ? (
            <p className="text-xs text-amber-700">
              برای ساخت الگو، ابتدا یک برنامه در بازه فعلی داشته باشید.
            </p>
          ) : null}
        </form>
      ) : null}
      <section className="grid gap-2">
        <h3 className="text-sm font-bold">الگوهای سازمان</h3>
        {templates.isLoading ? (
          <p className="text-sm text-slate-500">در حال دریافت الگوها…</p>
        ) : null}
        {templates.isError ? (
          <p className="text-sm text-rose-700" role="alert">
            دریافت الگوها ناموفق بود.
          </p>
        ) : null}
        {!templates.isLoading && !templates.isError && !templates.data?.length ? (
          <EmptyState title="هنوز الگویی ساخته نشده است" />
        ) : null}
        {templates.data?.map((template) => (
          <article
            key={template.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {template.title}{" "}
                <span className="text-xs font-normal text-slate-500">نسخه {template.version}</span>
              </p>
              {template.description ? (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {template.description}
                </p>
              ) : null}
              <p className="mt-1 text-xs text-slate-500">
                {stateLabel(template.state)} · {template.days.length} روز{" "}
                {template.tags.length ? `· ${template.tags.join("، ")}` : ""}
              </p>
            </div>
            {canPublish && template.state !== "PUBLISHED" && template.state !== "ARCHIVED" ? (
              <Button
                className="h-8"
                variant="soft"
                disabled={publish.isPending}
                onClick={() => publish.mutate(template.id)}
              >
                انتشار
              </Button>
            ) : null}
            {canApply && template.state === "PUBLISHED" ? (
              <Button className="h-8" variant="soft" onClick={() => setSelectedTemplate(template)}>
                اعمال برای مخاطبان
              </Button>
            ) : null}
          </article>
        ))}
      </section>
      {selectedTemplate ? (
        <section className="grid gap-3 rounded-xl border border-brand/30 bg-brand/5 p-3">
          <div>
            <h3 className="text-sm font-bold">اعمال «{selectedTemplate.title}»</h3>
            <p className="text-xs text-slate-500">
              برنامه‌های موجود حفظ می‌شوند؛ فقط روزهای خالی برای مخاطبان انتخاب‌شده ساخته می‌شوند.
            </p>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            شروع از تاریخ
            <input
              type="date"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-950"
              value={targetStartDate}
              onChange={(event) => setTargetStartDate(event.target.value)}
            />
          </label>
          <StudentAllocationControl
            students={students}
            selectedIds={targetStudentIds}
            onChange={setTargetStudentIds}
            classes={classes.data || []}
            label="مخاطبان الگو"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              loading={apply.isPending}
              disabled={!targetStudentIds.length || !targetStartDate}
              onClick={() => apply.mutate()}
            >
              اعمال برای {targetStudentIds.length.toLocaleString("fa-IR")} دانش‌آموز
            </Button>
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)}>
              انصراف
            </Button>
          </div>
        </section>
      ) : null}
      {showClose ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            بستن
          </Button>
        </div>
      ) : null}
    </div>
  );
}
