import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AttentionCard, attentionStatusLabels, formatAttentionDueDate } from "./AttentionPage";

describe("AttentionPage queue metadata", () => {
  it("keeps the server-provided open status visible in Persian", () => {
    expect(attentionStatusLabels.open).toBe("باز");
  });

  it("renders the operational status beside the owner and due date", () => {
    render(
      <MemoryRouter>
        <AttentionCard
          item={{
            id: "sync:1",
            type: "sync_failure",
            title: "همگام‌سازی ناموفق",
            description: "نیازمند بررسی",
            priority: "urgent",
            owner: { id: "advisor-1", label: "مشاور" },
            dueAt: "2026-10-01",
            status: "open",
            deepLink: "/admin/communication/live",
            createdAt: "2026-10-01T10:00:00.000Z",
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("وضعیت")).toBeInTheDocument();
    expect(screen.getByText("باز")).toBeInTheDocument();
    expect(screen.getByText("مشاور")).toBeInTheDocument();
    expect(screen.getByText(formatAttentionDueDate("2026-10-01"))).toBeInTheDocument();
    expect(screen.queryByText("2026-10-01")).not.toBeInTheDocument();
  });
});
