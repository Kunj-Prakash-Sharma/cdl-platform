"use client";

import { useCallback, useMemo } from "react";
import { assignments, certificates, courseLessons, getAssessment, getCourse, getMentor, getMentorOffer, getSession, liveSessions } from "@/data";
import { DEMO_NOW, DEMO_TODAY } from "@/data/constants";
import { formatDayShort } from "@/lib/format";
import type { Assignment, Course, LiveSession } from "@/lib/types";
import { useDemoStore, type Submission } from "@/store/demo-store";
import { useCurrentUser, useMyBookings, useMyEnrollments } from "@/store/hooks";
import { generatedCertificateId } from "./utils";

/** Pure progress calculation (mirrors useCourseProgress) for lists and aggregations. */
export function computeProgress(course: Course, completed: string[] | undefined) {
  const lessons = courseLessons(course);
  const done = lessons.filter((l) => completed?.includes(l.id)).length;
  return { done, total: lessons.length, percent: lessons.length ? Math.round((done / lessons.length) * 100) : 0, isComplete: lessons.length > 0 && done === lessons.length };
}

/**
 * Opens a lesson: records it as the last lesson and moves the course to the front of the
 * "recently opened" order so the dashboard's Continue learning card can pick it up.
 */
export function useTouchLesson() {
  const setLastLesson = useDemoStore((s) => s.setLastLesson);
  return useCallback(
    (courseId: string, lessonId: string) => {
      setLastLesson(courseId, lessonId);
      useDemoStore.setState((s) => {
        const rest = { ...s.lastLesson };
        delete rest[courseId];
        return { lastLesson: { [courseId]: lessonId, ...rest } };
      });
    },
    [setLastLesson],
  );
}

/** The course to resume: most recently opened, enrolled, not yet complete. */
export function useContinueCourse() {
  const enrollments = useMyEnrollments();
  const lastLesson = useDemoStore((s) => s.lastLesson);
  const progress = useDemoStore((s) => s.lessonProgress);
  return useMemo(() => {
    const open = enrollments.filter((e) => !computeProgress(e.course, progress[e.courseId]).isComplete);
    for (const courseId of Object.keys(lastLesson)) {
      const e = open.find((x) => x.courseId === courseId);
      if (e) return e;
    }
    return [...open].sort((a, b) => b.enrolledOn.localeCompare(a.enrolledOn))[0];
  }, [enrollments, lastLesson, progress]);
}

export type MyAssignment = Assignment & { submission?: Submission; course: Course };

export function mergeAssignment(a: Assignment, sub: Submission | undefined): MyAssignment {
  return {
    ...a,
    status: sub?.status ?? a.status,
    score: sub?.score ?? a.score,
    feedback: sub?.feedback ?? a.feedback,
    submission: sub,
    course: getCourse(a.courseId)!,
  };
}

/** Assignments & quizzes for the courses the current user is enrolled in, with demo submissions applied. */
export function useMyAssignments() {
  const enrollments = useMyEnrollments();
  const submissions = useDemoStore((s) => s.submissions);
  return useMemo(() => {
    const ids = new Set(enrollments.map((e) => e.courseId));
    return assignments.filter((a) => ids.has(a.courseId)).map((a) => mergeAssignment(a, submissions[a.id]));
  }, [enrollments, submissions]);
}

export type MyCertificate = { id: string; userId: string; courseId: string; issuedOn: string; course: Course; generated?: boolean };

/** Seed certificates plus one for every enrolled course that is now 100% complete. */
export function useMyCertificates(userIdOverride?: string) {
  const { userId: current } = useCurrentUser();
  const userId = userIdOverride ?? current;
  const enrollments = useMyEnrollments(userId);
  const progress = useDemoStore((s) => s.lessonProgress);
  const trackProgress = userId === current;
  return useMemo(() => {
    const seed: MyCertificate[] = certificates
      .filter((c) => c.userId === userId)
      .map((c) => ({ id: c.id, userId: c.userId, courseId: c.courseId, issuedOn: c.issuedOn, course: getCourse(c.courseId)! }));
    const generated: MyCertificate[] = trackProgress
      ? enrollments
          .filter((e) => !seed.some((c) => c.courseId === e.courseId) && computeProgress(e.course, progress[e.courseId]).isComplete)
          .map((e) => ({ id: generatedCertificateId(userId, e.courseId), userId, courseId: e.courseId, issuedOn: DEMO_TODAY, course: e.course, generated: true }))
      : [];
    return [...generated, ...seed.sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))];
  }, [userId, enrollments, progress, trackProgress]);
}

export type UpcomingSession = { session: LiveSession; booked: boolean };

/** Upcoming classes for the user's cohorts plus any live sessions they reserved. */
export function useUpcomingSessions(limit = 3, userId?: string) {
  const enrollments = useMyEnrollments(userId);
  const bookings = useMyBookings(userId);
  return useMemo(() => {
    const cohortIds = new Set(enrollments.map((e) => e.cohortId).filter(Boolean) as string[]);
    const bookedIds = new Set(
      bookings.filter((b) => b.kind === "live-session" && b.status === "confirmed" && b.sessionId).map((b) => b.sessionId as string),
    );
    const out: UpcomingSession[] = [];
    for (const s of liveSessions) {
      if (s.date < DEMO_TODAY || s.status === "completed" || s.status === "cancelled") continue;
      const inCohort = Boolean(s.cohortId && cohortIds.has(s.cohortId) && (s.type !== "doubt-clearing" || bookedIds.has(s.id)));
      if (inCohort || bookedIds.has(s.id)) out.push({ session: s, booked: bookedIds.has(s.id) });
    }
    // Booked sessions that aren't in the generated list (defensive)
    for (const id of bookedIds) {
      if (!out.some((o) => o.session.id === id)) {
        const s = getSession(id);
        if (s && s.date >= DEMO_TODAY) out.push({ session: s, booked: true });
      }
    }
    out.sort((a, b) => (a.session.date + a.session.time).localeCompare(b.session.date + b.session.time));
    return out.slice(0, limit);
  }, [enrollments, bookings, limit]);
}

/** Next scheduled class for a cohort. */
export function nextCohortClass(cohortId: string | undefined) {
  if (!cohortId) return undefined;
  return liveSessions.find((s) => s.cohortId === cohortId && s.type === "cohort-class" && s.date >= DEMO_TODAY && s.status === "scheduled");
}

/** Illustrative completion times for the demo learner's seeded lesson progress. */
const SEED_LESSON_TIMES: Record<string, string> = {
  "cdf-1": "2026-03-05T19:20:00", "cdf-2": "2026-03-07T20:05:00", "cdf-3": "2026-03-10T18:40:00", "cdf-4": "2026-03-13T21:10:00",
  "cdf-5": "2026-03-16T19:45:00", "cdf-6": "2026-03-19T20:30:00", "cdf-7": "2026-03-21T18:15:00",
  "rsb-1": "2026-04-13T20:00:00", "rsb-2": "2026-04-16T21:00:00", "rsb-3": "2026-04-20T19:30:00", "rsb-4": "2026-04-24T20:10:00",
  "rsb-5": "2026-04-28T19:05:00", "rsb-6": "2026-05-01T18:50:00",
  "gdm-1": "2026-10-07T21:15:00", "gdm-2": "2026-10-09T20:30:00", "gdm-3": "2026-10-14T21:40:00",
  "inp-1": "2026-10-03T19:10:00", "inp-2": "2026-10-12T22:05:00",
};

export type ActivityKind = "lesson" | "submission" | "booking" | "order" | "result" | "thread";
export interface ActivityItem {
  id: string;
  at: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  href: string;
}

/** A timeline derived from everything the user has done in the demo data. */
export function useRecentActivity(limit = 7) {
  const { userId } = useCurrentUser();
  const enrollments = useMyEnrollments();
  const lessonProgress = useDemoStore((s) => s.lessonProgress);
  const submissions = useDemoStore((s) => s.submissions);
  const bookingsAll = useDemoStore((s) => s.bookings);
  const orders = useDemoStore((s) => s.orders);
  const results = useDemoStore((s) => s.assessmentResults);
  const threads = useDemoStore((s) => s.threads);
  return useMemo(() => {
    const items: ActivityItem[] = [];
    for (const e of enrollments) {
      const lessons = courseLessons(e.course);
      for (const lessonId of lessonProgress[e.courseId] ?? []) {
        const lesson = lessons.find((l) => l.id === lessonId);
        if (!lesson) continue;
        items.push({
          id: `l-${lessonId}`,
          at: SEED_LESSON_TIMES[lessonId] ?? DEMO_NOW,
          kind: "lesson",
          title: `Completed “${lesson.title}”`,
          detail: e.course.title,
          href: `/dashboard/learn/${e.courseId}`,
        });
      }
    }
    const enrolledIds = new Set(enrollments.map((e) => e.courseId));
    for (const a of assignments) {
      if (!enrolledIds.has(a.courseId)) continue;
      const sub = submissions[a.id];
      const course = getCourse(a.courseId)!;
      if (sub?.submittedAt && sub.status !== "in-progress") {
        items.push({
          id: `s-${a.id}`,
          at: sub.submittedAt,
          kind: "submission",
          title: sub.status === "graded" ? `${a.kind === "quiz" ? "Quiz" : "Assignment"} graded: ${a.title}` : `Submitted “${a.title}”`,
          detail: sub.score !== undefined ? `${course.title} · ${sub.score}/${a.points} points` : `${course.title} · awaiting mentor review`,
          href: `/dashboard/assignments/${a.id}`,
        });
      } else if (!sub && a.status === "graded") {
        items.push({
          id: `s-${a.id}`,
          at: `${a.dueDate}T12:00:00`,
          kind: "submission",
          title: `Feedback received on “${a.title}”`,
          detail: `${course.title} · ${a.score}/${a.points} points`,
          href: `/dashboard/assignments/${a.id}`,
        });
      }
    }
    for (const b of bookingsAll) {
      if (b.userId !== userId) continue;
      const mentor = getMentor(b.mentorId);
      if (b.kind === "live-session") {
        const s = b.sessionId ? getSession(b.sessionId) : undefined;
        items.push({ id: `b-${b.id}`, at: b.createdAt, kind: "booking", title: `Reserved a seat: ${s?.title ?? "Live session"}`, detail: `${mentor?.name ?? ""} · ${formatDayShort(b.date)}`, href: "/dashboard/sessions" });
      } else {
        const offer = b.offerId ? getMentorOffer(b.offerId)?.offer : undefined;
        items.push({ id: `b-${b.id}`, at: b.createdAt, kind: "booking", title: `Booked ${offer?.title ?? "a mentoring session"}`, detail: `with ${mentor?.name ?? "mentor"}`, href: "/dashboard/mentoring" });
        if (b.status === "completed") {
          items.push({ id: `bc-${b.id}`, at: `${b.date}T${b.time}:00`, kind: "booking", title: `Attended ${offer?.title ?? "mentoring session"}`, detail: `with ${mentor?.name ?? "mentor"} · notes shared`, href: "/dashboard/mentoring" });
        }
      }
    }
    for (const o of orders) {
      if (o.userId !== userId) continue;
      items.push({ id: `o-${o.id}`, at: o.createdAt, kind: "order", title: `Purchased ${o.items[0]?.title ?? "an item"}`, detail: `Order ${o.id} · simulated payment`, href: "/dashboard/orders" });
    }
    for (const r of results) {
      if (r.userId !== userId) continue;
      items.push({ id: `r-${r.id}`, at: `${r.completedOn}T12:00:00`, kind: "result", title: `Completed ${getAssessment(r.assessmentId)?.title ?? "an assessment"}`, detail: "Report ready", href: `/assessment/report/${r.id}` });
    }
    for (const t of threads) {
      if (t.authorId !== userId) continue;
      items.push({ id: `t-${t.id}`, at: t.createdAt, kind: "thread", title: `Asked: ${t.title}`, detail: `${getCourse(t.courseId)?.title ?? ""} · ${t.replies.length} ${t.replies.length === 1 ? "reply" : "replies"}`, href: "/dashboard/discussions" });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  }, [userId, enrollments, lessonProgress, submissions, bookingsAll, orders, results, threads, limit]);
}
