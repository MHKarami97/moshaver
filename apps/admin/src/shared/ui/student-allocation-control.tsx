import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { educationLabel } from "../lib/utils";
import { Button } from "./ui";

export type StudentAllocationCandidate = {
  id: string;
  name: string;
  grade?: string | null;
  gradeId?: number | null;
  major?: string | null;
  educationTypeId?: string | null;
  trackId?: string | null;
};

export function StudentAllocationControl({
  students,
  selectedIds,
  onChange,
  label = "دانش‌آموزان",
}: {
  students: StudentAllocationCandidate[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}) {
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [educationType, setEducationType] = useState("");
  const [track, setTrack] = useState("");
  const visible = useMemo(
    () =>
      students.filter(
        (student) =>
          (!grade || String(student.gradeId || student.grade || "") === grade) &&
          (!educationType || student.educationTypeId === educationType) &&
          (!track || student.trackId === track || student.major === track) &&
          `${student.name} ${student.grade || ""} ${student.major || ""}`
            .toLocaleLowerCase("fa")
            .includes(search.trim().toLocaleLowerCase("fa")),
      ),
    [educationType, grade, search, students, track],
  );
  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    );
  return (
    <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">{label}</strong>
        <span className="text-xs text-slate-500">
          {selectedIds.length.toLocaleString("fa-IR")} انتخاب
        </span>
      </div>
      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
        <Search size={15} className="text-slate-400" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی نام، پایه یا رشته"
        />
      </label>
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
              <option key={String(value)} value={value || ""}>
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
              <option key={String(value)} value={value || ""}>
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
                .filter((student) => !educationType || student.educationTypeId === educationType)
                .map((student) => student.trackId || student.major)
                .filter(Boolean),
            ),
          ]
            .sort((a, b) => a!.localeCompare(b!, "fa"))
            .map((value) => (
              <option key={String(value)} value={value || ""}>
                {educationLabel(value!)}
              </option>
            ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange([...new Set([...selectedIds, ...visible.map((student) => student.id)])])
          }
        >
          انتخاب نتایج
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
          پاک‌سازی
        </Button>
      </div>
      <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
        {visible.map((student) => (
          <label
            key={student.id}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 ${selectedIds.includes(student.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
          >
            <input
              type="checkbox"
              className="size-4 accent-brand"
              checked={selectedIds.includes(student.id)}
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
      {!visible.length ? (
        <p className="text-center text-xs text-slate-500">دانش‌آموزی با این فیلتر پیدا نشد.</p>
      ) : null}
    </section>
  );
}

function gradeLabel(value: string) {
  return value.startsWith("پایه") ? value : `پایه ${Number(value).toLocaleString("fa-IR")}`;
}
