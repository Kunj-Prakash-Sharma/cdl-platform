"use client";

import { useMemo } from "react";
import { bookings as seedBookings, getCohort, liveSessions } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import type { Booking, Cohort, LiveSession } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useMyBookings, useMyEnrollments } from "@/store/hooks";
import { isOpenSession } from "./engagement-utils";

export interface SessionEntry {
  session: LiveSession;
  /** The current user's active booking for this session, if any */
  booking?: Booking;
  /** Part of one of the user's Live Cohorts */
  inCohort: boolean;
  /** inCohort || booked */
  mine: boolean;
  open: boolean;
  seatsTaken: number;
  seatsLeft: number;
  full: boolean;
  isToday: boolean;
  isPast: boolean;
  /** The session's intended audience includes the user's stage */
  forMyStage: boolean;
}

const SEED_STATUS = new Map(seedBookings.map((b) => [b.id, b.status]));

/**
 * Everything the Live Sessions screens need, derived from seed sessions + the demo store:
 * my cohort sessions, my booked sessions, open (bookable) sessions and live seat counts.
 */
export function useSessionsModel() {
  const { user } = useCurrentUser();
  const enrollments = useMyEnrollments();
  const myBookings = useMyBookings();
  const allBookings = useDemoStore((s) => s.bookings);
  const stage = user.stage;

  return useMemo(() => {
    const cohortIds = new Set(enrollments.filter((e) => e.format === "live-cohort" && e.cohortId).map((e) => e.cohortId!));
    const cohorts = [...cohortIds].map((id) => getCohort(id)).filter((c): c is Cohort => Boolean(c));

    // Seats change as demo bookings are made or cancelled.
    const delta = new Map<string, number>();
    for (const b of allBookings) {
      if (b.kind !== "live-session" || !b.sessionId) continue;
      const seed = SEED_STATUS.get(b.id);
      if (!seed && b.status !== "cancelled") delta.set(b.sessionId, (delta.get(b.sessionId) ?? 0) + 1);
      if (seed && seed !== "cancelled" && b.status === "cancelled") delta.set(b.sessionId, (delta.get(b.sessionId) ?? 0) - 1);
    }

    const bookingBySession = new Map<string, Booking>();
    for (const b of myBookings) {
      if (b.kind === "live-session" && b.sessionId && b.status !== "cancelled") bookingBySession.set(b.sessionId, b);
    }

    const entries: SessionEntry[] = liveSessions
      .filter((s) => !s.collegeId)
      .map((session) => {
        const booking = bookingBySession.get(session.id);
        const inCohort = Boolean(session.cohortId && cohortIds.has(session.cohortId));
        const seatsTaken = Math.min(session.capacity, Math.max(0, session.booked + (delta.get(session.id) ?? 0)));
        return {
          session,
          booking,
          inCohort,
          mine: inCohort || Boolean(booking),
          open: isOpenSession(session),
          seatsTaken,
          seatsLeft: session.capacity - seatsTaken,
          full: seatsTaken >= session.capacity,
          isToday: session.date === DEMO_TODAY,
          isPast: session.status === "completed" || session.date < DEMO_TODAY,
          forMyStage: session.audience.includes(stage),
        };
      });

    const byId = new Map(entries.map((e) => [e.session.id, e]));
    const upcoming = entries.filter((e) => e.mine && !e.isPast && e.session.status !== "cancelled");
    const recordings = entries
      .filter((e) => e.isPast && e.session.recording && (e.mine || (e.open && e.forMyStage)))
      .sort((a, b) => (b.session.date + b.session.time).localeCompare(a.session.date + a.session.time));
    const bookable = entries.filter((e) => e.open && !e.isPast && e.session.status === "scheduled");
    const mentoring = myBookings.filter((b) => b.kind === "mentoring" && b.status !== "cancelled");

    return { entries, byId, cohorts, upcoming, recordings, bookable, mentoring };
  }, [enrollments, myBookings, allBookings, stage]);
}

export type SessionsModel = ReturnType<typeof useSessionsModel>;
