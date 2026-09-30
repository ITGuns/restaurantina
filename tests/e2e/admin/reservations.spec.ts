import { expect, test } from "@playwright/test";
import { cleanupAll, closePool, QA } from "../helpers/db";
import { nextWeekday } from "../helpers/dates";
import { expectToast } from "../helpers/ui";

test.describe("admin reservations", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("creates a staff reservation, changes status in list/calendar/day/detail views", async ({ page }) => {
    const date = nextWeekday(6, 4);
    await page.goto("/admin/reservations");
    await page.getByRole("button", { name: "+ New reservation" }).click();
    const dialog = page.getByRole("dialog", { name: "New reservation" });
    await dialog.getByLabel("Date").fill(date);
    await dialog.getByLabel("Time").fill("13:00");
    await dialog.getByLabel("Party size").fill("4");
    await dialog.getByLabel("First name").fill("QA");
    await dialog.getByLabel("Last name").fill("Staff");
    await dialog.getByLabel("Email").fill(`staff-${Date.now()}@${QA.emailDomain}`);
    await dialog.getByLabel("Phone").fill("(915) 555-0102");
    await dialog.getByLabel("Status").selectOption("pending");
    await dialog.getByRole("button", { name: "Create reservation" }).click();
    await expectToast(page, "Reservation created");

    await page.goto(`/admin/reservations?view=day&date=${date}`);
    const card = page.locator("li", { hasText: "QA Staff" }).first();
    await expect(card).toContainText("party of 4");
    await card.getByRole("button", { name: "Confirm" }).click();
    await expectToast(page, "Marked confirmed");
    await expect(card).toContainText("Confirmed");

    await page.goto(`/admin/reservations?view=calendar&month=${date.slice(0, 7)}`);
    await expect(page.getByText(/\d+ res · \d+ guests/).first()).toBeVisible();

    await page.goto(`/admin/reservations?view=list&from=${date}&to=${date}&status=all`);
    await page.getByRole("link", { name: "QA Staff" }).first().click();
    await page.waitForURL(/\/admin\/reservations\/\d+/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: "QA Staff" })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId("manage-link")).toContainText("/book/RT-");
    await page.getByRole("button", { name: "Mark no-show" }).click();
    await expectToast(page, "Marked no-show");
    await page.getByRole("button", { name: "Delete record" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page).toHaveURL(/\/admin\/reservations$/);
  });
});
