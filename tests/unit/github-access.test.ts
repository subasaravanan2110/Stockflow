import { describe, expect, it } from "vitest";
import { isAllowedGithubEmail, parseGithubAllowedDomains } from "@/lib/auth/github-access";

describe("GitHub company access", () => {
  it("parses and normalizes the configured domains", () => {
    expect(parseGithubAllowedDomains(" @StockFlow.com, engineering.stockflow.com,stockflow.com "))
      .toEqual(["stockflow.com", "engineering.stockflow.com"]);
  });

  it("accepts only exact allowed email domains", () => {
    const domains = ["stockflow.com"];
    expect(isAllowedGithubEmail("suba@stockflow.com", domains)).toBe(true);
    expect(isAllowedGithubEmail("suba@evilstockflow.com", domains)).toBe(false);
    expect(isAllowedGithubEmail("suba@engineering.stockflow.com", domains)).toBe(false);
    expect(isAllowedGithubEmail("invalid-email", domains)).toBe(false);
  });

  it("allows any valid verified-email shape when demo restrictions are not configured", () => {
    expect(parseGithubAllowedDomains("")).toEqual([]);
    expect(isAllowedGithubEmail("reviewer@gmail.com", [])).toBe(true);
    expect(isAllowedGithubEmail("invalid-email", [])).toBe(false);
  });
});
