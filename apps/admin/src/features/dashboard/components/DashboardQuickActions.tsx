import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Card } from "../../../shared/ui/ui";
import { quickActionsForRole } from "../model/role-experience";
import { useAuth } from "../../auth";

export function DashboardQuickActions() {
  const auth = useAuth();
  const actions = quickActionsForRole(auth.activeRole, auth.capabilities);

  if (!actions.length) return null;

  return (
    <Card className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-ink">گام بعدی شما</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            ابزارهای مجاز برای نقش فعال؛ هر مورد شما را به محل انجام کار می‌برد.
          </p>
        </div>
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
          {actions.length}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink transition-colors hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
            >
              {Icon ? (
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand/10 group-hover:text-brand dark:bg-slate-800 dark:text-slate-300">
                  <Icon size={16} aria-hidden="true" />
                </span>
              ) : null}

              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{item.label}</span>
                <span className="mt-0.5 block truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  {item.description}
                </span>
              </span>

              <ChevronLeft
                size={14}
                aria-hidden="true"
                className="shrink-0 text-slate-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-brand"
              />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
