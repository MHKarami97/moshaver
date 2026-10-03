export type AccessFlowScope = "users" | "organizations";

/**
 * Keeps the operational guidance on the two access pages consistent. Server
 * capabilities remain the source of authority; this text only makes the
 * resulting UI state understandable to the operator.
 */
export function accessFlowGuidance(scope: AccessFlowScope, canManage: boolean) {
  if (!canManage) {
    return scope === "users"
      ? {
          title: "دسترسی مشاهده کاربران",
          description:
            "می‌توانید حساب‌ها و نقش‌ها را بررسی کنید؛ ایجاد یا تغییر دسترسی به مجوز مدیریت کاربران نیاز دارد.",
        }
      : {
          title: "دسترسی مشاهده سازمان‌ها",
          description:
            "می‌توانید وضعیت و ساختار سازمان‌ها را بررسی کنید؛ تغییر سازمان و قابلیت‌ها به مجوز مدیریت سازمان نیاز دارد.",
        };
  }

  return scope === "users"
    ? {
        title: "مدیریت حساب و دسترسی",
        description:
          "کاربر را انتخاب کنید، نقش و محدوده او را بررسی کنید و سپس تغییر را ذخیره کنید. توقف و بایگانی دسترسی تأیید می‌خواهد.",
      }
    : {
        title: "مدیریت سازمان و قابلیت‌ها",
        description:
          "یک سازمان را انتخاب کنید تا اعضا، نقش‌ها و قابلیت‌های آن را بررسی کنید. غیرفعال‌سازی، دسترسی اعضا را متوقف می‌کند.",
      };
}

export function emptyAccessResult(scope: AccessFlowScope, hasFilters: boolean) {
  if (hasFilters) {
    return scope === "users"
      ? "کاربری با جستجو یا فیلتر انتخاب‌شده یافت نشد. فیلترها را پاک کنید یا محدوده سازمان را تغییر دهید."
      : "سازمانی با جستجوی انتخاب‌شده یافت نشد. جستجو را پاک کنید یا نام دیگری وارد کنید.";
  }

  return scope === "users"
    ? "هنوز حسابی در این محدوده وجود ندارد. برای شروع، یک حساب با نقش و سازمان درست بسازید."
    : "هنوز سازمانی ثبت نشده است. برای شروع، نخستین سازمان را بسازید.";
}
