import { Bot, Brain, CalendarRange, Compass, Lightbulb, Mic, Milestone, type LucideIcon } from "lucide-react";

export type AiFeatureId = "assistant" | "explorer" | "psychometric" | "next-step" | "mock-interview" | "study-plan" | "career-plan";

export interface AiFeature {
  id: AiFeatureId;
  title: string;
  short: string;
  description: string;
  status: "Coming soon" | "Planned";
  icon: LucideIcon;
  /** Two-stop gradient for the icon tile */
  from: string;
  to: string;
  capabilities: string[];
  exampleLabel: string;
}

/** Phase 2 roadmap: AI features previewed (not implemented) in the prototype. */
export const AI_FEATURES: AiFeature[] = [
  {
    id: "assistant",
    title: "AI Personal Career & Development Assistant",
    short: "Career assistant",
    description: "An always-available companion that knows your goals, courses, sessions and mentor notes — and turns them into clear daily guidance.",
    status: "Coming soon",
    icon: Bot,
    from: "#312e81",
    to: "#6366f1",
    capabilities: ["Answers questions about your learning", "Prepares you for upcoming classes", "Gentle nudges before deadlines"],
    exampleLabel: "Sample conversation",
  },
  {
    id: "explorer",
    title: "AI Career Explorer",
    short: "Career explorer",
    description: "Explore careers that match your interests and strengths, with realistic entry paths, skills to build and what a typical day looks like.",
    status: "Planned",
    icon: Compass,
    from: "#0f766e",
    to: "#14b8a6",
    capabilities: ["Career matches with reasons", "Entry routes for your stage", "Skills gap at a glance"],
    exampleLabel: "Sample career matches",
  },
  {
    id: "psychometric",
    title: "AI Interpretation of Psychometric Results",
    short: "Results interpreter",
    description: "Plain-language explanations of your assessment results — what your profile suggests, what it doesn't, and questions to discuss with a mentor.",
    status: "Planned",
    icon: Brain,
    from: "#6d28d9",
    to: "#a855f7",
    capabilities: ["Explains each dimension simply", "Highlights patterns across assessments", "Prepares questions for your mentor"],
    exampleLabel: "Sample interpretation",
  },
  {
    id: "next-step",
    title: "AI “What Should I Do Next?”",
    short: "Next best step",
    description: "One tap for a prioritised list of next actions across courses, assignments, sessions and mentoring — with the reason behind each one.",
    status: "Coming soon",
    icon: Lightbulb,
    from: "#b45309",
    to: "#f59e0b",
    capabilities: ["Prioritised by deadlines and goals", "Explains why each step matters", "Adapts as you make progress"],
    exampleLabel: "Sample next steps",
  },
  {
    id: "mock-interview",
    title: "AI Mock Interview",
    short: "Mock interview",
    description: "Practise HR and role-fit interviews any time, then get a structured scorecard on content, structure, clarity and delivery.",
    status: "Coming soon",
    icon: Mic,
    from: "#9f1239",
    to: "#f43f5e",
    capabilities: ["Role-specific question sets", "Instant structured feedback", "Track improvement over attempts"],
    exampleLabel: "Sample scorecard",
  },
  {
    id: "study-plan",
    title: "AI Personal Study Plan",
    short: "Study plan",
    description: "A weekly plan that fits your timetable — balancing lessons, assignments, live classes and practice around college and placement season.",
    status: "Planned",
    icon: CalendarRange,
    from: "#1e40af",
    to: "#38bdf8",
    capabilities: ["Fits around your live classes", "Rebalances when you fall behind", "Syncs with your calendar"],
    exampleLabel: "Sample weekly plan",
  },
  {
    id: "career-plan",
    title: "AI Career Plan",
    short: "Career plan",
    description: "A living 12-month roadmap from where you are today to your target role — milestones, learning and checkpoints you can review with your mentor.",
    status: "Planned",
    icon: Milestone,
    from: "#0e7490",
    to: "#22d3ee",
    capabilities: ["Quarter-by-quarter milestones", "Linked courses and mentoring", "Reviewed with a human mentor"],
    exampleLabel: "Sample roadmap",
  },
];
