import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw, Volume2 } from "lucide-react";
import { Button } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { notificationRequestErrorMessage } from "../lib/api-error";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import type { PushStatus } from "../model/notification-model";
import type { NotificationContextValue } from "../model/notification.types";
import { NotificationPreference } from "./NotificationPreference";

type Props = {
  notifications?: NotificationContextValue;
};

export function pushDeviceLabel(userAgent: string) {
  const browser = /edg\//i.test(userAgent)
    ? "Microsoft Edge"
    : /firefox\//i.test(userAgent)
      ? "Firefox"
      : /chrome\//i.test(userAgent) || /crios\//i.test(userAgent)
        ? "Chrome"
        : /safari\//i.test(userAgent)
          ? "Safari"
          : "مرورگر ناشناس";
  const platform = /android/i.test(userAgent)
    ? "Android"
    : /iphone|ipad|ipod/i.test(userAgent)
      ? "iOS"
      : /windows/i.test(userAgent)
        ? "Windows"
        : /mac os/i.test(userAgent)
          ? "macOS"
          : /linux/i.test(userAgent)
            ? "Linux"
            : "دستگاه ناشناس";
  return `${browser} · ${platform}`;
}

export function pushDateTime(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

/**
 * Passing `notifications` is recommended for content rendered by a global
 * ModalProvider. The modal may live outside NotificationProvider's subtree.
 */
export function NotificationSettings({ notifications }: Props = {}) {
  if (notifications) {
    return <NotificationSettingsContent notifications={notifications} />;
  }

  return <NotificationSettingsFromContext />;
}

function NotificationSettingsFromContext() {
  const notifications = useAdminNotifications();
  return <NotificationSettingsContent notifications={notifications} />;
}

function NotificationSettingsContent({
  notifications,
}: {
  notifications: NotificationContextValue;
}) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState("");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setStatus(await notifications.pushStatus());
    } catch (error) {
      setStatus(null);
      setLoadError(notificationRequestErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [notifications.pushStatus]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function action(
    name: string,
    work: () => Promise<PushStatus | void>,
    successMessage: string,
  ) {
    if (busy) {
      return;
    }

    setBusy(name);

    try {
      const next = await work();
      if (next) {
        setStatus(next);
      }
      notify(successMessage, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "عملیات اعلان ناموفق بود.", "error");
    } finally {
      setBusy("");
    }
  }

  if (loading) {
    return (
      <div
        className="h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
        aria-label="در حال دریافت تنظیمات اعلان"
      />
    );
  }

  if (loadError) {
    return (
      <div className="grid gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <strong className="block">تنظیمات اعلان دریافت نشد</strong>
            <p className="mt-1 text-xs leading-5 opacity-80">{loadError}</p>
          </div>
        </div>
        <Button variant="soft" onClick={() => void loadStatus()}>
          <RefreshCw size={15} />
          تلاش دوباره
        </Button>
      </div>
    );
  }

  const message = !status?.supported
    ? "این مرورگر Push را پشتیبانی نمی‌کند."
    : !status.serverConfigured
      ? "کلیدهای Web Push روی سرور تنظیم نشده‌اند."
      : status.permission === "denied"
        ? "اجازه اعلان در تنظیمات مرورگر مسدود شده است."
        : status.registered
          ? "اعلان سیستمی این دستگاه فعال است."
          : status.permission === "default"
            ? "منتظر اجازه مرورگر: برای ادامه، فعال‌سازی را بزنید و اجازه اعلان را تأیید کنید."
            : "اعلان سیستمی این دستگاه غیرفعال است؛ برای دریافت در پس‌زمینه آن را فعال کنید.";

  return (
    <div className="grid gap-4">
      <div
        className={[
          "rounded-xl border p-3 text-sm leading-6",
          status?.registered
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
            : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
        ].join(" ")}
      >
        {message}
      </div>

      <div className="flex flex-wrap gap-2">
        {status?.registered ? (
          <Button
            variant="danger"
            loading={busy === "disable"}
            disabled={Boolean(busy && busy !== "disable")}
            onClick={() =>
              void action(
                "disable",
                notifications.disablePush,
                "اعلان سیستمی این دستگاه غیرفعال شد.",
              )
            }
          >
            غیرفعال‌کردن Push
          </Button>
        ) : (
          <Button
            loading={busy === "enable"}
            disabled={
              Boolean(busy && busy !== "enable") ||
              !status?.supported ||
              !status.serverConfigured ||
              status.permission === "denied"
            }
            onClick={() =>
              void action("enable", notifications.enablePush, "اعلان سیستمی این دستگاه فعال شد.")
            }
          >
            فعال‌کردن اعلان سیستمی
          </Button>
        )}

        <Button
          variant="soft"
          disabled={!status?.registered || Boolean(busy && busy !== "test")}
          loading={busy === "test"}
          onClick={() =>
            void action(
              "test",
              async () => {
                await notifications.testPush();
              },
              "درخواست اعلان آزمایشی ثبت شد؛ دریافت آن را روی همین دستگاه بررسی کنید.",
            )
          }
        >
          ارسال اعلان آزمایشی
        </Button>

        <Button
          variant="ghost"
          disabled={Boolean(busy)}
          onClick={() => notifications.testSound(false)}
        >
          <Volume2 size={15} />
          آزمایش صدا
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <NotificationPreference
          label="پیام‌ها"
          name="messages"
          status={status}
          save={notifications.savePushPreferences}
          setStatus={setStatus}
        />
        <NotificationPreference
          label="آزمون‌ها"
          name="exams"
          status={status}
          save={notifications.savePushPreferences}
          setStatus={setStatus}
        />
        <NotificationPreference
          label="برنامه و درس"
          name="lessons"
          status={status}
          save={notifications.savePushPreferences}
          setStatus={setStatus}
        />
        <NotificationPreference
          label="اطلاعیه‌ها"
          name="announcements"
          status={status}
          save={notifications.savePushPreferences}
          setStatus={setStatus}
        />
      </div>
      {status?.devices?.length ? (
        <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
          <h3 className="text-sm font-bold">وضعیت تحویل روی مرورگرها و دستگاه‌ها</h3>
          <div className="mt-2 grid gap-2">
            {status.devices.map((device) => (
              <div
                key={device.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-900"
              >
                <span className="min-w-0 truncate" title={device.userAgent}>
                  {device.current ? "این دستگاه · " : ""}
                  {pushDeviceLabel(device.userAgent)}
                </span>
                <span
                  className={`text-left ${device.failureCount ? "text-rose-700" : "text-emerald-700"}`}
                >
                  <span className="block">
                    {device.failureCount
                      ? `${device.failureCount.toLocaleString("fa-IR")} خطای تحویل`
                      : device.lastSuccessAt
                        ? `تحویل موفق: ${pushDateTime(device.lastSuccessAt)}`
                        : "در انتظار نخستین تحویل"}
                  </span>
                  <small className="block text-[10px] text-slate-400">
                    آخرین فعالیت: {pushDateTime(device.updatedAt)}
                  </small>
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
