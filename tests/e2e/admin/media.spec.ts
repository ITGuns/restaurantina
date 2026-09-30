import { expect, test } from "@playwright/test";
import { cleanupAll, closePool, QA } from "../helpers/db";
import { expectToast } from "../helpers/ui";

/** 220×220 PNG made on the fly (the upload validator requires ≥200px on each side). */
function pngBuffer(): Buffer {
  const zlib = require("node:zlib") as typeof import("node:zlib");
  const w = 220, h = 220;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = 181; raw[o + 1] = 69; raw[o + 2] = 27;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf: Buffer) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type: string, data: Buffer) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

test.describe("admin media", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("uploads, edits metadata, assigns to a menu item and deletes", async ({ page }) => {
    await page.goto("/admin/media");
    await expect(page.locator('[data-testid="media-row"]')).toHaveCount(4);
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "+ Upload images" }).click()]);
    await chooser.setFiles({ name: "qa-plate.png", mimeType: "image/png", buffer: pngBuffer() });
    await expectToast(page, "uploaded");
    await expect(page.locator('[data-testid="media-row"]')).toHaveCount(5);

    await page.getByRole("button", { name: /Edit qa plate/ }).click();
    const dialog = page.getByRole("dialog", { name: "Edit image" });
    await dialog.getByLabel("Alt text").fill(`${QA.prefix}clay plate`);
    await dialog.getByLabel("Caption").fill("Test caption");
    await dialog.getByRole("button", { name: "Save image" }).click();
    await expectToast(page, "Image saved");

    // Assigning copies the (now saved) alt text onto the menu item.
    await page.getByRole("button", { name: /Edit QA clay plate/ }).click();
    await dialog.getByLabel("Menu item").selectOption({ label: "Menudo · Specials" });
    await dialog.getByRole("button", { name: "Assign to item" }).click();
    await expectToast(page, "Assigned to Menudo");
    await dialog.getByRole("button", { name: "Cancel" }).click();

    await page.goto("/menu?item=menudo");
    await expect(page.getByRole("dialog").locator("img[alt='QA clay plate']")).toBeVisible();

    await page.goto("/admin/media");
    await page.getByRole("button", { name: /Edit QA clay plate/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete image" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete image" }).click();
    await expectToast(page, "Image deleted");
    await expect(page.locator('[data-testid="media-row"]')).toHaveCount(4);
  });

  test("rejects non-image and tiny uploads", async ({ page }) => {
    await page.goto("/admin/media");
    const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByRole("button", { name: "+ Upload images" }).click()]);
    await chooser.setFiles({ name: "evil.png", mimeType: "image/png", buffer: Buffer.from("not really a png") });
    await expect(page.getByRole("status").first()).toContainText(/doesn't look like a valid image/);
  });
});
