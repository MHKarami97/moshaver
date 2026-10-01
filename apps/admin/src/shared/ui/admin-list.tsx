import { ListFilter, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button, Card, EmptyState, ErrorState, LoadingState } from "./ui";

/**
 * Standard shell for management collections. Feature code owns its query,
 * filters and mutations; this component owns the consistent list states and
 * responsive hierarchy used by every conventional admin collection.
 */
export function AdminList<T>({
  label,
  description,
  items,
  loading = false,
  error = false,
  toolbar,
  actions,
  children,
  emptyTitle,
  emptyAction,
  errorTitle,
  onRetry,
  footer,
  className = "",
  contentClassName = "",
}: {
  label: string;
  description?: string;
  items: readonly T[];
  loading?: boolean;
  error?: boolean;
  toolbar?: ReactNode;
  actions?: ReactNode;
  children: ReactNode | ((items: readonly T[]) => ReactNode);
  emptyTitle?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  onRetry?: () => void;
  footer?: ReactNode;
  className?: string;
  /** Enables fixed-height/scrolling consumers to keep the shared states in their viewport. */
  contentClassName?: string;
}) {
  const content = typeof children === "function" ? children(items) : children;
  return (
    <Card className={`min-w-0 overflow-hidden p-0 ${className}`}>
      <header className="grid gap-3 border-b border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:p-4 dark:border-slate-800">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
            <ListFilter size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-ink">{label}</h2>
            {description ? (
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
        {toolbar ? <div className="sm:col-span-2">{toolbar}</div> : null}
      </header>
      <div className={`p-3 sm:p-4 ${contentClassName}`}>
        {loading ? (
          <LoadingState label={`در حال دریافت ${label}…`} />
        ) : error ? (
          <ErrorState
            title={errorTitle || `دریافت ${label} ناموفق بود.`}
            action={
              onRetry ? (
                <Button variant="soft" onClick={onRetry}>
                  <RefreshCcw size={15} />
                  تلاش دوباره
                </Button>
              ) : undefined
            }
          />
        ) : !items.length ? (
          <EmptyState
            title={emptyTitle || `${label} برای نمایش وجود ندارد.`}
            action={emptyAction}
          />
        ) : (
          content
        )}
      </div>
      {footer ? (
        <footer className="border-t border-slate-200 p-3 dark:border-slate-800">{footer}</footer>
      ) : null}
    </Card>
  );
}
