import { describe, expect, it } from "vitest";
import { openAiFallbackNotice, safeOpenAiErrorDetails } from "@/lib/assistant/openai-error";

describe("OpenAI assistant errors", () => {
  it("explains exhausted API credits without exposing secrets", () => {
    const error = { status: 429, code: "credit_balance_exhausted", type: "insufficient_quota" };
    expect(openAiFallbackNotice(error)).toContain("no remaining credits");
    expect(safeOpenAiErrorDetails(error)).toEqual(error);
  });

  it("uses a safe generic message for unexpected errors", () => {
    expect(openAiFallbackNotice(new Error("internal details"))).toBe(
      "AI enhancement is temporarily unavailable. Showing the verified StockFlow answer.",
    );
  });
});
