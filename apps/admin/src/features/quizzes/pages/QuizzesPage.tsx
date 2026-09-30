import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { useAuth } from "../../auth/hooks/useAuth";
import { listStudents } from "../../students/api/students.api";
import { listClasses } from "../../education/api/classes.api";
import { StudentAllocationControl } from "../../../shared/ui/student-allocation-control";
import { Button, Card } from "../../../shared/ui/ui";
import {
  emptyQuestion,
  questionDraft,
  questionError,
  questionMatches,
} from "../../questions/question-model";
import {
  createQuiz,
  createQuizQuestion,
  deleteQuiz,
  deleteQuizQuestion,
  getQuizAssignments,
  getQuizAnalytics,
  getQuizClassAssignments,
  getQuizQuestions,
  getQuizzes,
  releaseQuizResults,
  setQuizAssignments,
  setQuizAudienceRules,
  setQuizClassAssignments,
  updateQuiz,
  updateQuizQuestion,
} from "../api/quizzes.api";
import { QuizEditor } from "../components/QuizEditor";
import { QuizQuestionEditor } from "../components/QuizQuestionEditor";
import { QuizQuestionsList } from "../components/QuizQuestionsList";
import { QuizSidebar } from "../components/QuizSidebar";
import type { QuizDraft } from "../model/quiz.types";
export function QuizzesPage() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [quizId, setQuizIdState] = useState(params.get("quizId") || "");
  const [editingQuestionId, setEditingQuestionId] = useState("");
  const [search, setSearch] = useState(params.get("question") || "");
  const [quizSearch, setQuizSearch] = useState(params.get("q") || "");
  const [status, setStatus] = useState(params.get("status") || "all");
  const [quiz, setQuiz] = useState<QuizDraft>({
    title: "",
    subject: "",
    durationMinutes: 20,
    attemptLimit: 1,
    resultPolicy: "immediate",
  });
  const [question, setQuestion] = useState(emptyQuestion);
  const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [audienceRules, setAudienceRules] = useState({ gradeIds: [] as number[], educationTypeIds: [] as string[], trackIds: [] as string[] });
  const modal = useModal();
  const auth = useAuth();
  const canCreate = auth.can("quizzes.create");
  const canUpdate = auth.can("quizzes.update");
  const canManageQuestions = auth.can("quiz_questions.manage");
  const quizzes = useQuery({ queryKey: ["quizzes"], queryFn: getQuizzes });
  const questions = useQuery({
    queryKey: ["quiz-questions", quizId],
    enabled: !!quizId,
    queryFn: () => getQuizQuestions(quizId),
  });
  const students = useQuery({ queryKey: ["students", "quiz-allocation"], queryFn: listStudents, enabled: !!quizId && canUpdate });
  const assignments = useQuery({ queryKey: ["quiz-assignments", quizId], queryFn: () => getQuizAssignments(quizId), enabled: !!quizId && canUpdate });
  const classes = useQuery({ queryKey: ["classes", "quiz-allocation"], queryFn: () => listClasses(), enabled: !!quizId && canUpdate });
  const classAssignments = useQuery({ queryKey: ["quiz-class-assignments", quizId], queryFn: () => getQuizClassAssignments(quizId), enabled: !!quizId && canUpdate });
  const analytics = useQuery({ queryKey: ["quiz-analytics", quizId], queryFn: () => getQuizAnalytics(quizId), enabled: !!quizId && auth.can("quizzes.read") });
  const selected = quizzes.data?.find((item) => item.id === quizId);
  const visibleQuizzes = (quizzes.data || []).filter(
    (item) =>
      `${item.title} ${item.subject || ""} ${item.exam?.title || ""}`
        .toLocaleLowerCase("fa")
        .includes(quizSearch.trim().toLocaleLowerCase("fa")) &&
      (status === "all" || (status === "active" ? !!item.active : !item.active)),
  );
  function setQuizId(value: string) {
    setQuizIdState(value);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value ? next.set("quizId", value) : next.delete("quizId");
        return next;
      },
      { replace: true },
    );
  }
  function syncFilter(key: "q" | "status" | "question", value: string, fallback = "") {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        value && value !== fallback ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  useEffect(() => {
    if (!quizId && quizzes.data?.[0]) setQuizId(quizzes.data[0].id);
  }, [quizId, quizzes.data]);
  useEffect(() => {
    if (quizId && quizzes.isSuccess && !selected) {
      setQuizId("");
      notify("آزمونک انتخاب‌شده دیگر وجود ندارد.", "warning");
    }
  }, [quizId, quizzes.isSuccess, selected]);
  useEffect(() => {
    if (selected)
      setQuiz({
        title: selected.title,
        subject: selected.subject || "",
        durationMinutes: selected.durationMinutes || 20,
        attemptLimit: selected.attemptLimit || 1,
        openAt: selected.openAt || null,
        closeAt: selected.closeAt || null,
        resultPolicy: selected.resultPolicy || "immediate",
      });
  }, [selected?.id]);
  useEffect(() => setAssignedStudentIds((assignments.data || []).map((item) => item.studentId)), [assignments.data]);
  useEffect(() => setAssignedClassIds((classAssignments.data || []).map((item) => item.classId)), [classAssignments.data]);
  useEffect(() => setAudienceRules(selected?.audienceRules || { gradeIds: [], educationTypeIds: [], trackIds: [] }), [selected?.id]);
  const save = useMutation({
    mutationFn: () => (quizId ? updateQuiz(quizId, quiz) : createQuiz(quiz)),
    onSuccess: (value) => {
      qc.invalidateQueries({ queryKey: ["quizzes"] });
      notify(quizId ? "آزمونک به‌روز شد." : "آزمونک ساخته شد.");
      if (value && typeof value === "object" && "id" in value) setQuizId(String(value.id));
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره آزمونک ناموفق بود.", "error"),
  });
  const toggle = useMutation({
    mutationFn: () => updateQuiz(quizId, { active: !selected?.active }),
    onSuccess: () => {
      notify(selected?.active ? "آزمونک غیرفعال شد." : "آزمونک فعال شد.");
      void qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر وضعیت آزمونک ناموفق بود.", "error"),
  });
  const removeQuiz = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: (result: { archived?: boolean }) => {
      notify(result.archived ? "آزمونک بایگانی شد؛ تلاش‌های ثبت‌شده حفظ شدند." : "آزمونک حذف شد.");
      setQuizId("");
      void qc.invalidateQueries({ queryKey: ["quizzes"] });
    },
    onError: (error) => notify(error instanceof Error ? error.message : "حذف آزمونک ناموفق بود.", "error"),
  });
  const saveAssignments = useMutation({
    mutationFn: () => setQuizAssignments(quizId, assignedStudentIds),
    onSuccess: () => { notify("دسترسی دانش‌آموزان به‌روز شد."); void qc.invalidateQueries({ queryKey: ["quiz-assignments", quizId] }); },
    onError: (error) => notify(error instanceof Error ? error.message : "ذخیره دسترسی ناموفق بود.", "error"),
  });
  const saveClassAssignments = useMutation({
    mutationFn: () => setQuizClassAssignments(quizId, assignedClassIds),
    onSuccess: () => { notify("دسترسی کلاس‌ها به‌روز شد."); void qc.invalidateQueries({ queryKey: ["quiz-class-assignments", quizId] }); },
    onError: (error) => notify(error instanceof Error ? error.message : "ذخیره دسترسی کلاس ناموفق بود.", "error"),
  });
  const saveAudienceRules = useMutation({ mutationFn: () => setQuizAudienceRules(quizId, audienceRules), onSuccess: () => { notify("قوانین مخاطبان ذخیره شد."); void qc.invalidateQueries({ queryKey: ["quizzes"] }); }, onError: (error) => notify(error instanceof Error ? error.message : "ذخیره قوانین ناموفق بود.", "error") });
  const releaseResults = useMutation({
    mutationFn: () => releaseQuizResults(quizId),
    onSuccess: () => { notify("نتایج آزمونک برای دانش‌آموزان منتشر شد."); void qc.invalidateQueries({ queryKey: ["quizzes"] }); },
    onError: (error) => notify(error instanceof Error ? error.message : "انتشار نتایج ناموفق بود.", "error"),
  });
  const add = useMutation({
    mutationFn: () =>
      editingQuestionId
        ? updateQuizQuestion(editingQuestionId, question)
        : createQuizQuestion(quizId, question),
    onSuccess: () => {
      notify(editingQuestionId ? "سؤال آزمونک ویرایش شد." : "سؤال آزمونک افزوده شد.");
      setQuestion(emptyQuestion());
      setEditingQuestionId("");
      qc.invalidateQueries({ queryKey: ["quiz-questions", quizId] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره سؤال ناموفق بود.", "error"),
  });
  const visibleQuestions = (questions.data ?? []).filter((item) => questionMatches(item, search));
  const validationError = questionError(question);
  const remove = useMutation({
    mutationFn: deleteQuizQuestion,
    onSuccess: () => {
      notify("سؤال حذف شد.");
      void qc.invalidateQueries({ queryKey: ["quiz-questions", quizId] });
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "حذف سؤال ناموفق بود.", "error"),
  });
  return (
    <div className="grid gap-5">
      <section className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <QuizSidebar
          quizzes={visibleQuizzes}
          loading={quizzes.isLoading}
          error={quizzes.isError}
          selectedId={quizId}
          search={quizSearch}
          status={status}
          onNew={() => {
            setQuizId("");
            setQuiz({ title: "", subject: "", durationMinutes: 20, attemptLimit: 1, resultPolicy: "immediate" });
          }}
          onSearch={(v) => {
            setQuizSearch(v);
            syncFilter("q", v);
          }}
          onStatus={(v) => {
            setStatus(v);
            syncFilter("status", v, "all");
          }}
          onSelect={setQuizId}
          onRetry={() => void quizzes.refetch()}
          onClear={() => {
            setQuizSearch("");
            setStatus("all");
            syncFilter("q", "");
            syncFilter("status", "all", "all");
          }}
          canCreate={canCreate}
        />
        <div className="grid gap-4">
          {(quizId && canUpdate) || (!quizId && canCreate) ? (
            <QuizEditor
              quiz={quiz}
              setQuiz={setQuiz}
              selected={selected}
              busy={save.isPending}
              onSave={() => save.mutate()}
              onToggle={() =>
                void modal
                  .confirm({
                    title: selected?.active ? "غیرفعال‌کردن آزمونک؟" : "فعال‌کردن آزمونک؟",
                    description: selected?.active
                      ? "دانش‌آموزان دیگر به این آزمونک دسترسی نخواهند داشت."
                      : "آزمونک دوباره برای دانش‌آموزان قابل استفاده می‌شود.",
                    confirmLabel: selected?.active ? "غیرفعال کن" : "فعال کن",
                  })
                  .then((ok) => ok && toggle.mutate())
              }
              onDelete={() => selected && void modal.confirm({ title: "حذف آزمونک؟", description: `«${selected.title}» حذف می‌شود؛ اگر تلاش ثبت‌شده داشته باشد، فقط بایگانی خواهد شد.`, tone: "danger", confirmLabel: "حذف آزمونک", confirmationText: selected.title }).then((ok) => ok && removeQuiz.mutate(selected.id))}
            />
          ) : null}
          {quizId && selected && canUpdate ? (
            <Card className="grid gap-3 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><strong className="text-sm">دسترسی و انتشار</strong><p className="text-xs text-slate-500">با انتخاب دانش‌آموز، آزمونک فقط برای همان افراد قابل مشاهده است.</p></div>
                {selected.resultPolicy === "manual" ? <Button size="sm" variant="soft" loading={releaseResults.isPending} onClick={() => releaseResults.mutate()}>انتشار نتایج</Button> : null}
              </div>
              <StudentAllocationControl students={students.data || []} selectedIds={assignedStudentIds} onChange={setAssignedStudentIds} label="دانش‌آموزان هدف" />
              <div><Button size="sm" loading={saveAssignments.isPending} onClick={() => saveAssignments.mutate()}>ذخیره دسترسی</Button></div>
              <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
                <div className="flex items-center justify-between"><strong className="text-sm">کلاس‌های هدف</strong><span className="text-xs text-slate-500">{assignedClassIds.length.toLocaleString("fa-IR")} کلاس</span></div>
                <p className="text-xs text-slate-500">دانش‌آموزان ثبت‌نام‌شده در کلاس‌های انتخابی نیز به آزمونک دسترسی خواهند داشت.</p>
                <div className="grid gap-2 sm:grid-cols-2">{(classes.data || []).filter((item) => item.status === "ACTIVE").map((item) => <label key={item.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 ${assignedClassIds.includes(item.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}><input type="checkbox" className="size-4 accent-brand" checked={assignedClassIds.includes(item.id)} onChange={() => setAssignedClassIds((ids) => ids.includes(item.id) ? ids.filter((id) => id !== item.id) : [...ids, item.id])} /><span><strong className="block text-sm">{item.name}</strong><small className="text-xs text-slate-500">{item.code} · {item.schoolYear} · {item.enrollmentCount.toLocaleString("fa-IR")} دانش‌آموز</small></span></label>)}</div>
                <div><Button size="sm" loading={saveClassAssignments.isPending} onClick={() => saveClassAssignments.mutate()}>ذخیره کلاس‌ها</Button></div>
              </section>
              <AudienceRuleControl students={students.data || []} value={audienceRules} onChange={setAudienceRules} onSave={() => saveAudienceRules.mutate()} saving={saveAudienceRules.isPending} />
            </Card>
          ) : null}
          {quizId && analytics.data ? <QuizAnalyticsPanel value={analytics.data} /> : null}
          {quizId ? (
            <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
              {canManageQuestions ? (
                <QuizQuestionEditor
                  editingId={editingQuestionId}
                  question={question}
                  setQuestion={setQuestion}
                  error={validationError}
                  busy={add.isPending}
                  onCancel={() => {
                    setEditingQuestionId("");
                    setQuestion(emptyQuestion());
                  }}
                  onSave={() => add.mutate()}
                />
              ) : null}
              <QuizQuestionsList
                items={visibleQuestions}
                loading={questions.isLoading}
                error={questions.isError}
                search={search}
                onSearch={(v) => {
                  setSearch(v);
                  syncFilter("question", v);
                }}
                onRetry={() => void questions.refetch()}
                onEdit={(item, index) => {
                  setEditingQuestionId(item.id);
                  setQuestion(questionDraft(item, index));
                }}
                onDelete={(item) =>
                  void modal
                    .confirm({
                      title: "حذف سؤال آزمونک؟",
                      description: "این سؤال برای همیشه از آزمونک حذف می‌شود.",
                      tone: "danger",
                      confirmLabel: "حذف",
                    })
                    .then((ok) => ok && remove.mutate(item.id))
                }
                canManage={canManageQuestions}
              />
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function QuizAnalyticsPanel({ value }: { value: import("../api/quizzes.api").QuizAnalytics }) { return <Card className="grid gap-3 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="text-sm">تحلیل عملکرد</strong><p className="text-xs text-slate-500">آمار فقط بر پایه تلاش‌های ارسال‌شده محاسبه می‌شود.</p></div><span className="rounded-lg bg-brand/10 px-2 py-1 text-xs font-bold text-brand">{value.attempts.toLocaleString("fa-IR")} تلاش · {value.averagePercent === null ? "—" : `${value.averagePercent.toLocaleString("fa-IR")}٪`}</span></div>{value.byGrade.length ? <div className="flex flex-wrap gap-2">{value.byGrade.map((row) => <span key={row.grade} className="rounded-lg border px-2 py-1 text-xs">{row.grade}: {row.averagePercent.toLocaleString("fa-IR")}٪ ({row.attempts.toLocaleString("fa-IR")})</span>)}</div> : null}<div className="grid gap-2">{value.questions.map((question, index) => <article key={question.id} className="grid gap-1 rounded-xl border p-2.5"><div className="flex items-start justify-between gap-3"><strong className="text-sm">{(index + 1).toLocaleString("fa-IR")}. {question.text}</strong><span className="shrink-0 text-xs text-slate-500">{question.accuracy === null ? "بدون تلاش" : `${question.accuracy.toLocaleString("fa-IR")}٪ درست`}</span></div><small className="text-xs text-slate-500">الف: {(question.responses.a || 0).toLocaleString("fa-IR")} · ب: {(question.responses.b || 0).toLocaleString("fa-IR")} · ج: {(question.responses.c || 0).toLocaleString("fa-IR")} · د: {(question.responses.d || 0).toLocaleString("fa-IR")} · سفید: {(question.responses.blank || 0).toLocaleString("fa-IR")}</small></article>)}</div></Card>; }

function AudienceRuleControl({ students, value, onChange, onSave, saving }: { students: Array<{ gradeId?: number | null; educationTypeId?: string; trackId?: string }>; value: { gradeIds: number[]; educationTypeIds: string[]; trackIds: string[] }; onChange: (next: { gradeIds: number[]; educationTypeIds: string[]; trackIds: string[] }) => void; onSave: () => void; saving: boolean }) {
  const grades = [...new Set(students.map((student) => student.gradeId).filter((value): value is number => typeof value === "number"))].sort((a,b) => a-b);
  const types = [...new Set(students.map((student) => student.educationTypeId).filter((value): value is string => !!value))].sort();
  const tracks = [...new Set(students.map((student) => student.trackId).filter((value): value is string => !!value))].sort();
  const toggle = <T,>(key: "gradeIds" | "educationTypeIds" | "trackIds", item: T) => onChange({ ...value, [key]: (value[key] as T[]).includes(item) ? (value[key] as T[]).filter((entry) => entry !== item) : [...(value[key] as T[]), item] } as typeof value);
  return <section className="grid gap-2 border-t pt-3 dark:border-slate-800"><div><strong className="text-sm">قوانین گروه هدف</strong><p className="text-xs text-slate-500">در هر ستون چند انتخاب مجاز است؛ بین ستون‌ها شرط «و» اعمال می‌شود.</p></div><div className="grid gap-2 sm:grid-cols-3"><RuleChoices title="پایه" values={grades} selected={value.gradeIds} label={(item) => `پایه ${item.toLocaleString("fa-IR")}`} onToggle={(item) => toggle("gradeIds", item)} /><RuleChoices title="نوع آموزش" values={types} selected={value.educationTypeIds} label={(item) => item} onToggle={(item) => toggle("educationTypeIds", item)} /><RuleChoices title="رشته" values={tracks} selected={value.trackIds} label={(item) => item} onToggle={(item) => toggle("trackIds", item)} /></div><div><Button size="sm" loading={saving} onClick={onSave}>ذخیره قوانین</Button></div></section>;
}
function RuleChoices<T extends string | number>({ title, values, selected, label, onToggle }: { title: string; values: T[]; selected: T[]; label: (value: T) => string; onToggle: (value: T) => void }) { return <div className="grid gap-1 rounded-xl border p-2"><strong className="text-xs">{title}</strong>{values.map((item) => <label key={String(item)} className="flex items-center gap-2 text-xs"><input type="checkbox" className="accent-brand" checked={selected.includes(item)} onChange={() => onToggle(item)} />{label(item)}</label>)}{!values.length ? <small className="text-xs text-slate-500">داده‌ای وجود ندارد.</small> : null}</div>; }
