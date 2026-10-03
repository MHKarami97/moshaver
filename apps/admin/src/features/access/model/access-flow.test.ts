import { describe, expect, it } from "vitest";
import { accessFlowGuidance, emptyAccessResult } from "./access-flow";

describe("access flow guidance", () => {
  it("explains the read-only boundary without implying authorization", () => {
    expect(accessFlowGuidance("users", false)).toMatchObject({
      title: "دسترسی مشاهده کاربران",
      description: expect.stringContaining("مجوز مدیریت کاربران"),
    });
  });

  it("gives a recovery path when a filtered collection is empty", () => {
    expect(emptyAccessResult("organizations", true)).toContain("جستجو را پاک");
  });

  it("keeps the destructive impact visible to organization managers", () => {
    expect(accessFlowGuidance("organizations", true).description).toContain("دسترسی اعضا را متوقف");
  });
});
