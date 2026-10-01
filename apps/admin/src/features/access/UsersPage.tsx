import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Building2,
  CheckCircle2,
  Crown,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useAuth } from "../auth";
import type { OrganizationSummary, RoleCode } from "../../shared/types/domain";
import { roleLabels } from "../../shared/lib/role-ui";
import { useModal } from "../../shared/ui/modal";
import { notify } from "../../shared/ui/notifications";
import { Button, Card, EmptyState, Field, Input, Select } from "../../shared/ui/ui";
import { AdminDataTable } from "../../shared/ui/admin-data-table";
import {
  ManagementPageHeader,
  ManagementStat,
  ManagementSummaryBar,
} from "../../shared/ui/management-workspace";
import {
  archiveOrganization,
  archiveUser,
  createOrganization,
  createUser,
  listOrganizations,
  listUsers,
  setUserActive,
  setUserRoles,
  setOrganizationEnabled,
  organizationFeatures,
  setOrganizationFeatures,
  transferPlatformOwnership,
  updateOrganization,
  updateUser,
  type PortalOrganization,
  type PortalUser,
} from "./api/access.api";
import { OrganizationWorkspace } from "./OrganizationWorkspace";

const allRoles = Object.keys(roleLabels) as RoleCode[];
const organizationTypes = [
  ["SCHOOL", "مدرسه"],
  ["ACADEMY", "آکادمی"],
  ["COUNSELING_CENTER", "مرکز مشاوره"],
  ["PRIVATE_PRACTICE", "مجموعه خصوصی"],
  ["OTHER", "سایر"],
] as const;
const statusLabels: Record<string, string> = {
  ACTIVE: "فعال",
  INACTIVE: "غیرفعال",
  DISABLED: "غیرفعال",
  ARCHIVED: "بایگانی‌شده",
};
const nameOf = (user: PortalUser) =>
  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username;
const errorText = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export function UsersPage() {
  const auth = useAuth(),
    modal = useModal(),
    qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManage = auth.can("users.manage"),
    isPlatform = auth.hasRole("PLATFORM_ADMIN"),
    isPlatformOwner = auth.context?.user.isPlatformOwner === true;
  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: listOrganizations,
    enabled: isPlatform,
  });
  const [organizationId, setOrganizationId] = useState(
    () => searchParams.get("organizationId") ?? auth.context?.activeOrganization?.id ?? "",
  );
  const [search, setSearch] = useState(() => searchParams.get("q") ?? ""),
    [status, setStatus] = useState(() => searchParams.get("status") ?? "ALL"),
    [selectedUserId, setSelectedUserId] = useState(() => searchParams.get("userId") ?? ""),
    [selectedIds, setSelectedIds] = useState<string[]>([]);
  const users = useQuery({
    queryKey: ["users", organizationId || "platform"],
    queryFn: () => listUsers(organizationId || undefined),
  });
  const [editing, setEditing] = useState<PortalUser | null>(null);
  const [editDraft, setEditDraft] = useState({
    username: "",
    firstName: "",
    lastName: "",
    role: "ADVISOR" as RoleCode,
    organizationId: "",
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["users"] });
  const create = useMutation({
    mutationFn: (body: Parameters<typeof createUser>[0]) => createUser(body),
    onSuccess: async () => {
      modal.close();
      notify("حساب کاربری ساخته شد.");
      await refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onSuccess: async () => {
      await refresh();
      notify("وضعیت حساب به‌روزرسانی شد.");
    },
  });
  const archive = useMutation({
    mutationFn: archiveUser,
    onSuccess: async () => {
      await refresh();
      notify("حساب بایگانی شد.");
    },
  });
  const transferOwnership = useMutation({
    mutationFn: transferPlatformOwnership,
    onSuccess: async () => {
      notify("مالکیت پلتفرم واگذار شد. حساب قبلی همچنان مدیر پلتفرم است.");
      await refresh();
    },
  });
  const bulkStatus = useMutation({
    mutationFn: ({ ids, active }: { ids: string[]; active: boolean }) =>
      Promise.all(ids.map((id) => setUserActive(id, active))),
    onSuccess: async (_, values) => {
      setSelectedIds([]);
      await refresh();
      notify(`${values.ids.length.toLocaleString("fa-IR")} حساب به‌روزرسانی شد.`);
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await updateUser(editing.id, {
        username: editDraft.username,
        firstName: editDraft.firstName,
        lastName: editDraft.lastName,
      });
      if (!editing.isPlatformOwner && editing.id !== auth.context?.user.id) {
        await setUserRoles(editing.id, {
          roleCodes: [editDraft.role],
          ...(editDraft.role !== "PLATFORM_ADMIN"
            ? { organizationId: editDraft.organizationId || organizationId }
            : {}),
        });
      }
    },
    onSuccess: async () => {
      setEditing(null);
      notify("مشخصات و دسترسی حساب ذخیره شد.");
      await refresh();
    },
  });
  const visible = useMemo(
    () =>
      (users.data || []).filter((user) => {
        const term = search.trim().toLowerCase();
        return (
          (!term || `${nameOf(user)} ${user.username}`.toLowerCase().includes(term)) &&
          (status === "ALL" || user.status === status)
        );
      }),
    [search, status, users.data],
  );
  const selectedUser = (users.data || []).find((user) => user.id === selectedUserId) || null;

  useEffect(() => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        const setOrDelete = (key: string, value: string, defaultValue = "") => {
          if (!value || value === defaultValue) next.delete(key);
          else next.set(key, value);
        };
        setOrDelete("organizationId", organizationId);
        setOrDelete("q", search);
        setOrDelete("status", status, "ALL");
        setOrDelete("userId", selectedUserId);
        return next;
      },
      { replace: true },
    );
  }, [organizationId, search, selectedUserId, setSearchParams, status]);

  useEffect(() => {
    if (selectedUserId && !selectedUser && !users.isLoading) setSelectedUserId("");
  }, [selectedUser, selectedUserId, users.isLoading]);
  const isProtected = (user: PortalUser) =>
    user.id === auth.context?.user.id || user.isPlatformOwner === true;
  const protectedSelection = selectedIds.some((id) => {
    const user = (users.data || []).find((candidate) => candidate.id === id);
    return user ? isProtected(user) : false;
  });
  const startEdit = (user: PortalUser) => {
    const assignment =
      user.assignments.find((item) => item.organizationId === organizationId) ??
      user.assignments[0];
    setEditing(user);
    setEditDraft({
      username: user.username,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      role: assignment?.role ?? "ADVISOR",
      organizationId: assignment?.organizationId ?? organizationId,
    });
  };

  return (
    <div className="grid gap-5">
      {isPlatformOwner ? (
        <Card className="border-brand/25 bg-brand/5 p-4">
          <div className="flex gap-3">
            <Crown className="mt-0.5 shrink-0 text-brand" size={20} />
            <div>
              <h2 className="font-black">مالکیت پلتفرم</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                برای کارکنان، نقش محدود متناسب با کارشان انتخاب کنید. فقط هنگام نیاز واقعی، مدیر
                پلتفرم بسازید؛ سپس می‌توانید مالکیت را به آن حساب واگذار کنید.
              </p>
            </div>
          </div>
        </Card>
      ) : null}
      <section className="grid gap-3" aria-label="ابزارهای فهرست کاربران">
        <ManagementSummaryBar
          action={
            canManage ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  modal.open({
                    title: "ساخت حساب جدید",
                    description: "حساب را از ابتدا با نقش و محدوده درست ایجاد کنید.",
                    size: "lg",
                    content: (
                      <UserCreateForm
                        organizations={organizations.data || []}
                        defaultOrganizationId={
                          organizationId || auth.context?.activeOrganization?.id || ""
                        }
                        isPlatform={isPlatform}
                        allowPlatform={isPlatformOwner}
                        onSubmit={(body) => create.mutateAsync(body)}
                      />
                    ),
                  });
                }}
              >
                <Plus size={16} />
                کاربر جدید
              </Button>
            ) : null
          }
        >
          <ManagementStat label="همه حساب‌ها" value={users.data?.length ?? 0} />
          <ManagementStat
            label="فعال"
            value={users.data?.filter((x) => x.status === "ACTIVE").length ?? 0}
            tone="success"
          />
          <ManagementStat
            label="نقش"
            value={new Set(users.data?.flatMap((x) => x.assignments.map((a) => a.role))).size}
          />
        </ManagementSummaryBar>
        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_220px_180px]">
            <Field label="جستجو">
              <div className="relative">
                <Search className="absolute right-3 top-3 text-slate-400" size={18} />
                <Input
                  className="pr-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="نام یا نام کاربری…"
                />
              </div>
            </Field>
            {isPlatform ? (
              <Field label="محدوده سازمان">
                <Select
                  value={organizationId}
                  onChange={(e) => {
                    setOrganizationId(e.target.value);
                    setSelectedUserId("");
                    setSelectedIds([]);
                  }}
                >
                  <option value="">همه پلتفرم</option>
                  {organizations.data?.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            <Field label="وضعیت">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال</option>
                <option value="DISABLED">غیرفعال</option>
                <option value="ARCHIVED">بایگانی‌شده</option>
              </Select>
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-800">
            <span>
              {visible.length.toLocaleString("fa-IR")} نتیجه از{" "}
              {(users.data?.length || 0).toLocaleString("fa-IR")}
            </span>
            {search || status !== "ALL" ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 font-bold text-brand"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                }}
              >
                <X size={14} />
                پاک‌کردن فیلترها
              </button>
            ) : null}
          </div>
        </Card>
      </section>
      {editing ? (
        <Card className="border-brand/30 p-5">
          <SectionTitle
            icon={<Pencil size={18} />}
            title={`ویرایش ${nameOf(editing)}`}
            subtitle="مشخصات، نقش و محدوده دسترسی را یکجا ذخیره کنید."
          />
          <form
            className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <Field label="نام کاربری">
              <Input
                required
                minLength={2}
                dir="ltr"
                value={editDraft.username}
                onChange={(e) => setEditDraft({ ...editDraft, username: e.target.value })}
              />
            </Field>
            <Field label="نام">
              <Input
                value={editDraft.firstName}
                onChange={(e) => setEditDraft({ ...editDraft, firstName: e.target.value })}
              />
            </Field>
            <Field label="نام خانوادگی">
              <Input
                value={editDraft.lastName}
                onChange={(e) => setEditDraft({ ...editDraft, lastName: e.target.value })}
              />
            </Field>
            {!isProtected(editing) ? (
              <RoleField
                value={editDraft.role}
                onChange={(role) => setEditDraft({ ...editDraft, role })}
                allowPlatform={isPlatformOwner}
              />
            ) : (
              <p className="self-end rounded-xl bg-slate-100 p-3 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                برای حفظ دسترسی، نقش حساب فعلی و مالک پلتفرم از اینجا قابل تغییر نیست.
              </p>
            )}
            {!isProtected(editing) && editDraft.role !== "PLATFORM_ADMIN" ? (
              <OrganizationField
                organizations={organizations.data || []}
                value={editDraft.organizationId}
                onChange={(value) => setEditDraft({ ...editDraft, organizationId: value })}
              />
            ) : null}
            <div className="flex items-end gap-2">
              <Button loading={save.isPending}>ذخیره تغییرات</Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                انصراف
              </Button>
            </div>
            {save.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                {errorText(save.error, "ویرایش حساب ناموفق بود.")}
              </p>
            ) : null}
          </form>
        </Card>
      ) : null}
      <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
        <Card className="overflow-hidden" aria-label="فهرست کاربران">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <h2 className="font-black">فهرست کاربران</h2>
            <p className="text-xs text-slate-500">
              نقش و عملیات مجاز هر حساب در همان ردیف در دسترس است.
            </p>
          </div>
          {users.isLoading ? (
            <LoadingRows />
          ) : users.isError ? (
            <Retry message="دریافت کاربران ناموفق بود." retry={() => users.refetch()} />
          ) : !visible.length ? (
            <div className="p-6">
              <EmptyState title="کاربری با این فیلتر یافت نشد." />
            </div>
          ) : (
            <AdminDataTable
              rows={visible}
              rowId={(user) => user.id}
              label="فهرست کاربران"
              activeId={selectedUserId}
              onRowClick={(user) => setSelectedUserId(user.id)}
              selectedIds={selectedIds}
              onSelectionChange={canManage ? setSelectedIds : undefined}
              batchActions={(selectedRows) => (
                <>
                  {
                    <Button
                      variant="soft"
                      className="h-9"
                      loading={bulkStatus.isPending}
                      disabled={protectedSelection}
                      onClick={() =>
                        bulkStatus.mutate({
                          ids: selectedRows.map((user) => user.id),
                          active: true,
                        })
                      }
                    >
                      فعال‌سازی
                    </Button>
                  }
                  <Button
                    variant="soft"
                    className="h-9"
                    loading={bulkStatus.isPending}
                    disabled={protectedSelection}
                    onClick={() =>
                      void modal
                        .confirm({
                          title: "غیرفعال‌کردن حساب‌های انتخاب‌شده؟",
                          description: `دسترسی ${selectedRows.length.toLocaleString("fa-IR")} حساب متوقف می‌شود.`,
                          tone: "danger",
                          confirmLabel: "غیرفعال‌کردن",
                        })
                        .then(
                          (confirmed) =>
                            confirmed &&
                            bulkStatus.mutate({
                              ids: selectedRows.map((user) => user.id),
                              active: false,
                            }),
                        )
                    }
                  >
                    غیرفعال‌کردن
                  </Button>
                </>
              )}
              columns={[
                {
                  id: "user",
                  header: "کاربر",
                  cell: (user) => (
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{nameOf(user)}</strong>
                        {user.isPlatformOwner ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            <Crown size={12} /> مالک پلتفرم
                          </span>
                        ) : null}
                        <StatusPill status={user.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500" dir="ltr">
                        {user.username}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {user.assignments.map((item, index) => (
                          <span
                            key={`${item.role}-${item.organizationId}-${index}`}
                            className="rounded-full bg-brand/10 px-2 py-1 text-[11px] font-bold text-brand"
                          >
                            {roleLabels[item.role] || item.role}
                            {item.organizationId
                              ? ` · ${organizations.data?.find((org) => org.id === item.organizationId)?.name || "سازمان"}`
                              : " · سطح پلتفرم"}
                          </span>
                        ))}
                      </div>
                    </div>
                  ),
                },
                {
                  id: "actions",
                  header: "عملیات",
                  cell: (user) =>
                    canManage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="soft" onClick={() => startEdit(user)}>
                          <Pencil size={15} />
                          ویرایش
                        </Button>
                        {!isProtected(user) ? (
                          <Button
                            variant="soft"
                            loading={toggle.isPending && toggle.variables?.id === user.id}
                            disabled={toggle.isPending || archive.isPending}
                            onClick={() =>
                              user.status === "ACTIVE"
                                ? void modal
                                    .confirm({
                                      title: "غیرفعال‌کردن حساب؟",
                                      description: `دسترسی ${nameOf(user)} و نشست‌های فعال او متوقف می‌شود.`,
                                      tone: "danger",
                                      confirmLabel: "غیرفعال‌کردن",
                                    })
                                    .then(
                                      (confirmed) =>
                                        confirmed && toggle.mutate({ id: user.id, active: false }),
                                    )
                                : toggle.mutate({ id: user.id, active: true })
                            }
                          >
                            {user.status === "ACTIVE" ? "غیرفعال" : "فعال‌سازی"}
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-slate-500">
                            {user.isPlatformOwner ? "ابتدا واگذاری مالکیت" : "حساب فعلی"}
                          </span>
                        )}
                        {isPlatform && user.status !== "ARCHIVED" && !isProtected(user) ? (
                          <Button
                            variant="danger"
                            loading={archive.isPending && archive.variables === user.id}
                            disabled={archive.isPending || toggle.isPending}
                            onClick={async () => {
                              if (
                                await modal.confirm({
                                  title: "بایگانی حساب",
                                  description: `حساب ${nameOf(user)} بایگانی و نشست‌های آن بسته شود؟`,
                                  confirmLabel: "بایگانی",
                                  confirmationText: "بایگانی",
                                  tone: "danger",
                                  cancelLabel: "انصراف",
                                  showCancel: true,
                                })
                              )
                                archive.mutate(user.id);
                            }}
                          >
                            بایگانی
                          </Button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">فقط مشاهده</span>
                    ),
                },
              ]}
            />
          )}
        </Card>
        <div className="xl:sticky xl:top-20">
          {selectedUser ? (
            <Card className="overflow-hidden p-0">
              <div className="bg-gradient-to-br from-slate-950 to-slate-700 p-5 text-white">
                <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-xl font-black">
                  {nameOf(selectedUser).slice(0, 1)}
                </span>
                <h2 className="mt-3 text-lg font-black">{nameOf(selectedUser)}</h2>
                <p className="mt-1 text-xs text-white/60" dir="ltr">
                  {selectedUser.username}
                </p>
              </div>
              <div className="grid gap-3 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">وضعیت حساب</span>
                  <StatusPill status={selectedUser.status} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">نقش‌ها و محدوده‌ها</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUser.assignments.map((item, index) => (
                      <span
                        key={`${item.role}-${index}`}
                        className="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand"
                      >
                        {roleLabels[item.role] || item.role}
                      </span>
                    ))}
                  </div>
                </div>
                {isPlatformOwner &&
                selectedUser.id !== auth.context?.user.id &&
                !selectedUser.isPlatformOwner &&
                selectedUser.status === "ACTIVE" &&
                selectedUser.assignments.some((item) => item.role === "PLATFORM_ADMIN") ? (
                  <Button
                    variant="soft"
                    loading={transferOwnership.isPending}
                    onClick={() =>
                      void modal
                        .confirm({
                          title: "واگذاری مالکیت پلتفرم؟",
                          description: `${nameOf(selectedUser)} مالک جدید می‌شود. حساب شما مدیر پلتفرم می‌ماند اما دیگر نمی‌تواند مدیر پلتفرم بسازد یا مالکیت را واگذار کند.`,
                          confirmLabel: "واگذاری مالکیت",
                          confirmationText: "واگذاری مالکیت",
                          tone: "danger",
                          cancelLabel: "انصراف",
                          showCancel: true,
                        })
                        .then((confirmed) => confirmed && transferOwnership.mutate(selectedUser.id))
                    }
                  >
                    <Crown size={15} /> واگذاری مالکیت پلتفرم
                  </Button>
                ) : null}
                {canManage ? (
                  <Button variant="soft" onClick={() => startEdit(selectedUser)}>
                    <Pencil size={15} />
                    ویرایش حساب و دسترسی
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <EmptyState title="یک کاربر را برای مشاهده جزئیات انتخاب کنید." />
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function UserCreateForm({
  organizations,
  defaultOrganizationId,
  isPlatform,
  allowPlatform,
  onSubmit,
}: {
  organizations: PortalOrganization[];
  defaultOrganizationId: string;
  isPlatform: boolean;
  allowPlatform: boolean;
  onSubmit: (body: Parameters<typeof createUser>[0]) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "ADVISOR" as RoleCode,
    organizationId: defaultOrganizationId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const requiresOrganization = draft.role !== "PLATFORM_ADMIN";

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
          await onSubmit({
            username: draft.username,
            password: draft.password,
            firstName: draft.firstName,
            lastName: draft.lastName,
            roleCodes: [draft.role],
            ...(requiresOrganization ? { organizationId: draft.organizationId } : {}),
          });
        } catch (submissionError) {
          setError(errorText(submissionError, "ساخت حساب ناموفق بود."));
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Field label="نام کاربری">
        <Input
          required
          minLength={2}
          dir="ltr"
          value={draft.username}
          onChange={(event) => setDraft({ ...draft, username: event.target.value })}
        />
      </Field>
      <Field label="رمز اولیه (حداقل ۱۲ نویسه)">
        <Input
          required
          minLength={12}
          type="password"
          dir="ltr"
          value={draft.password}
          onChange={(event) => setDraft({ ...draft, password: event.target.value })}
        />
      </Field>
      <RoleField
        value={draft.role}
        onChange={(role) => setDraft({ ...draft, role })}
        allowPlatform={allowPlatform}
      />
      <Field label="نام">
        <Input
          value={draft.firstName}
          onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
        />
      </Field>
      <Field label="نام خانوادگی">
        <Input
          value={draft.lastName}
          onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
        />
      </Field>
      {isPlatform && requiresOrganization ? (
        <OrganizationField
          organizations={organizations}
          value={draft.organizationId}
          onChange={(organizationId) => setDraft({ ...draft, organizationId })}
        />
      ) : null}
      {error ? (
        <p role="alert" className="md:col-span-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="md:col-span-2 flex justify-end">
        <Button loading={isSubmitting} disabled={requiresOrganization && !draft.organizationId}>
          ساخت حساب
        </Button>
      </div>
    </form>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
        {icon}
      </span>
      <div>
        <h2 className="font-black">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
function RoleField({
  value,
  onChange,
  allowPlatform,
}: {
  value: RoleCode;
  onChange: (role: RoleCode) => void;
  allowPlatform: boolean;
}) {
  return (
    <Field label="نقش">
      <Select value={value} onChange={(e) => onChange(e.target.value as RoleCode)}>
        {allRoles
          .filter((role) => allowPlatform || role !== "PLATFORM_ADMIN")
          .map((role) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
      </Select>
    </Field>
  );
}
function OrganizationField({
  organizations,
  value,
  onChange,
}: {
  organizations: PortalOrganization[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="سازمان">
      <Select required value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">انتخاب سازمان…</option>
        {organizations
          .filter((item) => item.status === "ACTIVE")
          .map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
      </Select>
    </Field>
  );
}
function OrganizationTypeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label="نوع سازمان">
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {organizationTypes.map(([type, label]) => (
          <option key={type} value={type}>
            {label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-bold ${status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : status === "ARCHIVED" ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
function IconAction({
  label,
  active = false,
  tone = "soft",
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "aria-label" | "title" | "size" | "variant"> & {
  label: string;
  active?: boolean;
  tone?: "soft" | "primary" | "danger";
}) {
  return (
    <Button
      size="icon"
      variant={active ? "primary" : tone}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </Button>
  );
}
function LoadingRows() {
  return (
    <div role="status" aria-label="در حال دریافت" className="grid gap-3 p-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-20 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ))}
    </div>
  );
}
function Retry({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="grid justify-items-center gap-3 p-8">
      <ShieldCheck className="text-rose-600" />
      <p className="text-sm text-rose-700">{message}</p>
      <Button variant="soft" onClick={retry}>
        تلاش دوباره
      </Button>
    </div>
  );
}
