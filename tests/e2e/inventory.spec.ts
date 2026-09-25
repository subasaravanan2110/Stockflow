import { expect, test } from "@playwright/test";

test("admin signs in and records a stock movement", async ({ page }) => {
  test.skip(!process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD, "Seeded credentials are required");
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("Inventory value")).toBeVisible();

  await page.goto("/dashboard/inventory");
  await page.getByLabel("Product").selectOption({ index: 1 });
  await page.getByLabel("Movement").selectOption("STOCK_IN");
  await page.getByRole("spinbutton", { name: "Quantity", exact: true }).fill("1");
  await page.getByLabel("Reason").fill("Playwright verification receipt");
  await page.getByRole("button", { name: "Record movement" }).click();
  await expect(page.getByText("Stock movement recorded.")).toBeVisible();
});
