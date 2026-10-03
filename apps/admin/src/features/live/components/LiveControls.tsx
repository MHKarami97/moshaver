import { fa } from "../../../shared/lib/utils";
import { Card, Select } from "../../../shared/ui/ui";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import type { LiveFilter, LivePanel } from "../model/live.types";

export function LiveControls({
  search,
  filter,
  panel,
  visibleCount,
  totalCount,
  onSearchChange,
  onFilterChange,
  onPanelChange,
}: {
  search: string;
  filter: LiveFilter;
  panel: LivePanel;
  visibleCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: LiveFilter) => void;
  onPanelChange: (value: LivePanel) => void;
}) {
  return (
    <Card className="shrink-0 p-2">
      <CollectionToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel="جستجوی دانش‌آموز"
        placeholder="نام، پایه، رشته یا صفحه فعلی…"
        onClear={search ? () => onSearchChange("") : undefined}
        resultLabel={`نمایش ${fa(visibleCount)} از ${fa(totalCount)}`}
        filters={
          <Select
            className="h-8 min-w-36 border-0 bg-transparent px-2 text-xs shadow-none"
            aria-label="فیلتر وضعیت"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as LiveFilter)}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="online">آنلاین</option>
            <option value="studying">در حال مطالعه</option>
            <option value="paused">متوقف</option>
            <option value="taking_exam">در حال آزمون</option>
            <option value="attention">نیازمند توجه</option>
            <option value="offline">آفلاین</option>
          </Select>
        }
        actions={
          <SegmentedControl
            className="lg:hidden"
            ariaLabel="پنل زنده"
            value={panel}
            onValueChange={onPanelChange}
            options={[
              { value: "students", label: "فهرست" },
              { value: "details", label: "جزئیات" },
              { value: "timeline", label: "رویدادها" },
            ]}
          />
        }
      />
    </Card>
  );
}
