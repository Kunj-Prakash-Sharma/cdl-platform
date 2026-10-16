import { publicCourses } from "@/data/courses";
import { recommendCourses } from "@/lib/recommend";
import type { Assessment, AssessmentResult, LearnerStage } from "@/lib/types";

/**
 * Scoring + interpretation for CDL's illustrative self-reflection assessments.
 * These are simple, transparent rules for a prototype — not a validated psychometric instrument.
 */

export type DimensionGroup = "interest" | "trait" | "skill";

export interface ScoredDimension {
  key: string;
  label: string;
  group: DimensionGroup;
  score: number;
}

export type ScoredAssessment = Omit<AssessmentResult, "id" | "assessmentId" | "userId" | "completedOn">;

/** Max points a dimension can earn across all questions (best option per question). */
export function maxPoints(assessment: Assessment) {
  const max: Record<string, number> = {};
  for (const q of assessment.questions) {
    const best: Record<string, number> = {};
    for (const o of q.options) {
      for (const [dim, pts] of Object.entries(o.scores)) best[dim] = Math.max(best[dim] ?? 0, pts);
    }
    for (const [dim, pts] of Object.entries(best)) max[dim] = (max[dim] ?? 0) + pts;
  }
  return max;
}

/** Dimension → courses that help develop it (or suit that interest). */
const DIMENSION_COURSES: Record<string, string[]> = {
  communication: ["communication-skills", "public-speaking-confidence"],
  teamwork: ["group-discussion-mastery", "leadership-essentials"],
  problemSolving: ["group-discussion-mastery", "career-discovery-fundamentals"],
  selfManagement: ["personality-development", "professional-readiness"],
  resilience: ["personality-development", "interview-preparation"],
  extraversion: ["public-speaking-confidence", "group-discussion-mastery"],
  openness: ["career-discovery-fundamentals"],
  conscientiousness: ["professional-readiness", "personality-development"],
  agreeableness: ["communication-skills", "leadership-essentials"],
  resume: ["resume-building"],
  interview: ["interview-preparation"],
  gd: ["group-discussion-mastery"],
  professional: ["professional-readiness"],
  enterprising: ["leadership-essentials", "communication-skills"],
  social: ["communication-skills", "personality-development"],
  artistic: ["public-speaking-confidence", "career-discovery-fundamentals"],
  investigative: ["career-discovery-fundamentals", "group-discussion-mastery"],
  conventional: ["professional-readiness"],
  realistic: ["career-discovery-fundamentals"],
};

/**
 * Scores a completed assessment.
 * Per-dimension score = points earned ÷ max possible points for that dimension × 100 (rounded).
 */
export function scoreAssessment(assessment: Assessment, answers: Record<string, string>, stage?: LearnerStage): ScoredAssessment {
  const max = maxPoints(assessment);
  const earned: Record<string, number> = {};
  for (const q of assessment.questions) {
    const option = q.options.find((o) => o.id === answers[q.id]);
    if (!option) continue;
    for (const [dim, pts] of Object.entries(option.scores)) earned[dim] = (earned[dim] ?? 0) + pts;
  }

  const scores: Record<string, number> = {};
  for (const dim of Object.keys(assessment.dimensions)) {
    if (!max[dim]) continue;
    scores[dim] = Math.round(((earned[dim] ?? 0) / max[dim]) * 100);
  }

  const dims = scoredDimensions(assessment, scores);
  const interests = dims.filter((d) => d.group === "interest").sort((a, b) => b.score - a.score);
  const behaviours = dims.filter((d) => d.group !== "interest");
  const strengths = [...behaviours].filter((d) => d.score >= 60).sort((a, b) => b.score - a.score).slice(0, 4);
  const development = [...behaviours].sort((a, b) => a.score - b.score).slice(0, 3);

  // Courses: develop the weakest areas first, then play to the top interests, then fill with general rules.
  const ids: string[] = [];
  const push = (id: string) => {
    const course = publicCourses.find((c) => c.id === id);
    if (!course || ids.includes(id)) return;
    if (stage && !course.audience.includes(stage)) return;
    ids.push(id);
  };
  development.forEach((d) => DIMENSION_COURSES[d.key]?.slice(0, 1).forEach(push));
  interests.slice(0, 2).forEach((d) => DIMENSION_COURSES[d.key]?.forEach(push));
  development.forEach((d) => DIMENSION_COURSES[d.key]?.forEach(push));
  if (ids.length < 3) {
    recommendCourses({ stage, interests: interests.map((i) => i.label), challenges: development.map((d) => d.label) }, 6).forEach((r) => push(r.course.id));
  }

  return {
    scores,
    topInterests: interests.slice(0, 3).map((d) => d.label),
    strengths: strengths.map((d) => d.label),
    developmentAreas: development.map((d) => d.label),
    recommendedCourseIds: ids.slice(0, 3),
  };
}

/** Dimensions present in a result, with labels and groups, in the assessment's defined order. */
export function scoredDimensions(assessment: Assessment, scores: Record<string, number>): ScoredDimension[] {
  return Object.entries(assessment.dimensions)
    .filter(([key]) => typeof scores[key] === "number")
    .map(([key, meta]) => ({ key, label: meta.label, group: meta.group, score: scores[key] }));
}

export function groupsPresent(assessment: Assessment, scores: Record<string, number>) {
  const dims = scoredDimensions(assessment, scores);
  return {
    interests: dims.filter((d) => d.group === "interest"),
    traits: dims.filter((d) => d.group === "trait"),
    skills: dims.filter((d) => d.group === "skill"),
  };
}

export function scoreBand(score: number): { label: string; tone: "brand" | "primary" | "warning" } {
  if (score >= 70) return { label: "Strong", tone: "brand" };
  if (score >= 50) return { label: "Developing", tone: "primary" };
  return { label: "Emerging", tone: "warning" };
}

/** Interest dimension → career areas worth exploring. */
export const CAREER_AREAS: Record<string, { family: string; areas: string[]; why: string; roles: string }> = {
  enterprising: {
    family: "Enterprising",
    areas: ["Marketing", "Sales", "Entrepreneurship", "Business development"],
    why: "Enjoys persuading, organising and taking initiative.",
    roles: "involve persuading, organising and taking initiative",
  },
  social: {
    family: "Social",
    areas: ["Human resources", "Counselling", "Teaching & training", "Healthcare"],
    why: "Energised by helping, guiding and supporting people.",
    roles: "involve guiding and supporting people",
  },
  artistic: {
    family: "Artistic",
    areas: ["Design", "Content & writing", "Media & communications"],
    why: "Values originality, expression and making things people notice.",
    roles: "reward originality and expression",
  },
  investigative: {
    family: "Investigative",
    areas: ["Research", "Data & analytics", "Science", "Engineering"],
    why: "Likes understanding how things work and solving complex problems.",
    roles: "involve analysis and solving complex problems",
  },
  conventional: {
    family: "Conventional",
    areas: ["Finance", "Accounting", "Operations"],
    why: "Brings structure, accuracy and reliability to work.",
    roles: "value structure, accuracy and reliability",
  },
  realistic: {
    family: "Realistic",
    areas: ["Engineering", "Manufacturing", "Architecture"],
    why: "Enjoys practical, hands-on work with tangible results.",
    roles: "involve practical, hands-on work",
  },
};

/** Plain-language tips used for development opportunities. */
export const DIMENSION_TIPS: Record<string, string> = {
  communication: "Practise a 60-second structured answer (point → example → takeaway) for common questions each week.",
  problemSolving: "Break problems into 'what we know / what we need / options' before proposing a solution.",
  teamwork: "Volunteer for one group task a month where you coordinate rather than contribute alone.",
  selfManagement: "Use a weekly plan with three priorities and a 15-minute Friday review.",
  extraversion: "Set a small goal for group settings — e.g. speak within the first three minutes of a discussion.",
  openness: "Try one unfamiliar topic or activity each month and note what you learned.",
  conscientiousness: "Break big deadlines into dated milestones and track them in one place.",
  agreeableness: "Practise disagreeing respectfully: acknowledge the other view, then add your perspective.",
  resilience: "After a setback, write down one lesson and one next action within 24 hours.",
  resume: "Rewrite each bullet point as action + measurable result, and get it reviewed every quarter.",
  interview: "Do at least three mock interviews before your next real one, and record yourself once.",
  gd: "Read the news daily and practise opening and summarising a GD topic in under a minute.",
  professional: "Track applications in a simple sheet and reply to recruiters within 24 hours.",
};

export const tipForLabel = (label: string, assessment: Assessment) => {
  const key = Object.entries(assessment.dimensions).find(([, m]) => m.label === label)?.[0];
  return key ? DIMENSION_TIPS[key] : undefined;
};

/** Interest dimension key for a label (e.g. "Enterprising & Leading" → "enterprising"). */
export function dimensionKey(assessment: Assessment, label: string) {
  return Object.entries(assessment.dimensions).find(([, m]) => m.label === label)?.[0];
}

/** Earlier result for the same learner + assessment (for profile history), and any newer one. */
export function relatedResults(all: AssessmentResult[], result: AssessmentResult) {
  const same = all
    .filter((r) => r.userId === result.userId && r.assessmentId === result.assessmentId && r.id !== result.id)
    .sort((a, b) => b.completedOn.localeCompare(a.completedOn));
  return {
    previous: same.find((r) => r.completedOn < result.completedOn),
    newer: [...same].reverse().find((r) => r.completedOn > result.completedOn),
  };
}

/** Narrative summary paragraph for a report. */
export function reportSummary(assessment: Assessment, result: AssessmentResult, firstName: string) {
  const { interests, traits, skills } = groupsPresent(assessment, result.scores);
  const parts: string[] = [];
  if (interests.length && result.topInterests.length) {
    const [a, b] = result.topInterests;
    parts.push(
      `${firstName}'s strongest interests lie in ${a.toLowerCase()}${b ? ` and ${b.toLowerCase()}` : ""} work, which points towards roles that ${
        CAREER_AREAS[dimensionKey(assessment, a) ?? ""]?.roles ?? "match these preferences"
      }.`,
    );
  }
  if (result.strengths.length) {
    parts.push(`Clear strengths include ${joinLower(result.strengths.slice(0, 3))}.`);
  }
  if (result.developmentAreas.length) {
    parts.push(`The biggest opportunities for growth are ${joinLower(result.developmentAreas.slice(0, 2))} — both very learnable with structured practice.`);
  }
  if (!interests.length && skills.length) {
    const avg = Math.round(skills.reduce((s, d) => s + d.score, 0) / skills.length);
    parts.unshift(`${firstName}'s overall readiness score is ${avg}/100 across ${skills.length} areas.`);
  }
  if (traits.length && interests.length) {
    parts.push("Use this report as a conversation starter rather than a verdict: preferences change with experience.");
  }
  return parts.join(" ");
}

function joinLower(items: string[]) {
  const l = items.map((i) => i.charAt(0).toLowerCase() + i.slice(1));
  if (l.length <= 1) return l[0] ?? "";
  return `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`;
}
