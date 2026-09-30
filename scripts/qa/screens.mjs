import { chromium } from "@playwright/test";
import { config } from "dotenv";
import { mkdirSync } from "node:fs";
config({ path: ".env.local" });
mkdirSync("data/qa-screens", { recursive: true });
const browser = await chromium.launch();
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ["/", "/menu", "/book", "/gallery", "/visit"];
for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: width > 500 ? 900 : 844 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const r of routes) {
    await page.goto(`http://localhost:3200${r}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    // scroll through to trigger lazy content, then back to top
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(600);
    const name = (r === "/" ? "home" : r.replace(/\W+/g, "-").replace(/^-|-$/g, "")) + `-${width}.png`;
    await page.screenshot({ path: `data/qa-screens/${name}`, fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`${name} height=${await page.evaluate(() => document.body.scrollHeight)} overflowX=${overflow}`);
  }
  if (errors.length) console.log("PAGE ERRORS:", errors);
  await ctx.close();
}
await browser.close();
