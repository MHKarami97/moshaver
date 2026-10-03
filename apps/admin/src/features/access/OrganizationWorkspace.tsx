import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Link2,
  UserPlus,
  Users,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Check,
  X,
  Search,
  UserRound,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import type { RoleCode } from "../../shared/types/domain";
import { Button, Card, EmptyState, Field, Select } from "../../shared/ui/ui";
import { useModal } from "../../shared/ui/modal";
import { notify } from "../../shared/ui/notifications";
import { roleLabels } from "../../shared/lib/role-ui";
import { useAuth } from "../auth";
import {
  acceptRelationship,
  addOrganizationMember,
  allowGuardianChange,
  createRelationship,
  listRelationshipStudents,
  listOrganizationMembers,
  listRelationships,
  listUsers,
  rejectRelationship,
  removeRelationship,
  removeOrganizationMember,
  updateOrganizationMember,
  type OrganizationMember,
  type RelationshipStudent,
} from "./api/access.api";

const roles: Array<{ value: RoleCode; label: string }> = [
  { value: "STUDENT", label: "دانش‌آموز" },
  { value: "GUARDIAN", label: "سرپرست" },
  { value: "ADVISOR", label: "مشاور" },
  { value: "TEACHER", label: "دبیر" },
  { value: "MENTOR", label: "منتور" },
  { value: "CONTENT_MANAGER", label: "مدیر محتوا" },
  { value: "ORGANIZATION_ADMIN", label: "مدیر سازمان" },
];

const relationTypeLabels: Record<string, string> = {
  GUARDIAN_OF: "سرپرست",
  ADVISOR_OF: "مشاور",
  TEACHER_OF: "دبیر",
  MENTOR_OF: "منتور",
};

const statusLabels: Record<string, string> = {
  PENDING: "در انتظار بررسی",
  ACCEPTED: "تأییدشده",
  REJECTED: "ردشده",
};

const statusTones: Record<string, string> = {
  PENDING:
    "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
  ACCEPTED:
    "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
  REJECTED:
    "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
};

function displayName(
  user?: { firstName?: string | null; lastName?: string | null; username?: string } | null,
) {
  if (!user) return "—";
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "—";
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/60 px-3 py-2 text-center dark:border-slate-800 dark:bg-slate-900/40">
      <div className="text-lg font-black tabular-nums">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {icon}
        </span>
        <div>
          <h3 className="font-bold leading-tight">{title}</h3>
          {description ? <p className="text-xs text-slate-500">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function OrganizationWorkspace({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const auth = useAuth();
  const qc = useQueryClient();
  const modal = useModal();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<RoleCode>("ADVISOR");
  const [memberSearch, setMemberSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const members = useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => listOrganizationMembers(organizationId),
  });
  const users = useQuery({
    queryKey: ["users", "platform-membership-picker"],
    queryFn: () => listUsers(),
  });
  const relationships = useQuery({ queryKey: ["relationships"], queryFn: listRelationships });
  const relationshipStudents = useQuery({
    queryKey: ["students", "relationship-picker"],
    queryFn: listRelationshipStudents,
  });

  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["organization-members", organizationId] }),
      qc.invalidateQueries({ queryKey: ["relationships"] }),
    ]);
  };

  const add = useMutation({
    mutationFn: () => addOrganizationMember(organizationId, { userId, roleCodes: [role] }),
    onSuccess: async () => {
      setUserId("");
      setShowAddForm(false);
      notify("عضو با نقش انتخاب‌شده به سازمان افزوده شد.");
      await refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({
      id,
      status,
      roleCodes,
    }: {
      id: string;
      status?: "ACTIVE" | "INACTIVE";
      roleCodes?: RoleCode[];
    }) => updateOrganizationMember(organizationId, id, { status, roleCodes }),
    onSuccess: async (_, variables) => {
      notify(
        variables.status
          ? variables.status === "ACTIVE"
            ? "عضویت فعال شد."
            : "عضویت غیرفعال شد."
          : "نقش سازمانی عضو به‌روزرسانی شد.",
      );
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => removeOrganizationMember(organizationId, id),
    onSuccess: async () => {
      notify("عضویت از سازمان حذف شد؛ حساب کاربری حفظ شده است.");
      await refresh();
    },
  });
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      action === "accept" ? acceptRelationship(id) : rejectRelationship(id),
    onSuccess: async (_, variables) => {
      notify(variables.action === "accept" ? "درخواست ارتباط تأیید شد." : "درخواست ارتباط رد شد.");
      await refresh();
    },
  });
  const createLink = useMutation({
    mutationFn: (body: Parameters<typeof createRelationship>[0]) => createRelationship(body),
    onSuccess: async () => {
      modal.close();
      notify("ارتباط ایجاد شد.");
      await refresh();
    },
  });
  const revokeLink = useMutation({
    mutationFn: removeRelationship,
    onSuccess: async () => {
      notify("ارتباط لغو شد.");
      await refresh();
    },
  });
  const guardianOverride = useMutation({
    mutationFn: allowGuardianChange,
    onSuccess: () => notify("محدودیت تغییر سرپرست لغو شد."),
  });

  const available = (users.data || []).filter(
    (user) => !members.data?.some((member) => member.user.id === user.id),
  );
  const relevant = (relationships.data || []).filter(
    (item) => !item.organizationId || item.organizationId === organizationId,
  );

  const filteredMembers = (members.data || []).filter((member) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.trim().toLowerCase();
    return (
      displayName(member.user).toLowerCase().includes(q) ||
      member.user.username?.toLowerCase().includes(q)
    );
  });

  const pendingCount = relevant.filter((item) => item.status === "PENDING").length;
  const activeMembers = (members.data || []).filter((m) => m.status === "ACTIVE").length;

  return (
    <div className="grid gap-4">
      {/* ── Hero / Overview ─────────────────────────────────────────── */}
      <Card className="overflow-hidden p-0">
        <div className="relative bg-gradient-to-l from-brand/10 via-brand/5 to-transparent p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-brand/15 text-brand shadow-sm">
                <Building2 size={22} />
              </span>
              <div>
                <h2 className="text-lg font-black leading-tight">{organizationName}</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  مدیریت اعضا، نقش‌ها و ارتباط‌های سازمانی
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <StatPill label="کل اعضا" value={members.data?.length ?? "—"} />
              <StatPill label="فعال" value={activeMembers} />
              <StatPill label="در انتظار" value={pendingCount} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Two-column main layout ─────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* ── Members ─────────────────────────────────────────────── */}
        <Card className="p-5">
          <SectionHeader
            icon={<Users size={18} />}
            title="اعضای سازمان"
            description="افزودن، تغییر نقش و مدیریت وضعیت اعضا"
            action={
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search
                    size={14}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="جستجوی عضو…"
                    className="h-9 w-44 rounded-lg border border-slate-200 bg-white pr-8 pl-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <Button
                  variant={showAddForm ? "soft" : "primary"}
                  onClick={() => setShowAddForm((v) => !v)}
                >
                  <UserPlus size={16} />
                  {showAddForm ? "بستن" : "افزودن عضو"}
                </Button>
              </div>
            }
          />

          {showAddForm ? (
            <form
              className="mb-4 grid gap-3 rounded-xl border border-brand/20 bg-brand/5 p-3 md:grid-cols-[1fr_180px_auto]"
              onSubmit={(e) => {
                e.preventDefault();
                add.mutate();
              }}
            >
              <Field label="کاربر">
                <Select required value={userId} onChange={(e) => setUserId(e.target.value)}>
                  <option value="">انتخاب کاربر…</option>
                  {available.map((user) => (
                    <option key={user.id} value={user.id}>
                      {displayName(user)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="نقش سازمانی">
                <Select value={role} onChange={(e) => setRole(e.target.value as RoleCode)}>
                  {roles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end gap-2">
                <Button className="flex-1" loading={add.isPending} disabled={!userId}>
                  <UserPlus size={16} />
                  افزودن
                </Button>
              </div>
              {add.isError ? (
                <p role="alert" className="md:col-span-3 text-sm text-rose-700">
                  افزودن عضو ناموفق بود.
                </p>
              ) : null}
            </form>
          ) : null}

          {members.isLoading ? (
            <div className="grid gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : members.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-900 dark:bg-rose-950/40"
            >
              <p className="text-sm text-rose-700 dark:text-rose-300">اعضا دریافت نشدند.</p>
              <Button variant="soft" className="mt-2" onClick={() => members.refetch()}>
                تلاش دوباره
              </Button>
            </div>
          ) : !filteredMembers.length ? (
            <EmptyState
              title={memberSearch ? "عضوی با این جستجو یافت نشد." : "این سازمان هنوز عضوی ندارد."}
              description={!memberSearch ? "برای شروع، اولین عضو را اضافه کنید." : undefined}
            />
          ) : (
            <ul className="grid gap-2">
              {filteredMembers.map((member) => {
                const isActive = member.status === "ACTIVE";
                return (
                  <li
                    key={member.id}
                    className="group flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${
                        isActive
                          ? "bg-brand/10 text-brand"
                          : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                      }`}
                    >
                      {displayName(member.user).slice(0, 1)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <strong className="truncate text-sm">{displayName(member.user)}</strong>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"
                              : "bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
                          }`}
                        >
                          {isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {member.roles.map((item) => roleLabels[item] || item).join("، ") ||
                          "بدون نقش"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <select
                          aria-label={`نقش ${member.user.username}`}
                          value={member.roles[0] || "ADVISOR"}
                          disabled={update.isPending}
                          onChange={(event) =>
                            update.mutate({
                              id: member.user.id,
                              roleCodes: [event.target.value as RoleCode],
                            })
                          }
                          className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pr-3 pl-7 text-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                        >
                          {roles.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={12}
                          className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>

                      <button
                        type="button"
                        title={isActive ? "تعلیق" : "فعال‌سازی"}
                        disabled={update.isPending}
                        onClick={() =>
                          isActive
                            ? void modal
                                .confirm({
                                  title: "غیرفعال‌کردن عضویت؟",
                                  description: `${displayName(member.user)} تا فعال‌سازی مجدد به داده‌های این سازمان دسترسی ندارد.`,
                                  tone: "danger",
                                  confirmLabel: "غیرفعال‌کردن",
                                  showCancel: true,
                                })
                                .then(
                                  (confirmed) =>
                                    confirmed &&
                                    update.mutate({ id: member.user.id, status: "INACTIVE" }),
                                )
                            : update.mutate({ id: member.user.id, status: "ACTIVE" })
                        }
                        className={`grid size-9 place-items-center rounded-lg border transition disabled:opacity-50 ${
                          isActive
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {isActive ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      </button>

                      <button
                        type="button"
                        title="حذف عضو"
                        disabled={remove.isPending}
                        onClick={() =>
                          void modal
                            .confirm({
                              title: "حذف عضو از سازمان؟",
                              description: `عضویت ${displayName(member.user)} حذف می‌شود؛ حساب کاربری او حذف نخواهد شد.`,
                              tone: "danger",
                              confirmLabel: "حذف عضویت",
                            })
                            .then((confirmed) => confirmed && remove.mutate(member.user.id))
                        }
                        className="grid size-9 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* ── Relationships ───────────────────────────────────────── */}
        <Card className="p-5">
          <SectionHeader
            icon={<Link2 size={18} />}
            title="ارتباط‌ها"
            description={
              pendingCount
                ? `${pendingCount} درخواست در انتظار بررسی`
                : "ارتباط بین کاربران و دانش‌آموزان"
            }
            action={
              <Button
                onClick={() =>
                  modal.open({
                    title: "ارتباط جدید",
                    description: "فقط اعضای فعال همین سازمان برای ارتباط قابل انتخاب هستند.",
                    size: "md",
                    content: (
                      <RelationshipCreateForm
                        members={members.data ?? []}
                        students={relationshipStudents.data ?? []}
                        onSubmit={(body) => createLink.mutateAsync({ ...body, organizationId })}
                      />
                    ),
                  })
                }
              >
                <Link2 size={16} />
                ارتباط جدید
              </Button>
            }
          />

          {relationships.isLoading ? (
            <div className="grid gap-2">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : relationships.isError ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-900 dark:bg-rose-950/40"
            >
              <p className="text-sm text-rose-700 dark:text-rose-300">ارتباط‌ها دریافت نشدند.</p>
              <Button variant="soft" className="mt-2" onClick={() => relationships.refetch()}>
                تلاش دوباره
              </Button>
            </div>
          ) : !relevant.length ? (
            <EmptyState
              title="درخواست ارتباطی وجود ندارد."
              description="برای ایجاد ارتباط بین کاربران و دانش‌آموزان، ارتباط جدید بسازید."
            />
          ) : (
            <ul className="grid gap-2">
              {relevant.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                      <UserRound size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
                        <strong className="truncate">{displayName(item.fromUser)}</strong>
                        <span className="text-slate-400">←</span>
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                          <GraduationCap size={13} className="text-slate-400" />
                          {item.student.name}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {relationTypeLabels[item.type] || item.type}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                            statusTones[item.status] || ""
                          }`}
                        >
                          {statusLabels[item.status] || item.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    {item.status === "PENDING" ? (
                      <>
                        <Button
                          variant="soft"
                          loading={decide.isPending}
                          onClick={() =>
                            void modal
                              .confirm({
                                title: "رد درخواست ارتباط؟",
                                description:
                                  "این درخواست رد می‌شود و برای ایجاد ارتباط، درخواست تازه‌ای لازم خواهد بود.",
                                tone: "danger",
                                confirmLabel: "رد درخواست",
                              })
                              .then(
                                (confirmed) =>
                                  confirmed && decide.mutate({ id: item.id, action: "reject" }),
                              )
                          }
                        >
                          <X size={14} />
                          رد
                        </Button>
                        <Button
                          loading={decide.isPending}
                          onClick={() => decide.mutate({ id: item.id, action: "accept" })}
                        >
                          <Check size={14} />
                          تأیید
                        </Button>
                      </>
                    ) : (
                      <>
                        {item.type === "GUARDIAN_OF" && auth.can("system.manage") ? (
                          <Button
                            variant="soft"
                            loading={guardianOverride.isPending}
                            onClick={() => guardianOverride.mutate(item.student.id)}
                          >
                            لغو محدودیت تغییر
                          </Button>
                        ) : null}
                        <Button
                          variant="danger"
                          loading={revokeLink.isPending}
                          onClick={() =>
                            void modal
                              .confirm({
                                title: "لغو ارتباط؟",
                                description: `ارتباط بین ${displayName(item.fromUser)} و ${item.student.name} لغو می‌شود.`,
                                tone: "danger",
                                confirmLabel: "لغو ارتباط",
                              })
                              .then((confirmed) => confirmed && revokeLink.mutate(item.id))
                          }
                        >
                          <Trash2 size={14} />
                          لغو ارتباط
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function RelationshipCreateForm({
  members,
  students,
  onSubmit,
}: {
  members: OrganizationMember[];
  students: RelationshipStudent[];
  onSubmit: (
    body: Omit<Parameters<typeof createRelationship>[0], "organizationId">,
  ) => Promise<unknown>;
}) {
  const [fromUserId, setFromUserId] = useState("");
  const [toStudentId, setToStudentId] = useState("");
  const [type, setType] = useState<Parameters<typeof createRelationship>[0]["type"]>("GUARDIAN_OF");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const eligibleMembers = members.filter(
    (member) => member.status === "ACTIVE" && member.roles.some((role) => role !== "STUDENT"),
  );

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
          await onSubmit({ fromUserId, toStudentId, type });
        } catch {
          setError("ایجاد ارتباط ناموفق بود.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Field label="کاربر مرتبط">
        <Select required value={fromUserId} onChange={(event) => setFromUserId(event.target.value)}>
          <option value="">انتخاب کاربر…</option>
          {eligibleMembers.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {displayName(member.user)}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="دانش‌آموز">
        <Select
          required
          value={toStudentId}
          onChange={(event) => setToStudentId(event.target.value)}
        >
          <option value="">انتخاب دانش‌آموز…</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="نوع ارتباط">
        <Select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
          <option value="GUARDIAN_OF">سرپرست</option>
          <option value="ADVISOR_OF">مشاور</option>
          <option value="TEACHER_OF">دبیر</option>
          <option value="MENTOR_OF">منتور</option>
        </Select>
      </Field>
      {error ? (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button loading={isSubmitting} disabled={!fromUserId || !toStudentId}>
          ایجاد ارتباط
        </Button>
      </div>
    </form>
  );
}
