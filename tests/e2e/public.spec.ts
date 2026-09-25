import { expect, test } from "@playwright/test";

test("landing page explains the product and reaches authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /know what you have/i })).toBeVisible();
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: /sign in to stockflow/i })).toBeVisible();
});

test("signup requires an administrator invitation", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Invitation required" })).toBeVisible();
  await expect(page.getByText(/only be created from an invitation/i)).toBeVisible();
  await expect(page.getByLabel("Business name")).toHaveCount(0);
});

test("StockFlow branding appears in the page title", async ({ page }) => {
  await page.goto("/signup");
  await expect(page).toHaveTitle(/Create staff account.*StockFlow/);
});
