import { FileArchive, FileSpreadsheet, FileText, FileType2, Presentation, type LucideIcon } from "lucide-react";
import { courseDurationSec, courseLessons } from "@/data";
import { FORMAT_META } from "@/data/constants";
import { formatClock } from "@/lib/format";
import type { Course, LearningFormat, Lesson, Resource, UserProfile } from "@/lib/types";

/** Arjun Iyer — Sunita's son. His records are shown read-only in parent mode. */
export const CHILD_USER_ID = "u-arjun-i";

/**
 * Lesson completion is only tracked for the logged-in demo user, so the child's progress in
 * parent mode is illustrative and fixed (lessons done per course).
 */
export const CHILD_LESSONS_DONE: Record<string, number> = {
  "career-discovery-fundamentals": 7,
  "personality-development": 2,
};
export const CHILD_LAST_ACTIVE: Record<string, string> = {
  "career-discovery-fundamentals": "2026-07-10",
  "personality-development": "2026-10-11",
};

export function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const FORMAT_RANK: Record<LearningFormat, number> = { "self-paced": 1, "live-cohort": 2, mentoring: 3 };

export function highestFormat(formats: LearningFormat[]): LearningFormat | undefined {
  return [...formats].sort((a, b) => FORMAT_RANK[b] - FORMAT_RANK[a])[0];
}

export const LEVEL_EXPLAINER: Record<LearningFormat, string> = {
  "self-paced": "You're learning with recorded lessons, resources and quizzes at your own pace.",
  "live-cohort": "You're learning with a cohort — scheduled evening classes with a mentor, peers, recordings and doubt-clearing.",
  mentoring: "You're working one-to-one with an expert mentor on a personalised plan.",
};

export const formatLabel = (f: LearningFormat) => FORMAT_META[f].label;

// ---------------- Goals ----------------

/** Completed goals are stored in the profile with this prefix so completion survives reloads. */
export const GOAL_DONE_PREFIX = "✓ ";
export const parseGoal = (g: string) =>
  g.startsWith(GOAL_DONE_PREFIX) ? { text: g.slice(GOAL_DONE_PREFIX.length), done: true } : { text: g, done: false };

// ---------------- Profile completion ----------------

export interface ProfileCheck {
  id: string;
  label: string;
  done: boolean;
}

/** Ten equally weighted checks; the meter is computed live from the current profile. */
export function profileChecklist(user: UserProfile): ProfileCheck[] {
  const filled = (v?: string) => Boolean(v && v.trim());
  const interests = user.interests.filter(Boolean);
  const goals = user.goals.filter(Boolean);
  const detail =
    user.stage === "parent"
      ? { label: "Your child's name and stage", done: filled(user.childName) && Boolean(user.childStage) }
      : user.stage === "professional"
        ? { label: "Current role or organisation", done: filled(user.occupation) }
        : user.stage === "graduate"
          ? { label: "College or current role", done: filled(user.institution) || filled(user.occupation) }
          : { label: "School or college name", done: filled(user.institution) };
  return [
    { id: "name", label: "Full name", done: filled(user.name) },
    { id: "email", label: "Email address", done: filled(user.email) },
    { id: "phone", label: "Mobile number", done: filled(user.phone) },
    { id: "city", label: "City", done: filled(user.city) },
    { id: "stage", label: "Current stage", done: Boolean(user.stage) },
    { id: "education", label: user.stage === "parent" ? "Your education or profession" : "Education / qualification", done: filled(user.education) },
    { id: "detail", ...detail },
    { id: "interests3", label: "At least 3 career interests", done: interests.length >= 3 },
    { id: "goals", label: "At least 2 goals", done: goals.length >= 2 },
    { id: "interests5", label: "5 or more interests for sharper recommendations", done: interests.length >= 5 },
  ];
}

export function profileCompletion(user: UserProfile) {
  const checks = profileChecklist(user);
  return Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
}

// ---------------- Certificates ----------------

export function generatedCertificateId(userId: string, courseId: string) {
  return `CDL-2026-10-${String(1000 + (hashString(`${userId}|${courseId}`) % 9000)).padStart(4, "0")}`;
}

export function courseHoursLabel(course: Course) {
  const hours = courseDurationSec(course) / 3600;
  return `${hours < 1 ? hours.toFixed(1) : (Math.round(hours * 10) / 10).toString()} hours`;
}

// ---------------- Files ----------------

export const FILE_META: Record<Resource["fileType"], { icon: LucideIcon; className: string; label: string }> = {
  PDF: { icon: FileText, className: "bg-rose-50 text-rose-700 ring-rose-200", label: "PDF document" },
  DOCX: { icon: FileType2, className: "bg-blue-50 text-blue-700 ring-blue-200", label: "Word document" },
  XLSX: { icon: FileSpreadsheet, className: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "Spreadsheet" },
  PPTX: { icon: Presentation, className: "bg-orange-50 text-orange-700 ring-orange-200", label: "Slides" },
  ZIP: { icon: FileArchive, className: "bg-violet-50 text-violet-700 ring-violet-200", label: "ZIP archive" },
};

export const formatSize = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

// ---------------- Lessons ----------------

export function lessonPosition(course: Course, lessonId: string) {
  for (let c = 0; c < course.chapters.length; c++) {
    const idx = course.chapters[c].lessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0) return { chapterIndex: c, lessonIndex: idx, chapter: course.chapters[c] };
  }
  return undefined;
}

export function lessonContextLabel(course: Course, lessonId: string) {
  const pos = lessonPosition(course, lessonId);
  return pos ? `Chapter ${pos.chapterIndex + 1} · Lesson ${pos.lessonIndex + 1}` : undefined;
}

export const LESSON_KIND_LABEL: Record<Lesson["kind"], string> = { video: "Video", reading: "Reading", quiz: "Quiz" };

const TRANSCRIPT_OPENERS = [
  "Hi everyone, and welcome back. In this lesson we're looking at {title}.",
  "Welcome back. Let's get straight into {title}.",
  "Hello again. Today's topic is {title} — and it's one learners ask about a lot.",
];
const TRANSCRIPT_MIDDLES = [
  "Before we start, think about the last time this came up for you — keep that example in mind.",
  "Here's the simple idea: make your point clearly first, then support it with one concrete example.",
  "Most people skip this step, which is exactly why doing it well helps you stand out.",
  "Let me show you what this looks like in a real situation from a recent placement season.",
  "Notice the structure: a short opening, two supporting points and a crisp close.",
  "A common mistake here is trying to say everything at once. Pick the one thing that matters most.",
  "Pause the video and try this yourself — it takes less than two minutes.",
  "Evaluators and interviewers are listening for clarity, not perfection.",
];
const TRANSCRIPT_CLOSERS = [
  "That's it for this lesson. Use the resource in this chapter to practise, and I'll see you in the next one.",
  "Quick recap: keep it structured, keep it specific, and practise out loud. See you in the next lesson.",
];

/** Deterministic, illustrative transcript lines for a lesson. */
export function transcriptFor(course: Course, lesson: Lesson) {
  const h = hashString(lesson.id);
  const outcomes = course.outcomes;
  const lines = [
    TRANSCRIPT_OPENERS[h % TRANSCRIPT_OPENERS.length].replace("{title}", `“${lesson.title}”`),
    `By the end, you should be able to ${outcomes[h % outcomes.length].charAt(0).toLowerCase()}${outcomes[h % outcomes.length].slice(1)}.`,
    TRANSCRIPT_MIDDLES[h % TRANSCRIPT_MIDDLES.length],
    TRANSCRIPT_MIDDLES[(h + 3) % TRANSCRIPT_MIDDLES.length],
    `This builds directly on what we covered earlier in ${course.title}.`,
    TRANSCRIPT_MIDDLES[(h + 5) % TRANSCRIPT_MIDDLES.length],
    TRANSCRIPT_CLOSERS[h % TRANSCRIPT_CLOSERS.length],
  ];
  const step = lesson.durationSec / lines.length;
  return lines.map((text, i) => ({ at: formatClock(Math.round(i * step + (i ? (h % 20) : 0))), text }));
}

export function courseLessonCount(course: Course) {
  return courseLessons(course).length;
}
