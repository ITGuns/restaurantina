import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("seo, security and accessibility", () => {
  test("robots, sitemap and 404", async ({ page, request }) => {
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /admin");
    const sitemap = await request.get("/sitemap.xml");
    const xml = await sitemap.text();
    for (const p of ["/menu", "/book", "/gallery", "/visit", "/privacy", "/terms"]) expect(xml).toContain(p);
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /isn't on the menu/ })).toBeVisible();
  });

  test("admin routes redirect to login without a session and uploads reject junk", async ({ page, request }) => {
    await page.goto("/admin/menu");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fmenu/);
    const res = await request.get("/uploads/../../etc/passwd");
    expect([404, 400]).toContain(res.status());
    const headers = (await request.get("/")).headers();
    expect(headers["content-security-policy"]).toContain("default-src 'self'");
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("gallery lightbox opens, navigates with keys and closes", async ({ page }) => {
    await page.goto("/gallery");
    await page.getByRole("tabpanel").getByRole("button").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/1 \/ 3/)).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText(/2 \/ 3/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("legal pages and visit page render", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: "Terms of Service" })).toBeVisible();
    await page.goto("/visit");
    await expect(page.getByText("12115 Montwood Dr Ste 201B").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Call Us" })).toHaveAttribute("href", "tel:+19152598774");
  });

  for (const path of ["/", "/menu", "/book", "/gallery", "/visit"]) {
    test(`axe: no serious accessibility violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const results = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
