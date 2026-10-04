import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Card } from "../../../shared/ui/ui";
import { quickActionsForRole } from "../model/role-experience";
import { useAuth } from "../../auth";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";

export function DashboardQuickActions() {
  const { language, profile } = useLocale();
  const copy = dashboardCopy[language];
  const auth = useAuth();
  const actions = quickActionsForRole(auth.activeRole, auth.capabilities, language);
  const primaryActions = actions.slice(0, 6);
  const additionalActions = actions.slice(6);

  if (!actions.length) return null;

  return (
    <Card className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-ink">{copy.nextStep}</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">{copy.nextStepDescription}</p>
        </div>
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
          {actions.length.toLocaleString(profile.locale)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {primaryActions.map((item) => (
          <DashboardToolLink key={item.to} item={item} />
        ))}
      </div>
      {additionalActions.length ? (
        <details className="mt-2 border-t border-[rgb(var(--border-subtle))] pt-2">
          <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-2 text-xs font-semibold text-brand marker:content-none hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <span>{copy.moreTools}</span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {additionalActions.length.toLocaleString(profile.locale)}
            </span>
          </summary>
          <p className="px-2 pb-1 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {copy.moreToolsDescription}
          </p>
          <div className="flex flex-col gap-1.5">
            {additionalActions.map((item) => (
              <DashboardToolLink key={item.to} item={item} />
            ))}
          </div>
        </details>
      ) : null}
    </Card>
  );
}

function DashboardToolLink({ item }: { item: ReturnType<typeof quickActionsForRole>[number] }) {
  const Icon = item.icon;
  return (
    <Link
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
        className="shrink-0 text-slate-400 transition-transform rtl:group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5 group-hover:text-brand"
      />
    </Link>
  );
}
