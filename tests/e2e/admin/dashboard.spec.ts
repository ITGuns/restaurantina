import { expect, test } from "@playwright/test";

test.describe("admin dashboard", () => {
  test("shows today's stats, hours, menu counts and quick actions", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Today at a glance" })).toBeVisible();
    for (const label of ["Reservations today", "Expected guests", "Pending", "Confirmed today", "Upcoming (active)"]) await expect(page.getByText(label, { exact: true })).toBeVisible();
    await expect(page.getByText("Today's hours")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Menu", exact: true })).toBeVisible();
    await expect(page.getByText("Needs your confirmation")).toBeVisible();
    await expect(page.getByRole("link", { name: "+ Add Menu Item" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Reservations" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit Hours", exact: true })).toBeVisible();
  });

  test("quick action opens the new item editor", async ({ page }) => {
    await page.goto("/admin");
    await page.getByRole("link", { name: "+ Add Menu Item" }).click();
    await expect(page.getByRole("dialog", { name: "New menu item" })).toBeVisible();
  });
});
