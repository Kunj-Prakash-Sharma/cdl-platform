import type { Course, Lesson, LearningFormat } from "@/lib/types";
import { colleges, collegeStudents } from "./colleges";
import { courses } from "./courses";
import { mentors } from "./mentors";
import { users } from "./users";
import { cohorts, liveSessions } from "./sessions";
import { assessments } from "./assessments";
import { packages } from "./commerce";
import { resources } from "./learning";

export * from "./constants";
export * from "./courses";
export * from "./mentors";
export * from "./users";
export * from "./colleges";
export * from "./sessions";
export * from "./learning";
export * from "./assessments";
export * from "./commerce";
export * from "./community";
export * from "./content";
export * from "./analytics";

// ---------- Lookups (return undefined when missing; callers decide on empty/404 states) ----------

export const getCourse = (id: string) => courses.find((c) => c.id === id);
export const getMentor = (id: string) => mentors.find((m) => m.id === id);
export const getUser = (id: string) => users.find((u) => u.id === id);
export const getCollege = (id: string) => colleges.find((c) => c.id === id);
export const getCollegeStudent = (id: string) => collegeStudents.find((s) => s.id === id);
export const getCohort = (id: string) => cohorts.find((c) => c.id === id);
export const getSession = (id: string) => liveSessions.find((s) => s.id === id);
export const getAssessment = (id: string) => assessments.find((a) => a.id === id);
export const getPackage = (id: string) => packages.find((p) => p.id === id);
export const getResource = (id: string) => resources.find((r) => r.id === id);

export function getMentorOffer(offerId: string) {
  for (const m of mentors) {
    const offer = m.offers.find((o) => o.id === offerId);
    if (offer) return { mentor: m, offer };
  }
  return undefined;
}

// ---------- Course helpers ----------

export const courseLessons = (course: Course): Lesson[] => course.chapters.flatMap((c) => c.lessons);
export const courseVideoLessons = (course: Course): Lesson[] => courseLessons(course).filter((l) => l.kind === "video");
export const courseDurationSec = (course: Course) => courseLessons(course).reduce((s, l) => s + l.durationSec, 0);

export function findLesson(course: Course, lessonId: string) {
  for (const chapter of course.chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return { chapter, lesson };
  }
  return undefined;
}

/** Lowest available price across formats (for "From ₹X" labels). */
export function courseStartingPrice(course: Course) {
  const prices = Object.values(course.pricing).filter((p): p is number => typeof p === "number");
  return prices.length ? Math.min(...prices) : 0;
}

export const coursePrice = (course: Course, format: LearningFormat) => course.pricing[format];

export const isFreeCourse = (course: Course) => course.pricing["self-paced"] === 0;

export const coursesByMentor = (mentorId: string) => courses.filter((c) => c.instructorId === mentorId);
export const cohortsForCourse = (courseId: string) => cohorts.filter((c) => c.courseId === courseId && !c.collegeId);
export const sessionsForCourse = (courseId: string) => liveSessions.filter((s) => s.courseId === courseId);

/** Total number of recorded video lessons across the public + institutional catalog. */
export const totalRecordings = courses.reduce((n, c) => n + courseVideoLessons(c).length, 0);
