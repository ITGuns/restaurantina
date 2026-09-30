import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const routes = ["/", "/menu", "/book", "/gallery", "/visit"];
const rows = [];
for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const r of routes) {
    await page.goto(`http://localhost:3200${r}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 900) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const offenders = overflow > 0 ? await page.evaluate(() => [...document.querySelectorAll("body *")].filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1 && getComputedStyle(el).position !== "fixed").slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 3).join(".")}`)) : [];
    rows.push(`${String(width).padStart(4)} ${r.padEnd(9)} overflow=${overflow}${offenders.length ? " " + offenders.join(" | ") : ""}`);
  }
  if (errors.length) rows.push(`${width} PAGE ERRORS: ${errors.join("; ")}`);
  await ctx.close();
}
await browser.close();
console.log(rows.join("\n"));
