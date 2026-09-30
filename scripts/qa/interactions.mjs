import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
mkdirSync("data/qa-screens/flows", { recursive: true });
const browser = await chromium.launch();
const shot = async (page, name) => page.screenshot({ path: `data/qa-screens/flows/${name}.png` });
for (const [label, vp] of [["desk", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: label === "mobile", hasTouch: label === "mobile" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:3200/menu", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await shot(page, `menu-top-${label}`);
  await page.getByRole("tab", { name: "Comida" }).click();
  await page.waitForTimeout(900);
  await shot(page, `menu-comida-${label}`);
  await page.getByRole("button", { name: /^No Manches/ }).first().click();
  await page.waitForTimeout(800);
  await shot(page, `menu-modal-${label}`);
  await page.keyboard.press("Escape");
  await page.getByRole("searchbox", { name: "Search the menu" }).fill("chile");
  await page.waitForTimeout(900);
  await shot(page, `menu-search-${label}`);

  await page.goto("http://localhost:3200/book", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, `book-step1-${label}`);
  await page.getByRole("button", { name: /Saturday/ }).first().click();
  await page.waitForTimeout(700);
  await shot(page, `book-step2-${label}`);
  await page.getByRole("button", { name: "2 guests", exact: true }).click();
  await page.waitForTimeout(1500);
  await shot(page, `book-step3-${label}`);
  await page.getByRole("button", { name: "12:00 PM", exact: true }).click();
  await page.waitForTimeout(700);
  await shot(page, `book-step4-${label}`);

  await page.goto("http://localhost:3200/gallery", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await shot(page, `gallery-${label}`);
  await page.getByRole("tabpanel").getByRole("button").first().click();
  await page.waitForTimeout(800);
  await shot(page, `gallery-lightbox-${label}`);

  if (label === "mobile") {
    await page.goto("http://localhost:3200/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, `home-hero-mobile`);
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(600);
    await shot(page, `home-mobile-nav`);
  }
  if (errors.length) console.log(label, "PAGE ERRORS:", errors);
  await ctx.close();
}
await browser.close();
console.log("done");
