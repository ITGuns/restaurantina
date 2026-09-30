import { expect, test } from "@playwright/test";

test.describe("mobile", () => {
  test("hamburger navigation, sticky reserve bar and swipeable menu categories", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Reserve a Table" }).last()).toBeVisible(); // sticky bar
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: "Mobile" });
    await expect(nav.getByRole("link", { name: "Menu" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(nav).toHaveCount(0);

    await page.goto("/menu");
    const tabs = page.getByRole("tablist").first();
    await expect(tabs.getByRole("tab", { name: "Postres" })).toBeAttached();
    await tabs.getByRole("tab", { name: "Bebidas" }).click();
    await expect(page.getByRole("button", { name: /Café de la olla/ })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(width).toBe(true);
  });
});
