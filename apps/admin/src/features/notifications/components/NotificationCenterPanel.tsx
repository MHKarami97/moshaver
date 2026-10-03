import { CheckCheck, RefreshCw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../../../shared/ui/locale";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge, Button } from "../../../shared/ui/ui";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useAdminNotifications } from "../hooks/useAdminNotifications";
import type { AdminNotification } from "../model/notification-model";
import {
  notificationAdminUrl,
  notificationTone,
  notificationTypeLabel,
} from "../model/notification-model";

export function NotificationCenterPanel({
  mobilePanel,
  filter,
  setFilter,
  typeFilter,
  setTypeFilter,
  search,
  setSearch,
  items,
}: {
  mobilePanel: "notifications" | "inbox";
  filter: "all" | "unread";
  setFilter: Dispatch<SetStateAction<"all" | "unread">>;
  typeFilter: string;
  setTypeFilter: Dispatch<SetStateAction<string>>;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  items: AdminNotification[];
}) {
  const notifications = useAdminNotifications();
  const { formatDateTime } = useLocale();
  const navigate = useNavigate();

  return (
    <AdminList
      label="اعلان‌های مدیر"
      description="پیام‌ها، آزمون‌ها و اطلاعیه‌های بارگذاری‌شده را در همین‌جا پیگیری کنید."
      items={items}
      loading={notifications.loading}
      error={notifications.error}
      errorTitle={notifications.errorMessage || "دریافت اعلان‌ها ناموفق بود."}
      onRetry={notifications.refresh}
      className={[
        mobilePanel === "inbox" ? "hidden lg:flex" : "flex",
        "min-h-0 flex-col dark:border-slate-800 dark:bg-slate-900",
      ].join(" ")}
      contentClassName="min-h-0 flex-1 overflow-hidden"
      stickyHeader
      emptyTitle={
        filter === "unread"
          ? "همه اعلان‌ها خوانده شده‌اند."
          : search || typeFilter !== "all"
            ? "اعلانی مطابق فیلتر پیدا نشد."
            : "اعلانی وجود ندارد."
      }
      actions={
        <>
          {notifications.unread ? (
            <Button
              className="h-8 px-2 text-xs"
              variant="ghost"
              loading={notifications.markingAllRead}
              onClick={notifications.markAllRead}
            >
              <CheckCheck size={15} />
              خواندن همه
            </Button>
          ) : null}
          <Button
            className="h-8 px-2"
            variant="ghost"
            aria-label="تازه‌سازی اعلان‌ها"
            loading={notifications.refreshing}
            onClick={notifications.refresh}
          >
            <RefreshCw size={15} />
          </Button>
        </>
      }
      toolbar={
        <CollectionToolbar
          search={search}
          onSearchChange={setSearch}
          placeholder="جستجو در اعلان‌های بارگذاری‌شده"
          searchLabel="جستجوی اعلان‌ها"
          searchInputType="text"
          onClear={search ? () => setSearch("") : undefined}
          filters={<select className="h-8 min-w-28 border-0 bg-transparent px-2 text-xs outline-none" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="نوع اعلان"><option value="all">همه نوع‌ها</option><option value="message">پیام</option><option value="exam">آزمون</option><option value="lesson">برنامه</option><option value="announcement">اطلاعیه</option></select>}
          actions={
            <SegmentedControl
              ariaLabel="وضعیت خواندن اعلان‌ها"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: "همه" },
                { value: "unread", label: <>خوانده‌نشده {notifications.unread > 0 ? <span className="rounded-full bg-rose-600 px-1.5 text-white">{notifications.unread.toLocaleString("fa-IR")}</span> : null}</> },
              ]}
            />
          }
        />
      }
      footer={
        notifications.hasMore ? (
          <Button
            className="w-full sm:w-auto"
            variant="soft"
            loading={notifications.loadingMore}
            onClick={notifications.loadMore}
          >
            نمایش اعلان‌های بیشتر
          </Button>
        ) : null
      }
    >
      <div className="grid h-full min-h-0 gap-1 overflow-y-auto overscroll-contain pl-1 [scrollbar-gutter:stable]">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            style={{
              contentVisibility: "auto",
              containIntrinsicSize: "76px",
            }}
            className={[
              "rounded-lg border px-3 py-2 text-right shadow-[var(--shadow-surface)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
              item.isRead
                ? "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand dark:hover:border-brand"
                : "border-indigo-200 bg-indigo-50/70 hover:border-brand dark:border-indigo-900 dark:bg-indigo-950/20",
            ].join(" ")}
            onClick={() => {
              if (!item.isRead) {
                notifications.markRead(item.id);
              }
              navigate(notificationAdminUrl(item.url ?? undefined));
            }}
          >
            <span className="flex items-center gap-2">
              <strong className="min-w-0 flex-1 truncate text-sm text-slate-900 dark:text-white">
                {item.title}
              </strong>
              <Badge tone={notificationTone(item.type)}>{notificationTypeLabel(item.type)}</Badge>
              {!item.isRead ? (
                <span className="size-2 rounded-full bg-rose-600" aria-label="خوانده‌نشده" />
              ) : null}
            </span>

            {item.body ? (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                {item.body}
              </p>
            ) : null}

            {item.createdAt ? (
              <small className="text-[10px] text-slate-400">{formatDateTime(item.createdAt)}</small>
            ) : null}
          </button>
        ))}
      </div>
    </AdminList>
  );
}
