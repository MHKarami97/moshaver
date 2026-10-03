import type { AdminLanguage } from "../../shared/ui/locale";
import type { AttentionItem } from "./api/attention.api";

const copy = {
  fa: {
    eyebrow: "عملیات یکپارچه",
    title: "نیازمند توجه",
    description: "فقط کارهایی را می‌بینید که در نقش و محدوده کاری فعلی شما مجاز هستند.",
    queue: "صف رسیدگی",
    queueDescription:
      "درخواست‌ها، خطاها و پیام‌های باز با اولویت بالاتر در ابتدای صف قرار می‌گیرند.",
    all: "همه",
    refresh: "به‌روزرسانی",
    loadFailed: "صف نیازمند توجه دریافت نشد.",
    empty: "مورد بازی برای رسیدگی ندارید.",
    emptyPriority: "موردی با این اولویت وجود ندارد.",
    open: "باز",
    owner: "مالک",
    status: "وضعیت",
    due: "سررسید",
    student: "دانش‌آموز",
    openItem: "باز کردن مورد",
    priorities: { urgent: "فوری", high: "بالا", normal: "عادی" },
    types: {
      recovery: "بازیابی",
      task_issue: "مسئله فعالیت",
      retry_request: "تلاش مجدد",
      unread_chat: "گفت‌وگو",
      sync_failure: "همگام‌سازی",
      inactive_user: "حساب",
    },
  },
  en: {
    eyebrow: "Unified operations",
    title: "Needs attention",
    description: "Only work permitted by your current role and scope is shown.",
    queue: "Attention queue",
    queueDescription:
      "Open requests, failures, and messages are ordered with higher priorities first.",
    all: "All",
    refresh: "Refresh",
    loadFailed: "Could not load the attention queue.",
    empty: "There are no open items for you to handle.",
    emptyPriority: "There are no items at this priority.",
    open: "Open",
    owner: "Owner",
    status: "Status",
    due: "Due",
    student: "Student",
    openItem: "Open item",
    priorities: { urgent: "Urgent", high: "High", normal: "Normal" },
    types: {
      recovery: "Recovery",
      task_issue: "Task issue",
      retry_request: "Retry request",
      unread_chat: "Conversation",
      sync_failure: "Sync failure",
      inactive_user: "Account",
    },
  },
} as const;

export function attentionCopy(language: AdminLanguage) {
  return copy[language];
}
export function attentionPriorityLabel(
  priority: AttentionItem["priority"],
  language: AdminLanguage,
) {
  return copy[language].priorities[priority];
}
export function attentionTypeLabel(type: AttentionItem["type"], language: AdminLanguage) {
  return copy[language].types[type];
}
