export type StudentWorkflowAction = {
  id: "planner" | "learning" | "reports" | "exams";
  title: string;
  description: string;
  destination: string;
};

type WorkflowDefinition = Omit<StudentWorkflowAction, "destination"> & {
  capability: string;
  path: string;
};

/**
 * The student directory is the hand-off point for operational work. Keep the
 * links here in one capability-aware model so a selected student is carried
 * through to the next workspace instead of making an operator select them
 * again.
 */
const workflowDefinitions: readonly WorkflowDefinition[] = [
  {
    id: "planner",
    title: "برنامه‌ریزی",
    description: "برنامه و وظایف این دانش‌آموز را بررسی کنید",
    capability: "plans.read",
    path: "planner",
  },
  {
    id: "learning",
    title: "یادگیری و مرور",
    description: "مرورها، تسلط و موارد یادگیری را پیگیری کنید",
    capability: "learning.read",
    path: "learning",
  },
  {
    id: "reports",
    title: "گزارش پیشرفت",
    description: "گزارش‌های روزانه و روند عملکرد را ببینید",
    capability: "reports.read",
    path: "reports",
  },
  {
    id: "exams",
    title: "آزمون‌ها",
    description: "تلاش‌ها و وضعیت آزمون‌های دانش‌آموز را بررسی کنید",
    capability: "exams.read",
    path: "exams",
  },
];

export function studentWorkflowActions(
  studentId: string,
  capabilities: readonly string[],
): StudentWorkflowAction[] {
  if (!studentId) return [];

  return workflowDefinitions
    .filter((item) => capabilities.includes(item.capability))
    .map(({ capability: _capability, path, ...item }) => ({
      ...item,
      destination: `/admin/${path}?studentId=${encodeURIComponent(studentId)}`,
    }));
}
