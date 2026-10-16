"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CircleCheck, GraduationCap, HeartHandshake, Quote, School, UserRoundSearch } from "lucide-react";
import { courseStartingPrice, getCourse, isFreeCourse } from "@/data";
import { STAGE_META } from "@/data/constants";
import { formatINR } from "@/lib/format";
import type { AvatarSpec, LearnerStage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";

type Audience = {
  stage: LearnerStage;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  outcomes: string[];
  courseIds: string[];
  persona: { name: string; context: string; quote: string; avatar: AvatarSpec };
};

const AUDIENCES: Audience[] = [
  {
    stage: "school",
    icon: School,
    title: "School Students",
    blurb: "Explore interests early and choose streams and subjects with confidence — not guesswork or peer pressure.",
    outcomes: [
      "Discover interest areas through a guided, judgement-free conversation",
      "Choose a stream after Class 10 with a clear rationale",
      "Build everyday confidence, communication and study habits",
    ],
    courseIds: ["career-discovery-fundamentals", "personality-development", "public-speaking-confidence"],
    persona: {
      name: "Aditi",
      context: "Class 10 · Jaipur",
      quote: "I like biology but hate memorising. What should I take after Class 10?",
      avatar: { skin: 1, hair: "long", hairColor: 0, bg: 2, shirt: 4 },
    },
  },
  {
    stage: "college",
    icon: GraduationCap,
    title: "College Students",
    blurb: "Get placement-ready: sharper communication, stronger group discussions, interview practice and a resume that gets shortlisted.",
    outcomes: [
      "Stand out in GD rounds and HR interviews",
      "Turn projects and internships into a shortlist-worthy resume",
      "Plan placement season week by week, with live evening practice",
    ],
    courseIds: ["group-discussion-mastery", "campus-placement-readiness", "interview-preparation"],
    persona: {
      name: "Riya",
      context: "Final-year BBA · Pune",
      quote: "Marketing or HR? And how do I stop freezing in group discussions?",
      avatar: { skin: 1, hair: "long", hairColor: 1, bg: 1, shirt: 2 },
    },
  },
  {
    stage: "graduate",
    icon: UserRoundSearch,
    title: "Graduates",
    blurb: "Turn your degree into the right first job — with a clear direction, better applications and confident interviews.",
    outcomes: [
      "Narrow down roles that fit your strengths and degree",
      "Answer 'tell me about yourself' and STAR questions with confidence",
      "Start your first job with realistic expectations and quick wins",
    ],
    courseIds: ["interview-preparation", "resume-building", "professional-readiness"],
    persona: {
      name: "Mehul",
      context: "B.Com graduate · Indore",
      quote: "I've applied to 60 jobs and heard back from three. What am I doing wrong?",
      avatar: { skin: 2, hair: "short", hairColor: 0, bg: 3, shirt: 1 },
    },
  },
  {
    stage: "professional",
    icon: BriefcaseBusiness,
    title: "Working Professionals",
    blurb: "Grow into leadership or plan a confident career switch — with structured programmes and expert one-to-one guidance.",
    outcomes: [
      "Lead your first team with clarity, feedback and delegation",
      "Map transferable skills and test a new career path safely",
      "Communicate with presence in meetings and presentations",
    ],
    courseIds: ["leadership-essentials", "career-transition-blueprint", "communication-skills"],
    persona: {
      name: "Sneha",
      context: "New team lead · Bengaluru",
      quote: "I just got promoted. How do I give feedback to people who were my peers last month?",
      avatar: { skin: 2, hair: "bun", hairColor: 1, bg: 0, shirt: 0 },
    },
  },
  {
    stage: "parent",
    icon: HeartHandshake,
    title: "Parents",
    blurb: "Understand your child's interests and strengths, and support their decisions without adding pressure.",
    outcomes: [
      "Hold supportive, pressure-free career conversations at home",
      "Understand streams, subjects and entrance exam pathways",
      "Plan next steps together in a joint session with an expert",
    ],
    courseIds: ["career-clarity-for-parents", "personality-development", "career-discovery-fundamentals"],
    persona: {
      name: "Sunita",
      context: "Parent of a Class 10 student · Chennai",
      quote: "My son is unsure between Science and Humanities. How can I help without pushing?",
      avatar: { skin: 3, hair: "bun", hairColor: 0, bg: 5, shirt: 4 },
    },
  },
];

export function AudienceExplorer() {
  const [active, setActive] = useState<LearnerStage>("college");
  const audience = AUDIENCES.find((a) => a.stage === active) ?? AUDIENCES[1];
  const Icon = audience.icon;

  return (
    <div className="mt-12 grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
      <div role="tablist" aria-label="Who CDL serves" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0">
        {AUDIENCES.map((a) => {
          const selected = a.stage === active;
          const TabIcon = a.icon;
          return (
            <button
              key={a.stage}
              id={`aud-tab-${a.stage}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="aud-panel"
              onClick={() => setActive(a.stage)}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition lg:px-4 lg:py-3.5",
                selected ? "border-primary/25 bg-card shadow-sm ring-1 ring-primary/10" : "border-transparent bg-muted/60 hover:bg-muted lg:bg-transparent",
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg transition lg:size-9",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
                )}
              >
                <TabIcon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold whitespace-nowrap">{a.title}</span>
                <span className="hidden text-xs text-muted-foreground lg:block">{STAGE_META[a.stage].description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="aud-panel"
        role="tabpanel"
        aria-labelledby={`aud-tab-${audience.stage}`}
        className="grid gap-8 rounded-3xl border bg-card p-6 shadow-xs md:p-8 xl:grid-cols-[1.15fr_1fr]"
      >
        <div className="flex flex-col">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon className="size-5" />
          </span>
          <h3 className="mt-5 font-heading text-2xl font-bold">{audience.title}</h3>
          <p className="mt-2 text-muted-foreground">{audience.blurb}</p>
          <p className="mt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Example outcomes</p>
          <ul className="mt-3 space-y-3">
            {audience.outcomes.map((o) => (
              <li key={o} className="flex gap-3 text-sm">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2 xl:mt-auto xl:pt-8">
            <Button asChild className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
              <Link href="/discover">
                Start discovery as a {STAGE_META[audience.stage].label.split(" / ")[0].toLowerCase()} <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-10 px-4">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl bg-muted/60 p-5">
          <div className="flex items-center gap-3">
            <Portrait avatar={audience.persona.avatar} name={audience.persona.name} className="size-12" />
            <div>
              <p className="text-sm font-semibold">{audience.persona.name}</p>
              <p className="text-xs text-muted-foreground">{audience.persona.context}</p>
            </div>
          </div>
          <div className="relative mt-4 rounded-xl bg-card p-4 text-sm shadow-xs">
            <Quote className="absolute -top-2 right-3 size-5 rotate-180 text-brand/30" />
            &ldquo;{audience.persona.quote}&rdquo;
          </div>
          <p className="mt-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Programs that often help</p>
          <ul className="mt-3 space-y-2">
            {audience.courseIds.map((id) => {
              const course = getCourse(id);
              if (!course) return null;
              return (
                <li key={id}>
                  <Link
                    href={`/courses/${id}`}
                    className="group flex items-center gap-3 rounded-xl bg-card p-2 pr-3 shadow-xs ring-1 ring-border transition hover:ring-primary/30"
                  >
                    <CourseThumbnail course={course} size="sm" className="w-16 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium group-hover:text-primary">{course.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        {isFreeCourse(course) ? "Free to start" : `From ${formatINR(courseStartingPrice(course))}`} · {course.durationLabel}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-[11px] text-muted-foreground">Illustrative learner persona for the demo.</p>
        </div>
      </div>
    </div>
  );
}
