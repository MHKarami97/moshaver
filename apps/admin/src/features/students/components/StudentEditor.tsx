import { RotateCcw, Save, UserPlus, X } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Field, Input } from "../../../shared/ui/ui";
import { api } from "../../../shared/api/api";
import type { StudentForm } from "../model/student-form";

export type StudentEditorMode = "empty" | "create" | "edit";
export type StudentEditorFeedback = { tone: "success" | "error" | "info"; message: string } | null;
type CatalogLabel = { id: string; fa: string };
type SignupOptions = {
  grades: Array<{ id: number; fa: string }>;
  educationTypes: CatalogLabel[];
  theoreticalTracks: CatalogLabel[];
  vocationalFields: CatalogLabel[];
  gradeStructure: Array<{
    grades: number[];
    education_type_ids: string[];
    track_required: boolean;
  }>;
};

function formCompleteness(form: StudentForm, includePassword: boolean) {
  const values = [
    form.name,
    form.username,
    ...(form.learnerProfile === "school"
      ? [form.gradeId, form.educationTypeId, form.trackId]
      : [form.independentType, form.learningLevel]),
    form.targetUniversity,
    form.targetField,
    form.targetRank,
    form.dailyCapacity,
    ...(includePassword ? [form.password] : []),
  ];
  return Math.round((values.filter((value) => value.trim()).length / values.length) * 100);
}

function Progress({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>تکمیل اطلاعات</span>
        <strong className="text-slate-700 dark:text-slate-200">
          ٪{value.toLocaleString("fa-IR")}
        </strong>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-label="تکمیل اطلاعات"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span
          className="block h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function StudentEditor({
  mode,
  form,
  setField,
  onSave,
  onReset,
  onCancelCreate,
  busy,
  dirty,
  saveDirty,
  usernameError,
}: {
  mode: Exclude<StudentEditorMode, "empty">;
  form: StudentForm;
  setField: (key: keyof StudentForm, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onCancelCreate?: () => void;
  busy: boolean;
  dirty: boolean;
  saveDirty: boolean;
  usernameError?: string;
}) {
  const catalog = useQuery({
    queryKey: ["education-catalog", "signup-options"],
    queryFn: () => api.get<SignupOptions>("/education-catalog/signup-options"),
    staleTime: 30 * 60 * 1000,
  });
  const structure = catalog.data?.gradeStructure.find((item) =>
    item.grades.includes(Number(form.gradeId)),
  );
  const educationTypes =
    catalog.data?.educationTypes.filter((item) =>
      structure?.education_type_ids.includes(item.id),
    ) || [];
  const tracks =
    form.educationTypeId === "theoretical"
      ? catalog.data?.theoreticalTracks || []
      : ["technical_vocational", "kar_danesh"].includes(form.educationTypeId)
        ? catalog.data?.vocationalFields || []
        : [];
  const passwordValid = mode !== "create" || form.password.length >= 12;
  const educationValid =
    form.learnerProfile === "independent"
      ? !!form.independentType
      : !!form.gradeId && !!form.educationTypeId && (!structure?.track_required || !!form.trackId);
  const baseValid = !!form.name.trim() && !!form.username.trim() && educationValid;
  const saveDisabled = !baseValid || busy || !saveDirty || !passwordValid || !!usernameError;
  const completion = useMemo(() => formCompleteness(form, mode === "create"), [form, mode]);

  return (
    <section className="grid gap-5">
      {mode === "create" ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-brand text-white">
                <UserPlus size={17} />
              </span>
              <h3 className="font-black text-ink">ساخت دانش‌آموز جدید</h3>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              اطلاعات ضروری را وارد کنید؛ سایر اطلاعات را می‌توان بعداً تکمیل کرد.
            </p>
          </div>
          {onCancelCreate ? (
            <Button variant="ghost" className="h-9 px-2.5" onClick={onCancelCreate}>
              <X size={15} />
              انصراف
            </Button>
          ) : null}
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-black text-ink">ویرایش پروفایل</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            تغییرات پروفایل مستقل از تنظیمات امنیتی ذخیره می‌شوند.
          </p>
        </div>
      )}

      <Progress value={completion} />

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">اطلاعات حساب</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            مشخصات اصلی حساب دانش‌آموز
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="نام">
            <Input
              autoFocus={mode === "create"}
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="نام و نام خانوادگی"
            />
          </Field>
          <Field label="نام کاربری" error={usernameError}>
            <Input
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              value={form.username}
              onChange={(event) => setField("username", event.target.value)}
              placeholder="username"
            />
          </Field>
        </div>
        {mode === "create" ? (
          <Field
            label="رمز عبور"
            error={
              form.password && form.password.length < 12
                ? "رمز عبور باید حداقل ۱۲ نویسه باشد."
                : undefined
            }
          >
            <Input
              dir="ltr"
              autoComplete="new-password"
              type="password"
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              placeholder="حداقل ۱۲ نویسه"
            />
          </Field>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">وضعیت تحصیلی</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            مسیر یادگیری، گروه‌بندی و گزارش‌ها را مشخص می‌کند.
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {(
            [
              ["school", "دانش‌آموز مدرسه"],
              ["independent", "یادگیرنده مستقل"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setField("learnerProfile", value)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${form.learnerProfile === value ? "bg-white text-ink shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {form.learnerProfile === "independent" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="نوع یادگیرنده">
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.independentType}
                onChange={(event) => setField("independentType", event.target.value)}
              >
                <option value="">انتخاب نوع</option>
                <option value="adult">بزرگسال</option>
                <option value="gap_year">پشت‌کنکوری / سال فاصله</option>
                <option value="homeschool">آموزش خانگی</option>
                <option value="other">سایر</option>
              </select>
            </Field>
            <Field label="سطح یا مسیر یادگیری (اختیاری)">
              <Input
                value={form.learningLevel}
                onChange={(event) => setField("learningLevel", event.target.value)}
                placeholder="مثلاً آمادگی کنکور یا زبان عمومی"
              />
            </Field>
          </div>
        ) : null}
        {form.learnerProfile === "school" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="پایه">
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.gradeId}
                onChange={(event) => {
                  const gradeId = event.target.value;
                  const next = catalog.data?.gradeStructure.find((item) =>
                    item.grades.includes(Number(gradeId)),
                  );
                  setField("gradeId", gradeId);
                  setField(
                    "educationTypeId",
                    next?.education_type_ids.length === 1 ? next.education_type_ids[0] : "",
                  );
                  setField("trackId", "");
                }}
                disabled={catalog.isLoading}
              >
                <option value="">انتخاب پایه</option>
                {catalog.data?.grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.fa}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="نوع آموزش">
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.educationTypeId}
                disabled={!form.gradeId || catalog.isLoading}
                onChange={(event) => {
                  setField("educationTypeId", event.target.value);
                  setField("trackId", "");
                }}
              >
                <option value="">انتخاب نوع آموزش</option>
                {educationTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fa}
                  </option>
                ))}
              </select>
            </Field>
            {structure?.track_required ? (
              <Field label="رشته">
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={form.trackId}
                  disabled={!form.educationTypeId || catalog.isLoading}
                  onChange={(event) => setField("trackId", event.target.value)}
                >
                  <option value="">انتخاب رشته</option>
                  {tracks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fa}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>
        ) : null}
        {catalog.isError ? (
          <p role="alert" className="text-xs text-rose-700">
            دریافت پایه‌ها و رشته‌ها انجام نشد.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">هدف و ظرفیت</h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            هدف دانشگاهی و ظرفیت برنامه‌ریزی روزانه
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="دانشگاه هدف">
            <Input
              value={form.targetUniversity}
              onChange={(event) => setField("targetUniversity", event.target.value)}
              placeholder="دانشگاه هدف"
            />
          </Field>
          <Field label="رشته هدف">
            <Input
              value={form.targetField}
              onChange={(event) => setField("targetField", event.target.value)}
              placeholder="رشته هدف"
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="رتبه هدف">
            <Input
              dir="ltr"
              inputMode="numeric"
              value={form.targetRank}
              onChange={(event) => setField("targetRank", event.target.value)}
              placeholder="مثلاً 1500"
            />
          </Field>
          <Field label="ظرفیت روزانه">
            <Input
              value={form.dailyCapacity}
              onChange={(event) => setField("dailyCapacity", event.target.value)}
              placeholder="مثلاً 6 ساعت"
            />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-2 z-10 grid gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto] dark:border-slate-800 dark:bg-slate-950/95">
        <Button
          loading={busy}
          loadingLabel={mode === "create" ? "در حال ساخت..." : "در حال ذخیره..."}
          disabled={saveDisabled}
          onClick={onSave}
        >
          <Save size={16} />
          {mode === "create" ? "ساخت دانش‌آموز" : "ذخیره تغییرات"}
        </Button>
        <Button variant="soft" disabled={!dirty || busy} onClick={onReset}>
          <RotateCcw size={16} />
          بازنشانی
        </Button>
      </div>
    </section>
  );
}
