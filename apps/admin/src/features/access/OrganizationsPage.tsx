import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Building2, CheckCircle2, Crown, Pencil, Plus, Power, RotateCcw, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth";
import type { OrganizationSummary, RoleCode } from "../../shared/types/domain";
import { roleLabels } from "../../shared/lib/role-ui";
import { useModal } from "../../shared/ui/modal";
import { notify } from "../../shared/ui/notifications";
import { Button, Card, EmptyState, Field, Input, Select } from "../../shared/ui/ui";
import { AdminDataTable } from "../../shared/ui/admin-data-table";
import { CollectionToolbar } from "../../shared/ui/collection-toolbar";
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
import { AccessFlowGuidance } from "./components/AccessFlowGuidance";
import { emptyAccessResult } from "./model/access-flow";

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

export function OrganizationsPage() {
  const auth = useAuth(),
    modal = useModal(),
    qc = useQueryClient();
  const isPlatform = auth.hasRole("PLATFORM_ADMIN"),
    canManage = isPlatform && auth.can("organization.manage");
  const organizations = useQuery({ queryKey: ["organizations"], queryFn: listOrganizations });
  const [search, setSearch] = useState(""),
    [draft, setDraft] = useState({ name: "", type: "SCHOOL" }),
    [editing, setEditing] = useState<PortalOrganization | null>(null),
    [creating, setCreating] = useState(false),
    [selectedId, setSelectedId] = useState(auth.context?.activeOrganization?.id ?? "");
  const refresh = () => qc.invalidateQueries({ queryKey: ["organizations"] });
  const create = useMutation({
    mutationFn: (body: { name: string; type: string }) => createOrganization(body),
    onSuccess: async () => {
      setDraft({ name: "", type: "SCHOOL" });
      setCreating(false);
      notify("سازمان ساخته شد.");
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: (org: PortalOrganization) =>
      updateOrganization(org.id, { name: org.name, type: org.type, status: org.status }),
    onSuccess: async () => {
      setEditing(null);
      notify("اطلاعات سازمان ذخیره شد.");
      await refresh();
    },
  });
  const archive = useMutation({
    mutationFn: archiveOrganization,
    onSuccess: async () => {
      await refresh();
      notify("سازمان بایگانی شد.");
    },
  });
  const setEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      setOrganizationEnabled(id, enabled),
    onSuccess: async (_, { enabled }) => {
      notify(enabled ? "دسترسی سازمان فعال شد." : "دسترسی سازمان غیرفعال شد.");
      await refresh();
    },
  });
  const setFeatures = useMutation({
    mutationFn: ({ id, enabledFeatures }: { id: string; enabledFeatures: (typeof organizationFeatures)[number][0][] }) =>
      setOrganizationFeatures(id, enabledFeatures),
    onSuccess: async () => {
      modal.close();
      notify("قابلیت‌های سازمان به‌روزرسانی شد.");
      await refresh();
    },
  });
  const filtered = (organizations.data || []).filter((item) =>
    item.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const selected = (organizations.data || []).find((item) => item.id === selectedId);
  const selectedEnabledFeatureCount = selected
    ? organizationFeatures.length - (selected.disabledFeatures || []).length
    : 0;
  const activate = (org: PortalOrganization) =>
    auth.setActiveOrganization({
      id: org.id,
      membershipId: "",
      name: org.name,
      type: org.type,
    } as OrganizationSummary);
  const openFeatures = (organization: PortalOrganization) =>
    modal.open({
      title: `قابلیت‌های ${organization.name}`,
      description: "قابلیت غیرفعال از منو و API اعضای این سازمان حذف می‌شود.",
      size: "lg",
      content: (
        <OrganizationFeatureSettings
          organization={organization}
          pending={setFeatures.isPending}
          onChange={(enabledFeatures) =>
            setFeatures.mutate({ id: organization.id, enabledFeatures })
          }
        />
      ),
    });
  const openEditor = (organization?: PortalOrganization) =>
    modal.open({
      title: organization ? `ویرایش ${organization.name}` : "سازمان جدید",
      description: organization ? "نام و نوع سازمان را به‌روزرسانی کنید." : "نام و نوع سازمان را وارد کنید.",
      size: "md",
      content: (
        <OrganizationEditor
          organization={organization}
          onSubmit={async (value) => {
            if (organization) await update.mutateAsync({ ...organization, ...value });
            else await create.mutateAsync(value);
            modal.close();
          }}
        />
      ),
    });
  return (
    <div className="grid gap-5">
      <AccessFlowGuidance scope="organizations" canManage={canManage} />
      <section className="w-full" aria-label="ابزارهای فهرست سازمان‌ها">
        <ManagementSummaryBar
          action={
            canManage ? (
              <Button onClick={() => openEditor()}>
                <Plus size={16} />
                سازمان جدید
              </Button>
            ) : null
          }
        >
          <div className="flex w-full flex-wrap items-end gap-3">
            <ManagementStat label="همه سازمان‌ها" value={organizations.data?.length ?? 0} />
            <ManagementStat
              label="فعال"
              value={organizations.data?.filter((x) => x.status === "ACTIVE").length ?? 0}
              tone="success"
            />
            <ManagementStat
              label="بایگانی"
              value={organizations.data?.filter((x) => x.status === "ARCHIVED").length ?? 0}
            />

            <div className="min-w-[260px] flex-1 self-end">
              <CollectionToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="نام سازمان…"
                resultLabel={`${filtered.length.toLocaleString("fa-IR")} نتیجه`}
                onClear={search ? () => setSearch("") : undefined}
              />
            </div>
          </div>
        </ManagementSummaryBar>
      </section>
      {false && canManage && creating ? (
        <Card className="p-5">
          <SectionTitle
            icon={<Plus size={18} />}
            title="سازمان جدید"
            subtitle="نوع سازمان را برای نمایش و گزارش‌گیری دقیق انتخاب کنید."
          />
          <form
            className="mt-4 grid gap-3 sm:grid-cols-[1fr_240px_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate(draft);
            }}
          >
            <Field label="نام سازمان">
              <Input
                required
                minLength={2}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </Field>
            <OrganizationTypeField
              value={draft.type}
              onChange={(type) => setDraft({ ...draft, type })}
            />
            <div className="flex items-end">
              <div className="flex gap-2">
                <Button loading={create.isPending}>ساخت سازمان</Button>
                <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                  انصراف
                </Button>
              </div>
            </div>
            {create.isError ? (
              <p role="alert" className="text-sm text-rose-700">
                {errorText(create.error, "ساخت سازمان ناموفق بود.")}
              </p>
            ) : null}
          </form>
        </Card>
      ) : null}
      <section className="grid items-start gap-4 xl:h-[calc(100dvh-11rem)] xl:grid-cols-[minmax(420px,.9fr)_minmax(0,1.1fr)] xl:overflow-hidden">
        <Card className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="فهرست سازمان‌ها">
          {organizations.isLoading ? (
            <LoadingRows />
          ) : organizations.isError ? (
            <Retry message="دریافت سازمان‌ها ناموفق بود." retry={() => organizations.refetch()} />
          ) : !filtered.length ? (
            <div className="p-6">
              <EmptyState
                title={emptyAccessResult("organizations", Boolean(search))}
                action={
                  search
                    ? (
                      <Button variant="soft" onClick={() => setSearch("")}>
                        پاک‌کردن جستجو
                      </Button>
                    )
                    : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((org) => (
                <article
                  key={org.id}
                  className={`p-4 transition ${selectedId === org.id ? "bg-brand/5" : "hover:bg-slate-50/80 dark:hover:bg-slate-900/40"}`}
                >
                  {editing?.id === org.id ? (
                    <form
                      className="grid gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        update.mutate(editing);
                      }}
                    >
                      <Field label="نام">
                        <Input
                          required
                          value={editing.name}
                          onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        />
                      </Field>
                      <OrganizationTypeField
                        value={editing.type}
                        onChange={(type) => setEditing({ ...editing, type })}
                      />
                      <Field label="وضعیت">
                        <Select
                          value={editing.status}
                          onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                        >
                          <option value="ACTIVE">فعال</option>
                          <option value="INACTIVE">غیرفعال</option>
                          <option value="ARCHIVED">بایگانی‌شده</option>
                        </Select>
                      </Field>
                      <div className="flex gap-2">
                        <Button loading={update.isPending}>ذخیره</Button>
                        <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                          انصراف
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                          <Building2 size={19} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate font-black">{org.name}</h2>
                            <StatusPill status={org.status} />
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {organizationTypes.find(([value]) => value === org.type)?.[1] || org.type}
                            {org.status !== "ARCHIVED" ? ` · ${(organizationFeatures.length - (org.disabledFeatures || []).length).toLocaleString("fa-IR")} قابلیت فعال` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <IconAction
                            label={selectedId === org.id ? "فضای کار انتخاب شده" : `بازکردن فضای کار ${org.name}`}
                            active={selectedId === org.id}
                            disabled={org.status === "ARCHIVED"}
                            onClick={() => setSelectedId(org.id)}
                          >
                            <CheckCircle2 size={17} />
                          </IconAction>
                          {auth.context?.activeOrganization?.id !== org.id && org.status === "ACTIVE" ? (
                            <IconAction label={`انتخاب ${org.name} به‌عنوان زمینه کاری`} onClick={() => activate(org)}>
                              <Building2 size={17} />
                            </IconAction>
                          ) : null}
                        {canManage ? (
                          <>
                            <IconAction label={`ویرایش ${org.name}`} onClick={() => openEditor(org)}>
                              <Pencil size={17} />
                            </IconAction>
                            {org.status !== "ARCHIVED" ? (
                              <IconAction
                                label={org.status === "ACTIVE" ? `غیرفعال‌کردن ${org.name}` : `فعال‌کردن ${org.name}`}
                                tone={org.status === "ACTIVE" ? "danger" : "primary"}
                                loading={setEnabled.isPending && setEnabled.variables?.id === org.id}
                                disabled={setEnabled.isPending}
                                onClick={() =>
                                  void modal
                                    .confirm({
                                      title: org.status === "ACTIVE" ? "غیرفعال‌کردن سازمان؟" : "فعال‌کردن سازمان؟",
                                      description:
                                        org.status === "ACTIVE"
                                          ? `دسترسی سازمانی اعضای ${org.name} تا فعال‌سازی مجدد متوقف می‌شود.`
                                          : `دسترسی سازمانی اعضای ${org.name} دوباره فعال می‌شود.`,
                                      confirmLabel: org.status === "ACTIVE" ? "غیرفعال‌کردن" : "فعال‌کردن",
                                      tone: org.status === "ACTIVE" ? "danger" : undefined,
                                      showCancel: true,
                                    })
                                    .then(
                                      (confirmed) =>
                                        confirmed &&
                                        setEnabled.mutate({ id: org.id, enabled: org.status !== "ACTIVE" }),
                                    )
                                }
                              >
                                <Power size={17} />
                              </IconAction>
                            ) : null}
                            {org.status !== "ARCHIVED" ? (
                              <IconAction
                                label={`بایگانی ${org.name}`}
                                tone="danger"
                                loading={archive.isPending && archive.variables === org.id}
                                onClick={async () => {
                                  if (
                                    await modal.confirm({
                                      title: "بایگانی سازمان",
                                      description: `سازمان ${org.name} بایگانی شود؟ داده‌ها حذف نمی‌شوند.`,
                                      confirmLabel: "بایگانی",
                                      confirmationText: "بایگانی",
                                      tone: "danger",
                                      cancelLabel: "انصراف",
                                      showCancel: true,
                                    })
                                  )
                                    archive.mutate(org.id);
                                }}
                              >
                                <Archive size={17} />
                              </IconAction>
                            ) : (
                              <IconAction
                                label={`بازیابی ${org.name}`}
                                onClick={() =>
                                  void modal
                                    .confirm({
                                      title: "بازیابی سازمان؟",
                                      description: `سازمان ${org.name} و فضای مدیریتی آن دوباره فعال می‌شود.`,
                                      confirmLabel: "بازیابی",
                                      confirmationText: "بازیابی",
                                      showCancel: true,
                                    })
                                    .then(
                                      (confirmed) =>
                                        confirmed && update.mutate({ ...org, status: "ACTIVE" }),
                                    )
                                }
                              >
                                <RotateCcw size={17} />
                              </IconAction>
                            )}
                          </>
                        ) : null}
                        </div>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </Card>
        <div className="xl:h-full xl:overflow-y-auto xl:pe-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="جزئیات سازمان انتخاب‌شده">
          {selected && canManage && selected.status !== "ARCHIVED" ? (
            <Card className="mb-4 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-black">قابلیت‌های {selected.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">{selectedEnabledFeatureCount.toLocaleString("fa-IR")} قابلیت فعال از {organizationFeatures.length.toLocaleString("fa-IR")}</p>
                </div>
                <Button variant="soft" size="sm" onClick={() => openFeatures(selected)} title="مدیریت قابلیت‌های سازمان">
                  مدیریت قابلیت‌ها
                </Button>
              </div>
            </Card>
          ) : null}
          {selected && auth.can("organization.members.manage") && selected.status !== "ARCHIVED" ? (
            <OrganizationWorkspace organizationId={selected.id} organizationName={selected.name} />
          ) : (
            <Card className="p-6">
              <EmptyState
                title={
                  selected?.status === "ARCHIVED"
                    ? "سازمان بایگانی‌شده قابل مدیریت نیست."
                    : "یک سازمان را برای مدیریت اعضا انتخاب کنید."
                }
              />
            </Card>
          )}
        </div>
      </section>
    </div>
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
function OrganizationEditor({
  organization,
  onSubmit,
}: {
  organization?: PortalOrganization;
  onSubmit: (value: { name: string; type: string }) => Promise<void>;
}) {
  const modal = useModal();
  const [name, setName] = useState(organization?.name ?? "");
  const [type, setType] = useState(organization?.type ?? "SCHOOL");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        void onSubmit({ name, type })
          .catch((reason) => setError(errorText(reason, "ذخیره سازمان ناموفق بود.")))
          .finally(() => setSubmitting(false));
      }}
    >
      <Field label="نام سازمان">
        <Input required minLength={2} autoFocus value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <OrganizationTypeField value={type} onChange={setType} />
      {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Button type="button" variant="soft" onClick={modal.close}>انصراف</Button>
        <Button loading={submitting}>{organization ? "ذخیره تغییرات" : "ساخت سازمان"}</Button>
      </div>
    </form>
  );
}
function OrganizationFeatureSettings({
  organization,
  pending,
  onChange,
}: {
  organization: PortalOrganization;
  pending: boolean;
  onChange: (features: (typeof organizationFeatures)[number][0][]) => void;
}) {
  const modal = useModal();
  const disabled = organization.disabledFeatures || [];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {organizationFeatures.map(([code, label]) => {
        const enabled = !disabled.includes(code);
        const next = organizationFeatures
          .filter(([feature]) => feature === code ? !enabled : !disabled.includes(feature))
          .map(([feature]) => feature);
        const apply = () => onChange(next);
        return (
          <div key={code} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
            <span className="font-medium text-sm">{label}</span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`${enabled ? "غیرفعال‌کردن" : "فعال‌کردن"} ${label}`}
              title={`${enabled ? "غیرفعال‌کردن" : "فعال‌کردن"} ${label}`}
              disabled={pending}
              onClick={() => {
                if (!enabled) { apply(); return; }
                void modal.confirm({
                  title: `غیرفعال‌کردن ${label}؟`,
                  description: `اعضای ${organization.name} فوراً دسترسی ${label} را در منو و API از دست می‌دهند.`,
                  confirmLabel: "غیرفعال‌کردن",
                  confirmationText: "غیرفعال",
                  tone: "danger",
                }).then((confirmed) => confirmed && apply());
              }}
              className={`relative h-6 w-11 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 ${enabled ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"}`}
            >
              <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-1" : "translate-x-6"}`} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
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
