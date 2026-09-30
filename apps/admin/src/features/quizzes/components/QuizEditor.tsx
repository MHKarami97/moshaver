import { Power, Save, Trash2 } from "lucide-react";
import { Button, Card, Field, Input } from "../../../shared/ui/ui";
import type { Quiz, QuizDraft } from "../model/quiz.types";
export function QuizEditor({
  quiz,
  setQuiz,
  selected,
  busy,
  onSave,
  onToggle,
  onDelete,
}: {
  quiz: QuizDraft;
  setQuiz: (q: QuizDraft) => void;
  selected?: Quiz;
  busy: boolean;
  onSave: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="عنوان">
          <Input value={quiz.title} onChange={(e) => setQuiz({ ...quiz, title: e.target.value })} />
        </Field>
        <Field label="درس">
          <Input
            value={quiz.subject}
            onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })}
          />
        </Field>
        <Field label="مدت (دقیقه)">
          <Input
            type="number"
            value={quiz.durationMinutes}
            onChange={(e) => setQuiz({ ...quiz, durationMinutes: Number(e.target.value) })}
          />
        </Field>
        <Field label="تعداد تلاش">
          <Input type="number" min={1} value={quiz.attemptLimit} onChange={(e) => setQuiz({ ...quiz, attemptLimit: Number(e.target.value) })} />
        </Field>
        <Field label="شروع دسترسی (اختیاری)">
          <Input type="datetime-local" value={quiz.openAt ? quiz.openAt.slice(0, 16) : ""} onChange={(e) => setQuiz({ ...quiz, openAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
        </Field>
        <Field label="پایان دسترسی (اختیاری)">
          <Input type="datetime-local" value={quiz.closeAt ? quiz.closeAt.slice(0, 16) : ""} onChange={(e) => setQuiz({ ...quiz, closeAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
        </Field>
        <Field label="نمایش نتیجه">
          <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" value={quiz.resultPolicy || "immediate"} onChange={(e) => setQuiz({ ...quiz, resultPolicy: e.target.value as QuizDraft["resultPolicy"] })}>
            <option value="immediate">بلافاصله پس از ارسال</option>
            <option value="manual">پس از بررسی مدیر</option>
          </select>
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          loading={busy}
          disabled={
            !quiz.title.trim() || quiz.durationMinutes < 1 || quiz.durationMinutes > 360 || quiz.attemptLimit < 1 || (!!quiz.openAt && !!quiz.closeAt && new Date(quiz.openAt) >= new Date(quiz.closeAt)) || busy
          }
          onClick={onSave}
        >
          <Save size={16} />
          ذخیره
        </Button>
        {selected ? (
          <Button variant="soft" onClick={onToggle}>
            <Power size={16} />
            {selected.active ? "غیرفعال" : "فعال"}
          </Button>
        ) : null}
        {selected ? <Button variant="ghost" className="text-rose-700" onClick={onDelete}><Trash2 size={16} />حذف</Button> : null}
      </div>
    </Card>
  );
}
