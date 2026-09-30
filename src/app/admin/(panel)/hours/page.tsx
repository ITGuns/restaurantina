import type { Metadata } from "next";
import { BookingWindowsEditor } from "@/components/admin/hours/BookingWindowsEditor";
import { HoursEditor } from "@/components/admin/hours/HoursEditor";
import { OverridesEditor } from "@/components/admin/hours/OverridesEditor";
import { SourceHoursCard } from "@/components/admin/hours/SourceHoursCard";
import { PageHeader } from "@/components/admin/ui";
import { getClock } from "@/lib/availability";
import { readBookingWindows, readDateOverrides } from "@/lib/data/booking";
import { readBookingSettings, readHours, readRestaurant } from "@/lib/data/restaurant";

export const metadata: Metadata = { title: "Hours" };

export default async function HoursPage() {
  const [hours, settings, restaurant] = await Promise.all([readHours(), readBookingSettings(), readRestaurant()]);
  const clock = getClock(settings.timezone);
  const [windows, overrides] = await Promise.all([readBookingWindows(), readDateOverrides(clock.date)]);
  return (
    <>
      <PageHeader title="Hours & availability" description="Regular hours, holiday hours, temporary closures, special events and the weekly reservation windows." />
      <div className="space-y-8">
        <HoursEditor hours={hours} confirmed={restaurant.hoursConfirmed} />
        <SourceHoursCard current={hours} confirmed={restaurant.hoursConfirmed} />
        <BookingWindowsEditor windows={windows} slotInterval={settings.slotIntervalMinutes} />
        <OverridesEditor overrides={overrides} />
      </div>
    </>
  );
}
