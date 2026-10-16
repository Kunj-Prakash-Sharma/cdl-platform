import { publicCourses } from "@/data/courses";
import { packages as seedPackages } from "@/data/commerce";
import { DISCOVERY_STEPS, STAGE_META } from "@/data/constants";
import { recommendCourses } from "@/lib/recommend";
import type { DiscoveryAnswers, DiscoveryResult, DiscoveryStep, LearningFormat } from "@/lib/types";

/**
 * Free Career Discovery — a predefined conversation driven by simple, transparent frontend rules.
 * No AI is involved: every message, option and result below is deterministic demo content.
 */

export const GUIDE = { name: "Disha", title: "Career guide at CDL" };

/** Whose path the conversation is about. Parents get their own track regardless of the child's stage. */
export type Track = "school" | "college" | "graduate" | "professional" | "parent";

export type NodeId =
  | "contact"
  | "name"
  | "persona"
  | "childName"
  | "stage"
  | "background"
  | "interests"
  | "challenges"
  | "goals"
  | "snapshot";

export type OptionIcon = "self" | "parent" | "school" | "college" | "graduate" | "professional";

export interface CardOption {
  value: string;
  label: string;
  description: string;
  icon: OptionIcon;
}

export type InputSpec =
  | { kind: "phone" }
  | { kind: "text"; placeholder: string; suggestions?: string[]; aside?: string; maxLength: number; minLength: number }
  | { kind: "cards"; options: CardOption[] }
  | { kind: "multi"; options: string[]; max: number; customPlaceholder: string }
  | { kind: "single"; options: string[]; customPlaceholder: string }
  | { kind: "none" };

export type AssistantMessage =
  | { kind: "text"; text: string }
  | { kind: "note"; text: string }
  | { kind: "course"; lead: string; courseId: string; format: LearningFormat; reason: string };

/** Chip used in the background step when the visitor's circumstances changed recently. */
export const SITUATION_CHANGED = "My situation changed recently";

// ---------------------------------------------------------------- helpers

export const trackOf = (a: DiscoveryAnswers): Track | undefined =>
  a.persona === "parent" ? "parent" : (a.stage as Track | undefined);

const firstName = (name?: string) => (name ?? "").trim().split(/\s+/)[0] || "there";
const childOf = (a: DiscoveryAnswers) => firstName(a.childName) === "there" ? "your child" : firstName(a.childName);
/** Lower-cases the first letter unless the word is an acronym ("HR", "IT"). */
const lowerFirst = (s: string) => (!s || /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export function listJoin(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** "9876543210" → "+91 98765 43210" */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(-10);
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

export const isValidMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits.replace(/\D/g, ""));

// ---------------------------------------------------------------- flow

export function getFlow(a: DiscoveryAnswers): NodeId[] {
  return [
    "contact",
    "name",
    "persona",
    ...(a.persona === "parent" ? (["childName"] as NodeId[]) : []),
    "stage",
    "background",
    "interests",
    "challenges",
    "goals",
    "snapshot",
  ];
}

/** Maps each conversation node onto the shared DISCOVERY_STEPS (used for progress + drop-off analytics). */
export const NODE_STEP: Record<NodeId, DiscoveryStep["id"]> = {
  contact: "contact",
  name: "name",
  persona: "persona",
  childName: "stage",
  stage: "stage",
  background: "background",
  interests: "interests",
  challenges: "challenges",
  goals: "goals",
  snapshot: "snapshot",
};

export function stepFor(node: NodeId) {
  return DISCOVERY_STEPS.find((s) => s.id === NODE_STEP[node]) ?? DISCOVERY_STEPS[0];
}

export function isAnswered(node: NodeId, a: DiscoveryAnswers): boolean {
  switch (node) {
    case "contact":
      return !!a.phone;
    case "name":
      return !!a.name;
    case "persona":
      return !!a.persona;
    case "childName":
      return !!a.childName;
    case "stage":
      return !!a.stage;
    case "background":
      return !!a.background;
    case "interests":
      return a.interests.length > 0;
    case "challenges":
      return a.challenges.length > 0;
    case "goals":
      return a.goals.length > 0;
    case "snapshot":
      return false;
  }
}

/** Patch that removes the answer for a node (used by Back / undo). */
export function clearedAnswer(node: NodeId): Partial<DiscoveryAnswers> {
  switch (node) {
    case "contact":
      return { phone: undefined };
    case "name":
      return { name: undefined };
    case "persona":
      return { persona: undefined };
    case "childName":
      return { childName: undefined };
    case "stage":
      return { stage: undefined };
    case "background":
      return { background: undefined };
    case "interests":
      return { interests: [] };
    case "challenges":
      return { challenges: [] };
    case "goals":
      return { goals: [] };
    case "snapshot":
      return {};
  }
}

/**
 * Applies an answer and works out where the conversation goes next. Changing who the conversation is
 * about (persona) or the stage resets the stage-specific answers; otherwise later answers are kept and
 * the flow resumes at the first unanswered step (or the snapshot).
 */
export function applyAnswer(prev: DiscoveryAnswers, node: NodeId, patch: Partial<DiscoveryAnswers>) {
  let next: DiscoveryAnswers = { ...prev, ...patch };
  const stageSpecific: Partial<DiscoveryAnswers> = { background: undefined, interests: [], challenges: [], goals: [] };
  if (node === "persona" && prev.persona && prev.persona !== next.persona) {
    next = { ...next, childName: undefined, stage: undefined, ...stageSpecific };
  }
  if (node === "stage" && prev.stage && prev.stage !== next.stage) {
    next = { ...next, ...stageSpecific };
  }
  const flow = getFlow(next);
  let index = flow.indexOf(node) + 1;
  while (flow[index] !== "snapshot" && isAnswered(flow[index], next)) index++;
  return { answers: next, stepIndex: index, node: flow[index] };
}

// ---------------------------------------------------------------- options per track

const STAGE_CARDS: CardOption[] = [
  { value: "school", label: "School student", description: "Class 8–12 · choosing subjects and streams", icon: "school" },
  { value: "college", label: "College student", description: "UG / PG · building placement readiness", icon: "college" },
  { value: "graduate", label: "Graduate / job seeker", description: "Looking for the first (or next) job", icon: "graduate" },
  { value: "professional", label: "Working professional", description: "Growing, leading or switching careers", icon: "professional" },
];

const CHILD_STAGE_CARDS: CardOption[] = [
  { value: "school", label: "In school", description: "Class 8–12 · subjects, streams and strengths", icon: "school" },
  { value: "college", label: "In college", description: "UG / PG · placements and direction", icon: "college" },
  { value: "graduate", label: "Recently graduated", description: "Looking for a first job", icon: "graduate" },
];

const BACKGROUND: Record<Track, { ack: string; question: string; placeholder: string; suggestions: string[] }> = {
  school: {
    ack: "School is a great time to explore — nobody expects you to have it all figured out.",
    question: "Which class are you in, and what are your favourite subjects?",
    placeholder: "e.g. Class 10 · I enjoy Biology and Art",
    suggestions: ["Class 9 · Maths & Science", "Class 10 · Biology & Drawing", "Class 11 Commerce · Economics", "Class 12 Science (PCM)", "Class 11 Humanities · Psychology"],
  },
  college: {
    ack: "College is where careers really start taking shape.",
    question: "Tell me about your course — degree, specialisation and year.",
    placeholder: "e.g. BBA · Marketing · Final year",
    suggestions: ["BBA · Marketing · Final year", "B.Tech CSE · 3rd year", "B.Com · 2nd year", "B.Sc Data Science · Final year", "BA Psychology · 2nd year"],
  },
  graduate: {
    ack: "A job search can feel like a lot — let's make it more focused.",
    question: "What did you study, and how long has it been since you graduated?",
    placeholder: "e.g. B.Com · graduated 6 months ago",
    suggestions: ["B.Com · graduated this year", "B.Tech Mechanical · 1 year ago", "BBA · 6 months ago", "MBA (HR) · just graduated", "BCA · 2 years ago"],
  },
  professional: {
    ack: "Great — experience gives you a lot to build on.",
    question: "What's your current role, and how many years of experience do you have?",
    placeholder: "e.g. Sales executive · 3 years",
    suggestions: ["Sales executive · 3 yrs", "Software engineer · 5 yrs", "HR executive · 4 yrs", "Team lead · 8 yrs", "Operations analyst · 2 yrs"],
  },
  parent: {
    ack: "Thank you — let's get to know them a little better.",
    question: "Which class or year are they in, and which subjects do they enjoy?",
    placeholder: "e.g. Class 10 · enjoys Biology and Drawing",
    suggestions: ["Class 10 · Biology & Drawing", "Class 9 · loves Maths", "Class 11 Science · unsure", "Class 12 Commerce", "1st-year college · B.Com"],
  },
};

const INTERESTS: Record<Track, { question: string; options: string[] }> = {
  school: {
    question: "What do you enjoy most? Pick a few — subjects, activities or things you're curious about.",
    options: ["Science & experiments", "Maths & puzzles", "Computers & coding", "Art & design", "Writing & literature", "Business & economics", "Debating & public speaking", "Sports & fitness", "Helping people", "Music & performing arts", "Exploring different careers"],
  },
  college: {
    question: "Which areas interest you most? Pick a few specialisations or roles that feel exciting.",
    options: ["Marketing", "Finance", "HR & people", "Data & analytics", "Consulting", "Sales & business development", "Product & tech", "Operations", "Entrepreneurship", "Content & media", "Campus placements"],
  },
  graduate: {
    question: "What kind of roles are you aiming for? Pick all that apply.",
    options: ["First job in my field", "Sales & marketing roles", "Banking & finance", "IT & software", "Operations & supply chain", "HR & recruitment", "Government / PSU exams", "Higher studies (MBA / MS)", "Job readiness", "Startups"],
  },
  professional: {
    question: "Which areas do you want to grow in? Pick a few.",
    options: ["Leading a team", "People management", "Career switch", "Executive presence", "Strategic thinking", "Communication & influence", "Product management", "Upskilling for promotion", "Entrepreneurship", "Work–life balance"],
  },
  parent: {
    question: "What are they naturally drawn to? Pick a few.",
    options: ["Science & experiments", "Maths & puzzles", "Art & design", "Computers & coding", "Sports", "Reading & writing", "Helping others", "Business & money", "Music & performing arts", "Not sure yet"],
  },
};

const CHALLENGES: Record<Track, { question: string; options: string[] }> = {
  school: {
    question: "What feels hardest right now? Pick any that apply — there are no wrong answers.",
    options: ["Unsure about which stream to choose", "Don't know my strengths", "Exam pressure", "Low confidence", "Too many options, feeling confused", "Stage fear while speaking"],
  },
  college: {
    question: "What's getting in the way right now? Pick any that apply.",
    options: ["Group discussions", "Interview nerves", "Resume doesn't stand out", "Communication / spoken English", "Placement readiness", "Unclear career direction"],
  },
  graduate: {
    question: "What's been the toughest part of the job search so far?",
    options: ["Not getting shortlisted", "Interview rejections", "Unclear direction", "Lack of work experience", "Low confidence after rejections", "Communication"],
  },
  professional: {
    question: "What's holding you back at the moment?",
    options: ["Feeling stuck in my role", "Want to lead a team", "Considering a career switch", "Building executive presence", "Managing stress & workload", "Presenting to senior leaders"],
  },
  parent: {
    question: "What concerns you most about their path right now?",
    options: ["Unsure about stream or subjects", "Low confidence", "Exam & peer pressure", "We disagree on career options", "Don't know their strengths", "Low motivation"],
  },
};

const GOALS: Record<Track, string[]> = {
  school: ["Choose the right stream", "Discover my strengths", "Build my confidence", "Explore career options early", "Prepare for college applications"],
  college: ["Get placed on campus", "Crack GDs and interviews", "Build a strong resume", "Become a confident communicator", "Find the right career path"],
  graduate: ["Land my first job", "Get more interview calls", "Clear interviews confidently", "Decide on a clear direction", "Become job-ready for corporate life"],
  professional: ["Move into a leadership role", "Switch careers confidently", "Grow my executive presence", "Get promoted in the next year", "Communicate with more impact"],
  parent: ["Help them choose the right stream", "Understand their strengths", "Build their confidence", "Plan the next 2–3 years together", "Talk to an expert first"],
};

/** Challenge chip → development area (noun phrase). */
const DEVELOPMENT: Record<string, string> = {
  "Unsure about which stream to choose": "Stream & subject clarity",
  "Don't know my strengths": "Self-awareness of strengths",
  "Exam pressure": "Managing pressure",
  "Low confidence": "Self-confidence",
  "Too many options, feeling confused": "Career decision-making",
  "Stage fear while speaking": "Speaking confidence",
  "Group discussions": "Structured thinking in group discussions",
  "Interview nerves": "Interview composure",
  "Resume doesn't stand out": "Resume & profile impact",
  "Communication / spoken English": "Clear, confident communication",
  "Placement readiness": "Placement preparation",
  "Unclear career direction": "Career direction",
  "Not getting shortlisted": "Resume & profile impact",
  "Interview rejections": "Interview performance",
  "Unclear direction": "Career direction",
  "Lack of work experience": "Showcasing transferable skills",
  "Low confidence after rejections": "Resilience after setbacks",
  Communication: "Clear, confident communication",
  "Feeling stuck in my role": "Career growth planning",
  "Want to lead a team": "People leadership",
  "Considering a career switch": "Career transition planning",
  "Building executive presence": "Executive presence",
  "Managing stress & workload": "Managing pressure",
  "Presenting to senior leaders": "Influential presentations",
  "Unsure about stream or subjects": "Stream & subject clarity",
  "Exam & peer pressure": "Managing pressure",
  "We disagree on career options": "Aligned family decisions",
  "Don't know their strengths": "Understanding strengths",
  "Low motivation": "Motivation & study habits",
};

export const developmentArea = (challenge: string) => DEVELOPMENT[challenge] ?? challenge;

// ---------------------------------------------------------------- interest families (illustrative)

export type InterestFamily = "enterprising" | "social" | "artistic" | "investigative" | "conventional" | "realistic";

export const FAMILY_META: Record<InterestFamily, { label: string; descriptor: string }> = {
  enterprising: { label: "Enterprising & Leading", descriptor: "a natural persuader and organiser" },
  social: { label: "Social & Helping", descriptor: "a people-first communicator" },
  artistic: { label: "Creative & Expressive", descriptor: "a creative, expressive thinker" },
  investigative: { label: "Analytical & Investigative", descriptor: "an analytical problem-solver" },
  conventional: { label: "Organised & Detail-focused", descriptor: "a structured, detail-minded planner" },
  realistic: { label: "Hands-on & Technical", descriptor: "a hands-on, practical builder" },
};

/** Secondary signals: a chip often hints at a second family too (e.g. marketing is also creative). */
const SECONDARY_RULES: [RegExp, InterestFamily][] = [
  [/market|content|media|brand|design/i, "artistic"],
  [/consult|strateg|data|finance|research|product/i, "investigative"],
  [/sales|hr|people|lead|team|teach|speaking|communicat/i, "social"],
  [/operations|finance|account|placement|readiness|resume|exam/i, "conventional"],
  [/engineer|tech|computer|coding|sport/i, "realistic"],
  [/business|money|startup|promot/i, "enterprising"],
];

const FAMILY_RULES: [RegExp, InterestFamily][] = [
  [/market|sales|business|entrepren|startup|consult|lead|influence|promot|strateg|debat|executive|money/i, "enterprising"],
  [/\bhr\b|people|helping|teach|counsel|recruit|work–life|others|communicat|speaking/i, "social"],
  [/art|design|writing|music|content|media|literature|perform|reading/i, "artistic"],
  [/science|math|data|analytic|coding|computer|tech|research|software|product|it &/i, "investigative"],
  [/finance|bank|account|operations|supply|government|psu|exam|organis|readiness|higher studies/i, "conventional"],
  [/sport|fitness|engineer|mechan|build|hands-on|manufactur/i, "realistic"],
];

/** Illustrative interest profile derived from the chips a visitor picked (0-100). Not a psychometric score. */
export function interestProfile(a: DiscoveryAnswers): { key: InterestFamily; label: string; value: number }[] {
  const score: Record<InterestFamily, number> = { enterprising: 34, social: 34, artistic: 30, investigative: 30, conventional: 26, realistic: 22 };
  const add = (text: string, by: number) => {
    for (const [re, fam] of FAMILY_RULES) if (re.test(text)) score[fam] += by;
  };
  a.interests.forEach((i) => {
    add(i, 16);
    for (const [re, fam] of SECONDARY_RULES) if (re.test(i)) score[fam] += 8;
  });
  [...a.goals, ...a.challenges].forEach((t) => add(t, 6));
  if (a.background) add(a.background, 6);
  return (Object.keys(score) as InterestFamily[])
    .map((key) => ({ key, label: FAMILY_META[key].label, value: Math.min(92, score[key]) }))
    .sort((x, y) => y.value - x.value);
}

// ---------------------------------------------------------------- messages + inputs per node

function courseMessage(lead: string, a: DiscoveryAnswers, limit: number, skip?: string): AssistantMessage | null {
  const recs = recommendCourses({ stage: a.stage, persona: a.persona, interests: a.interests, challenges: a.challenges }, limit);
  const pick = recs.find((r) => r.course.id !== skip);
  if (!pick) return null;
  return { kind: "course", lead, courseId: pick.course.id, format: pick.format, reason: pick.reason };
}

/** The first inline suggestion's course id, so the second suggestion can avoid repeating it. */
function firstSuggestionId(a: DiscoveryAnswers) {
  const recs = recommendCourses({ stage: a.stage, persona: a.persona, interests: a.interests }, 1);
  return recs[0]?.course.id;
}

/** What the assistant says when a node becomes the active question. */
export function nodeMessages(node: NodeId, a: DiscoveryAnswers): AssistantMessage[] {
  const track = trackOf(a);
  const name = firstName(a.name);
  switch (node) {
    case "contact":
      return [
        { kind: "text", text: `Hi there! I'm ${GUIDE.name}, a career guide at Career Design Lab 👋` },
        {
          kind: "text",
          text: "In about 3 minutes I'll ask a few quick questions and put together a free career snapshot — with learning suggestions that actually fit you. It's free and there's no registration.",
        },
        { kind: "text", text: "To begin, what's your mobile number? It lets us save your snapshot — and call you back only if you ask us to." },
        { kind: "note", text: "Demo: no OTP is sent and nothing is stored." },
      ];
    case "name":
      return [
        { kind: "text", text: "Thanks — that's all we need. No OTP, no password." },
        { kind: "text", text: "What should I call you?" },
      ];
    case "persona":
      return [
        { kind: "text", text: `Lovely to meet you, ${name}! 😊` },
        { kind: "text", text: "Are you exploring your own career, or helping your child with theirs?" },
      ];
    case "childName":
      return [
        { kind: "text", text: "That's wonderful — parents who get involved early make a real difference." },
        { kind: "text", text: "What's your child's name?" },
      ];
    case "stage":
      return a.persona === "parent"
        ? [{ kind: "text", text: `Thanks! Which stage is ${childOf(a)} at right now?` }]
        : [
            { kind: "text", text: "Great — let's focus on you." },
            { kind: "text", text: "Which of these best describes where you are right now?" },
          ];
    case "background": {
      if (!track) return [];
      const b = BACKGROUND[track];
      return [
        { kind: "text", text: track === "parent" ? `Thank you — let's get to know ${childOf(a)} a little better.` : b.ack },
        { kind: "text", text: track === "parent" ? `Which class or year is ${childOf(a)} in, and which subjects do they enjoy?` : b.question },
      ];
    }
    case "interests": {
      if (!track) return [];
      const q = INTERESTS[track];
      return [
        { kind: "text", text: "That helps a lot, thank you." },
        { kind: "text", text: track === "parent" ? `What is ${childOf(a)} naturally drawn to? Pick a few.` : q.question },
      ];
    }
    case "challenges": {
      if (!track) return [];
      const picked = a.interests.slice(0, 2);
      const msgs: AssistantMessage[] = [
        { kind: "text", text: picked.length ? `${listJoin(picked)} — great picks.` : "Great picks." },
      ];
      const suggestion = courseMessage("Learners with similar interests often start with…", { ...a, challenges: [] }, 1);
      if (suggestion) msgs.push(suggestion);
      msgs.push({ kind: "text", text: track === "parent" ? `What concerns you most about ${childOf(a)}'s path right now?` : CHALLENGES[track].question });
      return msgs;
    }
    case "goals": {
      if (!track) return [];
      const msgs: AssistantMessage[] = [
        { kind: "text", text: "Thanks for being honest — these are very common, and very fixable with the right practice." },
      ];
      const suggestion = courseMessage(
        `For ${lowerFirst(developmentArea(a.challenges[0] ?? "your goals"))}, learners often find this helpful…`,
        { ...a, interests: [] },
        3,
        firstSuggestionId(a),
      );
      if (suggestion) msgs.push(suggestion);
      msgs.push({
        kind: "text",
        text: track === "parent" ? `Last question! What would you most like to achieve for ${childOf(a)} next?` : "Last question! What would you most like to achieve next?",
      });
      return msgs;
    }
    case "snapshot":
      return [{ kind: "text", text: `That's everything, ${name}. Here's your free career snapshot ✨` }];
  }
}

/** How the visitor answers a node. */
export function nodeInput(node: NodeId, a: DiscoveryAnswers): InputSpec {
  const track = trackOf(a);
  switch (node) {
    case "contact":
      return { kind: "phone" };
    case "name":
      return { kind: "text", placeholder: "Your first name", maxLength: 40, minLength: 2 };
    case "persona":
      return {
        kind: "cards",
        options: [
          { value: "self", label: "My own career", description: "I'm a student, graduate or working professional", icon: "self" },
          { value: "parent", label: "My child's career", description: "I'm a parent or guardian", icon: "parent" },
        ],
      };
    case "childName":
      return { kind: "text", placeholder: "Your child's first name", maxLength: 40, minLength: 2 };
    case "stage":
      return { kind: "cards", options: a.persona === "parent" ? CHILD_STAGE_CARDS : STAGE_CARDS };
    case "background": {
      if (!track) return { kind: "none" };
      const b = BACKGROUND[track];
      return {
        kind: "text",
        placeholder: b.placeholder,
        suggestions: b.suggestions,
        aside: a.freeText?.situationChanged ? undefined : SITUATION_CHANGED,
        maxLength: 120,
        minLength: 3,
      };
    }
    case "interests":
      return track ? { kind: "multi", options: INTERESTS[track].options, max: 5, customPlaceholder: "Add your own interest" } : { kind: "none" };
    case "challenges":
      return track ? { kind: "multi", options: CHALLENGES[track].options, max: 4, customPlaceholder: "Describe another challenge" } : { kind: "none" };
    case "goals":
      return track
        ? {
            kind: "single",
            options: track === "parent" ? GOALS.parent.map((g) => g.replace("them", childOf(a)).replace("their", `${childOf(a)}'s`)) : GOALS[track],
            customPlaceholder: "Or type your own goal",
          }
        : { kind: "none" };
    case "snapshot":
      return { kind: "none" };
  }
}

const STAGE_ANSWER: Record<string, string> = {
  school: "I'm a school student",
  college: "I'm in college",
  graduate: "I've graduated and I'm looking for a job",
  professional: "I'm a working professional",
};
const CHILD_STAGE_ANSWER: Record<string, string> = {
  school: "in school",
  college: "in college",
  graduate: "a recent graduate",
};

/** The visitor's reply bubble for an answered node. */
export function answerText(node: NodeId, a: DiscoveryAnswers): string {
  switch (node) {
    case "contact":
      return a.phone ?? "";
    case "name":
      return a.name ?? "";
    case "persona":
      return a.persona === "parent" ? "I'm helping my child" : "I'm exploring my own career";
    case "childName":
      return a.childName ?? "";
    case "stage":
      if (!a.stage) return "";
      return a.persona === "parent" ? `${childOf(a)} is ${CHILD_STAGE_ANSWER[a.stage] ?? STAGE_META[a.stage].label.toLowerCase()}` : STAGE_ANSWER[a.stage] ?? STAGE_META[a.stage].label;
    case "background":
      return a.background ?? "";
    case "interests":
      return a.interests.join(" · ");
    case "challenges":
      return a.challenges.join(" · ");
    case "goals":
      return a.goals.join(" · ");
    case "snapshot":
      return "";
  }
}

/** Label + value rows for the "Your answers so far" summary. */
export function summaryLabel(node: NodeId, a: DiscoveryAnswers): string {
  const map: Record<NodeId, string> = {
    contact: "Mobile",
    name: "Name",
    persona: "Exploring for",
    childName: "Child's name",
    stage: a.persona === "parent" ? "Child's stage" : "Current stage",
    background: a.persona === "parent" ? "Child's class & subjects" : "Background",
    interests: a.persona === "parent" ? "Child's interests" : "Interests",
    challenges: a.persona === "parent" ? "Concerns" : "Challenges",
    goals: "Goal",
    snapshot: "Career snapshot",
  };
  return map[node];
}

export function summaryValue(node: NodeId, a: DiscoveryAnswers): string {
  switch (node) {
    case "persona":
      return a.persona === "parent" ? "My child's career" : a.persona === "self" ? "My own career" : "";
    case "stage":
      return a.stage ? STAGE_META[a.stage].label : "";
    case "interests":
      return a.interests.join(", ");
    case "challenges":
      return a.challenges.join(", ");
    case "goals":
      return a.goals.join(", ");
    default:
      return answerText(node, a);
  }
}

// ---------------------------------------------------------------- result

const PACKAGE_BY_TRACK: Record<Track, string> = {
  school: "pkg-clarity-pack",
  parent: "pkg-clarity-pack",
  college: "pkg-placement-bundle",
  graduate: "pkg-placement-bundle",
  professional: "pkg-leader-cohort",
};

/** Suggested bundle for the visitor, falling back to any active package. */
export function suggestPackageId(a: DiscoveryAnswers, activePackageIds?: string[]) {
  const track = trackOf(a) ?? "college";
  const text = [...a.challenges, ...a.goals, ...a.interests].join(" ");
  let id = PACKAGE_BY_TRACK[track];
  if (track === "professional" && /switch/i.test(text) && !/lead/i.test(text)) id = "pkg-self-pass";
  const active = activePackageIds ?? seedPackages.filter((p) => p.active).map((p) => p.id);
  if (active.includes(id)) return id;
  return active.find((p) => p !== "pkg-parent-plan") ?? active[0];
}

/** A mentor who fits the visitor's situation (shown on the snapshot). */
export function suggestMentorId(a: DiscoveryAnswers) {
  const track = trackOf(a) ?? "college";
  const text = [...a.challenges, ...a.goals].join(" ");
  if (track === "school" || track === "parent") return "m-meera";
  if (track === "professional") {
    if (/switch/i.test(text)) return "m-sameer";
    if (/present|executive|communicat/i.test(text)) return "m-kavya";
    return "m-rohan";
  }
  if (/group discussion|gd/i.test(text)) return "m-vikram";
  if (/shortlist|resume|experience/i.test(text)) return "m-farah";
  if (/communicat|speak/i.test(text)) return "m-kavya";
  if (/direction/i.test(text) && track === "graduate") return "m-meera";
  return "m-arjun";
}

function goalPhrase(goal: string | undefined, known: string[]) {
  if (!goal) return "take your next step";
  return known.includes(goal) ? lowerFirst(goal) : "reach the goal you shared";
}

const STAGE_PHRASE: Record<Exclude<Track, "parent">, string> = {
  school: "a school student",
  college: "a college student",
  graduate: "a graduate",
  professional: "a working professional",
};

/** Builds the illustrative career snapshot from the visitor's answers. Deterministic — no AI. */
export function buildDiscoveryResult(a: DiscoveryAnswers, opts: { activePackageIds?: string[]; createdAt?: string } = {}): DiscoveryResult {
  const track = trackOf(a) ?? "college";
  const name = firstName(a.name);
  const child = childOf(a);
  const profile = interestProfile(a);
  const top = profile[0].key;
  const descriptor = FAMILY_META[top].descriptor;
  const goals = nodeInput("goals", a);
  const knownGoals = goals.kind === "single" ? goals.options : [];
  const goal = goalPhrase(a.goals[0], knownGoals);
  const devAreas = Array.from(new Set(a.challenges.map(developmentArea))).slice(0, 4);
  const interestsText = listJoin(a.interests.slice(0, 3).map(lowerFirst));
  const devText = listJoin(devAreas.slice(0, 2).map(lowerFirst));

  const headline =
    track === "parent"
      ? `${child} looks like ${descriptor} — let's ${goal}`
      : `${name}, you're ${descriptor}, ready to ${goal}`;

  const summary =
    track === "parent"
      ? `${child} (${(a.background ?? "").trim() || CHILD_STAGE_ANSWER[a.stage ?? "school"]}) is naturally drawn to ${interestsText || "a range of things"}. ` +
        `The areas you'd most like to support are ${devText || "clarity and confidence"} — very common at this stage. ` +
        `Your goal is to ${goal}. A structured look at ${child}'s strengths, followed by a conversation with an expert, usually brings real clarity within a few weeks — the suggestions below are a calm, practical place to start.`
      : `You're ${STAGE_PHRASE[track]} (${(a.background ?? "").trim() || STAGE_META[track].label}) drawn to ${interestsText || "several areas"}. ` +
        `Right now the areas worth working on are ${devText || "clarity and confidence"} — completely normal at this stage. ` +
        `Your next goal is to ${goal}. With focused practice over the next 6–8 weeks, learners with a similar profile typically see a clear jump in confidence; the three suggestions below are a good place to start.`;

  const recs = recommendCourses({ stage: a.stage, persona: a.persona, interests: a.interests, challenges: a.challenges, goals: a.goals }, 3);

  return {
    createdAt: opts.createdAt ?? "",
    headline,
    summary,
    interestAreas: profile.slice(0, 3).map((p) => p.label),
    developmentAreas: devAreas.length ? devAreas : ["Career direction"],
    recommendations: recs.map((r) => ({ title: r.course.title, reason: r.reason, courseId: r.course.id, format: r.format })),
    suggestedPackageId: suggestPackageId(a, opts.activePackageIds),
  };
}

// ---------------------------------------------------------------- follow-up Q&A after the snapshot

export type FollowUpId = "live-cohort" | "mentor-first" | "cost" | "assessment" | "certificate";

export const FOLLOW_UPS: { id: FollowUpId; question: string }[] = [
  { id: "live-cohort", question: "What happens in a Live Cohort?" },
  { id: "mentor-first", question: "Can I talk to a mentor first?" },
  { id: "cost", question: "How much does it cost?" },
  { id: "assessment", question: "Is there a full assessment?" },
  { id: "certificate", question: "Do I get a certificate?" },
];

const prices = (format: LearningFormat) =>
  publicCourses.map((c) => c.pricing[format]).filter((p): p is number => typeof p === "number" && p > 0);

export const PRICE_RANGES = {
  selfPacedFrom: Math.min(...prices("self-paced")),
  liveFrom: Math.min(...prices("live-cohort")),
  liveTo: Math.max(...prices("live-cohort")),
  mentoringFrom: Math.min(...prices("mentoring")),
};
