import { addDays, format, parseISO } from "date-fns";
import type { AnonymousConversation, CourseCategory, DiscoveryStep, FunnelDay, LearnerStage } from "@/lib/types";

// All numbers in this file are synthetic and exist only to illustrate the analytics UI.

function rand(seed: number) {
  // deterministic 0..1
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export const funnelDays: FunnelDay[] = Array.from({ length: 30 }, (_, i) => {
  const date = format(addDays(parseISO("2026-09-16"), i), "yyyy-MM-dd");
  const weekday = addDays(parseISO("2026-09-16"), i).getDay();
  const weekend = weekday === 0 || weekday === 6;
  const trend = 1 + i * 0.012; // gentle growth into placement season
  const visitors = Math.round((weekend ? 1650 : 2150) * trend * (0.9 + rand(i) * 0.2));
  const conversations = Math.round(visitors * (0.31 + rand(i + 50) * 0.06));
  const snapshots = Math.round(conversations * (0.5 + rand(i + 100) * 0.06));
  const programViews = Math.round(snapshots * (0.68 + rand(i + 150) * 0.08));
  const checkouts = Math.round(programViews * (0.16 + rand(i + 200) * 0.05));
  const purchases = Math.round(checkouts * (0.52 + rand(i + 250) * 0.08));
  return {
    date,
    visitors,
    conversations,
    snapshots,
    programViews,
    checkouts,
    purchases,
    assessments: Math.round(conversations * (0.18 + rand(i + 300) * 0.05)),
    courseViews: Math.round(visitors * (0.42 + rand(i + 350) * 0.08)),
  };
});

export const funnelTotals = funnelDays.reduce(
  (acc, d) => ({
    visitors: acc.visitors + d.visitors,
    conversations: acc.conversations + d.conversations,
    snapshots: acc.snapshots + d.snapshots,
    programViews: acc.programViews + d.programViews,
    checkouts: acc.checkouts + d.checkouts,
    purchases: acc.purchases + d.purchases,
    assessments: acc.assessments + d.assessments,
    courseViews: acc.courseViews + d.courseViews,
  }),
  { visitors: 0, conversations: 0, snapshots: 0, programViews: 0, checkouts: 0, purchases: 0, assessments: 0, courseViews: 0 },
);

/** Funnel stages in display order. */
export const FUNNEL_STAGES = [
  { key: "visitors", label: "Visitors" },
  { key: "conversations", label: "Conversation started" },
  { key: "snapshots", label: "Career snapshot" },
  { key: "programViews", label: "Program viewed" },
  { key: "checkouts", label: "Checkout started" },
  { key: "purchases", label: "Purchase completed" },
] as const;

/** Share of started conversations that reached each discovery step (last 30 days). */
export const stepReach: { stepId: DiscoveryStep["id"]; reachedPct: number; avgSecondsOnStep: number }[] = [
  { stepId: "contact", reachedPct: 100, avgSecondsOnStep: 14 },
  { stepId: "name", reachedPct: 93, avgSecondsOnStep: 9 },
  { stepId: "persona", reachedPct: 89, avgSecondsOnStep: 7 },
  { stepId: "stage", reachedPct: 86, avgSecondsOnStep: 8 },
  { stepId: "background", reachedPct: 71, avgSecondsOnStep: 41 },
  { stepId: "interests", reachedPct: 66, avgSecondsOnStep: 22 },
  { stepId: "challenges", reachedPct: 60, avgSecondsOnStep: 26 },
  { stepId: "goals", reachedPct: 57, avgSecondsOnStep: 19 },
  { stepId: "snapshot", reachedPct: 53, avgSecondsOnStep: 64 },
];

export const trafficSources = [
  { source: "Instagram", visitors: 19840, conversionPct: 2.1 },
  { source: "Google Search", visitors: 15320, conversionPct: 3.4 },
  { source: "YouTube", visitors: 8910, conversionPct: 2.6 },
  { source: "WhatsApp", visitors: 7020, conversionPct: 4.2 },
  { source: "College partner", visitors: 5640, conversionPct: 5.8 },
  { source: "Direct", visitors: 4410, conversionPct: 3.9 },
  { source: "Referral", visitors: 2560, conversionPct: 6.3 },
];

export const popularPrograms = [
  { courseId: "group-discussion-mastery", views: 6820, checkouts: 742, purchases: 418 },
  { courseId: "interview-preparation", views: 6410, checkouts: 688, purchases: 391 },
  { courseId: "communication-skills", views: 5980, checkouts: 540, purchases: 322 },
  { courseId: "campus-placement-readiness", views: 4720, checkouts: 455, purchases: 236 },
  { courseId: "career-discovery-fundamentals", views: 4510, checkouts: 1980, purchases: 1980 },
  { courseId: "resume-building", views: 3860, checkouts: 402, purchases: 251 },
  { courseId: "public-speaking-confidence", views: 3120, checkouts: 266, purchases: 141 },
  { courseId: "leadership-essentials", views: 2740, checkouts: 214, purchases: 109 },
  { courseId: "personality-development", views: 2210, checkouts: 168, purchases: 92 },
  { courseId: "professional-readiness", views: 1650, checkouts: 121, purchases: 58 },
];

export const revenueByMonth = [
  { month: "Apr", b2c: 412000, b2b: 180000 },
  { month: "May", b2c: 455000, b2b: 180000 },
  { month: "Jun", b2c: 498000, b2b: 660000 },
  { month: "Jul", b2c: 532000, b2b: 410000 },
  { month: "Aug", b2c: 611000, b2b: 245000 },
  { month: "Sep", b2c: 744000, b2b: 320000 },
  { month: "Oct", b2c: 389000, b2b: 975000 },
];

export const stageMix: { stage: LearnerStage; learners: number }[] = [
  { stage: "college", learners: 8420 },
  { stage: "graduate", learners: 4310 },
  { stage: "school", learners: 3180 },
  { stage: "professional", learners: 2760 },
  { stage: "parent", learners: 1290 },
];

export const platformTotals = {
  users: 19960,
  activeLearners: 7840,
  colleges: 5,
  mentors: 9,
  publishedCourses: 13,
  enrollments: 26410,
  upcomingSessions: 0, // computed in UI from liveSessions
  revenueMtd: 1364000,
};

// ---------------- Anonymous discovery conversations ----------------

const sources: AnonymousConversation["source"][] = ["Instagram", "Google Search", "Direct", "YouTube", "WhatsApp", "College partner", "Referral"];
const devices: AnonymousConversation["device"][] = ["Mobile", "Mobile", "Mobile", "Desktop", "Mobile", "Tablet", "Desktop"];
const stages: LearnerStage[] = ["college", "school", "graduate", "college", "professional", "parent", "college", "graduate"];
const cats: CourseCategory[] = ["Employability", "Career Discovery", "Communication", "Employability", "Leadership", "Personal Growth"];
const cities = ["Pune", "Jaipur", "Lucknow", "Hyderabad", "Indore", "Bengaluru", "Nagpur", "Kochi", "Patna", "Surat", "Bhopal", "Chennai"];
const stepOrder: DiscoveryStep["id"][] = ["contact", "name", "persona", "stage", "background", "interests", "challenges", "goals", "snapshot"];
const programForCat: Record<CourseCategory, string> = {
  Employability: "interview-preparation",
  "Career Discovery": "career-discovery-fundamentals",
  Communication: "communication-skills",
  Leadership: "leadership-essentials",
  "Personal Growth": "personality-development",
};

function pickLastStep(i: number): DiscoveryStep["id"] {
  const r = rand(i + 900);
  // Mirrors stepReach: ~47% drop before snapshot, heaviest at background
  if (r < 0.07) return "name";
  if (r < 0.11) return "persona";
  if (r < 0.14) return "stage";
  if (r < 0.29) return "background";
  if (r < 0.34) return "interests";
  if (r < 0.4) return "challenges";
  if (r < 0.43) return "goals";
  if (r < 0.47) return "contact";
  return "snapshot";
}

const generated: AnonymousConversation[] = Array.from({ length: 42 }, (_, i) => {
  const lastStepId = pickLastStep(i);
  const completed = lastStepId === "snapshot";
  const stepIdx = stepOrder.indexOf(lastStepId);
  const stage = stepIdx >= 3 ? stages[i % stages.length] : undefined;
  const cat = stepIdx >= 5 ? cats[i % cats.length] : undefined;
  const viewed = completed && rand(i + 1000) > 0.25;
  const checkout = viewed && rand(i + 1100) > 0.6;
  const purchased = checkout && rand(i + 1200) > 0.45;
  const day = 15 - Math.floor(i / 4);
  const hour = 9 + Math.floor(rand(i + 1300) * 13);
  const minute = Math.floor(rand(i + 1400) * 60);
  return {
    id: `V-${20480 - i * 7}`,
    startedAt: `2026-10-${String(Math.max(day, 5)).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
    source: sources[i % sources.length],
    device: devices[(i * 3) % devices.length],
    stage,
    persona: stepIdx >= 2 ? (stage === "parent" ? "parent" : "self") : "unknown",
    lastStepId,
    messages: Math.max(2, (stepIdx + 1) * 2 + Math.floor(rand(i + 1500) * 4)),
    durationSec: Math.round((stepIdx + 1) * 28 + rand(i + 1600) * 90),
    completed,
    interestCategory: cat,
    programViewed: viewed && cat ? programForCat[cat] : undefined,
    checkoutStarted: checkout,
    purchased,
    followUp: purchased
      ? "converted"
      : checkout
        ? "follow-up-scheduled"
        : completed && rand(i + 1700) > 0.6
          ? "callback-requested"
          : stepIdx >= 4
            ? "nurture"
            : "none",
    city: cities[i % cities.length],
  };
});

/** Hand-written example journeys with full transcripts (fictional). */
const featured: AnonymousConversation[] = [
  {
    id: "V-20488",
    startedAt: "2026-10-15T08:42:00",
    source: "Instagram",
    device: "Mobile",
    stage: "college",
    persona: "self",
    lastStepId: "snapshot",
    messages: 19,
    durationSec: 286,
    completed: true,
    interestCategory: "Employability",
    programViewed: "group-discussion-mastery",
    checkoutStarted: true,
    purchased: true,
    followUp: "converted",
    city: "Pune",
    transcript: [
      { from: "assistant", text: "Hi! I'm your CDL career guide. Let's discover what fits you best — it takes about 3 minutes. What's a good number to reach you on?", at: "08:42" },
      { from: "visitor", text: "+91 98XXX XXXXX", at: "08:42" },
      { from: "assistant", text: "Thanks! What should I call you?", at: "08:42" },
      { from: "visitor", text: "Neha", at: "08:43" },
      { from: "assistant", text: "Nice to meet you, Neha. Are you exploring your own career, or helping your child?", at: "08:43" },
      { from: "visitor", text: "My own career", at: "08:43" },
      { from: "assistant", text: "Which stage are you in right now?", at: "08:43" },
      { from: "visitor", text: "College student", at: "08:43" },
      { from: "assistant", text: "What are you studying, and which year are you in?", at: "08:44" },
      { from: "visitor", text: "B.Com, final year", at: "08:44" },
      { from: "assistant", text: "Which areas interest you most? Pick any that apply.", at: "08:44" },
      { from: "visitor", text: "Marketing, Communication", at: "08:45" },
      { from: "assistant", text: "What feels hardest right now?", at: "08:45" },
      { from: "visitor", text: "Group discussions, Interview nerves", at: "08:45" },
      { from: "assistant", text: "What would you like to achieve next?", at: "08:46" },
      { from: "visitor", text: "Get placed this season", at: "08:46" },
      { from: "assistant", text: "Here's your career snapshot, Neha. You show strong interest in people-facing, persuasive work. I'd suggest starting with Group Discussion Mastery (Live Cohort).", at: "08:46" },
      { from: "visitor", text: "Tapped: View program", at: "08:47" },
      { from: "assistant", text: "Great choice — the October evening cohort has 4 seats left.", at: "08:47" },
    ],
  },
  {
    id: "V-20486",
    startedAt: "2026-10-15T07:55:00",
    source: "WhatsApp",
    device: "Mobile",
    stage: "parent",
    persona: "parent",
    lastStepId: "background",
    messages: 9,
    durationSec: 132,
    completed: false,
    checkoutStarted: false,
    purchased: false,
    followUp: "nurture",
    city: "Indore",
    transcript: [
      { from: "assistant", text: "Hi! I'm your CDL career guide. What's a good number to reach you on?", at: "07:55" },
      { from: "visitor", text: "+91 93XXX XXXXX", at: "07:55" },
      { from: "assistant", text: "Thanks! What should I call you?", at: "07:56" },
      { from: "visitor", text: "Ramesh", at: "07:56" },
      { from: "assistant", text: "Are you exploring your own career, or helping your child?", at: "07:56" },
      { from: "visitor", text: "Helping my child", at: "07:56" },
      { from: "assistant", text: "Which stage is your child in?", at: "07:57" },
      { from: "visitor", text: "School student", at: "07:57" },
      { from: "assistant", text: "Tell me a little about their education — which class, and which subjects do they enjoy?", at: "07:57" },
    ],
  },
  {
    id: "V-20483",
    startedAt: "2026-10-14T21:18:00",
    source: "Google Search",
    device: "Desktop",
    stage: "professional",
    persona: "self",
    lastStepId: "snapshot",
    messages: 17,
    durationSec: 341,
    completed: true,
    interestCategory: "Leadership",
    programViewed: "leadership-essentials",
    checkoutStarted: true,
    purchased: false,
    followUp: "callback-requested",
    city: "Bengaluru",
    transcript: [
      { from: "assistant", text: "Hi! I'm your CDL career guide. What's a good number to reach you on?", at: "21:18" },
      { from: "visitor", text: "+91 90XXX XXXXX", at: "21:18" },
      { from: "assistant", text: "What should I call you?", at: "21:18" },
      { from: "visitor", text: "Vivek", at: "21:19" },
      { from: "assistant", text: "Are you exploring your own career, or helping your child?", at: "21:19" },
      { from: "visitor", text: "My own career", at: "21:19" },
      { from: "assistant", text: "Which stage are you in right now?", at: "21:19" },
      { from: "visitor", text: "Working professional", at: "21:19" },
      { from: "assistant", text: "What's your current role and experience?", at: "21:20" },
      { from: "visitor", text: "Senior analyst, 6 years", at: "21:20" },
      { from: "assistant", text: "Which areas would you like to grow in?", at: "21:21" },
      { from: "visitor", text: "Leadership, People management", at: "21:21" },
      { from: "assistant", text: "What's getting in the way right now?", at: "21:22" },
      { from: "visitor", text: "Not sure how to lead a team", at: "21:22" },
      { from: "assistant", text: "Here's your snapshot, Vivek. Leadership Essentials (Live Cohort) plus one-to-one coaching looks like a strong fit.", at: "21:23" },
      { from: "visitor", text: "Tapped: Request a callback", at: "21:24" },
      { from: "assistant", text: "Done! A CDL advisor will call you tomorrow between 6–8 PM (simulated).", at: "21:24" },
    ],
  },
];

export const conversations: AnonymousConversation[] = [...featured, ...generated].sort((a, b) =>
  b.startedAt.localeCompare(a.startedAt),
);
