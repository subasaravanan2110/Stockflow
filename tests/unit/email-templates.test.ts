import { describe, expect, it } from "vitest";
import { passwordResetEmail, staffInvitationEmail } from "@/lib/email-templates";

describe("email templates", () => {
  it("builds a branded staff invitation and escapes organization content", () => {
    const email = staffInvitationEmail({
      organizationName: "Northstar <script>alert(1)</script>",
      inviterName: "StockFlow Administrator",
      invitationUrl: "https://stockflow.example/signup?token=safe-token",
    });

    expect(email.subject).toContain("Northstar");
    expect(email.html).toContain("StockFlow");
    expect(email.html).toContain("Create staff account");
    expect(email.html).toContain("Northstar &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(email.html).not.toContain("<script>alert(1)</script>");
    expect(email.text).toContain("https://stockflow.example/signup?token=safe-token");
  });

  it("builds a password reset with expiry and security guidance", () => {
    const email = passwordResetEmail({
      name: "Subavarsha",
      resetUrl: "https://stockflow.example/reset-password?token=safe-token",
    });

    expect(email.subject).toBe("Reset your StockFlow password");
    expect(email.html).toContain("Reset password");
    expect(email.html).toContain("expires in 30 minutes");
    expect(email.text).toContain("used only once");
  });
});
