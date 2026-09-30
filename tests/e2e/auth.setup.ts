import { expect, test as setup } from "@playwright/test";
import { config } from "dotenv";
import { mkdirSync } from "node:fs";

config({ path: ".env.local" });

const PUBLIC_ROUTES = ["/", "/menu", "/book", "/gallery", "/visit", "/privacy", "/terms", "/admin/login", "/this-page-does-not-exist"];
const ADMIN_ROUTES = ["/admin", "/admin/reservations", "/admin/menu", "/admin/menu/categories", "/admin/menu/modifiers", "/admin/media", "/admin/hours", "/admin/settings"];

setup("admin login + route warm-up", async ({ page }) => {
  // Compile every route once so first-hit dev compilation never eats into test timeouts.
  for (const p of PUBLIC_ROUTES) await page.goto(p);

  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "owner@restaurantina.local");
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 60_000 });
  await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
  mkdirSync("tests/.auth", { recursive: true });
  await page.context().storageState({ path: "tests/.auth/admin.json" });

  for (const p of ADMIN_ROUTES) await page.goto(p);
});
