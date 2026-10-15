import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { DEMO_TODAY } from "@/data/constants";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

/** ₹4,999 — or "Free" when price is 0 and allowFree is set. */
export function formatINR(value: number, opts: { free?: boolean } = {}) {
  if (opts.free && value === 0) return "Free";
  return inr.format(value);
}

/** Compact INR for dashboards: ₹13.6L, ₹1.2Cr */
export function formatINRCompact(value: number) {
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)}Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return inr.format(value);
}

export const formatNumber = (n: number) => num.format(n);

export function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
}

/** 754 → "12:34", 3725 → "1:02:05" */
export function formatClock(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** 5400 → "1h 30m", 720 → "12 min" */
export function formatDuration(totalSec: number) {
  const mins = Math.round(totalSec / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** ISO date (YYYY-MM-DD or full ISO) → "15 Oct 2026" */
export const formatDate = (iso: string, pattern = "d MMM yyyy") => format(parseISO(iso), pattern);

/** "Thu, 15 Oct" */
export const formatDayShort = (iso: string) => format(parseISO(iso), "EEE, d MMM");

/** "19:00" → "7:00 PM" */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Relative to the fixed demo date: "Today", "Tomorrow", "In 4 days", "3 days ago" */
export function relativeDay(iso: string) {
  const diff = differenceInCalendarDays(parseISO(iso.slice(0, 10)), parseISO(DEMO_TODAY));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${-diff} days ago`;
}

export const initials = (name: string) =>
  name
    .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s+/i, "")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
