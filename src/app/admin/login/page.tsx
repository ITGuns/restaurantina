import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/site/Logo";
import { getSession } from "@/lib/auth";
import { readRestaurant } from "@/lib/data/restaurant";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: { absolute: "Staff login | RestauranTina" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [session, { next }] = await Promise.all([getSession(), searchParams]);
  if (session) redirect(next?.startsWith("/admin") ? next : "/admin");
  const restaurant = await readRestaurant().catch(() => null);
  return (
    <div className="admin-body flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <Logo src={restaurant?.logo ?? "/images/logo.png"} name={restaurant?.name ?? "RestauranTina"} size={96} />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-600">Staff control panel</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Sign in</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Manage reservations, the menu, photos, hours and settings.</p>
          <div className="mt-5"><LoginForm next={next ?? "/admin"} /></div>
        </div>
      </div>
    </div>
  );
}
