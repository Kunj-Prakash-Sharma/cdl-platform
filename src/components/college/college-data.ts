/**
 * Derived, deterministic data for the B2B college portal and the college-branded student portal.
 * Everything here is synthetic demo data computed once at module scope (no Math.random in render).
 */
import { addDays, differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { cohorts, collegeStudents, getCourse, liveSessions } from "@/data";
import { DEMO_COLLEGE_ID, DEMO_TODAY } from "@/data/constants";
import type { CollegeStudent, Course, LiveSession } from "@/lib/types";

export const AIT_COURSE_ID = "ait-industry-readiness";

export const AIT_STUDENTS: CollegeStudent[] = collegeStudents.filter((s) => s.collegeId === DEMO_COLLEGE_ID);
export const AIT_COHORTS = cohorts.filter((c) => c.collegeId === DEMO_COLLEGE_ID);
export const AIT_SESSIONS: LiveSession[] = liveSessions.filter((s) => s.collegeId === DEMO_COLLEGE_ID);

/** Short label for a college cohort: "Batch A" */
export const cohortShort = (cohortId?: string) => {
  const c = cohorts.find((x) => x.id === cohortId);
  return c ? (c.name.split("·")[1]?.trim() ?? c.name) : "—";
};

/** "Class 6: Mock interviews" → "Mock interviews" */
export const sessionTopic = (title: string) => title.replace(/^Class \d+:\s*/, "");
export const sessionNumber = (title: string) => title.match(/^Class (\d+)/)?.[1];

export function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Small seeded PRNG (mulberry32) — used only at module scope to precompute series. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- Students ----------

export function overallProgress(s: CollegeStudent) {
  const ids = s.assignedCourseIds;
  if (!ids.length) return 0;
  return Math.round(ids.reduce((sum, id) => sum + (s.progress[id] ?? 0), 0) / ids.length);
}

export const daysSinceActive = (s: CollegeStudent) => differenceInCalendarDays(parseISO(DEMO_TODAY), parseISO(s.lastActive));

export function attentionReasons(s: CollegeStudent) {
  const reasons: string[] = [];
  const days = daysSinceActive(s);
  if (days > 7) reasons.push(`Inactive for ${days} days`);
  const p = overallProgress(s);
  if (p < 35) reasons.push(`Low progress (${p}%)`);
  return reasons;
}

export const needsAttention = (s: CollegeStudent) => attentionReasons(s).length > 0;

export const PROGRESS_BANDS = [
  { id: "0-25", label: "0–25%", min: 0, max: 25 },
  { id: "25-50", label: "25–50%", min: 25, max: 50 },
  { id: "50-75", label: "50–75%", min: 50, max: 75 },
  { id: "75-100", label: "75–100%", min: 75, max: 101 },
] as const;

export const inBand = (p: number, bandId: string) => {
  const band = PROGRESS_BANDS.find((b) => b.id === bandId);
  return band ? p >= band.min && p < band.max : true;
};

export const STUDENT_YEARS = Array.from(new Set(AIT_STUDENTS.map((s) => s.year)));

/** Department roster sizes at full scale (412 active students). */
export const DEPARTMENT_SIZE: Record<string, number> = {
  "Computer Science": 148,
  Mechanical: 82,
  Electronics: 76,
  Civil: 58,
  MBA: 48,
};

export const SAMPLE_ASSESSMENT_RATE = Math.round((AIT_STUDENTS.filter((s) => s.assessmentCompleted).length / AIT_STUDENTS.length) * 100);

// ---------- Programs ----------

/** Licence allocation per program (synthetic). Programs without seeded student records fall back to these values. */
const ROLLOUT: Record<string, { assigned: number; fallbackProgress: number; assignedOn: string }> = {
  "campus-placement-readiness": { assigned: 364, fallbackProgress: 52, assignedOn: "2026-06-18" },
  "group-discussion-mastery": { assigned: 412, fallbackProgress: 63, assignedOn: "2026-06-18" },
  "interview-preparation": { assigned: 412, fallbackProgress: 39, assignedOn: "2026-07-01" },
  "resume-building": { assigned: 286, fallbackProgress: 24, assignedOn: "2026-09-29" },
  "communication-skills": { assigned: 48, fallbackProgress: 81, assignedOn: "2026-07-01" },
  [AIT_COURSE_ID]: { assigned: 364, fallbackProgress: 60, assignedOn: "2026-08-04" },
};

export function programStats(courseId: string) {
  const sample = AIT_STUDENTS.filter((s) => s.assignedCourseIds.includes(courseId));
  const rollout = ROLLOUT[courseId];
  const avgProgress = sample.length
    ? Math.round(sample.reduce((sum, s) => sum + (s.progress[courseId] ?? 0), 0) / sample.length)
    : (rollout?.fallbackProgress ?? 0);
  const completed = sample.filter((s) => (s.progress[courseId] ?? 0) >= 100).length;
  const completionRate = sample.length ? Math.round((completed / sample.length) * 100) : Math.round((rollout?.fallbackProgress ?? 0) / 4);
  return {
    assigned: rollout?.assigned ?? 0,
    assignedOn: rollout?.assignedOn,
    avgProgress,
    completionRate,
    sampleSize: sample.length,
    cohorts: AIT_COHORTS.filter((c) => c.courseId === courseId),
  };
}

export const isCollegeCourse = (course: Pick<Course, "collegeId">) => Boolean(course.collegeId);

export function coursesFromIds(ids: string[]) {
  return ids.map((id) => getCourse(id)).filter((c): c is Course => Boolean(c));
}

/** Short program names for chart axes. */
export const PROGRAM_SHORT: Record<string, string> = {
  "campus-placement-readiness": "Placement Readiness",
  "group-discussion-mastery": "GD Mastery",
  "interview-preparation": "Interview Prep",
  "resume-building": "Resume Building",
  "communication-skills": "Communication",
  [AIT_COURSE_ID]: "AIT Bootcamp",
};
export const programShort = (course: Course) => PROGRAM_SHORT[course.id] ?? course.title;

// ---------- Sessions & attendance (synthetic, deterministic) ----------

export const isPast = (s: LiveSession) => s.date < DEMO_TODAY;

export function sessionAttendance(session: LiveSession) {
  if (session.date >= DEMO_TODAY) return null;
  const rate = 72 + (hash(session.id) % 21); // 72–92%
  return { rate, attended: Math.round((session.booked * rate) / 100), enrolled: session.booked };
}

/** Whether a sample student attended a past class (synthetic). */
export function studentAttended(student: CollegeStudent, session: LiveSession) {
  if (!session.cohortId || student.cohortId !== session.cohortId) return false;
  if (session.date >= DEMO_TODAY) return false;
  if (student.lastActive < session.date) return false; // inactive since before this class
  return hash(`${student.id}|${session.id}`) % 7 !== 0;
}

export function sessionsForCohort(cohortId: string) {
  return AIT_SESSIONS.filter((s) => s.cohortId === cohortId);
}

export const SESSIONS_THIS_MONTH = AIT_SESSIONS.filter((s) => s.date.slice(0, 7) === DEMO_TODAY.slice(0, 7)).length;

// ---------- Weekly engagement (12 weeks, Monday week starts) ----------

export const LICENSED_ACTIVE = 412;
const CURRENT_WEEK_START = "2026-10-12";
const WEEKS = 12;

export interface WeekRow {
  week: string;
  label: string;
  active: number;
  activeRate: number;
  lessons: number;
  hours: number;
  assessments: number;
  attendanceA: number | null;
  attendanceB: number | null;
}

function weekAttendance(cohortId: string, start: string) {
  const end = format(addDays(parseISO(start), 6), "yyyy-MM-dd");
  const list = AIT_SESSIONS.filter((s) => s.cohortId === cohortId && s.date >= start && s.date <= end)
    .map(sessionAttendance)
    .filter((a): a is NonNullable<ReturnType<typeof sessionAttendance>> => Boolean(a));
  if (!list.length) return null;
  return Math.round(list.reduce((s, a) => s + a.rate, 0) / list.length);
}

export const WEEKLY: WeekRow[] = (() => {
  const rand = seeded(20261015);
  return Array.from({ length: WEEKS }, (_, i) => {
    const week = format(subDays(parseISO(CURRENT_WEEK_START), (WEEKS - 1 - i) * 7), "yyyy-MM-dd");
    const base = 182 + i * 15.5;
    const active = Math.min(LICENSED_ACTIVE - 14, Math.round(base + rand() * 30 - 10));
    const lessons = Math.round(active * (1.9 + rand() * 0.9));
    return {
      week,
      label: format(parseISO(week), "d MMM"),
      active,
      activeRate: Math.round((active / LICENSED_ACTIVE) * 100),
      lessons,
      hours: Math.round(lessons * 0.21),
      assessments: Math.round(12 + rand() * 18 + (i < 3 ? 8 : 0)),
      attendanceA: weekAttendance("coh-ait-a", week),
      attendanceB: weekAttendance("coh-ait-b", week),
    };
  });
})();

export const weeksFor = (range: number) => WEEKLY.slice(WEEKS - range);

/** Fraction of today's progress reached by the end of week index i (-1 = before the window). */
const curve = (i: number) => 0.22 + 0.78 * Math.pow((i + 1) / WEEKS, 1.2);

/** Average program progress at the start of an N-week window vs now. */
export function programProgressWindow(courseId: string, range: number) {
  const now = programStats(courseId).avgProgress;
  const startIndex = WEEKS - range - 1;
  const jitter = (hash(courseId) % 5) - 2;
  const start = Math.max(0, Math.min(now, Math.round(now * curve(startIndex)) + (range === WEEKS ? 0 : jitter)));
  return { start, now, gained: now - start };
}

const DEPT_BASE: Record<string, number> = { "Computer Science": 0.8, Electronics: 0.77, MBA: 0.82, Mechanical: 0.64, Civil: 0.58 };

/** Department weekly-active rate matrix (precomputed). */
const DEPT_WEEKLY: Record<string, number[]> = (() => {
  const rand = seeded(9901);
  const out: Record<string, number[]> = {};
  for (const [dept, base] of Object.entries(DEPT_BASE)) {
    out[dept] = Array.from({ length: WEEKS }, (_, i) => Math.round(Math.min(97, (base * (0.62 + 0.38 * ((i + 1) / WEEKS)) + rand() * 0.06) * 100)));
  }
  return out;
})();

export function departmentComparison(departments: string[], range: number) {
  return departments.map((dept) => {
    const sample = AIT_STUDENTS.filter((s) => s.department === dept);
    const avgProgress = sample.length ? Math.round(sample.reduce((s, x) => s + overallProgress(x), 0) / sample.length) : 0;
    const weekly = (DEPT_WEEKLY[dept] ?? []).slice(WEEKS - range);
    const activeRate = weekly.length ? Math.round(weekly.reduce((s, v) => s + v, 0) / weekly.length) : 0;
    const assessmentRate = sample.length ? Math.round((sample.filter((s) => s.assessmentCompleted).length / sample.length) * 100) : 0;
    return { department: dept, short: dept === "Computer Science" ? "CS" : dept, avgProgress, activeRate, assessmentRate, students: DEPARTMENT_SIZE[dept] ?? 0 };
  });
}

/** Assessment completion at full scale (rate taken from the sample records). */
export function assessmentSummary(range: number) {
  const completed = Math.round((LICENSED_ACTIVE * SAMPLE_ASSESSMENT_RATE) / 100);
  const inProgress = 38;
  const notStarted = LICENSED_ACTIVE - completed - inProgress;
  const inPeriod = weeksFor(range).reduce((s, w) => s + w.assessments, 0);
  return { completed, inProgress, notStarted, rate: SAMPLE_ASSESSMENT_RATE, inPeriod: Math.min(completed, inPeriod) };
}
