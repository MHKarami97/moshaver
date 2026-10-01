import type { PortalOrganization } from "../../access/api/access.api";
import { Button, EmptyState } from "../../../shared/ui/ui";

export function TemplateOrganizationPicker({
  organizations,
  onSelect,
  onClose,
}: {
  organizations: PortalOrganization[];
  onSelect: (organizationId: string) => void;
  onClose?: () => void;
}) {
  if (!organizations.length)
    return (
      <div className="grid gap-4">
        <EmptyState title="سازمانی برای الگوها وجود ندارد" />
        {onClose ? (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              بستن
            </Button>
          </div>
        ) : null}
      </div>
    );

  return (
    <div className="grid gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        الگوهای برنامه متعلق به یک سازمان هستند. سازمان موردنظر را انتخاب کنید.
      </p>
      <div className="grid max-h-80 gap-2 overflow-y-auto">
        {organizations.map((organization) => (
          <Button
            key={organization.id}
            variant="soft"
            className="justify-between"
            onClick={() => onSelect(organization.id)}
          >
            <span>{organization.name}</span>
            <span className="text-xs text-slate-500">{organization.type}</span>
          </Button>
        ))}
      </div>
      {onClose ? (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            انصراف
          </Button>
        </div>
      ) : null}
    </div>
  );
}
