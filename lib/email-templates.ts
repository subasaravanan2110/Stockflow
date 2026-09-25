type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function emailLayout({
  preview,
  eyebrow,
  title,
  message,
  actionLabel,
  actionUrl,
  notice,
}: {
  preview: string;
  eyebrow: string;
  title: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  notice: string;
}) {
  const safePreview = escapeHtml(preview);
  const safeEyebrow = escapeHtml(eyebrow);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeNotice = escapeHtml(notice);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;background:#f3f6f3;color:#17211b;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreview}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6f3;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
            <tr>
              <td style="padding:0 4px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="center" style="width:44px;height:44px;border-radius:12px;background:#176b45;color:#ffffff;font-size:16px;font-weight:800;">SF</td>
                    <td style="padding-left:12px;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Stock<span style="color:#176b45;">Flow</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border:1px solid #dfe5df;border-radius:16px;background:#ffffff;padding:40px;box-shadow:0 2px 8px rgba(23,33,27,0.05);">
                <p style="margin:0 0 12px;color:#176b45;font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">${safeEyebrow}</p>
                <h1 style="margin:0;color:#17211b;font-size:30px;line-height:1.25;letter-spacing:-0.6px;">${safeTitle}</h1>
                <p style="margin:18px 0 0;color:#526057;font-size:16px;line-height:1.7;">${safeMessage}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
                  <tr>
                    <td style="border-radius:10px;background:#176b45;">
                      <a href="${safeActionUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${safeActionLabel}</a>
                    </td>
                  </tr>
                </table>
                <div style="border-left:4px solid #dfff7a;border-radius:8px;background:#f5fbe7;padding:14px 16px;color:#425047;font-size:14px;line-height:1.55;">${safeNotice}</div>
                <p style="margin:24px 0 8px;color:#68736c;font-size:12px;line-height:1.5;">If the button does not work, copy and paste this secure link into your browser:</p>
                <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.5;"><a href="${safeActionUrl}" style="color:#176b45;text-decoration:underline;">${safeActionUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px 16px 0;color:#7b867e;font-size:12px;line-height:1.6;">
                <p style="margin:0;">StockFlow · Secure inventory operations</p>
                <p style="margin:4px 0 0;">This is an automated security email. Please do not reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function staffInvitationEmail({
  organizationName,
  inviterName,
  invitationUrl,
}: {
  organizationName: string;
  inviterName: string;
  invitationUrl: string;
}): EmailContent {
  const subject = `You’re invited to ${organizationName} on StockFlow`;
  return {
    subject,
    html: emailLayout({
      preview: `${inviterName} invited you to join ${organizationName} on StockFlow.`,
      eyebrow: "Staff invitation",
      title: `Join ${organizationName}`,
      message: `${inviterName} invited you to join their StockFlow inventory team. Create your staff account to begin monitoring products and recording authorized stock movements.`,
      actionLabel: "Create staff account",
      actionUrl: invitationUrl,
      notice: "This invitation expires in 24 hours and can be used only once. If you were not expecting it, you can safely ignore this email.",
    }),
    text: `${inviterName} invited you to join ${organizationName} on StockFlow. Create your staff account: ${invitationUrl}\n\nThis invitation expires in 24 hours and can be used only once.`,
  };
}

export function passwordResetEmail({ name, resetUrl }: { name: string; resetUrl: string }): EmailContent {
  const subject = "Reset your StockFlow password";
  return {
    subject,
    html: emailLayout({
      preview: "Use this secure link to reset your StockFlow password.",
      eyebrow: "Account security",
      title: "Reset your password",
      message: `Hello ${name}, we received a request to reset the password for your StockFlow account. Use the secure button below to choose a new password.`,
      actionLabel: "Reset password",
      actionUrl: resetUrl,
      notice: "This link expires in 30 minutes and can be used only once. If you did not request a password reset, no action is required.",
    }),
    text: `Hello ${name}, reset your StockFlow password: ${resetUrl}\n\nThis link expires in 30 minutes and can be used only once. If you did not request it, ignore this email.`,
  };
}
