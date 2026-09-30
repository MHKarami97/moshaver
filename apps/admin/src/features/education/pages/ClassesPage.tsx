import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Pencil, Plus, Save, Trash2, UsersRound } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { listOrganizations } from "../../access/api/access.api";
import { useAuth } from "../../auth";
import { useModal } from "../../../shared/ui/modal";
import { educationLabel } from "../../../shared/lib/utils";
import { notify } from "../../../shared/ui/notifications";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingState,
  Textarea,
} from "../../../shared/ui/ui";
import {
  createClass,
  deleteClass,
  getClassOptions,
  listClasses,
  setClassBooks,
  setClassEnrollments,
  type ClassDraft,
  type EducationClass,
  updateClass,
} from "../api/classes.api";

const initial = (): ClassDraft => ({
  organizationId: "",
  code: "",
  name: "",
  schoolYear: "1405-1406",
  gradeId: 10,
  educationTypeId: "theoretical",
  trackId: "experimental_sciences",
  capacity: 35,
  description: "",
  advisorId: null,
});

export function ClassesPage() {
  const auth = useAuth();
  const client = useQueryClient();
  const modal = useModal();
  const canManage = auth.can("classes.manage");
  const canRoster = auth.can("classes.roster.manage");
  const organizations = useQuery({
    queryKey: ["organizations", "classes"],
    queryFn: listOrganizations,
  });
  const classes = useQuery({ queryKey: ["classes"], queryFn: () => listClasses() });
  const [form, setForm] = useState<ClassDraft>(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = (classes.data || []).find((item) => item.id === selectedId) || null;
  const options = useQuery({
    queryKey: ["class-options", selectedId],
    queryFn: () => getClassOptions(selectedId!),
    enabled: !!selectedId,
  });
  const refresh = () => void client.invalidateQueries({ queryKey: ["classes"] });
  const save = useMutation({
    mutationFn: ({ id, draft }: { id: string | null; draft: ClassDraft }) =>
      id ? updateClass(id, draft) : createClass(draft),
    onSuccess: (row) => {
      refresh();
      setSelectedId(row.id);
      setEditing(row.id);
      modal.close();
      notify("کلاس ذخیره شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره کلاس ناموفق بود.", "error"),
  });
  const remove = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      refresh();
      setSelectedId(null);
      setEditing(null);
      setForm(initial());
      notify("کلاس حذف شد.", "success");
    },
    onError: () => notify("حذف کلاس ناموفق بود.", "error"),
  });
  const saveBooks = useMutation({
    mutationFn: (books: Array<{ bookId: string; teacherId: string }>) =>
      setClassBooks(selectedId!, books),
    onSuccess: () => {
      refresh();
      void options.refetch();
      notify("کتاب‌ها و دبیران کلاس ذخیره شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره کتاب‌ها ناموفق بود.", "error"),
  });
  const saveRoster = useMutation({
    mutationFn: (studentIds: string[]) => setClassEnrollments(selectedId!, studentIds),
    onSuccess: () => {
      refresh();
      void options.refetch();
      notify("فهرست دانش‌آموزان کلاس ذخیره شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره فهرست ناموفق بود.", "error"),
  });
  const saveAdvisor = useMutation({
    mutationFn: (advisorId: string | null) => updateClass(selectedId!, { advisorId }),
    onSuccess: () => { refresh(); void options.refetch(); notify("مشاور کلاس به‌روزرسانی شد.", "success"); },
    onError: (error) => notify(error instanceof Error ? error.message : "ذخیره مشاور ناموفق بود.", "error"),
  });
  const start = (row?: EducationClass) => {
    if (!row) {
      setEditing(null);
      setSelectedId(null);
      setForm({
        ...initial(),
        organizationId: organizations.data?.length === 1 ? organizations.data[0].id : "",
      });
      return;
    }
    setSelectedId(row.id);
    setEditing(row.id);
    setForm({
      organizationId: row.organization.id,
      code: row.code,
      name: row.name,
      schoolYear: row.schoolYear,
      gradeId: row.gradeId,
      educationTypeId: row.educationTypeId,
      trackId: row.trackId,
      capacity: row.capacity,
      description: row.description,
      advisorId: row.advisor?.id || null,
    });
  };
  const openEditor = (row?: EducationClass) => {
    const draft: ClassDraft = row
      ? { organizationId: row.organization.id, code: row.code, name: row.name, schoolYear: row.schoolYear, gradeId: row.gradeId, educationTypeId: row.educationTypeId, trackId: row.trackId, capacity: row.capacity, description: row.description, advisorId: row.advisor?.id || null }
      : { ...initial(), organizationId: organizations.data?.length === 1 ? organizations.data[0].id : "" };
    modal.open({
      title: row ? "ویرایش کلاس" : "کلاس جدید",
      description: "مشخصات کلاس را ثبت کنید؛ کتاب‌ها و دانش‌آموزان در مرحلهٔ بعد مدیریت می‌شوند.",
      size: "lg",
      content: <ClassEditorModal initialDraft={draft} editingId={row?.id || null} organizations={organizations.data || []} saving={save.isPending} onClose={modal.close} onSave={(next) => save.mutate({ id: row?.id || null, draft: next })} />,
    });
  };
  const visible = useMemo(
    () =>
      (classes.data || []).filter(
        (row) => !form.organizationId || row.organization.id === form.organizationId,
      ),
    [classes.data, form.organizationId],
  );
  if (classes.isLoading || organizations.isLoading)
    return <LoadingState label="در حال آماده‌سازی کلاس‌ها…" />;
  if (classes.isError || organizations.isError)
    return <EmptyState title="دریافت اطلاعات کلاس ناموفق بود." />;
  if (!auth.can("classes.read"))
    return <EmptyState title="دسترسی مشاهده کلاس‌های آموزشی ندارید." />;
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
      <Card className="min-w-0 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black">کلاس‌های سازمان</h2>
            <p className="mt-1 text-xs text-slate-500">
              کتاب، دبیر، مشاور و ثبت‌نام را در یک جریان کنترل کنید.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="blue">{visible.length.toLocaleString("fa-IR")}</Badge>
            {canManage ? (
              <Button size="sm" onClick={() => openEditor()}>
                <Plus size={15} />
                کلاس جدید
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid gap-2">
          {visible.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setSelectedId(row.id)}
              className={`grid gap-2 rounded-xl border p-3 text-right transition ${selectedId === row.id ? "border-brand bg-brand/5 ring-1 ring-brand/15" : "border-slate-200 hover:border-brand/40 dark:border-slate-800"}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
                    <GraduationCap size={18} />
                  </span>
                  <span>
                    <strong className="block text-sm">{row.name}</strong>
                    <small className="text-xs text-slate-500">
                      {row.organization.name} · {row.schoolYear}
                    </small>
                  </span>
                </span>
                <Badge tone={row.status === "ACTIVE" ? "green" : "neutral"}>
                  {row.status === "ACTIVE" ? "فعال" : "بایگانی"}
                </Badge>
              </span>
              <span className="flex flex-wrap gap-1">
                <Badge tone="blue">پایه {row.gradeId.toLocaleString("fa-IR")}</Badge>
                <Badge tone="neutral">
                  {educationLabel(row.educationTypeId)} · {educationLabel(row.trackId)}
                </Badge>
                <small className="mr-auto flex items-center gap-1 text-xs text-slate-500">
                  <UsersRound size={13} />
                  {row.enrollmentCount}/{row.capacity}
                </small>
              </span>
              <small className="text-xs text-slate-500">
                مشاور: {row.advisor?.name || "تعیین نشده"} ·{" "}
                {row.books.length.toLocaleString("fa-IR")} کتاب
              </small>
            </button>
          ))}
          {!visible.length ? (
            <EmptyState
              title="هنوز کلاسی برای این سازمان ساخته نشده است."
              action={
                canManage ? (
                  <Button variant="soft" onClick={() => openEditor()}>
                    ساخت کلاس
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </div>
      </Card>
      <ClassDetail
        classroom={selected}
        options={options.data}
        loading={options.isLoading}
        canManage={canManage}
        canRoster={canRoster}
        onBooks={(rows) => saveBooks.mutate(rows)}
        onRoster={(ids) => saveRoster.mutate(ids)}
        onAdvisor={(advisorId) => saveAdvisor.mutate(advisorId)}
        onEdit={() => selected && openEditor(selected)}
        onDelete={() => selected && remove.mutate(selected.id)}
        savingBooks={saveBooks.isPending}
        savingRoster={saveRoster.isPending}
        savingAdvisor={saveAdvisor.isPending}
        deleting={remove.isPending}
      />
    </section>
  );
}

function ClassDetail({
  classroom,
  options,
  loading,
  canManage,
  canRoster,
  onBooks,
  onRoster,
  onAdvisor,
  onEdit,
  onDelete,
  savingBooks,
  savingRoster,
  savingAdvisor,
  deleting,
}: {
  classroom: EducationClass | null;
  options?: Awaited<ReturnType<typeof getClassOptions>>;
  loading: boolean;
  canManage: boolean;
  canRoster: boolean;
  onBooks: (books: Array<{ bookId: string; teacherId: string }>) => void;
  onRoster: (ids: string[]) => void;
  onAdvisor: (advisorId: string | null) => void;
  onEdit: () => void;
  onDelete: () => void;
  savingBooks: boolean;
  savingRoster: boolean;
  savingAdvisor: boolean;
  deleting: boolean;
}) {
  const modal = useModal();
  const [books, setBooks] = useState<Array<{ bookId: string; teacherId: string }>>([]);
  const [students, setStudents] = useState<string[]>([]);
  if (!classroom)
    return (
      <Card className="p-3 xl:sticky xl:top-16">
        <p className="text-sm text-slate-500">
          برای انتخاب کتاب، دبیر، مشاور و دانش‌آموزان، یک کلاس را انتخاب کنید.
        </p>
      </Card>
    );
  const activeBooks = books.length
    ? books
    : classroom.books.map((book) => ({ bookId: book.bookId, teacherId: book.teacher.id }));
  const activeStudents = students.length
    ? students
    : classroom.students.map((student) => student.id);
  const openBooks = () =>
    options &&
    modal.open({
      title: "کتاب‌ها و دبیران کلاس",
      description: "هر کتاب را انتخاب کنید و دبیر مسئول همان کتاب را تعیین کنید.",
      size: "xl",
      content: (
        <ClassBooksModal
          options={options}
          classroom={classroom}
          onSave={onBooks}
          onClose={modal.close}
          saving={savingBooks}
        />
      ),
    });
  const openRoster = () =>
    options &&
    modal.open({
      title: "فهرست دانش‌آموزان کلاس",
      description: "فقط دانش‌آموزان هم‌ساز با پایه، نوع آموزش و رشتهٔ کلاس نمایش داده می‌شوند.",
      size: "xl",
      content: (
        <ClassRosterModal
          options={options}
          classroom={classroom}
          onSave={onRoster}
          onClose={modal.close}
          saving={savingRoster}
        />
      ),
    });
  const openAdvisor = () => options && modal.open({
    title: "مشاور کلاس",
    description: "یک مشاور یا مربی فعالِ همین سازمان را انتخاب کنید.",
    content: <ClassAdvisorModal advisors={options.advisors} value={classroom.advisor?.id || null} saving={savingAdvisor} onSave={onAdvisor} onClose={modal.close} />,
  });
  const confirmDelete = async () => {
    const confirmed = await modal.confirm({
      title: "حذف کلاس؟",
      description: `کلاس «${classroom.name}» و فهرست کتاب‌ها و دانش‌آموزان آن حذف می‌شود.`,
      tone: "danger",
      confirmLabel: "حذف کلاس",
      confirmationText: classroom.name,
    });
    if (confirmed) onDelete();
  };
  return (
    <Card className="grid gap-3 p-3 xl:sticky xl:top-16">
      <div>
        <h2 className="text-sm font-black">{classroom.name}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {classroom.code} · {classroom.enrollmentCount}/{classroom.capacity} دانش‌آموز
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {canManage ? (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Pencil size={14} />
            ویرایش کلاس
          </Button>
        ) : null}
        {canManage ? <Button size="sm" variant="ghost" disabled={!options} onClick={openAdvisor}>مشاور کلاس</Button> : null}
        {canManage ? (
          <Button size="sm" variant="soft" disabled={!options} onClick={openBooks}>
            <BookOpen size={14} />
            مدیریت کتاب‌ها
          </Button>
        ) : null}
        {canRoster ? (
          <Button size="sm" variant="soft" disabled={!options} onClick={openRoster}>
            <UsersRound size={14} />
            مدیریت دانش‌آموزان
          </Button>
        ) : null}
      </div>
      {loading ? (
        <LoadingState label="در حال دریافت گزینه‌های کلاس…" />
      ) : options ? (
        <>
          <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
            <h3 className="flex items-center gap-1 text-xs font-black">
              <BookOpen size={14} />
              کتاب‌ها و دبیران
            </h3>
            {false && canManage && options ? (
              <>
                {options!.books.map((book) => {
                  const selected = activeBooks.find((item) => item.bookId === book.id);
                  return (
                    <div
                      key={book.id}
                      className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900"
                    >
                      <input
                        type="checkbox"
                        aria-label={`انتخاب ${book.title}`}
                        checked={!!selected}
                        onChange={() =>
                          setBooks(
                            selected
                              ? activeBooks.filter((item) => item.bookId !== book.id)
                              : [
                                  ...activeBooks,
                                  { bookId: book.id, teacherId: options!.teachers[0]?.id || "" },
                                ],
                          )
                        }
                      />
                      <span className="min-w-0">
                        <strong className="block truncate text-xs">{book.title}</strong>
                        <small className="text-xs text-slate-500">{book.category}</small>
                        {selected ? (
                          <select
                            className="mt-1 h-8 w-full rounded border bg-white px-1 text-xs dark:bg-slate-950"
                            value={selected.teacherId}
                            onChange={(event) =>
                              setBooks(
                                activeBooks.map((item) =>
                                  item.bookId === book.id
                                    ? { ...item, teacherId: event.target.value }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="">دبیر را انتخاب کنید</option>
                            {options!.teachers.map((teacher) => (
                              <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
                <Button
                  size="sm"
                  variant="soft"
                  disabled={activeBooks.some((item) => !item.teacherId)}
                  loading={savingBooks}
                  onClick={() => onBooks(activeBooks)}
                >
                  <Save size={14} />
                  ذخیره کتاب‌ها
                </Button>
              </>
            ) : (
              classroom.books.map((book) => (
                <p
                  key={book.id}
                  className="rounded bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-900"
                >
                  {book.title} · {book.teacher.name}
                </p>
              ))
            )}
          </section>
          <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
            <h3 className="flex items-center gap-1 text-xs font-black">
              <UsersRound size={14} />
              دانش‌آموزان واجد شرایط
            </h3>
            {false && canRoster && options ? (
              <>
                <div className="grid max-h-56 gap-1 overflow-auto">
                  {options!.eligibleStudents.map((student) => (
                    <label
                      key={student.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={activeStudents.includes(student.id)}
                        onChange={() =>
                          setStudents(
                            activeStudents.includes(student.id)
                              ? activeStudents.filter((id) => id !== student.id)
                              : [...activeStudents, student.id],
                          )
                        }
                      />
                      <span>
                        {student.name}
                        <small className="mr-1 text-slate-500">
                          {student.major || student.grade}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <Button
                  size="sm"
                  variant="soft"
                  disabled={activeStudents.length > classroom!.capacity}
                  loading={savingRoster}
                  onClick={() => onRoster(activeStudents)}
                >
                  <Save size={14} />
                  ذخیره دانش‌آموزان
                </Button>
              </>
            ) : (
              classroom.students.map((student) => (
                <p
                  key={student.id}
                  className="rounded bg-slate-50 px-2 py-1.5 text-xs dark:bg-slate-900"
                >
                  {student.name}
                </p>
              ))
            )}
          </section>
          {canManage ? (
            <Button
              size="sm"
              variant="ghost"
              className="justify-self-start text-rose-700"
              loading={deleting}
              onClick={() => void confirmDelete()}
            >
              <Trash2 size={14} />
              حذف کلاس
            </Button>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}
function ClassBooksModal({
  options,
  classroom,
  onSave,
  onClose,
  saving,
}: {
  options: Awaited<ReturnType<typeof getClassOptions>>;
  classroom: EducationClass;
  onSave: (books: Array<{ bookId: string; teacherId: string }>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState(() =>
    classroom.books.map((book) => ({ bookId: book.bookId, teacherId: book.teacher.id })),
  );
  const toggle = (bookId: string) =>
    setSelected((rows) =>
      rows.some((row) => row.bookId === bookId)
        ? rows.filter((row) => row.bookId !== bookId)
        : [...rows, { bookId, teacherId: options.teachers[0]?.id || "" }],
    );
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {options.books.map((book) => {
          const row = selected.find((item) => item.bookId === book.id);
          return (
            <article
              key={book.id}
              className={`grid gap-2 rounded-xl border p-3 ${row ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
            >
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-brand"
                  checked={!!row}
                  onChange={() => toggle(book.id)}
                />
                <span className="min-w-0">
                  <strong className="block text-sm">{book.title}</strong>
                  <small className="mt-1 block text-xs text-slate-500">
                    {book.category} · {book.track}
                  </small>
                </span>
              </label>
              {row ? (
                <label className="grid gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>دبیر مسئول</span>
                  <select
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    value={row.teacherId}
                    onChange={(event) =>
                      setSelected((rows) =>
                        rows.map((item) =>
                          item.bookId === book.id
                            ? { ...item, teacherId: event.target.value }
                            : item,
                        ),
                      )
                    }
                  >
                    <option value="">انتخاب دبیر</option>
                    {options.teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <small className="text-xs text-slate-400">این کتاب در کلاس فعال نیست.</small>
              )}
            </article>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>
          انصراف
        </Button>
        <Button
          loading={saving}
          disabled={selected.some((item) => !item.teacherId)}
          onClick={() => {
            onSave(selected);
            onClose();
          }}
        >
          <Save size={15} />
          ذخیره کتاب‌ها
        </Button>
      </div>
    </div>
  );
}

function ClassEditorModal({
  initialDraft,
  editingId,
  organizations,
  onSave,
  onClose,
  saving,
}: {
  initialDraft: ClassDraft;
  editingId: string | null;
  organizations: Array<{ id: string; name: string }>;
  onSave: (draft: ClassDraft) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState(initialDraft);
  return (
    <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="سازمان">
          <select required disabled={!!editingId} value={draft.organizationId} onChange={(event) => setDraft({ ...draft, organizationId: event.target.value })}>
            {organizations.length !== 1 ? <option value="">سازمان را انتخاب کنید</option> : null}
            {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
          </select>
        </Field>
        <Field label="سال تحصیلی"><Input required value={draft.schoolYear} onChange={(event) => setDraft({ ...draft, schoolYear: event.target.value })} /></Field>
        <Field label="نام کلاس"><Input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="مثلاً دوازدهم تجربی الف" /></Field>
        <Field label="کد کلاس"><Input required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} placeholder="12-exp-a" /></Field>
        <Field label="پایه">
          <select value={draft.gradeId} onChange={(event) => setDraft({ ...draft, gradeId: Number(event.target.value) })}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => <option key={grade} value={grade}>پایه {grade.toLocaleString("fa-IR")}</option>)}
          </select>
        </Field>
        <Field label="ظرفیت"><Input type="number" min={1} max={200} value={draft.capacity} onChange={(event) => setDraft({ ...draft, capacity: Number(event.target.value) || 1 })} /></Field>
        <Field label="نوع آموزش">
          <select value={draft.educationTypeId} onChange={(event) => setDraft({ ...draft, educationTypeId: event.target.value, trackId: event.target.value === "general" ? "general" : draft.trackId })}>
            <option value="general">عمومی</option><option value="theoretical">نظری</option><option value="technical_vocational">فنی و حرفه‌ای</option><option value="kar_danesh">کاردانش</option>
          </select>
        </Field>
        <Field label="رشته"><select value={draft.trackId} onChange={(event) => setDraft({ ...draft, trackId: event.target.value })}>{trackOptions(draft.educationTypeId).map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}</select></Field>
      </div>
      <Field label="توضیح"><Textarea className="min-h-24" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></Field>
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800"><Button type="button" variant="ghost" onClick={onClose}>انصراف</Button><Button type="submit" loading={saving} disabled={!draft.organizationId || !draft.name.trim() || !draft.code.trim()}><Save size={15} />{editingId ? "ذخیره تغییرات" : "ساخت کلاس"}</Button></div>
    </form>
  );
}

function ClassRosterModal({
  options,
  classroom,
  onSave,
  onClose,
  saving,
}: {
  options: Awaited<ReturnType<typeof getClassOptions>>;
  classroom: EducationClass;
  onSave: (studentIds: string[]) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState(() => classroom.students.map((student) => student.id));
  const toggle = (id: string) =>
    setSelected((rows) => (rows.includes(id) ? rows.filter((item) => item !== id) : [...rows, id]));
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-900">
        <span>انتخاب‌شده: {selected.length.toLocaleString("fa-IR")}</span>
        <span>ظرفیت: {classroom.capacity.toLocaleString("fa-IR")}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.eligibleStudents.map((student) => {
          const active = selected.includes(student.id);
          return (
            <label
              key={student.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${active ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
            >
              <input
                type="checkbox"
                className="size-4 accent-brand"
                checked={active}
                onChange={() => toggle(student.id)}
              />
              <span className="min-w-0">
                <strong className="block truncate text-sm">{student.name}</strong>
                <small className="mt-1 block truncate text-xs text-slate-500">
                  {student.grade || "پایه نامشخص"} · {student.major || "رشته نامشخص"}
                </small>
              </span>
              {active ? (
                <Badge tone="green">ثبت‌نام</Badge>
              ) : (
                <Badge tone="neutral">واجد شرایط</Badge>
              )}
            </label>
          );
        })}
      </div>
      {!options.eligibleStudents.length ? (
        <EmptyState title="دانش‌آموز واجد شرایطی برای این پروفایل آموزشی پیدا نشد." />
      ) : null}
      <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800">
        <Button variant="ghost" onClick={onClose}>
          انصراف
        </Button>
        <Button
          loading={saving}
          disabled={selected.length > classroom.capacity}
          onClick={() => {
            onSave(selected);
            onClose();
          }}
        >
          <Save size={15} />
          ذخیره فهرست
        </Button>
      </div>
    </div>
  );
}

function ClassAdvisorModal({ advisors, value, saving, onSave, onClose }: { advisors: Array<{ id: string; name: string; roles: string[] }>; value: string | null; saving: boolean; onSave: (advisorId: string | null) => void; onClose: () => void }) {
  const [advisorId, setAdvisorId] = useState(value || "");
  return <div className="grid gap-3"><div className="grid gap-2 sm:grid-cols-2"><label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${!advisorId ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}><input type="radio" checked={!advisorId} onChange={() => setAdvisorId("")} /><span><strong className="block text-sm">بدون مشاور</strong><small className="text-xs text-slate-500">بعداً تعیین می‌شود</small></span></label>{advisors.map((advisor) => <label key={advisor.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 ${advisorId === advisor.id ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}><input type="radio" checked={advisorId === advisor.id} onChange={() => setAdvisorId(advisor.id)} /><span><strong className="block text-sm">{advisor.name}</strong><small className="text-xs text-slate-500">{advisor.roles.includes("ADVISOR") ? "مشاور" : "مربی"}</small></span></label>)}</div><div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-800"><Button variant="ghost" onClick={onClose}>انصراف</Button><Button loading={saving} onClick={() => { onSave(advisorId || null); onClose(); }}><Save size={15} />ذخیره مشاور</Button></div></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
function trackOptions(type: string) {
  if (type === "general") return [{ id: "general", label: "عمومی" }];
  if (type === "theoretical")
    return [
      { id: "experimental_sciences", label: "علوم تجربی" },
      { id: "math_physics", label: "ریاضی و فیزیک" },
      { id: "humanities", label: "علوم انسانی" },
    ];
  return [
    { id: "industry", label: "صنعت" },
    { id: "services", label: "خدمات" },
    { id: "agriculture", label: "کشاورزی" },
    { id: "art", label: "هنر" },
  ];
}
