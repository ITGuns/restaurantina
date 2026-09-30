import { expect, test } from "@playwright/test";

/** Runs last: signing out bumps the server-side token version, which invalidates the shared admin storage state. */
test.describe("admin sign out", () => {
  test("sign out revokes the session server-side", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
