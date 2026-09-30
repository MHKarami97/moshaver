import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanForm } from "./PlannerForms";
import { LocaleProvider } from "../../../shared/ui/locale";

afterEach(cleanup);

const emptyDay = {
  planDate: "2026-09-26",
  title: "",
  dayLabel: "",
  persianDate: "",
  jalaliId: "",
  motivationText: "",
  published: false,
};

describe("PlanForm empty-day setup", () => {
  it("offers a Persian study starter and submits its editable values", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<LocaleProvider><PlanForm initial={emptyDay} lockDate busy={false} onSubmit={submit} onCancel={vi.fn()} /></LocaleProvider>);

    await user.click(screen.getByRole("button", { name: "شروع روز مطالعه" }));
    expect(screen.getByDisplayValue("برنامه مطالعاتی امروز")).toBeTruthy();
    expect(screen.getByDisplayValue("روز مطالعه")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "ذخیره" }));

    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      title: "برنامه مطالعاتی امروز",
      dayLabel: "روز مطالعه",
      published: false,
    }));
  });

  it("offers a separate review starter", async () => {
    const user = userEvent.setup();
    render(<LocaleProvider><PlanForm initial={emptyDay} lockDate busy={false} onSubmit={vi.fn()} onCancel={vi.fn()} /></LocaleProvider>);
    await user.click(screen.getByRole("button", { name: "روز مرور" }));
    expect(screen.getByDisplayValue("مرور و جمع‌بندی امروز")).toBeTruthy();
    expect(screen.getByDisplayValue("روز مرور")).toBeTruthy();
  });
});
