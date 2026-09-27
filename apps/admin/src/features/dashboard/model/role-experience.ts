import type { ComponentType, SVGProps } from "react";
import type { RoleCode } from "../../../shared/types/domain";
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  FileQuestion,
  ListChecks,
  Trophy,
  BookMarked,
  Library,
  MessageSquare,
  BarChart3,
  UserCog,
  Building2,
  UserPlus,
  Cpu,
  ShieldCheck,
  Settings,
  Home,
} from "lucide-react";

/** Compatible with any lucide-react icon (or any SVG component). */
export type RoleQuickActionIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number | string }
>;

export type RoleQuickAction = {
  to: string;
  label: string;
  capability?: string;
  icon?: RoleQuickActionIcon;
};

const sharedActions: Record<string, RoleQuickAction> = {
  education: {
    to: "/admin/education",
    label: "مرکز آموزش",
    capability: "exams.read",
    icon: GraduationCap,
  },
  students: {
    to: "/admin/students",
    label: "دانش‌آموزان",
    capability: "students.read",
    icon: Users,
  },
  planner: {
    to: "/admin/planner",
    label: "برنامه‌ها",
    capability: "plans.read",
    icon: Calendar,
  },
  learning: {
    to: "/admin/learning",
    label: "یادگیری و مرور",
    capability: "learning.read",
    icon: BookOpen,
  },
  exams: {
    to: "/admin/exams",
    label: "آزمون‌ها",
    capability: "exams.read",
    icon: ListChecks,
  },
  questions: {
    to: "/admin/questions",
    label: "بانک سؤال",
    capability: "questions.read",
    icon: FileQuestion,
  },
  quizzes: {
    to: "/admin/quizzes",
    label: "آزمونک‌ها",
    capability: "quizzes.read",
    icon: Trophy,
  },
  subjects: {
    to: "/admin/subjects",
    label: "درس‌ها",
    capability: "subjects.read",
    icon: BookMarked,
  },
  resources: {
    to: "/admin/resources",
    label: "منابع آموزشی",
    capability: "learning_resources.manage",
    icon: Library,
  },
  chat: {
    to: "/admin/communication/chat",
    label: "گفت‌وگو",
    capability: "chat.read",
    icon: MessageSquare,
  },
  reports: {
    to: "/admin/reports",
    label: "گزارش‌ها",
    capability: "reports.read",
    icon: BarChart3,
  },
  users: {
    to: "/admin/users",
    label: "کاربران و کارکنان",
    capability: "users.read",
    icon: UserCog,
  },
  organizations: {
    to: "/admin/organizations",
    label: "سازمان‌ها",
    capability: "organization.read",
    icon: Building2,
  },
  onboarding: {
    to: "/admin/onboarding",
    label: "ورودی دانش‌آموزان",
    capability: "student_onboarding.manage",
    icon: UserPlus,
  },
  system: {
    to: "/admin/system",
    label: "مرکز عملیات",
    capability: "system.manage",
    icon: Cpu,
  },
  audit: {
    to: "/admin/audit",
    label: "ممیزی امنیتی",
    capability: "audit.read",
    icon: ShieldCheck,
  },
  settings: {
    to: "/admin/settings",
    label: "پروفایل و حساب",
    icon: Settings,
  },
  family: {
    to: "/admin/family",
    label: "خانه خانواده",
    capability: "guardian.students.read",
    icon: Home,
  },
};

const roleActions: Partial<Record<RoleCode, RoleQuickAction[]>> = {
  GUARDIAN: [
    sharedActions.family,
    sharedActions.students,
    sharedActions.planner,
    sharedActions.reports,
    sharedActions.chat,
    sharedActions.settings,
  ],
  ADVISOR: [
    sharedActions.students,
    sharedActions.planner,
    sharedActions.learning,
    sharedActions.reports,
    sharedActions.chat,
    sharedActions.resources,
  ],
  TEACHER: [
    sharedActions.education,
    sharedActions.exams,
    sharedActions.questions,
    sharedActions.quizzes,
    sharedActions.subjects,
    sharedActions.students,
    sharedActions.resources,
    sharedActions.chat,
  ],
  MENTOR: [
    sharedActions.students,
    sharedActions.planner,
    sharedActions.reports,
    sharedActions.chat,
    sharedActions.resources,
  ],
  CONTENT_MANAGER: [
    sharedActions.education,
    sharedActions.resources,
    sharedActions.questions,
    sharedActions.quizzes,
    sharedActions.exams,
    sharedActions.subjects,
  ],
  ORGANIZATION_ADMIN: [
    sharedActions.education,
    sharedActions.students,
    sharedActions.users,
    sharedActions.organizations,
    sharedActions.reports,
    sharedActions.resources,
  ],
  PLATFORM_ADMIN: [
    sharedActions.education,
    sharedActions.onboarding,
    sharedActions.users,
    sharedActions.organizations,
    sharedActions.system,
    sharedActions.audit,
    sharedActions.students,
  ],
};

export function quickActionsForRole(
  role: RoleCode | null | undefined,
  capabilities: readonly string[],
): RoleQuickAction[] {
  const candidates = (role && roleActions[role]) || [sharedActions.settings];
  return candidates.filter(
    (action) => !action.capability || capabilities.includes(action.capability),
  );
}
