import { DashboardService } from "../src/modules/dashboard/dashboard.service";

const advisor = {
  id: "advisor-1",
  username: "advisor",
  role: "ADVISOR",
  roles: ["ADVISOR"],
  capabilities: ["recovery_requests.read"],
  sessionId: "session-1",
};

describe("DashboardService attentionQueue", () => {
  it("only returns student work that passes the existing source capability and student scope", async () => {
    const db = {
      query: jest.fn().mockResolvedValue([
        {
          id: "recovery-1",
          studentId: "student-allowed",
          studentName: "دانش‌آموز مجاز",
          createdAt: "2026-10-01T08:00:00.000Z",
          planDate: "2026-10-01",
          message: "نیاز به بازیابی",
        },
        {
          id: "recovery-2",
          studentId: "student-forbidden",
          studentName: "دانش‌آموز غیرمجاز",
          createdAt: "2026-10-01T09:00:00.000Z",
          planDate: "2026-10-01",
          message: "نباید نمایش داده شود",
        },
      ]),
    };
    const authorization = {
      hasCapability: jest.fn(
        (_: unknown, capability: string) =>
          capability === "recovery_requests.read",
      ),
      canAccessStudent: jest.fn(
        (_: unknown, studentId: string) => studentId === "student-allowed",
      ),
    };
    const service = new DashboardService(db as never, authorization as never);

    const queue = await service.attentionQueue(advisor, 20);

    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      id: "recovery:recovery-1",
      type: "recovery",
      descriptionKind: "user",
      status: "open",
      student: { id: "student-allowed" },
      deepLink: "/admin/follow-up",
    });
    expect(authorization.canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      "student-forbidden",
      "recovery_requests.read",
    );
  });
});
