import { describe, expect, it } from "vitest";
import { decryptCredential, encryptCredential } from "@/lib/crypto";

describe("credential encryption", () => {
  it("round-trips a two-factor secret without storing plaintext", () => {
    process.env.AUTH_SECRET = "unit-test-secret-with-more-than-32-characters";
    const plaintext = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptCredential(plaintext);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptCredential(encrypted)).toBe(plaintext);
  });

  it("rejects a tampered encrypted credential", () => {
    process.env.AUTH_SECRET = "unit-test-secret-with-more-than-32-characters";
    const encrypted = encryptCredential("JBSWY3DPEHPK3PXP");
    const parts = encrypted.split(".");
    parts[3] = `${parts[3].startsWith("A") ? "B" : "A"}${parts[3].slice(1)}`;
    expect(() => decryptCredential(parts.join("."))).toThrow();
  });
});
