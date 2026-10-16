/**
 * Synthetic data + helpers for the admin "Engagement" area (community, certificates, notifications).
 * Everything here is illustrative demo data.
 */

import { differenceInMinutes, parseISO } from "date-fns";
import { colleges as seedColleges, getCourse, stageMix } from "@/data";
import { DEMO_NOW, STAGE_META } from "@/data/constants";
import type { College, LearnerStage } from "@/lib/types";

// ---------------------------------------------------------------- time helpers

/** Compact age relative to the fixed demo clock: "45 min", "13 h", "2 d". */
export function ageLabel(iso: string) {
  const mins = Math.max(0, differenceInMinutes(parseISO(DEMO_NOW), parseISO(iso)));
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

export function ageHours(iso: string) {
  return Math.max(0, differenceInMinutes(parseISO(DEMO_NOW), parseISO(iso))) / 60;
}

// ---------------------------------------------------------------- announcements

export type AnnouncementChannel = "in-app" | "email" | "sms";

export const CHANNEL_META: Record<AnnouncementChannel, { label: string; short: string }> = {
  "in-app": { label: "In-app", short: "In-app" },
  email: { label: "Email", short: "Email" },
  sms: { label: "SMS", short: "SMS" },
};

export const CHANNELS: AnnouncementChannel[] = ["in-app", "email", "sms"];

export type Audience =
  | { type: "all" }
  | { type: "stage"; stage: LearnerStage }
  | { type: "course"; courseId: string }
  | { type: "college"; collegeId: string };

export interface Announcement {
  id: string;
  title: string;
  body: string;
  href?: string;
  audience: Audience;
  channels: AnnouncementChannel[];
  status: "sent" | "scheduled";
  /** ISO datetime — when it was sent, or when it is scheduled to go out */
  at: string;
  reach: number;
  /** 0-100; undefined while delivery metrics are still being collected */
  openRate?: number;
  createdBy: string;
}

const TOTAL_LEARNERS = stageMix.reduce((s, m) => s + m.learners, 0);

/** Deterministic audience size, used both for the form estimate and the history. */
export function audienceSize(audience: Audience, colleges: College[] = seedColleges) {
  switch (audience.type) {
    case "all":
      return TOTAL_LEARNERS;
    case "stage":
      return stageMix.find((m) => m.stage === audience.stage)?.learners ?? 0;
    case "course":
      return getCourse(audience.courseId)?.learners ?? 0;
    case "college":
      return colleges.find((c) => c.id === audience.collegeId)?.activeStudents ?? 0;
  }
}

/** Share of the audience reachable on each channel (email/SMS depend on opt-ins). */
export const CHANNEL_REACH: Record<AnnouncementChannel, number> = { "in-app": 1, email: 0.92, sms: 0.78 };

/** Unique learners reached: the best-covered selected channel wins. */
export function estimateReach(audience: Audience, channels: AnnouncementChannel[], colleges?: College[]) {
  const size = audienceSize(audience, colleges);
  if (!channels.length) return 0;
  const share = Math.max(...channels.map((c) => CHANNEL_REACH[c]));
  return Math.round(size * share);
}

export function audienceLabel(audience: Audience, colleges: College[] = seedColleges) {
  switch (audience.type) {
    case "all":
      return "All learners";
    case "stage":
      return STAGE_META[audience.stage].plural;
    case "course":
      return getCourse(audience.courseId)?.title ?? "Course learners";
    case "college":
      return colleges.find((c) => c.id === audience.collegeId)?.name ?? "College students";
  }
}

export function audienceKind(audience: Audience) {
  return { all: "Everyone", stage: "Stage", course: "Course", college: "College" }[audience.type];
}

const seed = (
  a: Omit<Announcement, "reach" | "createdBy"> & { createdBy?: string },
): Announcement => ({ ...a, createdBy: a.createdBy ?? "Aditi Kulkarni", reach: estimateReach(a.audience, a.channels) });

export const seedAnnouncements: Announcement[] = [
  seed({
    id: "an-110",
    title: "Mock GD marathon this Saturday",
    body: "Three back-to-back mock GDs with live evaluator feedback. Sat, 17 Oct · 10:00 AM IST. Seats are limited.",
    href: "/dashboard/sessions",
    audience: { type: "course", courseId: "group-discussion-mastery" },
    channels: ["in-app", "sms"],
    status: "scheduled",
    at: "2026-10-16T18:00:00",
  }),
  seed({
    id: "an-109",
    title: "Diwali break: live classes resume 10 Nov",
    body: "Live cohort classes pause from 7–9 Nov. Recordings and self-paced lessons stay available throughout the break.",
    audience: { type: "all" },
    channels: ["in-app", "email"],
    status: "scheduled",
    at: "2026-11-02T10:00:00",
  }),
  seed({
    id: "an-108",
    title: "New: Placement Ready Bundle",
    body: "GD Mastery + Interview Prep + Resume Building, now bundled for placement season.",
    href: "/programs",
    audience: { type: "stage", stage: "college" },
    channels: ["in-app", "email"],
    status: "sent",
    at: "2026-10-10T10:00:00",
    openRate: 46,
  }),
  seed({
    id: "an-107",
    title: "Free webinar: choosing a stream after Class 10",
    body: "Dr. Meera Kapoor walks parents through Science, Commerce and Humanities pathways. Sat, 24 Oct · 6:00 PM IST.",
    href: "/dashboard/sessions",
    audience: { type: "stage", stage: "parent" },
    channels: ["in-app", "email", "sms"],
    status: "sent",
    at: "2026-10-08T18:00:00",
    openRate: 52,
  }),
  seed({
    id: "an-106",
    title: "Interview Preparation · November cohort open",
    body: "Live mock interviews twice a week with Arjun Malhotra. Early-bird seats close on 25 Oct.",
    href: "/courses/interview-preparation",
    audience: { type: "course", courseId: "interview-preparation" },
    channels: ["in-app", "email"],
    status: "sent",
    at: "2026-10-06T11:30:00",
    openRate: 39,
  }),
  seed({
    id: "an-105",
    title: "AIT: Industry Readiness Bootcamp starts Monday",
    body: "Your placement cell has enrolled you in the bootcamp. First session: Mon, 5 Oct · 4:00 PM in the seminar hall and online.",
    href: "/campus",
    audience: { type: "college", collegeId: "col-ait" },
    channels: ["in-app", "sms"],
    status: "sent",
    at: "2026-10-03T09:15:00",
    openRate: 71,
  }),
  seed({
    id: "an-104",
    title: "Scheduled maintenance on Sunday, 4–5 AM",
    body: "The platform will be briefly unavailable for upgrades. Your progress and bookings are safe.",
    audience: { type: "all" },
    channels: ["in-app", "email"],
    status: "sent",
    at: "2026-09-26T17:00:00",
    openRate: 28,
  }),
  seed({
    id: "an-103",
    title: "Career Compass assessment refreshed",
    body: "New questions on work values and a clearer results report. Retake it to update your recommendations.",
    href: "/dashboard/assessments",
    audience: { type: "stage", stage: "graduate" },
    channels: ["in-app"],
    status: "sent",
    at: "2026-09-22T12:00:00",
    openRate: 34,
  }),
  seed({
    id: "an-102",
    title: "Leadership Essentials: October seats filling fast",
    body: "Evening live cohort for first-time managers starts 6 Oct. 8 seats left.",
    href: "/courses/leadership-essentials",
    audience: { type: "stage", stage: "professional" },
    channels: ["email"],
    status: "sent",
    at: "2026-09-15T10:00:00",
    openRate: 31,
  }),
  seed({
    id: "an-101",
    title: "Welcome to your new CDL dashboard",
    body: "Track courses, live sessions, mentoring and certificates in one place. Take a quick tour.",
    href: "/dashboard",
    audience: { type: "all" },
    channels: ["in-app", "email", "sms"],
    status: "sent",
    at: "2026-09-01T10:00:00",
    openRate: 58,
  }),
];

// ---------------------------------------------------------------- certificates

export const REVOKE_REASONS = [
  "Issued in error",
  "Academic integrity concern",
  "Course requirements not met",
  "Duplicate certificate",
  "Learner requested correction",
] as const;

export const CERT_SIGNATORIES = [
  { name: "Dr. Meera Kapoor", role: "Academic Director", signature: "Meera Kapoor" },
  { name: "Aditi Kulkarni", role: "Platform Administrator", signature: "Aditi Kulkarni" },
] as const;

// ---------------------------------------------------------------- community

/** Synthetic first-response time (hours) per ticket, for the summary card. */
export const AVG_FIRST_RESPONSE = "3.4 h";
