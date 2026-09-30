"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createReservation, fetchSlots, type PublicReservation } from "@/actions/booking";
import type { AvailabilityResult, SlotInfo } from "@/lib/booking";
import type { BookingSettings } from "@/db/schema";
import { Button } from "@/components/ui/Button";
import { longDate, shortDate, time12, toMinutes } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Confirmation } from "./Confirmation";
import { DatePicker, quickDates } from "./DatePicker";

type Details = { firstName: string; lastName: string; email: string; phone: string; occasion: string; specialRequests: string };
const EMPTY: Details = { firstName: "", lastName: "", email: "", phone: "", occasion: "", specialRequests: "" };
const STEPS = ["Date", "Guests", "Time", "Details", "Review"] as const;
const DRAFT_KEY = "rt-booking-draft";

export function BookingWizard({
  settings,
  bookable,
  restaurant,
}: {
  settings: Pick<BookingSettings, "minPartySize" | "maxPartySize" | "largePartyThreshold" | "turnTimeMinutes" | "occasions" | "bookingsEnabled" | "timezone">;
  bookable: { from: string; to: string; closedDates: string[]; openDays: number[] };
  restaurant: { name: string; addressLine1: string; city: string; state: string; zip: string; phone: string };
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [date, setDate] = useState<string | null>(null);
  const [party, setParty] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<AvailabilityResult | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PublicReservation | null>(null);
  const idem = useRef<string>("");
  const topRef = useRef<HTMLDivElement>(null);
  const focusStep = useRef(false);

  useEffect(() => {
    idem.current = crypto.randomUUID();
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) setDetails({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(details));
    } catch {}
  }, [details]);

  const go = useCallback(
    (next: number) => {
      setDir(next > step ? 1 : -1);
      setStep(next);
      setError(null);
      focusStep.current = true;
      requestAnimationFrame(() => {
        const top = (topRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 110;
        if (window.scrollY > top) window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
      });
    },
    [step, reduce],
  );

  const loadSlots = useCallback(async (d: string, p: number) => {
    setLoadingSlots(true);
    setSlots(null);
    try {
      const res = await fetchSlots(d, p);
      setSlots(res);
    } catch {
      setSlots({ ok: false, code: "invalid_date", message: "We couldn't load times. Please try again." });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const chooseDate = (d: string) => {
    setDate(d);
    setTime(null);
    go(1);
  };
  const chooseParty = (p: number) => {
    setParty(p);
    setTime(null);
    go(2);
    if (date) loadSlots(date, p);
  };
  const chooseTime = (t: string) => {
    setTime(t);
    go(3);
  };

  const validateDetails = (): boolean => {
    const e: Record<string, string> = {};
    if (!details.firstName.trim()) e.firstName = "First name is required";
    if (!details.lastName.trim()) e.lastName = "Last name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) e.email = "Enter a valid email";
    if (details.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a valid phone number";
    setFieldErrors(e);
    const firstInvalid = ["firstName", "lastName", "email", "phone"].find((k) => e[k]);
    if (firstInvalid) requestAnimationFrame(() => document.getElementById(`f-${firstInvalid}`)?.focus());
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!date || !party || !time) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createReservation({
        date,
        time,
        partySize: party,
        firstName: details.firstName.trim(),
        lastName: details.lastName.trim(),
        email: details.email.trim(),
        phone: details.phone.trim(),
        occasion: details.occasion || null,
        specialRequests: details.specialRequests.trim() || null,
        idempotencyKey: idem.current,
      });
      if (res.ok) {
        setResult(res.data);
        try {
          sessionStorage.removeItem(DRAFT_KEY);
        } catch {}
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      } else if (res.fieldErrors) {
        setFieldErrors(res.fieldErrors);
        setError(res.error);
        go(3);
      } else if (res.code === "unavailable" || res.code === "bad_slot" || res.code === "closed") {
        setError(res.error);
        setTime(null);
        go(2);
        loadSlots(date, party);
      } else {
        setError(res.error);
      }
    } catch {
      setError("We couldn't complete the reservation. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!settings.bookingsEnabled) {
    return (
      <div className="rounded-[24px] border border-brown-900/10 bg-cream-50 p-8 text-center shadow-card">
        <h2 className="font-display text-3xl text-brown-900">Online booking is paused</h2>
        <p className="mt-3 text-brown-700">
          Please call us at <a className="font-semibold text-brown-900" href={`tel:+1${restaurant.phone.replace(/\D/g, "")}`}>{restaurant.phone}</a> to reserve a table.
        </p>
      </div>
    );
  }

  if (result) return <Confirmation reservation={result} restaurant={restaurant} turnTime={settings.turnTimeMinutes} timezone={settings.timezone} />;

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -48 }),
  };
  const tel = `tel:+1${restaurant.phone.replace(/\D/g, "")}`;

  return (
    <div ref={topRef} className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-8">
        <ol className="flex items-center gap-2" aria-label="Booking progress">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            const reachable = i <= step && (i === 0 || (i === 1 && date) || (i === 2 && party) || (i === 3 && time) || (i === 4 && time));
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <button type="button" onClick={() => reachable && go(i)} disabled={!reachable} aria-current={current ? "step" : undefined} className={cn("flex items-center gap-2 text-[13px] font-semibold", current ? "text-brown-900" : done ? "text-brown-700" : "text-brown-500/60")}>
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-full font-display text-[13px]", current ? "bg-clay-600 text-cream-50" : done ? "bg-brown-900 text-cream-50" : "bg-brown-900/8 text-brown-500")}>{done ? "✓" : i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && <span className={cn("h-px flex-1", done ? "bg-brown-900" : "bg-brown-900/10")} />}
              </li>
            );
          })}
        </ol>

        {error && (
          <div role="alert" className="mt-6 rounded-2xl border border-clay-500/30 bg-clay-500/8 px-4 py-3 text-[14px] text-clay-700">
            {error}
          </div>
        )}

        <div className="relative mt-8 min-h-[420px]">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={(definition) => {
                if (definition === "center" && focusStep.current) {
                  focusStep.current = false;
                  topRef.current?.querySelector<HTMLElement>("h2[id^='step-']")?.focus();
                }
              }}
            >
              {step === 0 && (
                <section aria-labelledby="step-date">
                  <h2 id="step-date" tabIndex={-1} className="font-display text-3xl text-brown-900 outline-none sm:text-4xl">When are you coming in?</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {quickDates(bookable.from)
                      .filter((q) => !bookable.closedDates.includes(q.date) && q.date <= bookable.to)
                      .map((q) => (
                        <button key={q.label} type="button" onClick={() => chooseDate(q.date)} className="h-9 rounded-full border border-brown-900/12 bg-cream-50 px-4 text-[13px] font-semibold text-brown-800 transition hover:border-brown-900">
                          {q.label} · {shortDate(q.date)}
                        </button>
                      ))}
                  </div>
                  <div className="mt-5">
                    <DatePicker from={bookable.from} to={bookable.to} closedDates={bookable.closedDates} value={date} onChange={chooseDate} />
                  </div>
                </section>
              )}

              {step === 1 && (
                <section aria-labelledby="step-party">
                  <h2 id="step-party" tabIndex={-1} className="font-display text-3xl text-brown-900 outline-none sm:text-4xl">How many guests?</h2>
                  <p className="mt-2 text-[15px] text-brown-700">{longDate(date!)}</p>
                  <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
                    {Array.from({ length: settings.maxPartySize - settings.minPartySize + 1 }, (_, i) => settings.minPartySize + i).map((n) => (
                      <button key={n} type="button" onClick={() => chooseParty(n)} aria-pressed={party === n} aria-label={`${n} ${n === 1 ? "guest" : "guests"}`} className={cn("flex aspect-square flex-col items-center justify-center rounded-[18px] border text-brown-900 transition-all", party === n ? "border-clay-600 bg-clay-600 text-cream-50 shadow-glow" : "border-brown-900/10 bg-cream-50 hover:border-brown-900")}>
                        <span className="font-display text-3xl leading-none">{n}</span>
                        <span className={cn("mt-1 text-[11px] uppercase tracking-[0.12em]", party === n ? "text-cream-50/80" : "text-brown-500")}>{n === 1 ? "guest" : "guests"}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-5 text-[13px] text-brown-500">
                    Parties of {settings.largePartyThreshold}+ are held as a request and confirmed by our team. More than {settings.maxPartySize} guests? Call{" "}
                    <a href={tel} className="font-semibold text-brown-900">{restaurant.phone}</a>.
                  </p>
                  <Button variant="ghost" size="sm" className="mt-6 text-brown-700" onClick={() => go(0)}>← Change date</Button>
                </section>
              )}

              {step === 2 && (
                <section aria-labelledby="step-time">
                  <h2 id="step-time" tabIndex={-1} className="font-display text-3xl text-brown-900 outline-none sm:text-4xl">Pick a time</h2>
                  <p className="mt-2 text-[15px] text-brown-700">{longDate(date!)} · party of {party}</p>
                  <div className="mt-6" aria-live="polite">
                    {loadingSlots && (
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-full" />)}
                      </div>
                    )}
                    {!loadingSlots && slots && !slots.ok && (
                      <div className="rounded-[20px] border border-brown-900/10 bg-cream-50 p-6">
                        <p className="font-semibold text-brown-900">{slots.message}</p>
                        <Button size="sm" variant="secondary" className="mt-4" onClick={() => go(0)}>Choose another day</Button>
                      </div>
                    )}
                    {!loadingSlots && slots && slots.ok && <SlotGrid slots={slots.slots} label={slots.label} note={slots.note} value={time} onChoose={chooseTime} onOtherDay={() => go(0)} />}
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button variant="ghost" size="sm" className="text-brown-700" onClick={() => go(1)}>← Change guests</Button>
                    <Button variant="ghost" size="sm" className="text-brown-700" onClick={() => go(0)}>Change date</Button>
                  </div>
                </section>
              )}

              {step === 3 && (
                <section aria-labelledby="step-details">
                  <h2 id="step-details" tabIndex={-1} className="font-display text-3xl text-brown-900 outline-none sm:text-4xl">Who&apos;s the table for?</h2>
                  <form
                    className="mt-6 grid gap-4 sm:grid-cols-2"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (validateDetails()) go(4);
                    }}
                  >
                    <TextField label="First name" name="firstName" autoComplete="given-name" value={details.firstName} error={fieldErrors.firstName} onChange={(v) => setDetails({ ...details, firstName: v })} required />
                    <TextField label="Last name" name="lastName" autoComplete="family-name" value={details.lastName} error={fieldErrors.lastName} onChange={(v) => setDetails({ ...details, lastName: v })} required />
                    <TextField label="Email" name="email" type="email" autoComplete="email" inputMode="email" value={details.email} error={fieldErrors.email} onChange={(v) => setDetails({ ...details, email: v })} required />
                    <TextField label="Phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" value={details.phone} error={fieldErrors.phone} onChange={(v) => setDetails({ ...details, phone: v })} required />
                    {settings.occasions.length > 0 ? (
                      <SelectField label="Occasion" name="occasion" value={details.occasion} options={settings.occasions} onChange={(v) => setDetails({ ...details, occasion: v })} />
                    ) : (
                      <TextField label="Occasion" name="occasion" optional maxLength={60} placeholder="Birthday, anniversary…" value={details.occasion} onChange={(v) => setDetails({ ...details, occasion: v })} />
                    )}
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-[13px] font-semibold text-brown-800">Special requests <span className="font-normal text-brown-500">(optional)</span></span>
                      <textarea name="specialRequests" rows={3} maxLength={500} value={details.specialRequests} onChange={(e) => setDetails({ ...details, specialRequests: e.target.value })} placeholder="Allergies, high chair, celebrating something?" className="w-full rounded-2xl border border-brown-900/12 bg-cream-50 px-4 py-3 text-[15px] text-brown-900 placeholder:text-brown-500/60 focus:border-clay-500 focus:outline-none" />
                    </label>
                    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                      <Button type="submit" size="lg" arrow>Review reservation</Button>
                      <Button type="button" variant="ghost" className="text-brown-700" onClick={() => go(2)}>← Change time</Button>
                    </div>
                  </form>
                </section>
              )}

              {step === 4 && (
                <section aria-labelledby="step-confirm">
                  <h2 id="step-confirm" tabIndex={-1} className="font-display text-3xl text-brown-900 outline-none sm:text-4xl">Everything look right?</h2>
                  <div className="mt-6 rounded-[24px] border border-brown-900/10 bg-cream-50 p-6 shadow-card sm:p-8">
                    <dl className="grid gap-5 sm:grid-cols-3">
                      <div><dt className="eyebrow text-brown-500">Date</dt><dd className="mt-1 font-display text-xl text-brown-900">{longDate(date!)}</dd></div>
                      <div><dt className="eyebrow text-brown-500">Time</dt><dd className="mt-1 font-display text-xl text-brown-900">{time12(time!)}</dd></div>
                      <div><dt className="eyebrow text-brown-500">Party</dt><dd className="mt-1 font-display text-xl text-brown-900">{party} {party === 1 ? "guest" : "guests"}</dd></div>
                    </dl>
                    <div className="mt-5 border-t border-brown-900/10 pt-5 text-[15px] text-brown-700">
                      <p className="font-semibold text-brown-900">{details.firstName} {details.lastName}</p>
                      <p>{details.email} · {details.phone}</p>
                      {details.occasion && <p className="mt-2"><span className="font-semibold">Occasion:</span> {details.occasion}</p>}
                      {details.specialRequests && <p><span className="font-semibold">Requests:</span> {details.specialRequests}</p>}
                    </div>
                  </div>
                  {party! >= settings.largePartyThreshold && (
                    <p className="mt-4 rounded-2xl bg-mostaza-500/20 px-4 py-3 text-[14px] text-brown-800">Parties of {settings.largePartyThreshold}+ are submitted as a request. We&apos;ll confirm by phone or email.</p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button size="lg" onClick={submit} disabled={submitting} arrow={!submitting}>
                      {submitting ? "Reserving…" : "Confirm reservation"}
                    </Button>
                    <Button variant="ghost" className="text-brown-700" onClick={() => go(3)} disabled={submitting}>← Edit details</Button>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <aside className="hidden lg:col-span-4 lg:block">
        <div className="sticky top-28 rounded-[24px] bg-brown-900 p-6 text-cream-50 shadow-lift">
          <p className="eyebrow text-mostaza-400">Your reservation</p>
          <dl className="mt-4 space-y-3">
            <SummaryRow label="Date" value={date ? longDate(date) : "…"} onEdit={date ? () => go(0) : undefined} />
            <SummaryRow label="Guests" value={party ? `${party}` : "…"} onEdit={party ? () => go(1) : undefined} />
            <SummaryRow label="Time" value={time ? time12(time) : "…"} onEdit={time ? () => go(2) : undefined} />
            <SummaryRow label="Name" value={details.firstName ? `${details.firstName} ${details.lastName}` : "…"} onEdit={details.firstName ? () => go(3) : undefined} />
          </dl>
          <div className="mt-6 border-t border-cream-50/10 pt-5 text-[13px] leading-relaxed text-cream-100/70">
            <p className="font-semibold text-cream-50">{restaurant.name}</p>
            <p>{restaurant.addressLine1}, {restaurant.city}, {restaurant.state} {restaurant.zip}</p>
            <p className="mt-2">Questions? Call {restaurant.phone}.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function SlotGrid({ slots, label, note, value, onChoose, onOtherDay }: { slots: SlotInfo[]; label: string | null; note: string | null; value: string | null; onChoose: (t: string) => void; onOtherDay: () => void }) {
  const groups = useMemo(() => {
    if (label) return [{ name: label, slots }];
    const morning = slots.filter((s) => toMinutes(s.time) < 12 * 60);
    const afternoon = slots.filter((s) => toMinutes(s.time) >= 12 * 60);
    return [
      { name: "Desayuno", slots: morning },
      { name: "Comida", slots: afternoon },
    ].filter((g) => g.slots.length);
  }, [slots, label]);
  const anyAvailable = slots.some((s) => s.available);
  return (
    <div className="space-y-6">
      {note && <p className="rounded-2xl bg-mostaza-500/20 px-4 py-2.5 text-[14px] text-brown-800">{note}</p>}
      {!anyAvailable && (
        <div className="rounded-[20px] border border-brown-900/10 bg-cream-50 p-6">
          <p className="font-semibold text-brown-900">No reservations available for this date and party size.</p>
          <Button size="sm" variant="secondary" className="mt-4" onClick={onOtherDay}>Try another day</Button>
        </div>
      )}
      {groups.map((g) => (
        <div key={g.name}>
          <h3 className="eyebrow text-brown-500">{g.name}</h3>
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {g.slots.map((s) => (
              <button
                key={s.time}
                type="button"
                disabled={!s.available}
                onClick={() => onChoose(s.time)}
                aria-pressed={value === s.time}
                title={s.reason === "full" ? "Fully booked" : s.reason === "lead" ? "Too soon, please call us" : s.reason === "past" ? "Already passed" : undefined}
                className={cn(
                  "h-12 rounded-full border text-[15px] font-semibold transition-all",
                  value === s.time ? "border-clay-600 bg-clay-600 text-cream-50 shadow-glow" : s.available ? "border-brown-900/12 bg-cream-50 text-brown-900 hover:border-brown-900" : "cursor-not-allowed border-brown-900/8 bg-brown-900/4 text-brown-900/30 line-through",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-cream-50/10 pb-3">
      <dt className="text-[13px] text-cream-100/70">{label}</dt>
      <dd className="flex items-baseline gap-3 text-right text-[15px] font-semibold">
        {value}
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-[12px] font-semibold text-mostaza-300 hover:underline">
            Edit
          </button>
        )}
      </dd>
    </div>
  );
}

function TextField({ label, error, optional, onChange, ...rest }: { label: string; error?: string; optional?: boolean; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const id = `f-${rest.name}`;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-brown-800">
        {label}
        {optional && <span className="font-normal text-brown-500"> (optional)</span>}
      </span>
      <input id={id} {...rest} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} onChange={(e) => onChange(e.target.value)} className={cn("h-12 w-full rounded-full border bg-cream-50 px-4 text-[15px] text-brown-900 placeholder:text-brown-500/60 focus:outline-none", error ? "border-clay-500 focus:border-clay-500" : "border-brown-900/12 focus:border-clay-500")} />
      {error && <span id={`${id}-err`} className="mt-1 block text-[12px] font-medium text-clay-600">{error}</span>}
    </label>
  );
}

function SelectField({ label, name, value, options, onChange }: { label: string; name: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const id = `f-${name}`;
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-brown-800">{label} <span className="font-normal text-brown-500">(optional)</span></span>
      <select id={id} name={name} value={value} onChange={(e) => onChange(e.target.value)} className="h-12 w-full appearance-none rounded-full border border-brown-900/12 bg-cream-50 px-4 text-[15px] text-brown-900 focus:border-clay-500 focus:outline-none">
        <option value="">No occasion</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
