import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findResetToken: vi.fn(),
  updateUser: vi.fn(),
  deleteActiveSessions: vi.fn(),
  updateResetToken: vi.fn(),
  transaction: vi.fn(),
  hashPassword: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));
vi.mock("@/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("argon2", () => ({ hash: mocks.hashPassword }));
vi.mock("@/lib/crypto", () => ({
  createToken: vi.fn(),
  hashToken: vi.fn(() => "hashed-reset-token"),
}));
vi.mock("@/lib/mail", () => ({ sendMail: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    passwordResetToken: {
      findFirst: mocks.findResetToken,
      update: mocks.updateResetToken,
    },
    user: { update: mocks.updateUser },
    activeSession: { deleteMany: mocks.deleteActiveSessions },
    $transaction: mocks.transaction,
  },
}));

import { resetPasswordAction } from "@/app/actions/auth";
import { initialActionState } from "@/lib/action-state";

describe("password reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findResetToken.mockResolvedValue({ id: "reset-1", email: "staff@example.com" });
    mocks.hashPassword.mockResolvedValue("new-password-hash");
    mocks.updateUser.mockReturnValue(Promise.resolve({}));
    mocks.deleteActiveSessions.mockReturnValue(Promise.resolve({ count: 2 }));
    mocks.updateResetToken.mockReturnValue(Promise.resolve({}));
    mocks.transaction.mockResolvedValue([]);
  });

  it("updates the password, verifies the email, and consumes the token atomically", async () => {
    const formData = new FormData();
    formData.set("token", "valid-reset-token-that-is-long-enough");
    formData.set("password", "New@12");
    formData.set("confirmPassword", "New@12");

    const result = await resetPasswordAction(initialActionState, formData);

    expect(result).toEqual({ status: "success", message: "Password updated. You can now sign in." });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { email: "staff@example.com" },
      data: {
        passwordHash: "new-password-hash",
        emailVerified: expect.any(Date),
        sessionVersion: { increment: 1 },
      },
    });
    expect(mocks.updateResetToken).toHaveBeenCalledWith({
      where: { id: "reset-1" },
      data: { usedAt: expect.any(Date) },
    });
    expect(mocks.deleteActiveSessions).toHaveBeenCalledWith({
      where: { user: { email: "staff@example.com" } },
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
  });
});
