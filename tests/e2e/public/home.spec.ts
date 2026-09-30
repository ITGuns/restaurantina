import { expect, test } from "@playwright/test";

test.describe("homepage", () => {
  test("hero, navigation and key sections render from the database", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/RestauranTina — Authentic Mexican Cuisine · El Paso, TX/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Authentic Mexican Cuisine");
    await expect(page.getByRole("link", { name: "Reserve a Table" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore the Menu" }).first()).toBeVisible();
    await expect(page.getByText("El Paso, TX").first()).toBeVisible();
    // Real logo, not a generated mark
    await expect(page.locator('img[alt="RestauranTina logo"]').first()).toBeVisible();
    for (const heading of ["Featured dishes", "Sabores de Tina", "Nuestra historia", "Desayunos", "Made from", "Find us", "Follow Tina"]) {
      await expect(page.getByText(heading, { exact: false }).first()).toBeAttached();
    }
  });

  test("popular dishes, socials, address and map come from the seed", async ({ page }) => {
    await page.goto("/");
    for (const dish of ["Menudo", "Pozole", "La Milagrosa", "No Manches", "Café de la olla"]) await expect(page.getByText(dish, { exact: true }).first()).toBeAttached();
    await expect(page.getByRole("link", { name: /Instagram/ }).first()).toHaveAttribute("href", "https://www.instagram.com/restaurantina_/");
    await expect(page.getByRole("link", { name: /TikTok/ }).first()).toHaveAttribute("href", "https://www.tiktok.com/@restaurantina");
    await expect(page.getByRole("link", { name: /Facebook/ }).first()).toHaveAttribute("href", /facebook\.com\/p\/Restauran-Tina/);
    await expect(page.getByText("12115 Montwood Dr Ste 201B").first()).toBeAttached();
    await expect(page.locator("iframe[title*='Map showing RestauranTina']")).toHaveAttribute("src", /31\.7615158,-106\.2721195/);
    await expect(page.getByRole("link", { name: "Get Directions" })).toHaveAttribute("href", /destination=31\.7615158,-106\.2721195/);
    await expect(page.getByRole("link", { name: /Order online/i }).first()).toHaveAttribute("href", "https://www.restaurantinatx.com/restaurantina/");
  });

  test("Sabores de Tina switches dish, description and price", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("section", { has: page.getByRole("heading", { name: "Sabores de Tina" }) });
    await section.scrollIntoViewIfNeeded();
    const pozole = section.getByRole("button", { name: /Pozole/ });
    await pozole.click();
    await expect(pozole).toHaveAttribute("aria-pressed", "true");
    await expect(section.getByText("$11.55").first()).toBeVisible();
    await section.getByRole("button", { name: /Café de la olla/ }).click();
    await expect(section.getByText("$4.73").first()).toBeVisible();
  });

  test("footer has privacy, terms and staff links; structured data is present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    await expect(page.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    const data = JSON.parse(ld ?? "{}");
    expect(data["@type"]).toBe("Restaurant");
    expect(data.telephone).toBe("(915) 259-8774");
    expect(data.geo).toMatchObject({ latitude: 31.7615158, longitude: -106.2721195 });
    expect(data.aggregateRating).toMatchObject({ ratingValue: "4.7", reviewCount: 72 });
  });
});
