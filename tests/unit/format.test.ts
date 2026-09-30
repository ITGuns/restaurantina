import { describe, expect, it } from "vitest";
import { addDays, daysLabelWeek, money, phoneHref, time12, toMinutes } from "@/lib/format";
import { slugify } from "@/lib/slug";

describe("format helpers", () => {
  it("formats money from cents", () => {
    expect(money(1470)).toBe("$14.70");
    expect(money(525)).toBe("$5.25");
    expect(money(944)).toBe("$9.44");
    expect(money(1200)).toBe("$12");
    expect(money(null)).toBe("");
  });
  it("formats times and dates", () => {
    expect(time12("09:00", { compact: true })).toBe("9 AM");
    expect(time12("19:00", { compact: true })).toBe("7 PM");
    expect(time12("13:30")).toBe("1:30 PM");
    expect(toMinutes("18:30")).toBe(1110);
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
  });
  it("labels day ranges Mon→Sun", () => {
    expect(daysLabelWeek([6, 0])).toBe("Sat & Sun");
    expect(daysLabelWeek([1, 2, 3, 4, 5, 6])).toBe("Mon–Sat");
  });
  it("builds tel: links and slugs with Spanish characters", () => {
    expect(phoneHref("(915) 259-8774")).toBe("tel:+19152598774");
    expect(slugify("Nomás Mis Chicharrones Truenan")).toBe("nomas-mis-chicharrones-truenan");
    expect(slugify("Pa' los Chamacos")).toBe("pa-los-chamacos");
    expect(slugify("El Argüendero")).toBe("el-arguendero");
  });
});
