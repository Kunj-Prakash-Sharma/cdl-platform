import { CATEGORIES } from "@/data/constants";
import type { AvatarSpec, College, CollegeStudent, Enrollment, LearnerStage, UserProfile } from "@/lib/types";
import { getCourse } from "@/data";

export type UserKind = "individual" | "parent" | "college-student";

export const KIND_LABEL: Record<UserKind, string> = {
  individual: "Individual",
  parent: "Parent",
  "college-student": "College student",
};

/** One row in the admin user directory — B2C profiles and college students share this shape. */
export interface DirectoryUser {
  id: string;
  kind: UserKind;
  name: string;
  avatar: AvatarSpec;
  phone: string;
  email?: string;
  stage: LearnerStage;
  city: string;
  education: string;
  occupation?: string;
  institution?: string;
  interests: string[];
  goals: string[];
  programs: number;
  profileCompletion: number;
  lastActive: string;
  joinedOn?: string;
  status: UserProfile["status"];
  collegeId?: string;
  collegeShort?: string;
  childName?: string;
  childStage?: LearnerStage;
  student?: CollegeStudent;
}

export function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Students without an activity in the last ~2 weeks are shown as inactive. */
const INACTIVE_BEFORE = "2026-10-01";

export function profileToRow(u: UserProfile, enrollments: Enrollment[]): DirectoryUser {
  return {
    id: u.id,
    kind: u.stage === "parent" ? "parent" : "individual",
    name: u.name,
    avatar: u.avatar,
    phone: u.phone,
    email: u.email,
    stage: u.stage,
    city: u.city,
    education: u.education,
    occupation: u.occupation,
    institution: u.institution,
    interests: u.interests,
    // Learner dashboard marks completed goals with a "✓ " prefix; show plain goal text here.
    goals: u.goals.map((g) => g.replace(/^✓ /, "")),
    programs: enrollments.filter((e) => e.userId === u.id).length,
    profileCompletion: u.profileCompletion,
    lastActive: u.lastActive,
    joinedOn: u.joinedOn,
    status: u.status,
    childName: u.childName,
    childStage: u.childStage,
  };
}

export function studentToRow(s: CollegeStudent, college: College | undefined): DirectoryUser {
  const h = hash(s.id);
  const categories = Array.from(new Set(s.assignedCourseIds.map((id) => getCourse(id)?.category).filter(Boolean))) as string[];
  return {
    id: s.id,
    kind: "college-student",
    name: s.name,
    avatar: s.avatar,
    phone: `+91 9${h % 10}XXX ${String(10000 + (h % 89999)).slice(0, 5)}`,
    email: s.email,
    stage: college?.type === "School" ? "school" : "college",
    city: college?.city ?? "—",
    education: `${s.department}, ${s.year}`,
    institution: college?.name,
    interests: categories.length ? categories : [CATEGORIES[0]],
    goals: [`Complete the ${college?.shortName ?? "campus"} placement-readiness programme`, "Clear campus placement interviews"],
    programs: s.assignedCourseIds.length,
    profileCompletion: Math.min(100, 55 + (s.assessmentCompleted ? 25 : 0) + (s.cohortId ? 10 : 0) + (h % 3) * 5),
    lastActive: s.lastActive,
    status: s.lastActive < INACTIVE_BEFORE ? "inactive" : "active",
    collegeId: s.collegeId,
    collegeShort: college?.shortName,
    student: s,
  };
}

export type CompletionBand = "all" | "low" | "mid" | "high";
export const COMPLETION_BANDS: { value: CompletionBand; label: string }[] = [
  { value: "all", label: "Any profile completion" },
  { value: "low", label: "Below 50%" },
  { value: "mid", label: "50–79%" },
  { value: "high", label: "80–100%" },
];
export function inBand(pct: number, band: CompletionBand) {
  if (band === "low") return pct < 50;
  if (band === "mid") return pct >= 50 && pct < 80;
  if (band === "high") return pct >= 80;
  return true;
}

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Brand colour presets for colleges (accessible on white with white text). */
export const BRAND_PRESETS = ["#9f1239", "#1d4ed8", "#7c3aed", "#0f766e", "#15803d", "#b45309", "#334155", "#be185d"];
