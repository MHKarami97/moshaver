import type { ComponentProps } from "react";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge } from "../../../shared/ui/ui";
import type {
  AdvisorInboxRow,
  RecoveryActionInput,
  TaskIssueActionInput,
} from "../model/notification.types";
import { AdvisorInboxItem } from "./AdvisorInboxItem";

type StudentPickerProps = ComponentProps<typeof StudentPicker>;

export function AdvisorInboxPanel({
  mobilePanel,
  rows,
  students,
  studentId,
  loading,
  error,
  recoveryPendingId,
  issuePendingId,
  onStudentChange,
  onRetry,
  onRecovery,
  onIssue,
  canManageRecovery,
  canManageIssues,
}: {
  mobilePanel: "notifications" | "inbox";
  rows: AdvisorInboxRow[];
  students: StudentPickerProps["students"];
  studentId: string;
  loading: boolean;
  error: boolean;
  recoveryPendingId: string;
  issuePendingId: string;
  onStudentChange: (id: string) => void;
  onRetry: () => void;
  onRecovery: (input: RecoveryActionInput) => Promise<boolean>;
  onIssue: (input: TaskIssueActionInput) => Promise<boolean>;
  canManageRecovery: boolean;
  canManageIssues: boolean;
}) {
  const actionableCount = rows.filter((row) =>
    row.kind === "recovery" ? canManageRecovery : row.kind === "issue" ? canManageIssues : false,
  ).length;

  return (
    <AdminList
      label="صندوق پیگیری"
      description="مشکلات و ریکاوری‌ها از همین صفحه قابل پاسخ و بستن هستند."
      items={rows}
      loading={loading}
      error={error}
      errorTitle="صندوق پیگیری دریافت نشد."
      onRetry={onRetry}
      className={[
        mobilePanel === "notifications" ? "hidden lg:flex" : "flex",
        "min-h-0 flex-col dark:border-slate-800 dark:bg-slate-900",
      ].join(" ")}
      contentClassName="min-h-0 flex-1 overflow-hidden"
      stickyHeader
      emptyTitle="مورد فعالی برای این دانش‌آموز وجود ندارد."
      actions={
        <div className="flex items-center gap-1.5">
          {actionableCount ? (
            <Badge tone="red">{actionableCount.toLocaleString("fa-IR")} عملیاتی</Badge>
          ) : null}
          <Badge tone={rows.length ? "amber" : "green"}>
            {rows.length.toLocaleString("fa-IR")}
          </Badge>
        </div>
      }
      toolbar={<StudentPicker students={students} value={studentId} onChange={onStudentChange} />}
    >
      <div className="grid h-full min-h-0 gap-2 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
        {rows.map((row) => (
          <AdvisorInboxItem
            key={row.key}
            row={row}
            recoveryPendingId={recoveryPendingId}
            issuePendingId={issuePendingId}
            onRecovery={onRecovery}
            onIssue={onIssue}
            canManageRecovery={canManageRecovery}
            canManageIssues={canManageIssues}
          />
        ))}
      </div>
    </AdminList>
  );
}
