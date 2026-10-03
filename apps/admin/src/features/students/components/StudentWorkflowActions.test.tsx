import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { StudentWorkflowActions } from "./StudentWorkflowActions";

describe("StudentWorkflowActions", () => {
  it("explains the next student-specific workspace and preserves student context in each link", () => {
    render(
      <MemoryRouter>
        <StudentWorkflowActions
          studentId="student-1"
          capabilities={["plans.read", "learning.read", "reports.read"]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "ادامه کار با این دانش‌آموز" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /برنامه‌ریزی/ })).toHaveAttribute(
      "href",
      "/admin/planner?studentId=student-1",
    );
    expect(screen.getByRole("link", { name: /گزارش پیشرفت/ })).toHaveAttribute(
      "href",
      "/admin/reports?studentId=student-1",
    );
    expect(screen.queryByRole("link", { name: /آزمون‌ها/ })).not.toBeInTheDocument();
  });
});
