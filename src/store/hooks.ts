"use client";

import { useMemo, useSyncExternalStore } from "react";
import { addDays, format, getDay, parseISO } from "date-fns";
import { courseLessons, courses, getCourse, getUser, isSlotTaken, liveSessions, mentors } from "@/data";
import { DEMO_LEARNER_ID, DEMO_PARENT_ID, DEMO_TODAY } from "@/data/constants";
import type { Course, Mentor } from "@/lib/types";
import { useDemoStore } from "./demo-store";

/** True once persisted demo state has been restored from localStorage. */
export function useHydrated() {
  return useSyncExternalStore(
    (onChange) => useDemoStore.persist.onFinishHydration(onChange),
    () => useDemoStore.persist.hasHydrated(),
    () => false,
  );
}

/** The B2C user currently "logged in" for the demo: Riya (learner) or Sunita (parent). */
export function useCurrentUser() {
  const role = useDemoStore((s) => s.role);
  const overrides = useDemoStore((s) => s.profileOverrides);
  const userId = role === "parent" ? DEMO_PARENT_ID : DEMO_LEARNER_ID;
  const user = useMemo(() => ({ ...getUser(userId)!, ...overrides[userId] }), [userId, overrides]);
  return { user, userId, role, isParent: role === "parent" };
}

export function useMyEnrollments(userId?: string) {
  const { userId: current } = useCurrentUser();
  const id = userId ?? current;
  const enrollments = useDemoStore((s) => s.enrollments);
  return useMemo(
    () =>
      enrollments
        .filter((e) => e.userId === id)
        .map((e) => ({ ...e, course: getCourse(e.courseId)! }))
        .filter((e) => e.course),
    [enrollments, id],
  );
}

export function useEnrollment(courseId: string, userId?: string) {
  const { userId: current } = useCurrentUser();
  const id = userId ?? current;
  const enrollments = useDemoStore((s) => s.enrollments);
  return useMemo(() => enrollments.find((e) => e.userId === id && e.courseId === courseId), [enrollments, id, courseId]);
}

/** Progress for the demo learner on a course (lesson completion is tracked for the demo user only). */
export function useCourseProgress(courseOrId: Course | string) {
  const course = typeof courseOrId === "string" ? getCourse(courseOrId) : courseOrId;
  const completedIds = useDemoStore((s) => (course ? s.lessonProgress[course.id] : undefined));
  const lastLessonId = useDemoStore((s) => (course ? s.lastLesson[course.id] : undefined));
  return useMemo(() => {
    if (!course) return { completed: [] as string[], percent: 0, total: 0, done: 0, nextLessonId: undefined, isComplete: false };
    const lessons = courseLessons(course);
    const completed = completedIds ?? [];
    const done = lessons.filter((l) => completed.includes(l.id)).length;
    const nextLesson = lessons.find((l) => !completed.includes(l.id));
    return {
      completed,
      done,
      total: lessons.length,
      percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0,
      nextLessonId: lastLessonId && !completed.includes(lastLessonId) ? lastLessonId : (nextLesson?.id ?? lessons[0]?.id),
      isComplete: done === lessons.length && lessons.length > 0,
    };
  }, [course, completedIds, lastLessonId]);
}

export function useMyBookings(userId?: string) {
  const { userId: current } = useCurrentUser();
  const id = userId ?? current;
  const bookings = useDemoStore((s) => s.bookings);
  return useMemo(
    () => bookings.filter((b) => b.userId === id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings, id],
  );
}

export function useUnreadCount() {
  return useDemoStore((s) => s.notifications.filter((n) => !n.read).length);
}

/** Course list with admin status overrides applied. */
export function useCourses() {
  const status = useDemoStore((s) => s.courseStatus);
  return useMemo(() => courses.map((c) => (status[c.id] ? { ...c, status: status[c.id] } : c)), [status]);
}

/** Mentor list with admin approval overrides applied. */
export function useMentors() {
  const status = useDemoStore((s) => s.mentorStatus);
  return useMemo(() => mentors.map((m) => (status[m.id] ? { ...m, status: status[m.id] } : m)), [status]);
}

/** Mentoring slots are treated as one-hour blocks when checking clashes with live classes. */
const SLOT_MINUTES = 60;
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
function overlaps(startA: string, durA: number, startB: string, durB: number) {
  const a = toMinutes(startA);
  const b = toMinutes(startB);
  return a < b + durB && b < a + durA;
}

export interface MentorDaySlots {
  date: string; // YYYY-MM-DD
  slots: { time: string; available: boolean }[];
}

/**
 * Bookable slots for a mentor over the next `days` days, starting tomorrow.
 * Combines the mentor's weekly pattern, seeded bookings, demo bookings and any slots the mentor
 * blocked/opened in the Mentor Portal.
 */
export function useMentorSlots(mentor: Mentor | undefined, days = 21, fromDate = DEMO_TODAY): MentorDaySlots[] {
  const bookings = useDemoStore((s) => s.bookings);
  const blocked = useDemoStore((s) => (mentor ? s.blockedSlots[mentor.id] : undefined));
  const extra = useDemoStore((s) => (mentor ? s.extraSlots[mentor.id] : undefined));
  return useMemo(() => {
    if (!mentor) return [];
    const out: MentorDaySlots[] = [];
    for (let i = 1; i <= days; i++) {
      const day = addDays(parseISO(fromDate), i);
      const date = format(day, "yyyy-MM-dd");
      const patternTimes = mentor.availability.weekdays.includes(getDay(day)) ? mentor.availability.times : [];
      const extraTimes = (extra ?? []).filter((k) => k.startsWith(date)).map((k) => k.split("|")[1]);
      const times = Array.from(new Set([...patternTimes, ...extraTimes])).sort();
      if (!times.length) continue;
      out.push({
        date,
        slots: times.map((time) => {
          const key = `${date}|${time}`;
          const bookedNow = bookings.some((b) => b.mentorId === mentor.id && b.date === date && b.time === time && b.status !== "cancelled");
          const isExtra = extra?.includes(key);
          const teaching = liveSessions.some(
            (s) => s.mentorId === mentor.id && s.date === date && s.status !== "cancelled" && overlaps(s.time, s.durationMin, time, SLOT_MINUTES),
          );
          const taken = bookedNow || teaching || (!isExtra && isSlotTaken(mentor.id, date, time)) || blocked?.includes(key);
          return { time, available: !taken };
        }),
      });
    }
    return out;
  }, [mentor, days, fromDate, bookings, blocked, extra]);
}
