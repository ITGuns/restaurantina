"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import { SplitText } from "@/components/motion/SplitText";
import { StatusDot } from "@/components/site/Header";
import { Logo } from "@/components/site/Logo";
import { TalaveraRing, TalaveraTile } from "@/components/site/Talavera";
import { ButtonLink } from "@/components/ui/Button";
import type { MediaLite } from "@/lib/menu-types";

const ease = [0.16, 1, 0.3, 1] as const;
const fade = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.9, ease } } };
const fadeLate = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 1, ease, delay: 0.75 } } };

const TILES = [
  { cls: "-right-[3%] top-[6%] w-[14%]", color: "azul" as const, dx: 60, dy: -40, delay: 0.9, sway: "animate-sway" },
  { cls: "-left-[4%] top-[34%] w-[10%]", color: "verde" as const, dx: -60, dy: 20, delay: 1.05, sway: "animate-sway-slow" },
  { cls: "right-[4%] -bottom-[1%] w-[12%]", color: "mostaza" as const, dx: 40, dy: 50, delay: 1.2, sway: "animate-sway" },
];

export function Hero({
  name,
  logo,
  eyebrow,
  headline,
  subheadline,
  image,
  accentImage,
  status,
  addressShort,
}: {
  name: string;
  logo: string | null;
  eyebrow: string | null;
  headline: string;
  subheadline: string | null;
  image: MediaLite | null;
  accentImage: MediaLite | null;
  status: { isOpen: boolean; label: string; detail: string };
  addressShort: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const plateY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "14%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "-10%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const words = headline.trim().split(/\s+/);
  const lines = words.length > 2 ? [{ text: words.slice(0, -1).join(" ") }, { text: words[words.length - 1], className: "italic text-clay-600" }] : [{ text: headline }];

  return (
    <section ref={ref} className="grain relative isolate overflow-hidden bg-cream-100 pb-16 pt-[104px] md:pt-[136px] lg:flex lg:min-h-[100svh] lg:items-center lg:pb-20 lg:pt-[120px]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-talavera opacity-[0.22] [mask-image:radial-gradient(70%_70%_at_75%_40%,black,transparent_80%)]" />
      <div aria-hidden className="pointer-events-none absolute right-[-12%] top-[4%] h-[64vw] w-[64vw] rounded-full bg-[radial-gradient(closest-side,rgb(211_116_78/0.24),transparent)] blur-3xl lg:h-[44vw] lg:w-[44vw]" />
      <div aria-hidden className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(217_162_27/0.2),transparent)] blur-3xl" />

      <div className="container-site relative z-[2] grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
        {/* Plate composition */}
        <motion.div style={{ y: plateY }} className="order-1 lg:order-2 lg:col-span-6">
          <div className="relative mx-auto w-[min(78vw,400px)] lg:w-full lg:max-w-[560px]">
            <div className="relative aspect-square">
              <div aria-hidden className="absolute inset-[-10%] rounded-full bg-[radial-gradient(closest-side,rgb(217_162_27/0.28),transparent)] blur-2xl" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease, delay: 0.3 }} className="absolute inset-[-7%]">
                <TalaveraRing className="h-full w-full opacity-90" />
              </motion.div>

              {image ? (
                <motion.div
                  initial={{ clipPath: "inset(100% 0% 0% 0%)", scale: 1.06 }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
                  transition={{ duration: 1.5, ease, delay: 0.15 }}
                  className="arch absolute inset-[6%] overflow-hidden bg-cream-200 shadow-plate"
                >
                  <motion.div animate={{ scale: [1, 1.05, 1], x: ["0%", "1.5%", "0%"] }} transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 will-change-transform">
                    <Image src={image.file} alt={image.alt} fill priority fetchPriority="high" sizes="(min-width: 1024px) 560px, 80vw" className="object-cover" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} />
                  </motion.div>
                  <div aria-hidden className="light-sweep mix-blend-soft-light" />
                </motion.div>
              ) : (
                <div className="arch absolute inset-[6%] flex items-center justify-center bg-brown-900 text-cream-50">
                  <Logo src={logo} name={name} size={220} variant="badge" />
                </div>
              )}

              {/* Steam rising from the plate */}
              <div aria-hidden className="pointer-events-none absolute left-[28%] top-[-4%] h-[30%] w-[44%]">
                <span className="steam-layer steam-a absolute inset-0" />
                <span className="steam-layer steam-b absolute inset-[12%]" />
              </div>

              {accentImage && (
                <motion.div initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 1.1, duration: 1, ease }} className="absolute -bottom-[5%] -left-[9%] w-[38%]">
                  <div className="animate-sway-slow motion-reduce:animate-none">
                    <div className="relative aspect-square overflow-hidden rounded-full border-[6px] border-cream-50 bg-cream-200 shadow-lift">
                      <Image src={accentImage.file} alt={accentImage.alt} fill sizes="200px" className="object-cover" style={{ objectPosition: `${accentImage.focalX}% ${accentImage.focalY}%` }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {TILES.map((t) => (
                <motion.div key={t.cls} initial={{ opacity: 0, x: t.dx, y: t.dy, rotate: -18 }} animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }} transition={{ delay: t.delay, duration: 1.1, ease }} className={`absolute ${t.cls}`}>
                  <div className={`${t.sway} motion-reduce:animate-none`}>
                    <TalaveraTile color={t.color} className="h-full w-full drop-shadow-md" />
                  </div>
                </motion.div>
              ))}
            </div>
            {image?.caption && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }} className="mt-6 text-center text-[13px] text-brown-600">
                {image.caption}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Copy */}
        <motion.div style={{ y: textY, opacity: textOpacity }} className="order-2 lg:order-1 lg:col-span-6">
          <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }} className="max-w-2xl">
            <motion.div variants={fade}>
              <Logo src={logo} name={name} size={128} priority className="-ml-2" />
            </motion.div>
            {eyebrow && (
              <motion.p variants={fade} className="mt-3 flex items-center gap-2 eyebrow text-clay-600">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {eyebrow}
              </motion.p>
            )}
            <SplitText as="h1" delay={0.45} lines={lines} className="mt-5 font-display text-[clamp(2.9rem,7.6vw,6.6rem)] font-medium leading-[0.94] tracking-[-0.02em] text-brown-900" />
            {subheadline && (
              <motion.p variants={fadeLate} className="mt-6 max-w-xl text-[17px] leading-relaxed text-brown-700 md:text-[19px]">
                {subheadline}
              </motion.p>
            )}
            <motion.div variants={fadeLate} className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <ButtonLink href="/book" size="lg" arrow>
                  Reserve a Table
                </ButtonLink>
              </Magnetic>
              <Magnetic strength={0.2}>
                <ButtonLink href="/menu" size="lg" variant="secondary">
                  Explore the Menu
                </ButtonLink>
              </Magnetic>
            </motion.div>
            <motion.div variants={fadeLate} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13.5px] text-brown-600">
              <span className="inline-flex items-center gap-2">
                <StatusDot isOpen={status.isOpen} />
                <span className="font-semibold text-brown-900">{status.label}</span>
                {status.detail && <span>· {status.detail}</span>}
              </span>
              <Link href="/visit" className="inline-flex items-center gap-2 hover:text-brown-900">
                <span className="h-1 w-1 rounded-full bg-mostaza-500" aria-hidden />
                {addressShort}
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }} className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-brown-500 lg:flex">
        <span className="eyebrow">Scroll</span>
        <span className="h-10 w-px overflow-hidden bg-brown-900/15">
          <motion.span className="block h-full w-full bg-clay-500" animate={{ y: ["-100%", "100%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
        </span>
      </motion.div>
    </section>
  );
}
