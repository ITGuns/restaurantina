// Fails if any page logs a console error or throws, with and without prefers-reduced-motion.
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
let bad = 0;
for (const reducedMotion of ["no-preference", "reduce"]) {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion });
  const page = await ctx.newPage();
  const issues = [];
  page.on("pageerror", (e) => issues.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on("console", (m) => { if (m.type() === "error") issues.push(`console: ${m.text().slice(0, 200)}`); });
  for (const r of ["/", "/menu", "/book", "/gallery", "/visit"]) {
    await page.goto(`http://localhost:3200${r}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
  }
  console.log(`reducedMotion=${reducedMotion}: ${issues.length ? issues.join("\n  ") : "clean"}`);
  bad += issues.length;
  await ctx.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
