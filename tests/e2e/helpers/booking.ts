import { expect, type Page } from "@playwright/test";
import { dayButtonName } from "./dates";

/** Drives the public wizard up to the review step. */
export async function bookThrough(page: Page, opts: { date: string; party: number; time: string; first: string; last: string; email: string; phone: string; requests?: string }) {
  await page.goto("/book");
  await expect(page.getByRole("heading", { name: "When are you coming in?" })).toBeVisible();
  const day = page.getByRole("button", { name: dayButtonName(opts.date) });
  if (!(await day.isVisible())) await page.getByRole("button", { name: "Next month" }).click();
  await expect(day).toBeEnabled();
  await day.click();

  await expect(page.getByRole("heading", { name: "How many guests?" })).toBeVisible();
  await page.getByRole("button", { name: `${opts.party} guest${opts.party === 1 ? "" : "s"}`, exact: true }).click();

  await expect(page.getByRole("heading", { name: "Pick a time" })).toBeVisible();
  const slot = page.getByRole("button", { name: opts.time, exact: true });
  await expect(slot).toBeEnabled();
  await slot.click();

  await expect(page.getByRole("heading", { name: "Who's the table for?" })).toBeVisible();
  await page.getByLabel(/^First name/).fill(opts.first);
  await page.getByLabel(/^Last name/).fill(opts.last);
  await page.getByLabel(/^Email/).fill(opts.email);
  await page.getByLabel(/^Phone/).fill(opts.phone);
  if (opts.requests) await page.getByLabel(/^Special requests/).fill(opts.requests);
  await page.getByRole("button", { name: "Review reservation" }).click();
  await expect(page.getByRole("heading", { name: "Everything look right?" })).toBeVisible();
}
