import { describe, expect, it } from "vitest";
import { requiresTwoFactorForSession } from "@/lib/auth/two-factor-policy";

describe("two-factor sign-in policy", () => {
  it("requires 2FA for every unverified GitHub session", () => {
    expect(requiresTwoFactorForSession({
      provider: "github",
      twoFactorEnabled: false,
      sessionVerified: false,
    })).toBe(true);
  });

  it("allows a GitHub session after its authenticator challenge", () => {
    expect(requiresTwoFactorForSession({
      provider: "github",
      twoFactorEnabled: true,
      sessionVerified: true,
    })).toBe(false);
  });

  it("keeps authenticator enrollment optional for credential users", () => {
    expect(requiresTwoFactorForSession({
      provider: "credentials",
      twoFactorEnabled: false,
      sessionVerified: false,
    })).toBe(false);
    expect(requiresTwoFactorForSession({
      provider: "credentials",
      twoFactorEnabled: true,
      sessionVerified: false,
    })).toBe(true);
  });
});
