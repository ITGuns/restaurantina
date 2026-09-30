import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
mkdirSync("data/qa-screens/sections", { recursive: true });
const browser = await chromium.launch();
const width = Number(process.argv[2] ?? 1440);
const route = process.argv[3] ?? "/";
const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 900 : 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(`http://localhost:3200${route}`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } window.scrollTo(0, 0); });
await page.waitForTimeout(1500);
const sections = page.locator("main > div > section, main > div > div, main > section");
const n = await sections.count();
const slug = route === "/" ? "home" : route.replace(/\W+/g, "-").replace(/^-|-$/g, "");
for (let i = 0; i < n; i++) {
  const el = sections.nth(i);
  const box = await el.boundingBox();
  if (!box || box.height < 40) continue;
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await el.screenshot({ path: `data/qa-screens/sections/${slug}-${width}-${String(i).padStart(2, "0")}.png` });
  console.log(`${slug}-${width}-${i}: ${Math.round(box.width)}x${Math.round(box.height)}`);
}
await browser.close();
