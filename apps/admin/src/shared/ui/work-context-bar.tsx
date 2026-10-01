import { Building2, Layers3, UserRound } from "lucide-react";
import { NavLink } from "react-router-dom";

export function WorkContextBar({
  role,
  organization,
  multipleRoles = false,
  studentId,
  showStudent = false,
}: {
  role: string;
  organization?: string;
  multipleRoles?: boolean;
  studentId?: string;
  showStudent?: boolean;
}) {
  return (
    <aside
      className="flex h-10 min-w-0 max-w-[48vw] shrink items-center gap-2 rounded-xl border border-brand/20 bg-brand/5 px-2.5 text-xs text-slate-600 shadow-sm sm:max-w-sm sm:gap-3 sm:px-3 dark:text-slate-300"
      aria-label="زمینه کاری فعال"
      title={[role, organization || "سطح پلتفرم"].join(" — ")}
    >
      <span className="flex min-w-0 items-center gap-1.5 font-bold text-ink">
        <Layers3 size={14} className="shrink-0 text-brand" />
        <span className="truncate">{role}</span>
      </span>
      {organization ? (
        <span className="hidden min-w-0 items-center gap-1.5 border-r border-slate-200 pr-3 sm:flex dark:border-slate-700">
          <Building2 size={14} className="shrink-0" />
          <span className="truncate">{organization}</span>
        </span>
      ) : (
        <span className="hidden border-r border-slate-200 pr-3 text-slate-400 sm:inline dark:border-slate-700">
          سطح پلتفرم
        </span>
      )}
      {showStudent && studentId ? (
        <NavLink
          to={`/admin/students?studentId=${encodeURIComponent(studentId)}`}
          className="flex min-w-0 items-center gap-1.5 border-r border-slate-200 pr-3 font-semibold text-slate-600 outline-none transition hover:text-brand focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:text-slate-300"
          aria-label="بازگشت به پرونده دانش‌آموز فعال"
          title="بازگشت به پرونده دانش‌آموز فعال"
        >
          <UserRound size={14} className="shrink-0 text-brand" />
          <span className="truncate">دانش‌آموز فعال</span>
        </NavLink>
      ) : null}
      {multipleRoles ? (
        <span className="sr-only 2xl:not-sr-only 2xl:mr-auto 2xl:whitespace-nowrap 2xl:text-[11px] 2xl:text-slate-500">
          برای تغییر نقش از منوی حساب استفاده کنید.
        </span>
      ) : null}
    </aside>
  );
}
