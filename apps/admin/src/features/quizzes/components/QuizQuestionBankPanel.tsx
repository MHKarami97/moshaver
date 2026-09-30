import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, ClipboardCopy, Link2, Pencil, Plus, Search } from "lucide-react";
import { listOrganizations } from "../../access/api/access.api";
import {
  addBankItemToQuiz,
  archiveQuestionBankItem,
  copyExamItemsToQuizBank,
  createQuestionBankItem,
  listQuestionBank,
  type QuestionBankDraft,
  type QuestionBankItem,
  updateQuestionBankItem,
} from "../../questions/api/question-bank.api";
import { useModal } from "../../../shared/ui/modal";
import { notify } from "../../../shared/ui/notifications";
import { Badge, Button, Card, EmptyState, Input, LoadingState } from "../../../shared/ui/ui";
import { DataTransferWorkspace } from "../../../shared/ui/data-transfer";
import {
  downloadQuestionBankWorkbook,
  readQuestionBankWorkbook,
} from "../../../shared/lib/question-bank-transfer";
import {
  exportQuestionBank,
  getQuestionBankTemplate,
  importQuestionBank,
  type QuestionBankTransfer,
} from "../../questions/api/question-bank.api";

export function QuizQuestionBankPanel({
  selectedQuizId,
  canManage,
}: {
  selectedQuizId: string;
  canManage: boolean;
}) {
  const modal = useModal();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const quizBank = useQuery({
    queryKey: ["question-bank", "quiz"],
    queryFn: () => listQuestionBank(undefined, "quiz"),
  });
  const examBank = useQuery({
    queryKey: ["question-bank", "exam", "quiz-import"],
    queryFn: () => listQuestionBank(undefined, "exam"),
    enabled: canManage,
  });
  const organizations = useQuery({
    queryKey: ["organizations", "quiz-question-bank"],
    queryFn: listOrganizations,
    enabled: canManage,
  });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["question-bank"] });
  const save = useMutation({
    mutationFn: ({ id, draft }: { id?: string; draft: QuestionBankDraft }) =>
      id
        ? updateQuestionBankItem(id, draft)
        : createQuestionBankItem({ ...draft, bankType: "quiz" }),
    onSuccess: () => {
      refresh();
      modal.close();
      notify("سؤال بانک آزمونک ذخیره شد.");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "ذخیره سؤال ناموفق بود.", "error"),
  });
  const archive = useMutation({
    mutationFn: archiveQuestionBankItem,
    onSuccess: () => {
      refresh();
      notify("سؤال بانک آزمونک بایگانی شد.");
    },
  });
  const importExam = useMutation({
    mutationFn: copyExamItemsToQuizBank,
    onSuccess: (result) => {
      refresh();
      setSelectedExamIds([]);
      notify(
        `${result.created.toLocaleString("fa-IR")} سؤال به بانک آزمونک کپی شد.${result.skipped ? ` ${result.skipped.toLocaleString("fa-IR")} مورد تکراری بود.` : ""}`,
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "کپی از بانک آزمون ناموفق بود.", "error"),
  });
  const addToQuiz = useMutation({
    mutationFn: ({ itemId, quizId }: { itemId: string; quizId: string }) =>
      addBankItemToQuiz(itemId, quizId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["quiz-questions"] });
      notify("سؤال به آزمونک افزوده شد.");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "افزودن سؤال به آزمونک ناموفق بود.", "error"),
  });
  const rows = useMemo(
    () =>
      (quizBank.data || []).filter((item) =>
        `${item.text} ${item.subject} ${item.topic} ${item.tags.join(" ")}`
          .toLocaleLowerCase("fa")
          .includes(query.trim().toLocaleLowerCase("fa")),
      ),
    [quizBank.data, query],
  );
  const openEditor = (item?: QuestionBankItem) =>
    modal.open({
      title: item ? "ویرایش سؤال بانک آزمونک" : "سؤال جدید بانک آزمونک",
      description:
        "این بانک از بانک آزمون جدا است؛ نسخه‌های افزوده‌شده به آزمونک‌ها مستقل می‌مانند.",
      size: "xl",
      content: (
        <QuizBankEditor
          item={item}
          organizations={organizations.data || []}
          saving={save.isPending}
          onCancel={modal.close}
          onSave={(draft) => save.mutate({ id: item?.id, draft })}
        />
      ),
    });
  if (quizBank.isLoading) return <LoadingState label="در حال دریافت بانک سؤال آزمونک…" />;
  if (quizBank.isError) return <EmptyState title="دریافت بانک سؤال آزمونک ناموفق بود." />;
  return (
    <div className="grid gap-4">
      <DataTransferWorkspace
        variant="question-bank"
        bankType="quiz"
        canManage={canManage}
        load={(kind) =>
          kind === "export" ? exportQuestionBank("quiz") : getQuestionBankTemplate("quiz")
        }
        readWorkbook={readQuestionBankWorkbook}
        writeWorkbook={(data, filename) =>
          downloadQuestionBankWorkbook(data as QuestionBankTransfer, filename)
        }
        onImport={(data) => importQuestionBank(data as QuestionBankTransfer)}
        onImported={refresh}
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="grid gap-3 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black">بانک سؤال آزمونک</h2>
              <p className="text-xs text-slate-500">
                سؤال‌های منبع آزمونک؛ جدا از بانک آزمون و قابل‌استفاده در چند آزمونک.
              </p>
            </div>
            <Badge tone="blue">{rows.length.toLocaleString("fa-IR")}</Badge>
            {canManage ? (
              <Button size="sm" onClick={() => openEditor()}>
                <Plus size={15} />
                سؤال جدید
              </Button>
            ) : null}
          </div>
          <label className="flex items-center gap-2 rounded-lg border px-3">
            <Search size={15} />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جست‌وجوی متن، درس، مبحث یا برچسب"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {rows.map((item) => (
              <article key={item.id} className="grid gap-2 rounded-xl border p-3">
                <div>
                  <strong className="block text-sm">{item.text}</strong>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone="blue">{item.subject || "بدون درس"}</Badge>
                    <Badge tone="neutral">{item.difficulty || "متوسط"}</Badge>
                    {item.sourceQuestionBankItemId ? (
                      <Badge tone="neutral">کپی از بانک آزمون</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedQuizId && canManage ? (
                    <Button
                      size="sm"
                      variant="soft"
                      loading={addToQuiz.isPending}
                      onClick={() => addToQuiz.mutate({ itemId: item.id, quizId: selectedQuizId })}
                    >
                      <Link2 size={14} />
                      افزودن به آزمونک
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button size="sm" variant="ghost" onClick={() => openEditor(item)}>
                      <Pencil size={14} />
                      ویرایش
                    </Button>
                  ) : null}
                  {canManage ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-700"
                      loading={archive.isPending}
                      onClick={() =>
                        void modal
                          .confirm({
                            title: "بایگانی سؤال بانک آزمونک؟",
                            description: "سؤال‌های کپی‌شده در آزمونک‌ها تغییر نمی‌کنند.",
                            tone: "danger",
                            confirmLabel: "بایگانی",
                          })
                          .then((ok) => ok && archive.mutate(item.id))
                      }
                    >
                      <Archive size={14} />
                      بایگانی
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          {!rows.length ? <EmptyState title="هنوز سؤال منبعی در بانک آزمونک نیست." /> : null}
        </Card>
        <Card className="grid content-start gap-3 p-3">
          <div>
            <h2 className="text-sm font-black">کپی از بانک آزمون</h2>
            <p className="text-xs text-slate-500">
              هر تعداد سؤال را انتخاب کنید؛ کپی‌ها مستقل‌اند و در به‌روزرسانی‌های بعدی تکراری ساخته
              نمی‌شوند.
            </p>
          </div>
          <div className="grid max-h-[32rem] gap-2 overflow-auto">
            {(examBank.data || []).map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer gap-2 rounded-xl border p-2 text-xs ${selectedExamIds.includes(item.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 accent-brand"
                  checked={selectedExamIds.includes(item.id)}
                  onChange={() =>
                    setSelectedExamIds((ids) =>
                      ids.includes(item.id)
                        ? ids.filter((id) => id !== item.id)
                        : [...ids, item.id],
                    )
                  }
                />
                <span>
                  <strong className="block text-sm">{item.text}</strong>
                  <small className="text-slate-500">
                    {item.subject || "بدون درس"} · {item.difficulty || "متوسط"}
                  </small>
                </span>
              </label>
            ))}
            {examBank.isLoading ? <LoadingState label="در حال دریافت بانک آزمون…" /> : null}
            {!examBank.isLoading && !(examBank.data || []).length ? (
              <EmptyState title="سؤالی در بانک آزمون موجود نیست." />
            ) : null}
          </div>
          {canManage ? (
            <Button
              loading={importExam.isPending}
              disabled={!selectedExamIds.length}
              onClick={() => importExam.mutate(selectedExamIds)}
            >
              <ClipboardCopy size={15} />
              کپی {selectedExamIds.length.toLocaleString("fa-IR")} سؤال به بانک آزمونک
            </Button>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function QuizBankEditor({
  item,
  organizations,
  saving,
  onSave,
  onCancel,
}: {
  item?: QuestionBankItem;
  organizations: Array<{ id: string; name: string }>;
  saving: boolean;
  onSave: (draft: QuestionBankDraft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<QuestionBankDraft>({
    organizationId:
      item?.organization?.id || (organizations.length === 1 ? organizations[0].id : ""),
    text: item?.text || "",
    options: item?.options || ["", "", "", ""],
    correctAnswer: item?.correctAnswer || "",
    explanation: item?.explanation || "",
    subject: item?.subject || "",
    topic: item?.topic || "",
    book: item?.book || "",
    grade: item?.grade || "",
    chapter: item?.chapter || "",
    lesson: item?.lesson || "",
    difficulty: item?.difficulty || "medium",
    source: item?.source || "",
    tags: item?.tags || [],
  });
  const set = <K extends keyof QuestionBankDraft>(key: K, value: QuestionBankDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const valid =
    !!draft.organizationId &&
    !!draft.text.trim() &&
    draft.options.every((option) => option.trim()) &&
    new Set(draft.options.map((option) => option.trim().toLocaleLowerCase("fa"))).size === 4 &&
    draft.options.includes(draft.correctAnswer);
  return (
    <div className="grid gap-3">
      <select
        className="h-10 rounded-lg border px-3 text-sm"
        value={draft.organizationId}
        onChange={(event) => set("organizationId", event.target.value)}
      >
        <option value="">سازمان را انتخاب کنید</option>
        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
      <textarea
        className="min-h-24 rounded-lg border p-3 text-sm"
        value={draft.text}
        onChange={(event) => set("text", event.target.value)}
        placeholder="متن سؤال"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        {draft.options.map((option, index) => (
          <label key={index} className="flex items-center gap-2 rounded-lg border p-2">
            <input
              type="radio"
              checked={draft.correctAnswer === option && !!option}
              onChange={() => set("correctAnswer", option)}
              aria-label={`پاسخ صحیح گزینه ${index + 1}`}
            />
            <Input
              value={option}
              onChange={(event) => {
                const options = [...draft.options];
                const wasCorrect = draft.correctAnswer === options[index];
                options[index] = event.target.value;
                set("options", options);
                if (wasCorrect) set("correctAnswer", event.target.value);
              }}
              placeholder={`گزینه ${index + 1}`}
            />
          </label>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          value={draft.subject}
          onChange={(event) => set("subject", event.target.value)}
          placeholder="درس"
        />
        <Input
          value={draft.topic}
          onChange={(event) => set("topic", event.target.value)}
          placeholder="مبحث"
        />
        <select
          className="h-10 rounded-lg border px-3 text-sm"
          value={draft.difficulty}
          onChange={(event) => set("difficulty", event.target.value)}
        >
          <option value="easy">آسان</option>
          <option value="medium">متوسط</option>
          <option value="hard">سخت</option>
        </select>
      </div>
      <Input
        value={draft.tags.join(", ")}
        onChange={(event) =>
          set(
            "tags",
            event.target.value
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          )
        }
        placeholder="برچسب‌ها، با ویرگول جدا کنید"
      />
      <textarea
        className="min-h-16 rounded-lg border p-3 text-sm"
        value={draft.explanation}
        onChange={(event) => set("explanation", event.target.value)}
        placeholder="توضیح پاسخ (اختیاری)"
      />
      <div className="flex gap-2">
        <Button loading={saving} disabled={!valid} onClick={() => onSave(draft)}>
          ذخیره سؤال
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          انصراف
        </Button>
      </div>
    </div>
  );
}
