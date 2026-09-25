import { describe, expect, it } from "vitest";
import { loginRedirectFor } from "@/lib/auth/redirects";

describe("authentication redirects", () => {
  it("does not redirect a stale invalidated session into a 2FA loop", () => {
    expect(loginRedirectFor({
      user: { id: "", organizationId: "" },
      requiresTwoFactor: true,
    })).toBeNull();
  });

  it("routes complete sessions through 2FA when required", () => {
    expect(loginRedirectFor({
      user: { id: "user-1", organizationId: "org-1" },
      requiresTwoFactor: true,
    })).toBe("/two-factor");
  });

  it("routes fully authenticated sessions to the dashboard", () => {
    expect(loginRedirectFor({
      user: { id: "user-1", organizationId: "org-1" },
      requiresTwoFactor: false,
    })).toBe("/dashboard");
  });
});
