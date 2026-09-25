type OpenAIErrorLike = {
  status?: number;
  code?: string | null;
  type?: string | null;
};

export function openAiFallbackNotice(error: unknown) {
  const candidate = typeof error === "object" && error !== null ? error as OpenAIErrorLike : {};
  if (candidate.code === "credit_balance_exhausted" || candidate.type === "insufficient_quota") {
    return "AI enhancement is unavailable because the API project has no remaining credits. Showing the verified StockFlow answer.";
  }
  if (candidate.status === 401) {
    return "AI enhancement is unavailable because its server API key is invalid. Showing the verified StockFlow answer.";
  }
  if (candidate.status === 429) {
    return "AI enhancement is busy or rate-limited. Showing the verified StockFlow answer.";
  }
  return "AI enhancement is temporarily unavailable. Showing the verified StockFlow answer.";
}

export function safeOpenAiErrorDetails(error: unknown) {
  const candidate = typeof error === "object" && error !== null ? error as OpenAIErrorLike : {};
  return {
    status: candidate.status ?? null,
    code: candidate.code ?? null,
    type: candidate.type ?? null,
  };
}
