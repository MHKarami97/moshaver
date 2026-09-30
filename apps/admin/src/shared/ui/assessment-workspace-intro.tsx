import type { ReactNode } from "react";
import { Button, Card } from "./ui";

export function AssessmentWorkspaceIntro({ icon, title, description, actions, metrics }: { icon: ReactNode; title: string; description: string; actions?: ReactNode; metrics?: ReactNode }) {
  return <Card className="overflow-hidden p-0"><div className="grid gap-3 border-r-4 border-brand bg-gradient-to-l from-brand/5 to-transparent p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><span className="grid size-10 place-items-center rounded-xl bg-brand text-white shadow-sm">{icon}</span><div className="min-w-0"><h1 className="text-base font-black text-ink">{title}</h1><p className="mt-0.5 text-xs text-slate-500">{description}</p>{metrics ? <div className="mt-2 flex flex-wrap gap-1.5">{metrics}</div> : null}</div>{actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}</div></Card>;
}
export function AssessmentMetric({ children }: { children: ReactNode }) { return <span className="rounded-lg bg-white/80 px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900/80 dark:ring-slate-800">{children}</span>; }
