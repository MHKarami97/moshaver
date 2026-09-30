import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminList } from "./admin-list";

describe("AdminList", () => {
  it("uses one shared loading, error and empty-state contract", () => {
    const retry = vi.fn();
    const { rerender } = render(
      <AdminList items={[]} label="آزمون‌ها">
        {() => null}
      </AdminList>,
    );
    expect(screen.getByText("آزمون‌ها برای نمایش وجود ندارد.")).toBeInTheDocument();
    rerender(
      <AdminList items={[]} label="آزمون‌ها" error onRetry={retry}>
        {() => null}
      </AdminList>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("دریافت آزمون‌ها ناموفق بود.");
    rerender(
      <AdminList items={[]} label="آزمون‌ها" loading>
        {() => null}
      </AdminList>,
    );
    expect(screen.getByText("در حال دریافت آزمون‌ها…")).toBeInTheDocument();
  });

  it("renders a feature-owned collection when data is available", () => {
    render(
      <AdminList items={["الف"]} label="نمونه">
        {(items) => <p>{items.join("، ")}</p>}
      </AdminList>,
    );
    expect(screen.getByText("الف")).toBeInTheDocument();
  });
});
