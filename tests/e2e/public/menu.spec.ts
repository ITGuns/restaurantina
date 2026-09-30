import { expect, test } from "@playwright/test";

test.describe("menu", () => {
  test("shows every category with source notes and item counts", async ({ page }) => {
    await page.goto("/menu");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Desayunos");
    await expect(page.getByText("82 items")).toBeVisible();
    for (const cat of ["Desayunos", "Platillos", "Comida", "Burritos", "Chimichangas", "Quesadillas", "Pa' los Chamacos", "Extras", "Bebidas", "Postres", "Specials"]) {
      await expect(page.getByRole("tab", { name: cat })).toBeVisible();
    }
    await expect(page.getByText("Todos acompañados de frijoles con queso").first()).toBeVisible();
    await expect(page.getByText("Please call for allergy information")).toBeVisible();
  });

  test("category navigation, search and item drawer work with exact source data", async ({ page }) => {
    await page.goto("/menu");
    await page.getByRole("tab", { name: "Postres" }).click();
    await expect(page).toHaveURL(/category=postres/);
    await expect(page.getByRole("button", { name: /El Delicioso/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /El Pecadito/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /El Suculento/ })).toHaveCount(0);

    await page.getByRole("searchbox", { name: "Search the menu" }).fill("enchilada");
    await expect(page.getByRole("status")).toContainText(/items for “enchilada”/);
    await expect(page.getByRole("button", { name: /No Manches/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Las Tóxicas/ }).first()).toBeVisible();

    await page.getByRole("searchbox", { name: "Search the menu" }).fill("zzzz");
    await expect(page.getByRole("status")).toContainText("No menu items found");
    await page.getByRole("searchbox", { name: "Search the menu" }).fill("canon");
    await page.getByRole("button", { name: /^Ta Cañón/ }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "Ta Cañón" })).toBeVisible();
    await expect(dialog.getByText("Chile relleno de queso")).toBeVisible();
    await expect(dialog.getByText("$17.85")).toBeVisible();
    await expect(page).toHaveURL(/item=ta-canon/);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("filters by popular and deep links open an item", async ({ page }) => {
    await page.goto("/menu?item=la-milagrosa");
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: "La Milagrosa" })).toBeVisible();
    await expect(dialog.getByText("Milanesa de res")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByRole("button", { name: "Popular", exact: true }).click();
    await expect(page.getByRole("button", { name: /Burrito Ta Cañón/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Burrito Pólvora/ })).toHaveCount(0);
  });
});
