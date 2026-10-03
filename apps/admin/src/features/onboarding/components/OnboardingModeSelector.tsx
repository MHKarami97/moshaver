import { SlidersHorizontal, WandSparkles } from "lucide-react";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import type { OnboardingMode } from "../types/onboarding.types";

export function OnboardingModeSelector({
  value,
  onChange,
}: {
  value: OnboardingMode;
  onChange: (mode: OnboardingMode) => void;
}) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={onChange}
      ariaLabel="روش تخصیص دانش‌آموز"
      className="w-full"
      options={[
        {
          value: "AUTO",
          label: (
            <span className="inline-flex items-center gap-2">
              <WandSparkles size={15} aria-hidden="true" />
              تخصیص خودکار
            </span>
          ),
          title: "انتخاب سازمان و مشاور با ظرفیت مناسب",
        },
        {
          value: "MANUAL",
          label: (
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={15} aria-hidden="true" />
              انتخاب دستی
            </span>
          ),
          title: "انتخاب دقیق سازمان و مشاور برای هر دانش‌آموز",
        },
      ] as const}
    />
  );
}
