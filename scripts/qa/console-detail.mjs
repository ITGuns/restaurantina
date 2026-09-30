import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
let current = "";
page.on("console", (m) => { if (m.type() === "error") { const t = m.text(); const lines = t.split("\n").filter((l) => /^[+-]\s|<\w|\.\.\./.test(l)).slice(0, 40).join("\n"); console.log(`--- ${current}\n${lines}`); } });
for (const r of ["/", "/menu", "/book", "/gallery", "/visit"]) { current = r; await page.goto(`http://localhost:3200${r}`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200); }
await browser.close();
