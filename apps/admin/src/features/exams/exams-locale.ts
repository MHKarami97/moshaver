import type { AdminLanguage } from "../../shared/ui/locale";

const copy = {
  fa: {
    studentContext: "زمینه دانش‌آموز",
    studentContextHint: "اختیاری؛ برای تخصیص سریع و مشاهده سابقه.",
    exam: "آزمون",
    history: "سابقه",
    transfer: "ورود / خروجی",
  },
  en: {
    studentContext: "Student context",
    studentContextHint: "Optional; use it for quick assignment and viewing history.",
    exam: "Exam",
    history: "History",
    transfer: "Import / export",
  },
} as const;

export function examsCopy(language: AdminLanguage) {
  return copy[language];
}
