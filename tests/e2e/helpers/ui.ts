import { expect, type Page } from "@playwright/test";

/** Waits for a toast with `text` to show and then clear, so consecutive saves can't reuse a stale toast. */
export async function expectToast(page: Page, text: string | RegExp) {
  const status = page.getByRole("status").first();
  await expect(status).toContainText(text);
  await expect(status).not.toContainText(text, { timeout: 10_000 });
}

export async function gotoReady(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
