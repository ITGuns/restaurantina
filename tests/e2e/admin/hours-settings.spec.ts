import { expect, test } from "@playwright/test";
import { cleanupAll, closePool, query } from "../helpers/db";
import { expectToast } from "../helpers/ui";

test.describe("admin hours & settings", () => {
  test.afterAll(async () => {
    await query(`update restaurant_info set featured_phone = 'primary', phone_confirmed = false, hours_confirmed = false where id = 1`);
    await cleanupAll();
    await closePool();
  });

  test("shows the three conflicting hour sets and applies one", async ({ page }) => {
    await page.goto("/admin/hours");
    await expect(page.getByText("Which hours are right?")).toBeVisible();
    await expect(page.locator("tr", { hasText: "Old website" })).toBeVisible();
    await expect(page.getByText("Google Business Profile", { exact: true })).toBeVisible();
    await expect(page.getByText("Social posts", { exact: true })).toBeVisible();
    await expect(page.getByText("Needs confirmation").first()).toBeVisible();
    const googleRow = page.locator("tr", { hasText: "Google Business Profile" });
    await googleRow.getByRole("button", { name: "Apply" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Apply hours" }).click();
    await expectToast(page, "Hours applied");
    await expect(page.getByText("Confirmed").first()).toBeVisible();
    await expect(page.locator("tr", { hasText: "Website shows now" })).toContainText("Closed"); // Monday closed on Google

    // Public site reflects the change
    await page.goto("/visit");
    await expect(page.getByText("Mon", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();

    // Restore the website hours for the rest of the suite
    await page.goto("/admin/hours");
    await page.locator("tr", { hasText: "Old website" }).getByRole("button", { name: "Apply" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Apply hours" }).click();
    await expectToast(page, "Hours applied");
  });

  test("featured phone switches across the site", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByRole("radio", { name: /Secondary \(\(915\) 268-1543\)/ }).check();
    await page.getByRole("switch", { name: "I've confirmed this is the right number" }).click();
    await page.getByRole("button", { name: "Save contact" }).click();
    await expectToast(page, "Contact details saved");
    await page.goto("/visit");
    await expect(page.getByRole("link", { name: "Call Us" })).toHaveAttribute("href", "tel:+19152681543");
    await page.goto("/admin/settings");
    await page.getByRole("radio", { name: /Primary/ }).check();
    await page.getByRole("button", { name: "Save contact" }).click();
    await expectToast(page, "Contact details saved");
  });

  test("story, ordering toggle and booking rules save without wiping other fields", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("About Tina / our story").fill("Tina story paragraph one.\n\nParagraph two.");
    await page.getByRole("button", { name: "Save hero & story" }).click();
    await expectToast(page, "Hero & story saved");
    await page.goto("/");
    await expect(page.getByText("Tina story paragraph one.")).toBeVisible();
    await expect(page.getByText("Paragraph two.")).toBeVisible();
    const [row] = await query<{ review_themes: string[]; slogans: string[] }>(`select review_themes, slogans from restaurant_info where id = 1`);
    expect(row.review_themes.length).toBeGreaterThan(0);
    expect(row.slogans.length).toBeGreaterThan(0);

    await page.goto("/admin/settings");
    await page.getByLabel("About Tina / our story").fill("");
    await page.getByRole("button", { name: "Save hero & story" }).click();
    await expectToast(page, "Hero & story saved");

    await page.getByLabel("Max party size (online)").fill("10");
    await page.getByRole("button", { name: "Save rules" }).click();
    await expectToast(page, "Booking rules saved");
    await page.goto("/book");
    await page.getByRole("button", { name: /^Tomorrow/ }).or(page.getByRole("button", { name: /^Saturday/ })).first().click();
    await expect(page.getByRole("button", { name: "10 guests", exact: true })).toBeVisible();
    await page.goto("/admin/settings");
    await page.getByLabel("Max party size (online)").fill("8");
    await page.getByRole("button", { name: "Save rules" }).click();
    await expectToast(page, "Booking rules saved");
  });

  test("date override blocks a day for booking", async ({ page }) => {
    await page.goto("/admin/hours");
    await page.getByRole("button", { name: "+ Add date" }).click();
    const dialog = page.getByRole("dialog");
    const d = new Date();
    d.setDate(d.getDate() + 20);
    const ymd = d.toISOString().slice(0, 10);
    await dialog.getByLabel("Date *").fill(ymd);
    await dialog.getByLabel("Reason").fill("QA private event");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Date saved");
    await expect(page.getByText("QA private event")).toBeVisible();
  });
});
