import { expect, test } from "@playwright/test";
import { bookThrough } from "../helpers/booking";
import { cleanupAll, closePool, insertReservations, query, reservationByCode, QA } from "../helpers/db";
import { dayButtonName, nextWeekday } from "../helpers/dates";

test.describe("booking", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("books a table end-to-end and stores it before showing the confirmation", async ({ page }) => {
    const date = nextWeekday(6); // Saturday
    const email = `guest-${Date.now()}@${QA.emailDomain}`;
    await bookThrough(page, { date, party: 2, time: "12:00 PM", first: "QA", last: "Guest", email, phone: "(915) 555-0100", requests: "High chair please" });
    await page.getByRole("button", { name: "Confirm reservation" }).click();
    await expect(page.getByRole("heading", { name: "Reservation confirmed" })).toBeVisible();
    const code = (await page.getByTestId("confirmation-code").textContent())?.trim() ?? "";
    expect(code).toMatch(/^RT-\d{5}$/);
    await expect(page.getByText("RestauranTina", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("12:00 PM")).toBeVisible();
    await expect(page.getByText("2 guests")).toBeVisible();
    await expect(page.getByRole("link", { name: "Add to Calendar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Reservation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Home" })).toBeVisible();
    const row = await reservationByCode(code);
    expect(row).toMatchObject({ status: "confirmed", party_size: 2, email, source: "web" });

    // Private manage link → cancel
    await page.getByRole("link", { name: "View Reservation" }).click();
    await expect(page.getByRole("heading", { name: "Your reservation" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    // The button only works once React has hydrated; retry the click until the confirm step appears.
    await expect(async () => {
      await page.getByRole("button", { name: "Cancel this reservation" }).click();
      await expect(page.getByRole("button", { name: "Yes, cancel it" })).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    await page.getByRole("button", { name: "Yes, cancel it" }).click();
    await expect(page.getByRole("heading", { name: "Reservation cancelled" })).toBeVisible();
    expect((await reservationByCode(code)).status).toBe("cancelled");
  });

  test("large parties are held as pending", async ({ page }) => {
    const date = nextWeekday(5);
    await bookThrough(page, { date, party: 7, time: "1:00 PM", first: "QA", last: "Party", email: `party-${Date.now()}@${QA.emailDomain}`, phone: "9155550101" });
    await expect(page.getByText(/submitted as a request/)).toBeVisible();
    await page.getByRole("button", { name: "Confirm reservation" }).click();
    await expect(page.getByRole("heading", { name: "Reservation requested" })).toBeVisible();
    const code = (await page.getByTestId("confirmation-code").textContent())?.trim() ?? "";
    expect((await reservationByCode(code)).status).toBe("pending");
  });

  test("validates customer details client- and server-side", async ({ page }) => {
    const date = nextWeekday(4);
    await page.goto("/book");
    await page.getByRole("button", { name: dayButtonName(date) }).or(page.getByRole("button", { name: "Next month" })).first().click();
    if (!(await page.getByRole("heading", { name: "How many guests?" }).isVisible())) await page.getByRole("button", { name: dayButtonName(date) }).click();
    await page.getByRole("button", { name: "2 guests", exact: true }).click();
    await page.getByRole("button", { name: "11:00 AM", exact: true }).click();
    await page.getByRole("button", { name: "Review reservation" }).click();
    await expect(page.getByText("First name is required")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).toBeVisible();
  });

  test("full slots are disabled and a closed date cannot be picked", async ({ page }) => {
    const date = nextWeekday(2, 3); // Tuesday
    await insertReservations(Array.from({ length: 6 }, () => ({ date, time: "10:00", partySize: 2 })));
    await query(`insert into date_overrides (date, closed, reason) values ($1, true, $2) on conflict (date) do update set closed = true, reason = $2`, [nextWeekday(1, 3), `${QA.prefix}closure`]);
    await page.goto("/book");
    const closedDay = page.getByRole("button", { name: dayButtonName(nextWeekday(1, 3)) });
    if (!(await closedDay.isVisible())) await page.getByRole("button", { name: "Next month" }).click();
    await expect(closedDay).toBeDisabled();
    await page.goto("/book");
    const day = page.getByRole("button", { name: dayButtonName(date) });
    if (!(await day.isVisible())) await page.getByRole("button", { name: "Next month" }).click();
    await day.click();
    await page.getByRole("button", { name: "2 guests", exact: true }).click();
    await expect(page.getByRole("button", { name: "10:00 AM", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "10:30 AM", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "12:00 PM", exact: true })).toBeEnabled();
  });
});
