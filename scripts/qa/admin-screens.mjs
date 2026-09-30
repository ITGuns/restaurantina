import { chromium } from "@playwright/test";
import { config } from "dotenv";
import { mkdirSync } from "node:fs";
config({ path: ".env.local" });
mkdirSync("data/qa-screens/admin", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3200/admin/login", { waitUntil: "networkidle" });
await page.screenshot({ path: "data/qa-screens/admin/login.png" });
await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL);
await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD);
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/\/admin$/, { timeout: 60000 });
for (const r of ["/admin", "/admin/reservations", "/admin/reservations?view=calendar", "/admin/menu", "/admin/menu/categories", "/admin/menu/modifiers", "/admin/media", "/admin/hours", "/admin/settings"]) {
  await page.goto(`http://localhost:3200${r}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const name = r.replace(/^\/admin\/?/, "") .replace(/\W+/g, "-").replace(/^-|-$/g, "") || "dashboard";
  await page.screenshot({ path: `data/qa-screens/admin/${name}.png`, fullPage: true });
  console.log(name, await page.evaluate(() => document.body.scrollHeight));
}
if (errors.length) console.log("PAGE ERRORS:", errors);
await browser.close();
