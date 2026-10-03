import { ChevronDown, UserRoundCheck } from "lucide-react";
import { useAuthLocale } from "../model/auth-locale";

export const demoAccounts = [
  { role: "guardian", username: "e2e.guardian.a" },
  { role: "advisor", username: "e2e.advisor.a" },
  { role: "teacher", username: "e2e.teacher.a" },
  { role: "mentor", username: "e2e.mentor.a" },
  { role: "contentAdmin", username: "e2e.content.a" },
  { role: "organizationAdmin", username: "e2e.orgadmin.a" },
  { role: "platformAdmin", username: "e2e.platform" },
  { role: "multiRole", username: "e2e.multi" },
] as const;
export const demoPassword = "Moshaver-e2e-2026!";

export function DemoAccountPicker({
  onSelect,
}: {
  onSelect: (username: string, password: string) => void;
}) {
  const { copy } = useAuthLocale();
  return (
    <details className="group rounded-xl border border-dashed border-brand/30 bg-brand/5 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">
        <span className="flex items-center gap-2">
          <UserRoundCheck size={17} className="text-brand" />
          {copy.demoTitle}
        </span>
        <ChevronDown size={16} className="transition group-open:rotate-180" />
      </summary>
      <p className="mt-2 text-xs text-slate-500">
        {copy.demoInstruction} <code dir="ltr">npm run seed</code> {copy.demoInstructionSuffix}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => {
          const role = copy.demoRoles[account.role];
          return (
            <button
              key={account.username}
              type="button"
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-start transition hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 dark:border-slate-800 dark:bg-slate-950"
              onClick={() => onSelect(account.username, demoPassword)}
            >
              <strong className="block text-sm">{role.label}</strong>
              <span className="mt-0.5 block text-[11px] text-slate-500">{role.description}</span>
              <code dir="ltr" className="mt-1 block text-[10px] text-brand">
                {account.username}
              </code>
            </button>
          );
        })}
      </div>
    </details>
  );
}
