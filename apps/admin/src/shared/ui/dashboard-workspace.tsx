import type { ReactNode } from "react";
import { LayoutGrid, Rows3, SlidersHorizontal } from "lucide-react";
import { SegmentedControl } from "./segmented-control";

/**
 * A product-neutral dashboard shell. Hosts provide their own copy, data,
 * actions and widgets while this component owns the operational hierarchy:
 * header -> summary -> primary work -> secondary context.
 */
export function DashboardWorkspace({
  title,
  description,
  freshness,
  density,
  onDensityChange,
  densityLabels,
  actions,
  summary,
  primary,
  secondary,
  preferences,
}: {
  title: string;
  description: string;
  freshness?: ReactNode;
  density: "comfortable" | "compact";
  onDensityChange: (density: "comfortable" | "compact") => void;
  densityLabels: { label: string; comfortable: string; compact: string };
  actions?: ReactNode;
  summary: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  preferences?: {
    label: string;
    visibleWidgetsLabel: string;
    resetLabel: string;
    widgets: Array<{ id: string; label: string; visible: boolean }>;
    onVisibilityChange: (id: string, visible: boolean) => void;
    onReset: () => void;
  };
}) {
  return (
    <section
      className={`dashboard-workspace grid min-w-0 gap-4 ${density === "compact" ? "gap-3" : "gap-5"}`}
    >
      <header className="flex flex-col gap-3 border-b border-[rgb(var(--border-subtle))] pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-ink sm:text-2xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            {description}
          </p>
          {freshness ? (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{freshness}</div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel={densityLabels.label}
            value={density}
            onValueChange={(value) => onDensityChange(value as "comfortable" | "compact")}
            options={[
              {
                value: "comfortable",
                label: (
                  <>
                    <LayoutGrid size={14} aria-hidden="true" />
                    {densityLabels.comfortable}
                  </>
                ),
              },
              {
                value: "compact",
                label: (
                  <>
                    <Rows3 size={14} aria-hidden="true" />
                    {densityLabels.compact}
                  </>
                ),
              },
            ]}
          />
          {preferences?.widgets.length ? (
            <details className="relative">
              <summary className="inline-flex min-h-8 cursor-pointer list-none items-center gap-1.5 rounded-md border border-[rgb(var(--border-subtle))] px-2 text-xs font-semibold text-slate-700 marker:content-none hover:bg-[rgb(var(--surface-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-slate-200">
                <SlidersHorizontal size={14} aria-hidden="true" />
                {preferences.label}
              </summary>
              <div className="absolute end-0 z-20 mt-2 w-64 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-[var(--shadow-overlay)]">
                <fieldset className="grid gap-2">
                  <legend className="text-xs font-bold text-ink">
                    {preferences.visibleWidgetsLabel}
                  </legend>
                  {preferences.widgets.map((widget) => (
                    <label
                      key={widget.id}
                      className="flex min-h-8 cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={widget.visible}
                        onChange={(event) =>
                          preferences.onVisibilityChange(widget.id, event.target.checked)
                        }
                        className="size-4 rounded border-[rgb(var(--border-subtle))] text-brand focus:ring-brand"
                      />
                      {widget.label}
                    </label>
                  ))}
                </fieldset>
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  onClick={preferences.onReset}
                >
                  {preferences.resetLabel}
                </button>
              </div>
            </details>
          ) : null}
          {actions}
        </div>
      </header>

      {summary}

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">{primary}</div>
        {secondary ? (
          <aside className="grid min-w-0 gap-4 xl:sticky xl:top-24">{secondary}</aside>
        ) : null}
      </div>
    </section>
  );
}
