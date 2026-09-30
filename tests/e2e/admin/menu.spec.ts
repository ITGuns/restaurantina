import { expect, test } from "@playwright/test";
import { cleanupAll, closePool, query, QA } from "../helpers/db";
import { expectToast } from "../helpers/ui";

test.describe("admin menu CMS", () => {
  test.afterAll(async () => {
    await cleanupAll();
    await closePool();
  });

  test("creates, edits, hides, duplicates and deletes a menu item; the public menu follows", async ({ page }) => {
    const name = `${QA.prefix}Taco de prueba`;
    await page.goto("/admin/menu");
    await page.getByRole("button", { name: "+ Add Menu Item" }).click();
    const dialog = page.getByRole("dialog", { name: "New menu item" });
    await dialog.getByLabel("Item name").fill(name);
    await dialog.getByLabel("Category").selectOption({ label: "Comida" });
    await dialog.getByLabel("English name").fill("Test taco");
    await dialog.getByLabel("Description (Spanish)").fill("Taco de prueba con salsa");
    await dialog.getByLabel("English description").fill("Test taco with salsa");
    await dialog.getByLabel("Price ($)").fill("9.50");
    await dialog.getByRole("switch", { name: "Popular" }).click();
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expectToast(page, "Item created");

    await page.goto("/admin/menu?q=" + encodeURIComponent(name));
    const row = page.locator('[data-testid="menu-row"]', { hasText: name });
    await expect(row).toBeVisible();
    await expect(row).toContainText("$9.50");
    await expect(row).toContainText("Popular");

    // Public menu shows it with both languages
    await page.goto("/menu?q=" + encodeURIComponent("taco de prueba"));
    await expect(page.getByRole("button", { name: new RegExp(name) })).toBeVisible();
    await expect(page.getByText("Test taco with salsa")).toBeVisible();

    // Inline price edit
    await page.goto("/admin/menu?q=" + encodeURIComponent(name));
    await row.getByRole("button", { name: "$9.50" }).click();
    await row.getByLabel(`Price for ${name}`).fill("10.25");
    await row.getByLabel(`Price for ${name}`).press("Enter");
    await expectToast(page, "Price updated");
    await expect(row).toContainText("$10.25");

    // Hide → gone from public
    await row.getByRole("button", { name: "Hide" }).click();
    await expectToast(page, "Item hidden");
    await page.goto("/menu?q=" + encodeURIComponent("taco de prueba"));
    await expect(page.getByRole("status")).toContainText("No menu items found");

    // Duplicate + delete
    await page.goto("/admin/menu?q=" + encodeURIComponent(name));
    await row.first().getByRole("button", { name: "Duplicate" }).click();
    await expectToast(page, "Duplicated");
    await expect(page.locator('[data-testid="menu-row"]', { hasText: `${name} (copy)` })).toBeVisible();
    await page.locator('[data-testid="menu-row"]', { hasText: `${name} (copy)` }).getByRole("button", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete item" }).click();
    await expectToast(page, "Item deleted");
    const rows = await query(`select id from menu_items where name like $1`, [`${name}%`]);
    expect(rows).toHaveLength(1);
  });

  test("category CRUD", async ({ page }) => {
    const name = `${QA.prefix}Antojitos`;
    await page.goto("/admin/menu/categories");
    await page.getByRole("button", { name: "+ New category" }).click();
    const dialog = page.getByRole("dialog", { name: "New category" });
    await dialog.getByLabel("Name *").fill(name);
    await dialog.getByLabel("English name").fill("Snacks");
    await dialog.getByLabel("Note", { exact: true }).fill("Solo fines de semana");
    await dialog.getByRole("button", { name: "Create category" }).click();
    await expectToast(page, "Category created");
    await expect(page.getByText(name)).toBeVisible();
    await page.goto("/menu");
    await expect(page.getByRole("tab", { name: name })).toBeVisible();
    await page.goto("/admin/menu/categories");
    await page.locator("div", { hasText: name }).getByRole("button", { name: "Delete" }).last().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete category" }).click();
    await expectToast(page, "Category deleted");
  });

  test("modifier groups and options", async ({ page }) => {
    const name = `${QA.prefix}Guisado`;
    await page.goto("/admin/menu/modifiers");
    await page.getByRole("button", { name: "+ New modifier group" }).click();
    await page.getByRole("dialog").getByLabel("Name *").fill(name);
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Group saved");
    await page.locator("section", { hasText: name }).getByRole("button", { name: "+ Option" }).click();
    await page.getByRole("dialog").getByLabel("Name *").fill("Mole");
    await page.getByRole("dialog").getByLabel("Price adjustment ($)").fill("1.05");
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
    await expectToast(page, "Option saved");
    await expect(page.locator("section", { hasText: name })).toContainText("+$1.05");
  });
});
