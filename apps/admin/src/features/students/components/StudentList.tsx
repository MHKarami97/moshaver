import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  TableProperties,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import type { Student } from "../../../shared/types/domain";
import { Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { AdminDataTable } from "../../../shared/ui/admin-data-table";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useState } from "react";
import { createCollectionView, createViewPreferenceStore } from "@moshaver/admin-workspace-ui";
import {
  formatStudentLastSeen,
  getStudentProfileCompleteness,
  getStudentStatus,
  getStudentUsername,
  studentStatusCopy,
  type StudentProfileFilter,
  type StudentSort,
  type StudentSortDirection,
  type StudentStatusFilter,
} from "./student-ui";
import { StudentOverviewStats } from "./StudentOverviewStats";

export { getStudentStatus } from "./student-ui";
export type {
  StudentProfileFilter,
  StudentSort,
  StudentSortDirection,
  StudentStatusFilter,
} from "./student-ui";

const STUDENT_DIRECTORY_VIEW_ID = "student-directory";

function studentDirectoryPreferenceStore() {
  if (typeof window === "undefined") return undefined;
  return createViewPreferenceStore({
    namespace: "moshaver-admin",
    storage: window.localStorage,
  });
}

function readStudentDisplayMode(): "table" | "cards" {
  const layout = studentDirectoryPreferenceStore()?.load(STUDENT_DIRECTORY_VIEW_ID)?.layout;
  return layout === "cards" ? "cards" : "table";
}

function StudentStatus({ student }: { student: Student }) {
  const status = studentStatusCopy[getStudentStatus(student)];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-bold ${status.className}`}
    >
      {status.label}
    </span>
  );
}

function Completeness({ student, compact = false }: { student: Student; compact?: boolean }) {
  const value = getStudentProfileCompleteness(student);
  return (
    <div className={compact ? "min-w-0" : "min-w-28"}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{compact ? "تکمیل پرونده" : "پرونده"}</span>
        <strong className="text-slate-700 dark:text-slate-200">
          ٪{value.toLocaleString("fa-IR")}
        </strong>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-label="تکمیل پرونده"
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

export function StudentList({
  students,
  total,
  filteredTotal,
  page,
  pageCount,
  pageSize,
  setPage,
  setPageSize,
  selectedId,
  search,
  setSearch,
  status,
  counts,
  incomplete,
  profileFilter,
  sort,
  sortDirection,
  onSort,
  onStatusChange,
  onIncompleteToggle,
  onClearFilters,
  onSelect,
  loading = false,
  error = false,
  onRetry,
  creating = false,
}: {
  students: Student[];
  total: number;
  filteredTotal: number;
  page: number;
  pageCount: number;
  pageSize: number;
  setPage: (value: number) => void;
  setPageSize: (value: number) => void;
  selectedId: string;
  search: string;
  setSearch: (value: string) => void;
  status: StudentStatusFilter;
  counts: Record<StudentStatusFilter, number>;
  incomplete: number;
  profileFilter: StudentProfileFilter;
  sort: StudentSort;
  sortDirection: StudentSortDirection;
  onSort: (value: StudentSort) => void;
  onStatusChange: (value: StudentStatusFilter) => void;
  onIncompleteToggle: () => void;
  onClearFilters: () => void;
  onSelect: (student: Student) => void;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  creating?: boolean;
}) {
  const [displayMode, setDisplayMode] = useState<"table" | "cards">(readStudentDisplayMode);

  function changeDisplayMode(next: "table" | "cards") {
    setDisplayMode(next);
    studentDirectoryPreferenceStore()?.save(
      createCollectionView({
        id: STUDENT_DIRECTORY_VIEW_ID,
        title: "فهرست دانش‌آموزان",
        layout: next,
        columns: ["name", "grade", "target", "lastSeen", "completeness"],
        visibleColumns: ["name", "grade", "target", "lastSeen", "completeness"],
      }),
    );
  }
  const hasFilters = !!search.trim() || status !== "all" || profileFilter !== "all";
  const startItem = filteredTotal ? (page - 1) * pageSize + 1 : 0;
  const endItem = Math.min(page * pageSize, filteredTotal);
  const statusLabel =
    status === "active"
      ? "فعال"
      : status === "inactive"
        ? "غیرفعال"
        : status === "archived"
          ? "بایگانی"
          : "";

  return (
    <Card className="min-w-0 p-0 xl:flex xl:max-h-[calc(100dvh-6rem)] xl:flex-col">
      <div className="z-10 grid shrink-0 gap-3 border-b border-slate-200 bg-[rgb(var(--surface-card))] p-3 sm:p-4 dark:border-slate-800">
        <StudentOverviewStats
          counts={counts}
          status={status}
          onStatusChange={onStatusChange}
          incomplete={incomplete}
          incompleteOnly={profileFilter === "incomplete"}
          onIncompleteToggle={onIncompleteToggle}
        />
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="نام، شناسه، نام کاربری، پایه، رشته یا هدف…"
          resultLabel={
            <span className="inline-flex items-center gap-1.5">
              <UsersRound size={14} />
              {filteredTotal.toLocaleString("fa-IR")} نتیجه
            </span>
          }
          onClear={hasFilters ? onClearFilters : undefined}
          filters={
            status !== "all" || profileFilter === "incomplete" ? (
              <>
                {status !== "all" ? (
                  <span className="px-1.5 text-[11px] font-semibold text-slate-600">
                    وضعیت: {statusLabel}
                  </span>
                ) : null}
                {profileFilter === "incomplete" ? (
                  <span className="px-1.5 text-[11px] font-semibold text-amber-700">
                    پرونده ناقص
                  </span>
                ) : null}
              </>
            ) : undefined
          }
          actions={
            <SegmentedControl
              ariaLabel="نمایش فهرست دانش‌آموزان"
              value={displayMode}
              onValueChange={(value) => changeDisplayMode(value as "table" | "cards")}
              options={[
                {
                  value: "table",
                  label: (
                    <>
                      <TableProperties size={14} /> جدول
                    </>
                  ),
                },
                {
                  value: "cards",
                  label: (
                    <>
                      <LayoutGrid size={14} /> کارت‌ها
                    </>
                  ),
                },
              ]}
            />
          }
        />

        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:hidden">
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>مرتب‌سازی</span>
            <select
              className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              value={sort}
              onChange={(event) => onSort(event.target.value as StudentSort)}
            >
              <option value="name">نام</option>
              <option value="username">نام کاربری</option>
              <option value="grade">پایه</option>
              <option value="lastSeen">آخرین فعالیت</option>
              <option value="completeness">تکمیل پرونده</option>
            </select>
          </label>
          <Button
            variant="soft"
            className="h-9 px-3"
            onClick={() => onSort(sort)}
            aria-label={sortDirection === "asc" ? "مرتب‌سازی نزولی" : "مرتب‌سازی صعودی"}
          >
            {sortDirection === "asc" ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
          </Button>
        </div>
      </div>

      <div className="z-[1] flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[rgb(var(--surface-card))] px-3 py-2.5 text-[11px] text-slate-500 sm:px-4 dark:border-slate-800 dark:text-slate-400">
        <span>
          نمایش {startItem.toLocaleString("fa-IR")} تا {endItem.toLocaleString("fa-IR")} از{" "}
          {filteredTotal.toLocaleString("fa-IR")}
          {filteredTotal !== total ? ` · کل ${total.toLocaleString("fa-IR")}` : ""}
        </span>
        {creating ? (
          <span className="rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            در حال ساخت حساب جدید
          </span>
        ) : selectedId ? (
          <span className="inline-flex items-center gap-1 text-brand">
            <CheckCircle2 size={13} />
            دانش‌آموز انتخاب شده
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="p-4">
          <LoadingState label="در حال دریافت فهرست دانش‌آموزان..." />
        </div>
      ) : error ? (
        <div className="p-4">
          <EmptyState
            title="دریافت فهرست دانش‌آموزان ناموفق بود."
            action={
              onRetry ? (
                <Button variant="soft" onClick={onRetry}>
                  تلاش دوباره
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : students.length ? (
        <>
          <div className="min-h-0 xl:flex-1">
            <AdminDataTable
              rows={students}
              rowId={(student) => student.id}
              label="فهرست دانش‌آموزان"
              activeId={creating ? undefined : selectedId}
              sortId={sort}
              sortDirection={sortDirection}
              onSort={(value) => onSort(value as StudentSort)}
              onRowClick={onSelect}
              displayMode={displayMode}
              scrollClassName="xl:max-h-full xl:overflow-y-auto xl:overscroll-contain"
              mobileCard={(student) => {
                const education =
                  [student.grade, student.major].filter(Boolean).join(" / ") ||
                  "پایه و رشته ثبت نشده";
                return (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <UserRound size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-ink">{student.name}</strong>
                          <StudentStatus student={student} />
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {education}
                        </span>
                      </span>
                      <ChevronLeft className="mt-2 text-slate-400" size={16} />
                    </div>
                    <Completeness student={student} compact />
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatStudentLastSeen(student.last_seen_at)}</span>
                      <span className="font-bold text-brand">باز کردن پرونده</span>
                    </div>
                  </div>
                );
              }}
              columns={[
                {
                  id: "name",
                  header: "دانش‌آموز",
                  sortLabel: "دانش‌آموز",
                  cell: (student) => (
                    <div className="flex max-w-[260px] items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        <UserRound size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="truncate text-sm text-ink">{student.name}</strong>
                          <StudentStatus student={student} />
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-500" dir="ltr">
                          {getStudentUsername(student) || "بدون نام کاربری"}
                        </span>
                      </span>
                    </div>
                  ),
                },
                {
                  id: "grade",
                  header: "پایه / رشته",
                  sortLabel: "پایه و رشته",
                  cell: (student) => (
                    <p className="max-w-[190px] truncate font-semibold text-slate-700 dark:text-slate-200">
                      {[student.grade, student.major].filter(Boolean).join(" / ") || "ثبت نشده"}
                    </p>
                  ),
                },
                {
                  id: "target",
                  header: "هدف",
                  cell: (student) => (
                    <p className="max-w-[220px] truncate text-xs text-slate-500">
                      {[
                        student.targetField || student.target_major,
                        student.targetUniversity || student.target_city,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "ثبت نشده"}
                    </p>
                  ),
                },
                {
                  id: "lastSeen",
                  header: "آخرین فعالیت",
                  sortLabel: "آخرین فعالیت",
                  cell: (student) => (
                    <span className="text-xs text-slate-500">
                      {formatStudentLastSeen(student.last_seen_at)}
                    </span>
                  ),
                },
                {
                  id: "completeness",
                  header: "پرونده",
                  sortLabel: "تکمیل پرونده",
                  cell: (student) => <Completeness student={student} />,
                },
              ]}
            />
          </div>

          {filteredTotal > 0 ? (
            <div className="z-[1] flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-[rgb(var(--surface-card))] p-3 sm:p-4 dark:border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>تعداد در صفحه</span>
                <select
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                  value={pageSize}
                  onChange={(event) => setPageSize(Number(event.target.value))}
                >
                  <option value={25}>۲۵</option>
                  <option value={50}>۵۰</option>
                  <option value={100}>۱۰۰</option>
                </select>
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="soft"
                  className="h-9 px-2.5"
                  disabled={page <= 1}
                  onClick={() => setPage(Math.max(1, page - 1))}
                >
                  <ChevronRight size={15} />
                  قبلی
                </Button>
                <span className="min-w-20 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {page.toLocaleString("fa-IR")} / {Math.max(1, pageCount).toLocaleString("fa-IR")}
                </span>
                <Button
                  variant="soft"
                  className="h-9 px-2.5"
                  disabled={page >= pageCount}
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                >
                  بعدی
                  <ChevronLeft size={15} />
                </Button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="p-4">
          <EmptyState
            title={
              hasFilters ? "دانش‌آموزی با این فیلترها پیدا نشد." : "هنوز دانش‌آموزی ثبت نشده است."
            }
            action={
              hasFilters ? (
                <Button variant="soft" onClick={onClearFilters}>
                  نمایش همه دانش‌آموزان
                </Button>
              ) : undefined
            }
          />
        </div>
      )}
    </Card>
  );
}
