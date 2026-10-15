import { publicCourses } from "@/data/courses";
import type { Course, LearnerStage, LearningFormat } from "@/lib/types";

/**
 * Simple, transparent frontend rules that turn what a visitor/learner has told us into course
 * suggestions. Illustrative only — no AI or scoring model behind it.
 */

export interface RecommendationInput {
  stage?: LearnerStage;
  persona?: "self" | "parent";
  interests?: string[];
  challenges?: string[];
  goals?: string[];
  /** Courses to leave out (e.g. already enrolled) */
  exclude?: string[];
}

export interface Recommendation {
  course: Course;
  format: LearningFormat;
  score: number;
  reason: string;
}

const RULES: { match: RegExp; courses: string[]; reason: string }[] = [
  { match: /group discussion|\bgd\b|gds/i, courses: ["group-discussion-mastery", "campus-placement-readiness"], reason: "you want to perform better in group discussions" },
  { match: /interview|nerv/i, courses: ["interview-preparation", "public-speaking-confidence"], reason: "you're preparing for interviews" },
  { match: /resume|cv|shortlist|profile/i, courses: ["resume-building"], reason: "you want a resume that gets shortlisted" },
  { match: /placement|campus|get placed|first job offer/i, courses: ["campus-placement-readiness", "group-discussion-mastery", "interview-preparation"], reason: "placement season is your focus" },
  { match: /communicat|express|english|writing/i, courses: ["communication-skills"], reason: "clear communication came up in your answers" },
  { match: /speak|stage|confiden|shy|present/i, courses: ["public-speaking-confidence", "personality-development"], reason: "you'd like to build speaking confidence" },
  { match: /lead|team|manag|people/i, courses: ["leadership-essentials"], reason: "you're interested in leading people" },
  { match: /switch|transition|change career|new field|new industry/i, courses: ["career-transition-blueprint"], reason: "you're considering a career change" },
  { match: /first job|workplace|corporate|job ready|job readiness/i, courses: ["professional-readiness"], reason: "you want to be ready for the workplace" },
  { match: /unsure|unclear|direction|clarity|stream|subject|explore|options|confus/i, courses: ["career-discovery-fundamentals"], reason: "you're still exploring your direction" },
  { match: /personality|self-aware|stress|emotion|habit/i, courses: ["personality-development"], reason: "personal growth matters to you" },
  { match: /marketing|business|sales|entrepreneur/i, courses: ["communication-skills", "leadership-essentials"], reason: "business and marketing roles reward communication and leadership" },
];

const STAGE_DEFAULTS: Record<LearnerStage, string[]> = {
  school: ["career-discovery-fundamentals", "personality-development", "public-speaking-confidence"],
  college: ["campus-placement-readiness", "group-discussion-mastery", "communication-skills"],
  graduate: ["interview-preparation", "resume-building", "professional-readiness"],
  professional: ["leadership-essentials", "career-transition-blueprint", "communication-skills"],
  parent: ["career-clarity-for-parents", "career-discovery-fundamentals", "personality-development"],
};

export function pickFormat(course: Course, input: RecommendationInput): LearningFormat {
  const text = [...(input.goals ?? []), ...(input.challenges ?? [])].join(" ").toLowerCase();
  if (course.formats.includes("mentoring") && /personal|one-to-one|1:1|mentor|guidance|switch|transition/.test(text)) return "mentoring";
  if (course.formats.includes("live-cohort") && (input.stage === "college" || /practice|accountab|motivat|placement|live/.test(text))) return "live-cohort";
  return course.formats.includes("self-paced") ? "self-paced" : course.formats[0];
}

export function recommendCourses(input: RecommendationInput, limit = 3): Recommendation[] {
  const text = [...(input.interests ?? []), ...(input.challenges ?? []), ...(input.goals ?? [])].join(" · ");
  const scores = new Map<string, { score: number; reason: string }>();
  const bump = (id: string, by: number, reason: string) => {
    const cur = scores.get(id);
    if (!cur) scores.set(id, { score: by, reason });
    else scores.set(id, { score: cur.score + by, reason: cur.score >= by ? cur.reason : reason });
  };

  for (const rule of RULES) {
    if (rule.match.test(text)) rule.courses.forEach((id, i) => bump(id, 6 - i, rule.reason));
  }
  const stage = input.persona === "parent" ? "parent" : input.stage;
  if (stage) {
    STAGE_DEFAULTS[stage].forEach((id, i) => bump(id, 3 - i * 0.5, `it's a popular next step for ${stageWord(stage)}`));
  }

  const ranked = publicCourses
    .filter((c) => !input.exclude?.includes(c.id))
    .map((course) => {
      const s = scores.get(course.id);
      const audienceFit = stage && course.audience.includes(stage) ? 2 : stage ? -3 : 0;
      return { course, score: (s?.score ?? 0) + audienceFit, reason: s?.reason ?? "it builds broadly useful career skills" };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || b.course.learners - a.course.learners)
    .slice(0, limit);

  return ranked.map((r) => ({ ...r, format: pickFormat(r.course, input), reason: capitalise(`Because ${r.reason}.`) }));
}

function stageWord(stage: LearnerStage) {
  return {
    school: "school students",
    college: "college students",
    graduate: "graduates",
    professional: "working professionals",
    parent: "parents",
  }[stage];
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
