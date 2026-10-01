import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { WorkContextBar } from "./work-context-bar";

describe("WorkContextBar", () => {
  it("exposes the active role and organization from the Admin header", () => {
    render(<WorkContextBar role="مشاور" organization="آکادمی راه روشن" multipleRoles />);

    const context = screen.getByLabelText("زمینه کاری فعال");
    expect(context).toHaveTextContent("مشاور");
    expect(context).toHaveTextContent("آکادمی راه روشن");
    expect(context).toHaveTextContent("برای تغییر نقش از منوی حساب استفاده کنید.");
  });

  it("links the active student context back to the student workspace", () => {
    render(
      <MemoryRouter>
        <WorkContextBar role="مشاور" studentId="student 1" showStudent />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "بازگشت به پرونده دانش‌آموز فعال" })).toHaveAttribute(
      "href",
      "/admin/students?studentId=student%201",
    );
  });
});
