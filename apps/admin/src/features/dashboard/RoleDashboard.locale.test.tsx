import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";
import { RoleDashboard } from "./components/RoleDashboard";

vi.mock("../auth", () => ({
  useAuth: () => ({ activeRole: "ADVISOR", capabilities: [], can: () => false }),
}));

describe("RoleDashboard localization", () => {
  afterEach(() => window.localStorage.clear());

  it("renders the active English role workspace in LTR", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
        <RoleDashboard
          data={{
            context: "ADVISOR",
            generatedAt: "2026-01-01T00:00:00.000Z",
            assignedStudents: 2,
            unreadConversations: 1,
          }}
          loading={false}
          error={false}
          refreshing={false}
          attention={[]}
          attentionLoading={false}
          attentionError={false}
          onRefresh={vi.fn()}
          onRetry={vi.fn()}
          onRetryAttention={vi.fn()}
        />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "Advisor workspace" })).toBeVisible();
    expect(screen.getByText("Assigned students")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
