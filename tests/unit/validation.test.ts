import { describe, expect, it } from "vitest";
import { fieldErrors, menuItemInput, reservationInput, restaurantInfoInput } from "@/lib/validation";

describe("reservationInput", () => {
  const base = { date: "2026-10-03", time: "12:00", partySize: "2", firstName: " Ana ", lastName: "Lopez", email: "ana@example.com", phone: "(915) 555-0100", occasion: "", specialRequests: "", idempotencyKey: "abcdefgh-1234" };
  it("accepts a valid reservation and normalises blanks", () => {
    const r = reservationInput.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.firstName).toBe("Ana");
      expect(r.data.partySize).toBe(2);
      expect(r.data.occasion).toBeNull();
    }
  });
  it("rejects missing or invalid customer information", () => {
    const r = reservationInput.safeParse({ ...base, firstName: "", email: "nope", phone: "abc", time: "25:00" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.firstName).toBe("First name is required");
      expect(e.email).toBe("Enter a valid email");
      expect(e.phone).toBeTruthy();
      expect(e.time).toBeTruthy();
    }
  });
});

describe("menuItemInput", () => {
  it("converts dollars to cents and keeps bilingual fields", () => {
    const r = menuItemInput.safeParse({ categoryId: "1", name: "La Milagrosa", englishName: "Breaded beef", description: "Milanesa de res", price: "$17.85", availability: [{ days: ["6", "0"], startTime: "", endTime: "13:00" }], popular: "true" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.price).toBe(1785);
      expect(r.data.availability[0]).toMatchObject({ days: [0, 6], startTime: null, endTime: "13:00", active: true });
      expect(r.data.popular).toBe(true);
    }
  });
  it("rejects negative or malformed prices", () => {
    expect(menuItemInput.safeParse({ categoryId: 1, name: "X", price: "-4" }).success).toBe(false);
    expect(menuItemInput.safeParse({ categoryId: 1, name: "X", price: "abc" }).success).toBe(false);
  });
});

describe("restaurantInfoInput", () => {
  it("accepts partial updates", () => {
    const r = restaurantInfoInput.safeParse({ featuredPhone: "secondary", phoneConfirmed: "true" });
    expect(r.success).toBe(true);
    if (r.success) expect(Object.keys(r.data)).toEqual(["featuredPhone", "phoneConfirmed"]);
  });
  it("validates urls, coordinates and rating", () => {
    const r = restaurantInfoInput.safeParse({ instagramUrl: "instagram.com/x", latitude: "95", rating: "6" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.instagramUrl).toContain("https://");
      expect(e.latitude).toBeTruthy();
      expect(e.rating).toBeTruthy();
    }
  });
});
