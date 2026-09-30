import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  CheckSquare2,
  ExternalLink,
  FileVideo2,
  LayoutGrid,
  Link2,
  List,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useAuth } from "../auth";
import { educationLabel } from "../../shared/lib/utils";
import { notify } from "../../shared/ui/notifications";
import { useModal } from "../../shared/ui/modal";
import { StudentAllocationControl } from "../../shared/ui/student-allocation-control";
import { listClasses } from "../education/api/classes.api";
import { Badge, Button, Card, EmptyState, Input, LoadingState, Textarea } from "../../shared/ui/ui";
import {
  createResource,
  deleteResource,
  type LearningResource,
  listResources,
  listResourceStudents,
  type ResourceInput,
  shareResource,
  updateResource,
} from "./api/resources.api";

const empty: ResourceInput = {
  title: "",
  description: "",
  type: "LINK",
  category: "عمومی",
  url: "",
  status: "PUBLISHED",
  studentIds: [],
};

export function ResourcesPage() {
  const auth = useAuth(),
    qc = useQueryClient();
  const modal = useModal();
  const canManage = auth.can("learning_resources.manage"),
    canShare = auth.can("education.share");
  const resources = useQuery({
    queryKey: ["learning-resources"],
    queryFn: listResources,
    enabled: canManage,
  });
  const students = useQuery({
    queryKey: ["students", "resource-picker"],
    queryFn: listResourceStudents,
    enabled: canManage,
  });
  const classes = useQuery({
    queryKey: ["classes", "resource-picker"],
    queryFn: () => listClasses(),
    enabled: canManage && auth.can("classes.read"),
  });
  const [form, setForm] = useState<ResourceInput>(empty),
    [editing, setEditing] = useState<string | null>(null),
    [selectedId, setSelectedId] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState<"ALL" | ResourceInput["status"]>("ALL"),
    [category, setCategory] = useState(""),
    [view, setView] = useState<"details" | "grid">("details"),
    [studentQuery, setStudentQuery] = useState(""),
    [gradeFilter, setGradeFilter] = useState(""),
    [educationTypeFilter, setEducationTypeFilter] = useState(""),
    [trackFilter, setTrackFilter] = useState(""),
    [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all"),
    [confirmDelete, setConfirmDelete] = useState(false),
    [shareTarget, setShareTarget] = useState("");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["learning-resources"] });
  const selected = (resources.data || []).find((item) => item.id === selectedId) || null;
  const save = useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: ResourceInput }) =>
      id ? updateResource(id, draft) : createResource(draft),
    onSuccess: (resource) => {
      refresh();
      setSelectedId(resource.id);
      setEditing(resource.id);
      modal.close();
      notify(editing ? "منبع به‌روزرسانی شد." : "منبع آموزشی ساخته شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره منبع ناموفق بود.", "error"),
  });
  const remove = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      refresh();
      setForm(empty);
      setEditing(null);
      setSelectedId(null);
      setConfirmDelete(false);
      notify("منبع حذف شد.", "success");
    },
    onError: () => notify("حذف منبع ناموفق بود.", "error"),
  });
  const share = useMutation({
    mutationFn: () => shareResource(selectedId!, shareTarget),
    onSuccess: () => {
      refresh();
      setShareTarget("");
      notify("منبع برای دانش‌آموز انتخاب‌شده ارسال شد.", "success");
    },
    onError: () => notify("اشتراک‌گذاری منبع ناموفق بود.", "error"),
  });
  const visibleResources = useMemo(
    () =>
      (resources.data || []).filter(
        (item) =>
          (status === "ALL" || item.status === status) &&
          (!category || item.category === category) &&
          `${item.title} ${item.description} ${item.type} ${item.category}`
            .toLocaleLowerCase("fa")
            .includes(query.trim().toLocaleLowerCase("fa")),
      ),
    [category, query, resources.data, status],
  );
  const visibleStudents = useMemo(
    () =>
      (students.data || []).filter((item) => {
        const selectedForResource = form.studentIds.includes(item.id);
        return (
          (!gradeFilter || String(item.gradeId || item.grade || "") === gradeFilter) &&
          (!educationTypeFilter || item.educationTypeId === educationTypeFilter) &&
          (!trackFilter || item.trackId === trackFilter || item.major === trackFilter) &&
          (assignmentFilter === "all" ||
            (assignmentFilter === "assigned" ? selectedForResource : !selectedForResource)) &&
          `${item.name} ${item.grade || ""} ${item.major || ""} ${item.educationTypeId || ""} ${item.trackId || ""}`
            .toLocaleLowerCase("fa")
            .includes(studentQuery.trim().toLocaleLowerCase("fa"))
        );
      }),
    [
      assignmentFilter,
      educationTypeFilter,
      form.studentIds,
      gradeFilter,
      studentQuery,
      students.data,
      trackFilter,
    ],
  );
  const startEdit = (item: LearningResource) => {
    setSelectedId(item.id);
    setEditing(item.id);
    setForm({
      title: item.title,
      description: item.description,
      type: item.type,
      category: item.category || "عمومی",
      url: item.url,
      status: item.status,
      studentIds: item.assignments.map((assignment) => assignment.student.id),
    });
    setConfirmDelete(false);
  };
  const startNew = () => {
    setSelectedId(null);
    setEditing(null);
    setForm(empty);
    setStudentQuery("");
    setConfirmDelete(false);
  };
  const openEditor = (item?: LearningResource) => {
    const draft: ResourceInput = item
      ? {
          title: item.title,
          description: item.description,
          type: item.type,
          category: item.category || "عمومی",
          url: item.url,
          status: item.status,
          studentIds: item.assignments.map((assignment) => assignment.student.id),
        }
      : empty;
    modal.open({
      title: item ? "ویرایش منبع آموزشی" : "منبع آموزشی جدید",
      description: "مشخصات منبع و دانش‌آموزان دریافت‌کننده را در یک مرحله ثبت کنید.",
      size: "xl",
      content: (
        <ResourceEditorModal
          initialDraft={draft}
          students={students.data || []}
          classes={classes.data || []}
          saving={save.isPending}
          editing={!!item}
          onClose={modal.close}
          onSave={(next) => save.mutate({ id: item?.id || null, draft: next })}
        />
      ),
    });
  };
  const toggleStudent = (id: string) =>
    setForm((value) => ({
      ...value,
      studentIds: value.studentIds.includes(id)
        ? value.studentIds.filter((item) => item !== id)
        : [...value.studentIds, id],
    }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate({ id: editing, draft: form });
  };
  const confirmResourceDelete = async (resource: LearningResource) => {
    const confirmed = await modal.confirm({
      title: "حذف منبع آموزشی؟",
      description: `«${resource.title}» و تخصیص‌های آن حذف می‌شود.`,
      tone: "danger",
      confirmLabel: "حذف منبع",
      confirmationText: resource.title,
    });
    if (confirmed) remove.mutate(resource.id);
  };
  if (!canManage) return <EmptyState title="دسترسی مدیریت منابع آموزشی ندارید." />;
  if (resources.isLoading || students.isLoading || classes.isLoading)
    return <LoadingState label="در حال آماده‌سازی منابع آموزشی…" />;
  if (resources.isError || students.isError)
    return (
      <EmptyState
        title="دریافت منابع آموزشی ناموفق بود."
        action={
          <Button
            variant="soft"
            onClick={() => void Promise.all([resources.refetch(), students.refetch()])}
          >
            <RefreshCw size={16} />
            تلاش دوباره
          </Button>
        }
      />
    );
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
      {/* <Card className="hidden grid gap-3 p-3 xl:sticky xl:top-16">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-black text-ink">{editing ? "ویرایش منبع" : "منبع تازه"}</h2>
          {editing ? (
            <Button size="sm" variant="ghost" onClick={startNew}>
              <X size={15} />
              انصراف
            </Button>
          ) : null}
        </div>
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editing, draft: form });
          }}
        >
          <Field label="عنوان">
            <Input
              required
              minLength={2}
              maxLength={180}
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="عنوان کوتاه و روشن"
            />
          </Field>
          <Field label="پیوند HTTPS">
            <Input
              required
              type="url"
              dir="ltr"
              value={form.url}
              onChange={(event) => setForm({ ...form, url: event.target.value })}
              placeholder="https://…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="نوع">
              <Select
                value={form.type}
                onChange={(value) => setForm({ ...form, type: value as ResourceInput["type"] })}
              >
                <option value="LINK">پیوند</option>
                <option value="VIDEO">ویدئو</option>
              </Select>
            </Field>
            <Field label="وضعیت">
              <Select
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value as ResourceInput["status"] })}
              >
                <option value="PUBLISHED">منتشر</option>
                <option value="DRAFT">پیش‌نویس</option>
                <option value="ARCHIVED">بایگانی</option>
              </Select>
            </Field>
          </div>
          <Field label="دسته‌بندی">
            <Input
              maxLength={80}
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              placeholder="مثلاً مرور، ویدئو، آزمون"
            />
          </Field>
          <Field label="توضیح">
            <Textarea
              className="min-h-24"
              maxLength={4000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </Field>
          <Button
            type="submit"
            loading={save.isPending}
            disabled={!form.studentIds.length || !form.title.trim() || !form.url.trim()}
          >
            <Plus size={16} />
            {editing ? "ذخیره تغییرات" : "ساخت و تخصیص"}
          </Button>
        </form>
      </Card> */}

      <Card className="min-w-0 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-48 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
            <Search size={16} className="text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجوی عنوان یا توضیح"
            />
          </label>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option value="ALL">همه وضعیت‌ها</option>
            <option value="PUBLISHED">منتشر</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="ARCHIVED">بایگانی</option>
          </select>
          <select
            className="h-10 max-w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">همه دسته‌ها</option>
            {[...new Set((resources.data || []).map((item) => item.category || "عمومی"))]
              .sort((a, b) => a.localeCompare(b, "fa"))
              .map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
          </select>
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
            <button
              type="button"
              className={`rounded p-1.5 ${view === "details" ? "bg-white text-brand shadow-sm dark:bg-slate-800" : "text-slate-500"}`}
              title="نمای ردیفی با جزئیات"
              aria-label="نمای ردیفی با جزئیات"
              onClick={() => setView("details")}
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`rounded p-1.5 ${view === "grid" ? "bg-white text-brand shadow-sm dark:bg-slate-800" : "text-slate-500"}`}
              title="نمای سه‌ستونه"
              aria-label="نمای سه‌ستونه"
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <Button size="sm" variant="soft" onClick={() => openEditor()}>
            <Plus size={15} />
            جدید
          </Button>
        </div>
        <div
          className={`mt-3 grid gap-2 ${view === "grid" ? "md:grid-cols-2 2xl:grid-cols-3" : "grid-cols-1"}`}
        >
          {visibleResources.map((item) => (
            <ResourceListItem
              key={item.id}
              item={item}
              view={view}
              selected={selectedId === item.id}
              onSelect={() => setSelectedId(item.id)}
            />
          ))}
          {!visibleResources.length ? (
            <EmptyState
              title={
                query || status !== "ALL" || category
                  ? "منبعی با این فیلتر نیست."
                  : "هنوز منبعی ساخته نشده است."
              }
              action={
                <Button variant="soft" onClick={() => openEditor()}>
                  ساخت منبع
                </Button>
              }
            />
          ) : null}
        </div>
      </Card>

      <Card className="hidden grid gap-3 p-3 xl:sticky xl:top-16">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-ink">تخصیص و کنترل</h2>
          <span className="text-xs text-slate-500">
            {form.studentIds.length.toLocaleString("fa-IR")} انتخاب
          </span>
        </div>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
          <Search size={15} className="text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={studentQuery}
            onChange={(event) => setStudentQuery(event.target.value)}
            placeholder="نام، پایه یا رشته"
          />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option value="">همه پایه‌ها</option>
            {[
              ...new Set(
                (students.data || [])
                  .map((item) => String(item.gradeId || item.grade || ""))
                  .filter(Boolean),
              ),
            ]
              .sort((a, b) => a.localeCompare(b, "fa", { numeric: true }))
              .map((item) => (
                <option key={item} value={item}>
                  {gradeLabel(item)}
                </option>
              ))}
          </select>
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={educationTypeFilter}
            onChange={(event) => {
              setEducationTypeFilter(event.target.value);
              setTrackFilter("");
            }}
          >
            <option value="">همه نوع آموزش</option>
            {[...new Set((students.data || []).map((item) => item.educationTypeId).filter(Boolean))]
              .sort()
              .map((item) => (
                <option key={item} value={item}>
                  {educationLabel(item!)}
                </option>
              ))}
          </select>
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={trackFilter}
            onChange={(event) => setTrackFilter(event.target.value)}
          >
            <option value="">همه رشته‌ها</option>
            {[
              ...new Set(
                (students.data || [])
                  .filter(
                    (item) => !educationTypeFilter || item.educationTypeId === educationTypeFilter,
                  )
                  .map((item) => item.trackId || item.major)
                  .filter(Boolean),
              ),
            ]
              .sort((a, b) => a!.localeCompare(b!, "fa"))
              .map((item) => (
                <option key={item} value={item}>
                  {educationLabel(item!)}
                </option>
              ))}
          </select>
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={assignmentFilter}
            onChange={(event) => setAssignmentFilter(event.target.value as typeof assignmentFilter)}
          >
            <option value="all">همه دانش‌آموزان</option>
            <option value="unassigned">فقط تخصیص‌نداده</option>
            <option value="assigned">فقط انتخاب‌شده</option>
          </select>
        </div>
        {gradeFilter || educationTypeFilter || trackFilter || assignmentFilter !== "all" ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setGradeFilter("");
              setEducationTypeFilter("");
              setTrackFilter("");
              setAssignmentFilter("all");
            }}
          >
            پاک‌کردن فیلترهای دانش‌آموز
          </Button>
        ) : null}
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="soft"
            onClick={() =>
              setForm({
                ...form,
                studentIds: [
                  ...new Set([...form.studentIds, ...visibleStudents.map((item) => item.id)]),
                ],
              })
            }
          >
            <CheckSquare2 size={15} />
            انتخاب نتایج
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setForm({ ...form, studentIds: [] })}
          >
            پاک‌سازی
          </Button>
        </div>
        <div className="grid max-h-64 gap-1 overflow-auto pr-0.5">
          {visibleStudents.map((student) => (
            <label
              key={student.id}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-sm ${form.studentIds.includes(student.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
            >
              <input
                type="checkbox"
                className="size-4 accent-brand"
                checked={form.studentIds.includes(student.id)}
                onChange={() => toggleStudent(student.id)}
              />
              <span className="min-w-0">
                <strong className="block truncate text-xs">{student.name}</strong>
                <small className="block truncate text-xs text-slate-500">
                  {student.grade || "پایه نامشخص"} · {student.major || "رشته نامشخص"}
                </small>
              </span>
            </label>
          ))}
        </div>
        {selected ? (
          <div className="grid gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs">{selected.title}</strong>
                <Badge tone="blue">{selected.category || "عمومی"}</Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {selected.assignments.length.toLocaleString("fa-IR")} دانش‌آموز دریافت‌کننده
              </p>
              <div className="mt-2 grid gap-1">
                {selected.assignments.slice(0, 4).map((assignment) => (
                  <span
                    key={assignment.id}
                    className="flex items-center justify-between rounded bg-white px-2 py-1 text-xs dark:bg-slate-800"
                  >
                    <strong className="truncate">{assignment.student.name}</strong>
                    <small className="text-slate-500">
                      {assignment.student.grade || assignment.student.major || "—"}
                    </small>
                  </span>
                ))}
                {selected.assignments.length > 4 ? (
                  <small className="text-slate-500">
                    و {selected.assignments.length - 4} دانش‌آموز دیگر
                  </small>
                ) : null}
              </div>
            </div>
            <a
              className="inline-flex items-center gap-1 text-xs font-bold text-brand"
              href={selected.url}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              باز کردن منبع
            </a>
            {canShare ? (
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                <p className="mb-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                  اشتراک سریع با نتیجه جست‌وجوی دانش‌آموزان
                </p>
                <div className="flex gap-1">
                  <select
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    aria-label="دانش‌آموز مقصد برای اشتراک"
                    value={shareTarget}
                    onChange={(event) => setShareTarget(event.target.value)}
                  >
                    <option value="">دانش‌آموز مقصد…</option>
                    {visibleStudents
                      .filter(
                        (student) =>
                          !selected.assignments.some(
                            (assignment) => assignment.student.id === student.id,
                          ),
                      )
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} · {student.grade || student.major || "بدون پایه"}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    variant="soft"
                    disabled={!shareTarget}
                    loading={share.isPending}
                    onClick={() => share.mutate()}
                  >
                    <Share2 size={15} />
                    ارسال
                  </Button>
                </div>
              </div>
            ) : null}
            <div className="flex gap-1">
              {confirmDelete ? (
                <>
                  <Button
                    size="sm"
                    variant="danger"
                    loading={remove.isPending}
                    onClick={() => remove.mutate(selected.id)}
                  >
                    <Trash2 size={15} />
                    حذف قطعی
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
                    انصراف
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-700"
                  onClick={() => void confirmResourceDelete(selected)}
                >
                  <Trash2 size={15} />
                  حذف
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => openEditor(selected)}>
                <Pencil size={15} />
                ویرایش
              </Button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900">
            برای ویرایش، اشتراک یا حذف، یک منبع را از فهرست انتخاب کنید.
          </p>
        )}
      </Card>
    </section>
  );
}

function ResourceEditorModal({
  initialDraft,
  students,
  classes,
  saving,
  editing,
  onClose,
  onSave,
}: {
  initialDraft: ResourceInput;
  students: Awaited<ReturnType<typeof listResourceStudents>>;
  classes: Parameters<typeof StudentAllocationControl>[0]["classes"];
  saving: boolean;
  editing: boolean;
  onClose: () => void;
  onSave: (draft: ResourceInput) => void;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [educationType, setEducationType] = useState("");
  const [track, setTrack] = useState("");
  const visible = students.filter(
    (student) =>
      (!grade || String(student.gradeId || student.grade || "") === grade) &&
      (!educationType || student.educationTypeId === educationType) &&
      (!track || student.trackId === track || student.major === track) &&
      `${student.name} ${student.grade || ""} ${student.major || ""}`
        .toLocaleLowerCase("fa")
        .includes(search.trim().toLocaleLowerCase("fa")),
  );
  const toggle = (id: string) =>
    setDraft((current) => ({
      ...current,
      studentIds: current.studentIds.includes(id)
        ? current.studentIds.filter((item) => item !== id)
        : [...current.studentIds, id],
    }));
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="عنوان">
          <Input
            required
            minLength={2}
            maxLength={180}
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            placeholder="عنوان کوتاه و روشن"
          />
        </Field>
        <Field label="پیوند HTTPS">
          <Input
            required
            type="url"
            dir="ltr"
            value={draft.url}
            onChange={(event) => setDraft({ ...draft, url: event.target.value })}
            placeholder="https://…"
          />
        </Field>
        <Field label="نوع">
          <Select
            value={draft.type}
            onChange={(value) => setDraft({ ...draft, type: value as ResourceInput["type"] })}
          >
            <option value="LINK">پیوند</option>
            <option value="VIDEO">ویدئو</option>
          </Select>
        </Field>
        <Field label="وضعیت">
          <Select
            value={draft.status}
            onChange={(value) => setDraft({ ...draft, status: value as ResourceInput["status"] })}
          >
            <option value="PUBLISHED">منتشر</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="ARCHIVED">بایگانی</option>
          </Select>
        </Field>
        <Field label="دسته‌بندی">
          <Input
            maxLength={80}
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            placeholder="مثلاً مرور، ویدئو، آزمون"
          />
        </Field>
        <Field label="دریافت‌کننده">
          <span className="flex h-10 items-center rounded-lg bg-slate-100 px-3 text-sm dark:bg-slate-900">
            {draft.studentIds.length.toLocaleString("fa-IR")} دانش‌آموز
          </span>
        </Field>
      </div>
      <Field label="توضیح">
        <Textarea
          className="min-h-20"
          maxLength={4000}
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
        />
      </Field>
      {false ? (
        <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <strong className="text-sm">دانش‌آموزان</strong>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی نام، پایه یا رشته"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              aria-label="فیلتر پایه"
              value={grade}
              onChange={(event) => setGrade(event.target.value)}
            >
              <option value="">همه پایه‌ها</option>
              {[
                ...new Set(
                  students
                    .map((student) => String(student.gradeId || student.grade || ""))
                    .filter(Boolean),
                ),
              ]
                .sort((a, b) => a.localeCompare(b, "fa", { numeric: true }))
                .map((value) => (
                  <option key={value} value={value}>
                    {gradeLabel(value)}
                  </option>
                ))}
            </select>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              aria-label="فیلتر نوع آموزش"
              value={educationType}
              onChange={(event) => {
                setEducationType(event.target.value);
                setTrack("");
              }}
            >
              <option value="">همه نوع‌ها</option>
              {[...new Set(students.map((student) => student.educationTypeId).filter(Boolean))]
                .sort()
                .map((value) => (
                  <option key={value} value={value}>
                    {educationLabel(value!)}
                  </option>
                ))}
            </select>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
              aria-label="فیلتر رشته"
              value={track}
              onChange={(event) => setTrack(event.target.value)}
            >
              <option value="">همه رشته‌ها</option>
              {[
                ...new Set(
                  students
                    .filter(
                      (student) => !educationType || student.educationTypeId === educationType,
                    )
                    .map((student) => student.trackId || student.major)
                    .filter(Boolean),
                ),
              ]
                .sort((a, b) => a!.localeCompare(b!, "fa"))
                .map((value) => (
                  <option key={value} value={value}>
                    {educationLabel(value!)}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
            {visible.map((student) => (
              <label
                key={student.id}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 ${draft.studentIds.includes(student.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
              >
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={draft.studentIds.includes(student.id)}
                  onChange={() => toggle(student.id)}
                />
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{student.name}</strong>
                  <small className="block truncate text-xs text-slate-500">
                    {student.grade || "پایه نامشخص"} · {student.major || "رشته نامشخص"}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </section>
      ) : null}
      <StudentAllocationControl
        students={students}
        selectedIds={draft.studentIds}
        onChange={(studentIds) => setDraft({ ...draft, studentIds })}
        classes={classes}
      />
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button type="button" variant="ghost" onClick={onClose}>
          انصراف
        </Button>
        <Button
          type="submit"
          loading={saving}
          disabled={!draft.title.trim() || !draft.url.trim() || !draft.studentIds.length}
        >
          <Plus size={15} />
          {editing ? "ذخیره تغییرات" : "ساخت و تخصیص"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </select>
  );
}
function ResourceListItem({
  item,
  view,
  selected,
  onSelect,
}: {
  item: LearningResource;
  view: "details" | "grid";
  selected: boolean;
  onSelect: () => void;
}) {
  const status =
    item.status === "PUBLISHED" ? "منتشر" : item.status === "DRAFT" ? "پیش‌نویس" : "بایگانی";
  const icon = item.type === "VIDEO" ? <FileVideo2 size={18} /> : <Link2 size={18} />;
  const iconClass =
    item.type === "VIDEO" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700";
  const frame = selected
    ? "border-brand bg-brand/5 ring-1 ring-brand/15"
    : "border-slate-200 hover:border-brand/40 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900";
  if (view === "grid")
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`grid min-h-36 content-start gap-2 rounded-xl border p-3 text-right transition ${frame}`}
      >
        <span className="flex items-start justify-between gap-2">
          <span className={`grid size-9 place-items-center rounded-lg ${iconClass}`}>{icon}</span>
          <Badge
            tone={
              item.status === "PUBLISHED" ? "green" : item.status === "DRAFT" ? "blue" : "neutral"
            }
          >
            {status}
          </Badge>
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm text-ink">{item.title}</strong>
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-500">
            {item.description || "بدون توضیح"}
          </span>
        </span>
        <span className="mt-auto flex items-center justify-between">
          <Badge tone="blue">{item.category || "عمومی"}</Badge>
          <small className="flex items-center gap-1 text-xs text-slate-500">
            <UsersRound size={12} />
            {item.assignments.length.toLocaleString("fa-IR")}
          </small>
        </span>
      </button>
    );
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`grid w-full gap-3 rounded-xl border p-3 text-right transition md:grid-cols-[2.75rem_minmax(10rem,1fr)_minmax(12rem,1.5fr)_auto] md:items-center ${frame}`}
    >
      <span className={`grid size-11 place-items-center rounded-xl ${iconClass}`}>{icon}</span>
      <span className="min-w-0">
        <strong className="block truncate text-sm text-ink">{item.title}</strong>
        <span className="mt-1 flex flex-wrap items-center gap-1">
          <Badge tone="blue">{item.category || "عمومی"}</Badge>
          <small className="text-xs text-slate-500">
            {item.type === "VIDEO" ? "ویدئو" : "پیوند"}
          </small>
        </span>
      </span>
      <span className="min-w-0">
        <span className="block line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
          {item.description || "بدون توضیح"}
        </span>
        <small className="mt-1 block text-xs text-slate-400">
          آخرین تغییر:{" "}
          {new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(
            new Date(item.updatedAt),
          )}
        </small>
      </span>
      <span className="flex flex-wrap items-center justify-between gap-2 md:grid md:justify-items-end">
        <Badge
          tone={
            item.status === "PUBLISHED" ? "green" : item.status === "DRAFT" ? "blue" : "neutral"
          }
        >
          {status}
        </Badge>
        <small className="flex items-center gap-1 text-xs text-slate-500">
          <UsersRound size={13} />
          {item.assignments.length.toLocaleString("fa-IR")} دریافت‌کننده
        </small>
      </span>
    </button>
  );
}
function gradeLabel(value: string) {
  return value.startsWith("پایه") ? value : `پایه ${Number(value).toLocaleString("fa-IR")}`;
}
