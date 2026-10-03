import { Badge, Select } from "../../../shared/ui/ui";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import type { LearningFilter } from "../model/learning.types";

export function LearningFilters({
  search,
  filter,
  resultCount,
  onSearchChange,
  onFilterChange,
}: {
  search: string;
  filter: LearningFilter;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: LearningFilter) => void;
}) {
  return (
    <div className="mb-3">
      <CollectionToolbar
        search={search}
        onSearchChange={onSearchChange}
        placeholder="جستجو در عنوان، درس، کتاب یا مبحث"
        onClear={search ? () => onSearchChange("") : undefined}
        filters={
          <Select
            className="h-8 min-w-32 border-0 bg-transparent px-2 text-xs shadow-none"
            aria-label="فیلتر منابع یادگیری"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as LearningFilter)}
          >
            <option value="all">همه موارد</option>
            <option value="due">سررسیدشده</option>
            <option value="pending">در انتظار</option>
            <option value="done">تکمیل‌شده</option>
            <option value="archived">بایگانی</option>
          </Select>
        }
        resultLabel={<Badge tone={resultCount ? "blue" : "neutral"}>{resultCount.toLocaleString("fa-IR")} نتیجه</Badge>}
      />
    </div>
  );
}
