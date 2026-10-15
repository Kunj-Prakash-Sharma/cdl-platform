import type { CourseCategory, DiscoveryStep, LearnerStage, LearningFormat, Role } from "@/lib/types";

/** Fixed "today" for the demo so every screen agrees on what is upcoming vs past. */
export const DEMO_TODAY = "2026-10-15";
export const DEMO_NOW = "2026-10-15T10:30:00";

/** The demo learner the B2C dashboard is built around. */
export const DEMO_LEARNER_ID = "u-riya";
export const DEMO_PARENT_ID = "u-sunita";
export const DEMO_MENTOR_ID = "m-kavya";
export const DEMO_COLLEGE_ID = "col-ait";
export const DEMO_COLLEGE_STUDENT_ID = "cs-ait-01";

export const FORMAT_META: Record<
  LearningFormat,
  { label: string; short: string; level: number; tagline: string; description: string }
> = {
  "self-paced": {
    label: "Self-Paced",
    short: "Self-Paced",
    level: 1,
    tagline: "Learn anytime with recorded lessons",
    description:
      "Recorded video lessons, chapter-wise curriculum, downloadable resources, quizzes and progress tracking — on your schedule.",
  },
  "live-cohort": {
    label: "Live Cohort",
    short: "Live Cohort",
    level: 2,
    tagline: "Learn together in guided evening sessions",
    description:
      "Everything in Self-Paced plus scheduled live classes with your cohort, session recordings, doubt-clearing and assignments.",
  },
  mentoring: {
    label: "One-to-One Mentoring",
    short: "1:1 Mentoring",
    level: 3,
    tagline: "Personal guidance from an expert mentor",
    description:
      "Private sessions with a mentor matched to your goals, personalised plans, session notes and follow-up recommendations.",
  },
};

export const FORMATS: LearningFormat[] = ["self-paced", "live-cohort", "mentoring"];

export const STAGE_META: Record<LearnerStage, { label: string; plural: string; description: string }> = {
  school: {
    label: "School Student",
    plural: "School Students",
    description: "Explore interests, subjects and future possibilities early.",
  },
  college: {
    label: "College Student",
    plural: "College Students",
    description: "Build placement readiness, communication and employability.",
  },
  graduate: {
    label: "Graduate / Job Seeker",
    plural: "Graduates",
    description: "Sharpen your resume, interviews and career direction.",
  },
  professional: {
    label: "Working Professional",
    plural: "Professionals",
    description: "Grow into leadership or plan a confident career transition.",
  },
  parent: {
    label: "Parent",
    plural: "Parents",
    description: "Understand and support your child's development journey.",
  },
};

export const STAGES: LearnerStage[] = ["school", "college", "graduate", "professional", "parent"];

export const CATEGORIES: CourseCategory[] = [
  "Career Discovery",
  "Leadership",
  "Communication",
  "Employability",
  "Personal Growth",
];

export const ROLE_META: Record<Role, { label: string; home: string; description: string }> = {
  visitor: { label: "Public visitor", home: "/", description: "Landing page, free discovery, catalog & checkout" },
  learner: { label: "Learner (Riya)", home: "/dashboard", description: "My Self dashboard, courses, sessions & mentoring" },
  parent: { label: "Parent (Sunita)", home: "/dashboard", description: "Parent view of the learner dashboard" },
  "college-admin": { label: "College admin", home: "/college", description: "Aravali Institute of Technology admin portal" },
  "college-student": { label: "College student", home: "/campus", description: "College-branded student portal" },
  mentor: { label: "Mentor (Kavya)", home: "/mentor", description: "Schedule, content library & student questions" },
  admin: { label: "Platform admin", home: "/admin", description: "Users, content, pricing & conversion analytics" },
};

/** Conversation steps for free career discovery — shared by the flow and drop-off analytics. */
export const DISCOVERY_STEPS: DiscoveryStep[] = [
  { id: "contact", label: "Phone number", order: 1 },
  { id: "name", label: "Name", order: 2 },
  { id: "persona", label: "Self or child", order: 3 },
  { id: "stage", label: "Current stage", order: 4 },
  { id: "background", label: "Background", order: 5 },
  { id: "interests", label: "Interests", order: 6 },
  { id: "challenges", label: "Challenges", order: 7 },
  { id: "goals", label: "Goals", order: 8 },
  { id: "snapshot", label: "Career snapshot", order: 9 },
];

export const SUPPORT_EMAIL = "help@careerdesignlab.demo";
