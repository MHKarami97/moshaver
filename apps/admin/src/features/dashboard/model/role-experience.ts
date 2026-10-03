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
  /** Explains the outcome before an operator leaves their current workspace. */
  description: string;
  capability?: string;
  icon?: RoleQuickActionIcon;
};

const sharedActions: Record<string, RoleQuickAction> = {
  education: {
    to: "/admin/education",
    label: "مرکز آموزش",
    description: "کلاس‌ها، درس‌ها و محتوای آموزشی را مدیریت کنید",
    capability: "exams.read",
    icon: GraduationCap,
  },
  students: {
    to: "/admin/students",
    label: "دانش‌آموزان",
    description: "دانش‌آموزان و وضعیت پشتیبانی آن‌ها را بررسی کنید",
    capability: "students.read",
    icon: Users,
  },
  planner: {
    to: "/admin/planner",
    label: "برنامه‌ها",
    description: "برنامه‌های درسی و پیگیری روزانه را مدیریت کنید",
    capability: "plans.read",
    icon: Calendar,
  },
  learning: {
    to: "/admin/learning",
    label: "یادگیری و مرور",
    description: "مسیرهای یادگیری و مرورهای دانش‌آموز را پیگیری کنید",
    capability: "learning.read",
    icon: BookOpen,
  },
  exams: {
    to: "/admin/exams",
    label: "آزمون‌ها",
    description: "آزمون‌ها، زمان‌بندی و نتایج را بررسی کنید",
    capability: "exams.read",
    icon: ListChecks,
  },
  questions: {
    to: "/admin/questions",
    label: "بانک سؤال",
    description: "سؤال‌های ارزیابی را بسازید و سازمان‌دهی کنید",
    capability: "questions.read",
    icon: FileQuestion,
  },
  quizzes: {
    to: "/admin/quizzes",
    label: "آزمونک‌ها",
    description: "آزمونک‌های کوتاه و وضعیت انتشارشان را مدیریت کنید",
    capability: "quizzes.read",
    icon: Trophy,
  },
  subjects: {
    to: "/admin/subjects",
    label: "درس‌ها",
    description: "درس‌ها و ساختار آموزشی را تنظیم کنید",
    capability: "subjects.read",
    icon: BookMarked,
  },
  resources: {
    to: "/admin/resources",
    label: "منابع آموزشی",
    description: "منابع درسی قابل استفاده در آموزش را مدیریت کنید",
    capability: "learning_resources.manage",
    icon: Library,
  },
  chat: {
    to: "/admin/communication/chat",
    label: "گفت‌وگو",
    description: "پیام‌ها و گفت‌وگوهای نیازمند پاسخ را دنبال کنید",
    capability: "chat.read",
    icon: MessageSquare,
  },
  reports: {
    to: "/admin/reports",
    label: "گزارش‌ها",
    description: "گزارش‌های دانش‌آموزان و پیگیری‌های باز را مرور کنید",
    capability: "reports.read",
    icon: BarChart3,
  },
  users: {
    to: "/admin/users",
    label: "کاربران و کارکنان",
    description: "حساب‌ها، نقش‌ها و دسترسی کارکنان را مدیریت کنید",
    capability: "users.read",
    icon: UserCog,
  },
  organizations: {
    to: "/admin/organizations",
    label: "سازمان‌ها",
    description: "سازمان‌ها و عضویت‌های فعال را مدیریت کنید",
    capability: "organization.read",
    icon: Building2,
  },
  onboarding: {
    to: "/admin/onboarding",
    label: "ورودی دانش‌آموزان",
    description: "ثبت‌نام‌ها را بررسی و به تیم آموزشی واگذار کنید",
    capability: "student_onboarding.manage",
    icon: UserPlus,
  },
  system: {
    to: "/admin/system",
    label: "مرکز عملیات",
    description: "سلامت سامانه و عملیات پلتفرم را بررسی کنید",
    capability: "system.manage",
    icon: Cpu,
  },
  audit: {
    to: "/admin/audit",
    label: "ممیزی امنیتی",
    description: "رویدادهای امنیتی و فعالیت‌های حساس را مرور کنید",
    capability: "audit.read",
    icon: ShieldCheck,
  },
  settings: {
    to: "/admin/settings",
    label: "پروفایل و حساب",
    description: "تنظیمات حساب و اعلان‌های شخصی را تغییر دهید",
    icon: Settings,
  },
  family: {
    to: "/admin/family",
    label: "خانه خانواده",
    description: "پیشرفت، برنامه و ارتباط خانوادگی را دنبال کنید",
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
