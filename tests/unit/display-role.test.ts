import { describe, expect, it } from "vitest";
import { getDisplayRole } from "@/lib/auth/display-role";

describe("getDisplayRole", () => {
  it("always presents administrators as Administrator", () => {
    expect(getDisplayRole("ADMIN", "github")).toBe("Administrator");
  });

  it("presents GitHub-authenticated non-admin users as Developer", () => {
    expect(getDisplayRole("STAFF", "github")).toBe("Developer");
    expect(getDisplayRole("STAFF", ["credentials", "github"])).toBe("Developer");
  });

  it("presents other non-admin users as Staff", () => {
    expect(getDisplayRole("STAFF", "credentials")).toBe("Staff");
    expect(getDisplayRole("STAFF", undefined)).toBe("Staff");
  });
});
