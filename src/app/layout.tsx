import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz", "SOFT"], variable: "--font-fraunces", display: "swap" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

/* Public pages override these with values from the database (see app/(site)/layout.tsx). */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "RestauranTina — Authentic Mexican Cuisine · El Paso, TX", template: "%s | RestauranTina" },
  description: "Home-style Mexican comfort food made from scratch in El Paso, TX. Menudo, pozole, chilaquiles, enchiladas, fresh tortillas and café de la olla on Talavera-style plates.",
  openGraph: { type: "website", siteName: "RestauranTina", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#f5efe6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
