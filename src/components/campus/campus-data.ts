/** Data for the college-branded student portal (signed in as Pranav Kumawat, AIT). Synthetic demo data. */
import { differenceInCalendarDays, parseISO } from "date-fns";
import { assignments, getCollegeStudent, getCourse, liveSessions } from "@/data";
import { DEMO_COLLEGE_STUDENT_ID, DEMO_TODAY } from "@/data/constants";
import type { Assignment, Course, LearningFormat } from "@/lib/types";
import { AIT_COURSE_ID, studentAttended } from "@/components/college/college-data";

export const STUDENT = getCollegeStudent(DEMO_COLLEGE_STUDENT_ID)!;

export const STUDENT_COURSES: Course[] = STUDENT.assignedCourseIds.map((id) => getCourse(id)).filter((c): c is Course => Boolean(c));

/** Learning level the student accesses each program through (via the college licence). */
export const studentFormat = (courseId: string): LearningFormat => (courseId === "campus-placement-readiness" && STUDENT.cohortId ? "live-cohort" : "self-paced");

export const firstName = STUDENT.name.split(" ")[0];

// ---------- Assignments ----------

export interface CampusAssignment extends Assignment {
  provider: "cdl" | "college";
}

const collegeAssignments: CampusAssignment[] = [
  {
    id: "ait-resume",
    courseId: AIT_COURSE_ID,
    provider: "college",
    title: "Submit your placement resume to the T&P cell",
    kind: "assignment",
    description:
      "Upload your one-page placement resume (PDF) using the AIT template. The T&P cell verifies CGPA and backlogs before you can register for on-campus drives.",
    dueDate: "2026-10-20",
    points: 20,
    estimatedMin: 30,
    status: "not-started",
  },
  {
    id: "ait-drive-quiz",
    courseId: AIT_COURSE_ID,
    provider: "college",
    title: "Campus drive rules check",
    kind: "quiz",
    description: "Four questions on AIT's placement policy — eligibility, one-offer rule and drive-day conduct.",
    dueDate: "2026-10-12",
    points: 10,
    estimatedMin: 5,
    status: "graded",
    score: 8,
    feedback: "Good — revisit the one-offer policy section in the drive calendar reading. — AIT T&P cell",
    questions: [
      { id: "q1", prompt: "What is the minimum CGPA to register for the 2026 campus drive?", options: ["6.0", "6.5", "7.0", "No minimum"], correctIndex: 1, explanation: "Eligibility is 6.5 CGPA with no active backlogs." },
      { id: "q2", prompt: "After accepting a dream-company offer you…", options: ["Can keep applying everywhere", "Exit the drive (one-offer policy)", "Can apply to two more companies", "Must re-register"], correctIndex: 1, explanation: "The one-offer policy frees opportunities for classmates." },
      { id: "q3", prompt: "Who must approve your resume before drive registration?", options: ["Your HoD", "The T&P cell", "Your CDL mentor", "No approval needed"], correctIndex: 1 },
      { id: "q4", prompt: "Pre-placement talks are…", options: ["Optional", "Mandatory for students applying to that company", "Only for toppers", "Held online only"], correctIndex: 1, explanation: "Attendance is tracked by the T&P cell." },
    ],
  },
];

/** Pranav's own starting state for CDL assignments (the seed statuses in data belong to the B2C demo learner). */
const INITIAL: Record<string, Partial<Assignment>> = {
  "as-gdm-open": { status: "submitted" },
  "as-gdm-quiz": { status: "not-started" },
  "as-inp-star": { status: "in-progress" },
  "as-inp-quiz": { status: "not-started" },
};

export const CAMPUS_ASSIGNMENTS: CampusAssignment[] = [
  ...collegeAssignments,
  ...assignments
    .filter((a) => STUDENT.assignedCourseIds.includes(a.courseId))
    .map((a): CampusAssignment => ({ ...a, score: undefined, feedback: undefined, ...INITIAL[a.id], provider: "cdl" })),
].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

export const isOpen = (status: Assignment["status"]) => status === "not-started" || status === "in-progress";

// ---------- Sessions ----------

export const MY_SESSIONS = liveSessions.filter((s) => s.cohortId === STUDENT.cohortId);
export const MY_UPCOMING = MY_SESSIONS.filter((s) => s.date >= DEMO_TODAY);
export const MY_PAST = MY_SESSIONS.filter((s) => s.date < DEMO_TODAY);
export const NEXT_CLASS = MY_UPCOMING[0];
/** The other batch's class today — open to students for make-up attendance. */
export const MAKEUP_TODAY = liveSessions.find((s) => s.collegeId === STUDENT.collegeId && s.cohortId !== STUDENT.cohortId && s.date === DEMO_TODAY);
export const ATTENDED = MY_PAST.filter((s) => studentAttended(STUDENT, s));

// ---------- Announcements from the T&P cell ----------

export interface Announcement {
  id: string;
  date: string;
  tag: "Drive" | "Deadline" | "Workshop" | "Update";
  title: string;
  body: string;
  pinned?: boolean;
}

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "an-1",
    date: "2026-10-15",
    tag: "Deadline",
    title: "Placement resumes due by Tue, 20 Oct",
    body: "Upload your resume in the AIT template under Assignments. Unverified resumes cannot be registered for the November drives.",
    pinned: true,
  },
  {
    id: "an-2",
    date: "2026-10-14",
    tag: "Drive",
    title: "Infosys pre-placement talk — 27 Oct, Seminar Hall 2",
    body: "Mandatory for CS, Electronics and Mechanical final-year students applying to Infosys. Attendance will be recorded at the entrance.",
  },
  {
    id: "an-3",
    date: "2026-10-12",
    tag: "Workshop",
    title: "Mock interview week with CDL mentors, 19–23 Oct",
    body: "Batch A's Monday class becomes a live mock-interview round. Keep your STAR stories ready.",
  },
  {
    id: "an-4",
    date: "2026-10-08",
    tag: "Update",
    title: "Drive calendar & eligibility published",
    body: "The full November–December campus drive calendar is now in the AIT Industry Readiness Bootcamp, Chapter 2.",
  },
];

export const daysUntil = (iso: string) => differenceInCalendarDays(parseISO(iso), parseISO(DEMO_TODAY));
