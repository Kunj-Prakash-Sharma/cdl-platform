"use client";

import { useMemo } from "react";
import { addDays, differenceInMinutes, format, parseISO } from "date-fns";
import {
  cohorts,
  courses,
  coursesByMentor,
  getCourse,
  getMentor,
  getMentorOffer,
  getSession,
  getUser,
  liveSessions,
  resources,
} from "@/data";
import { DEMO_MENTOR_ID, DEMO_NOW, DEMO_TODAY } from "@/data/constants";
import type { Booking, ContentItem, Course, LiveSession, Mentor } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useMentors } from "@/store/hooks";

// ---------- Static context for the signed-in mentor (Kavya Nair) ----------

export const MENTOR_ID = DEMO_MENTOR_ID;
export const baseMentor = getMentor(MENTOR_ID)!;
export const MENTOR_NAME = baseMentor.name;
export const myCourses: Course[] = coursesByMentor(MENTOR_ID);
export const myCourseIds = myCourses.map((c) => c.id);
export const myCohorts = cohorts.filter((c) => c.mentorId === MENTOR_ID);
export const mySessions: LiveSession[] = liveSessions.filter((s) => s.mentorId === MENTOR_ID);
export const myResources = resources.filter((r) => myCourseIds.includes(r.courseId));
/** "10:30" — the fixed demo clock time on DEMO_TODAY */
export const NOW_TIME = DEMO_NOW.slice(11, 16);

export const isMyCourse = (courseId: string) => myCourseIds.includes(courseId);

export const SESSION_TYPE_LABEL: Record<LiveSession["type"], string> = {
  "cohort-class": "Cohort class",
  "doubt-clearing": "Doubt-clearing hour",
  workshop: "Workshop",
  webinar: "Webinar",
};

export const COURSE_SHORT: Record<string, string> = {
  "communication-skills": "Communication Skills",
  "public-speaking-confidence": "Public Speaking",
};

export const courseShort = (courseId: string) => COURSE_SHORT[courseId] ?? getCourse(courseId)?.title ?? "Course";

// ---------- Time helpers ----------

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const endTime = (time: string, durationMin: number) => {
  const total = toMinutes(time) + durationMin;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

export function overlaps(startA: string, durA: number, startB: string, durB: number) {
  const a = toMinutes(startA);
  const b = toMinutes(startB);
  return a < b + durB && b < a + durA;
}

/** "In 7h", "In 25 min", "Now", "Ended" — relative to the fixed demo clock. */
export function startsIn(date: string, time: string, durationMin = 60) {
  const mins = differenceInMinutes(parseISO(`${date}T${time}:00`), parseISO(DEMO_NOW));
  if (mins > 24 * 60) return undefined;
  if (mins > 90) return `Starts in ${Math.round(mins / 60)}h`;
  if (mins > 0) return `Starts in ${mins} min`;
  if (mins > -durationMin) return "Live now";
  return "Ended";
}

/** Next `n` dates after DEMO_TODAY (YYYY-MM-DD). */
export const nextDates = (n: number, includeToday = false) =>
  Array.from({ length: n }, (_, i) => format(addDays(parseISO(DEMO_TODAY), includeToday ? i : i + 1), "yyyy-MM-dd"));

// ---------- Lookups ----------

export function learnerOf(userId: string) {
  const user = getUser(userId);
  return {
    name: user?.name ?? "Learner",
    firstName: (user?.name ?? "Learner").split(" ")[0],
    avatar: user?.avatar,
    user,
  };
}

/** Title for a booking: the mentoring offer, or the live session it reserves a seat in. */
export function bookingTitle(b: Booking) {
  if (b.kind === "live-session") return b.sessionId ? (getSession(b.sessionId)?.title ?? "Live session seat") : "Live session seat";
  return (b.offerId && getMentorOffer(b.offerId)?.offer.title) || "Mentoring session";
}

export function bookingTypeLabel(b: Booking) {
  if (b.kind === "live-session") {
    const s = b.sessionId ? getSession(b.sessionId) : undefined;
    return s ? `${SESSION_TYPE_LABEL[s.type]} seat` : "Live session seat";
  }
  return "1:1 Mentoring";
}

export function chapterTitle(courseId: string, chapterId: string) {
  return getCourse(courseId)?.chapters.find((c) => c.id === chapterId)?.title ?? "New chapter (pending review)";
}

export const byDateTime = <T extends { date: string; time: string }>(a: T, b: T) => (a.date + a.time).localeCompare(b.date + b.time);

/** Courses a mentor can recommend after a session: her own programmes plus their related programmes. */
export const recommendableCourses: Course[] = Array.from(
  new Set([...myCourseIds, ...myCourses.flatMap((c) => c.relatedIds)]),
)
  .map((id) => courses.find((c) => c.id === id))
  .filter((c): c is Course => Boolean(c) && !c?.collegeId)
  .slice(0, 6);

// ---------- Profile completeness ----------

export function profileChecklist(m: Pick<Mentor, "headline" | "bio" | "expertise" | "languages" | "offers" | "availability">, extras: { introVideo?: boolean } = {}) {
  return [
    { label: "Profile photo", done: true },
    { label: "Headline", done: m.headline.trim().length >= 20 },
    { label: "Bio (150+ characters)", done: m.bio.trim().length >= 150 },
    { label: "At least 3 areas of expertise", done: m.expertise.length >= 3 },
    { label: "Languages", done: m.languages.length >= 1 },
    { label: "Session offers with rates", done: m.offers.length >= 1 },
    { label: "Weekly availability", done: m.availability.weekdays.length > 0 },
    { label: "Associated programmes", done: true },
    { label: "Verified credentials", done: true },
    { label: "60-second intro video", done: Boolean(extras.introVideo) },
  ];
}

export const completeness = (items: { done: boolean }[]) => Math.round((items.filter((i) => i.done).length / items.length) * 100);

// ---------- Store-backed hooks ----------

/** Kavya's mentor record with any admin approval override applied. */
export function useMentorProfile() {
  const mentors = useMentors();
  return useMemo(() => mentors.find((m) => m.id === MENTOR_ID) ?? baseMentor, [mentors]);
}

/** All of Kavya's bookings (1:1 mentoring + seats in her live sessions), chronological. */
export function useMentorBookings() {
  const bookings = useDemoStore((s) => s.bookings);
  return useMemo(() => bookings.filter((b) => b.mentorId === MENTOR_ID).sort(byDateTime), [bookings]);
}

export function useMentorThreads() {
  const threads = useDemoStore((s) => s.threads);
  return useMemo(() => threads.filter((t) => myCourseIds.includes(t.courseId)), [threads]);
}

export function useMentorContent() {
  const items = useDemoStore((s) => s.contentItems);
  return useMemo(() => items.filter((c) => c.mentorId === MENTOR_ID), [items]);
}

export const CONTENT_STATUS_LABEL: Record<ContentItem["status"], string> = {
  published: "Published",
  "in-review": "In review",
  draft: "Draft",
  "changes-requested": "Changes requested",
};

// ---------- Unified schedule items (calendar, agenda, today) ----------

export interface ScheduleItem {
  id: string;
  kind: "booking" | "session";
  date: string;
  time: string;
  durationMin: number;
  title: string;
  subtitle: string;
  status: string;
  booking?: Booking;
  session?: LiveSession;
}

export function sessionToItem(s: LiveSession): ScheduleItem {
  const cohort = s.cohortId ? cohorts.find((c) => c.id === s.cohortId) : undefined;
  return {
    id: s.id,
    kind: "session",
    date: s.date,
    time: s.time,
    durationMin: s.durationMin,
    title: s.title,
    subtitle: `${SESSION_TYPE_LABEL[s.type]} · ${s.type === "cohort-class" && cohort ? cohort.name : courseShort(s.courseId)}`,
    status: s.status,
    session: s,
  };
}

export function bookingToItem(b: Booking): ScheduleItem {
  const learner = learnerOf(b.userId);
  return {
    id: b.id,
    kind: "booking",
    date: b.date,
    time: b.time,
    durationMin: b.durationMin,
    title: b.kind === "mentoring" ? `${learner.name} · ${bookingTitle(b)}` : `${learner.name} · seat booking`,
    subtitle: b.topic ?? bookingTypeLabel(b),
    status: b.status,
    booking: b,
  };
}

/** Kavya's 1:1 bookings + her live sessions as one chronological list (cancelled items excluded unless asked). */
export function useScheduleItems({ includeCancelled = false } = {}) {
  const bookings = useMentorBookings();
  return useMemo(() => {
    const items = [
      ...bookings.filter((b) => b.kind === "mentoring" && (includeCancelled || b.status !== "cancelled")).map(bookingToItem),
      ...mySessions.filter((s) => includeCancelled || s.status !== "cancelled").map(sessionToItem),
    ];
    return items.sort(byDateTime);
  }, [bookings, includeCancelled]);
}
