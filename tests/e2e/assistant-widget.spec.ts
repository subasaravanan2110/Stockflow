import { expect, test } from "@playwright/test";

test("signed-in users can move and use the floating assistant", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "Seeded credentials are required");
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const launcher = page.getByRole("button", { name: /Open StockFlow assistant/ });
  const originalPosition = await launcher.boundingBox();
  expect(originalPosition).not.toBeNull();
  if (!originalPosition) return;

  await page.mouse.move(originalPosition.x + 28, originalPosition.y + 28);
  await page.mouse.down();
  await page.mouse.move(originalPosition.x - 70, originalPosition.y - 70, { steps: 5 });
  await page.mouse.up();
  const movedPosition = await launcher.boundingBox();
  expect(movedPosition?.x).not.toBe(originalPosition.x);

  await launcher.click();
  const dialog = page.getByRole("dialog", { name: "StockFlow AI assistant" });
  await expect(dialog).toBeVisible();
  const compactBox = await dialog.boundingBox();
  await page.getByRole("button", { name: "Maximize assistant" }).click();
  await expect(page.getByRole("button", { name: "Restore compact assistant" })).toBeVisible();
  const maximizedBox = await dialog.boundingBox();
  expect(maximizedBox?.width).toBeGreaterThan(compactBox?.width ?? 0);
  await page.getByRole("button", { name: "Restore compact assistant" }).click();
  await expect(page.getByRole("button", { name: "Stock health" })).toBeVisible();
  await page.getByLabel("Ask the StockFlow assistant").fill("Hello");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/Hello! I’m your StockFlow assistant/)).toBeVisible();

  await page.getByRole("button", { name: "Security & 2FA" }).click();
  await expect(page.getByText(/To enable 2FA/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Settings/ })).toHaveAttribute("href", "/dashboard/settings");
});
