import type { Metadata } from "next";
import Link from "next/link";
import { addDays, format, getDay, parseISO } from "date-fns";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CircleCheck,
  CirclePlay,
  FileText,
  Lock,
  Minus,
  NotebookPen,
  Radio,
  School,
  UsersRound,
} from "lucide-react";
import { cohorts, collegePlans, courseLessons, courseStartingPrice, faqs, getCourse, getMentor, liveSessions } from "@/data";
import { DEMO_TODAY, FORMAT_META, FORMATS } from "@/data/constants";
import { formatDate, formatINR, formatTime, pct } from "@/lib/format";
import type { LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AutoStatus, FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { fromPrice, priceRange, seatsLeft } from "@/components/site/commerce";
import { PackagesGrid } from "@/components/site/programs/packages-grid";
import { RequestDemoButton } from "@/components/site/programs/request-demo-dialog";
import { Container, Eyebrow, Section, SectionIntro } from "@/components/site/section";

export const metadata: Metadata = {
  title: "Programs & pricing",
  description: "Self-Paced, Live Cohort and One-to-One Mentoring — what each learning level includes, packages and upcoming cohorts.",
};

const LEVELS: Record<
  LearningFormat,
  { title: string; includes: string[]; bestFor: string; note: string; examples: string[]; icon: React.ComponentType<{ className?: string }> }
> = {
  "self-paced": {
    title: "Learn on your schedule with recorded lessons",
    icon: CirclePlay,
    includes: [
      "Recorded HD video lessons from expert instructors",
      "Chapter-wise curriculum you can follow in order",
      "Downloadable worksheets, templates and guides",
      "Quizzes and checkpoints after each chapter",
      "Progress tracking and a certificate of completion",
      "12 months of access from enrolment",
    ],
    note: "No live calendar — learn entirely in your own time.",
    bestFor: "Self-motivated learners, busy schedules and anyone wanting a low-cost first step.",
    examples: ["communication-skills", "resume-building", "career-discovery-fundamentals"],
  },
  "live-cohort": {
    title: "Learn together in guided evening sessions",
    icon: Radio,
    includes: [
      "Everything in Self-Paced",
      "Scheduled live cohort classes on weekday evenings (IST)",
      "A live session calendar with reminders",
      "Recordings of every class within 24 hours",
      "Programme discussions and doubt-clearing hours",
      "Assignments and practice with mentor feedback",
    ],
    note: "Most classes run between 6:30 PM and 9:00 PM IST, with a few weekend sessions.",
    bestFor: "Learners who want structure, accountability and live practice with peers — especially before placement season.",
    examples: ["group-discussion-mastery", "campus-placement-readiness", "leadership-essentials"],
  },
  mentoring: {
    title: "Personal guidance from an expert mentor",
    icon: UsersRound,
    includes: [
      "Browse mentor profiles, expertise and ratings",
      "Choose a session type and duration (30–75 minutes)",
      "Pick an open slot that suits your timetable",
      "Clear per-session or multi-session pricing",
      "Private session notes after every session",
      "Follow-up actions and recommended next courses",
    ],
    note: "Book single sessions or multi-session packs from the mentor's profile.",
    bestFor: "Personal decisions, targeted interview practice and leaders who want a sounding board.",
    examples: ["interview-preparation", "career-transition-blueprint", "leadership-essentials"],
  },
};

type Cell = boolean | string;
const COMPARISON: { feature: string; values: [Cell, Cell, Cell] }[] = [
  { feature: "Recorded video lessons & chapter curriculum", values: [true, true, "With any course"] },
  { feature: "Downloadable resources", values: [true, true, "Personalised"] },
  { feature: "Quizzes & progress tracking", values: [true, true, false] },
  { feature: "Certificate of completion", values: [true, true, false] },
  { feature: "Scheduled live evening classes", values: [false, true, false] },
  { feature: "Live session calendar & reminders", values: [false, true, true] },
  { feature: "Session recordings", values: [false, true, false] },
  { feature: "Programme discussions & doubt-clearing", values: [false, true, false] },
  { feature: "Assignments with mentor feedback", values: [false, true, true] },
  { feature: "Private one-to-one time with a mentor", values: [false, false, true] },
  { feature: "Choose your own slot & duration", values: [false, false, true] },
  { feature: "Session notes & follow-up plan", values: [false, false, true] },
  { feature: "Pace", values: ["Your own", "Cohort schedule", "By appointment"] },
];

const LEVEL_FAQ_CATEGORIES = ["Courses & levels", "Live sessions", "Mentoring", "Payments"];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Check className="size-3.5" />
        <span className="sr-only">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex size-6 items-center justify-center text-muted-foreground/50">
        <Minus className="size-4" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className="text-sm font-medium">{value}</span>;
}

/** Visual for Level 1: a course's lesson list with progress. */
function SelfPacedVisual() {
  const course = getCourse("communication-skills")!;
  const lessons = courseLessons(course).slice(0, 5);
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5">
      <div className="flex items-center gap-3">
        <CourseThumbnail course={course} size="sm" className="w-16" />
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold">{course.title}</p>
          <p className="text-xs text-muted-foreground">3 of 6 lessons complete</p>
        </div>
        <span className="ml-auto font-heading text-lg font-bold text-brand">50%</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-muted">
        <div className="h-full w-1/2 rounded-full bg-brand" />
      </div>
      <ul className="mt-4 divide-y">
        {lessons.map((l, i) => (
          <li key={l.id} className="flex items-center gap-3 py-2.5 text-sm">
            {i < 3 ? (
              <CircleCheck className="size-4 shrink-0 text-brand" />
            ) : l.kind === "video" ? (
              <CirclePlay className={cn("size-4 shrink-0", i === 3 ? "text-primary" : "text-muted-foreground")} />
            ) : (
              <FileText className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={cn("min-w-0 flex-1 truncate", i < 3 && "text-muted-foreground", i === 3 && "font-medium")}>{l.title}</span>
            {i === 3 ? (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">Resume</span>
            ) : (
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(l.durationSec / 60)} min</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-2.5 text-xs text-muted-foreground">
        <FileText className="size-4" /> PREP framework cheat-sheet · PDF
        <span className="ml-auto font-medium text-primary">Download</span>
      </div>
    </div>
  );
}

/** Visual for Level 2: the next live classes from real cohort data. */
function LiveCohortVisual() {
  const upcoming = liveSessions.filter((s) => s.type === "cohort-class" && !s.collegeId && s.date >= DEMO_TODAY).slice(0, 4);
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-heading text-sm font-semibold">
          <CalendarDays className="size-4 text-brand" /> Upcoming live classes
        </p>
        <span className="text-xs text-muted-foreground">IST</span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {upcoming.map((s) => {
          const mentor = getMentor(s.mentorId);
          return (
            <li key={s.id} className="flex items-center gap-3 rounded-xl border p-3">
              <div className="w-11 shrink-0 text-center">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">{format(parseISO(s.date), "EEE")}</p>
                <p className="font-heading text-lg leading-none font-bold">{format(parseISO(s.date), "d")}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatTime(s.time)} · {getCourse(s.courseId)?.title}
                </p>
              </div>
              {mentor && <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-xs text-brand">
        <CirclePlay className="size-4" /> Missed a class? Recordings are added within 24 hours.
      </div>
    </div>
  );
}

/** Visual for Level 3: a mentor's next open slots (sample, from the weekly pattern). */
function MentoringVisual() {
  const mentor = getMentor("m-kavya")!;
  const days: { date: string; times: string[] }[] = [];
  for (let i = 1; days.length < 3 && i < 10; i++) {
    const d = addDays(parseISO(DEMO_TODAY), i);
    if (mentor.availability.weekdays.includes(getDay(d))) days.push({ date: format(d, "yyyy-MM-dd"), times: mentor.availability.times });
  }
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5">
      <div className="flex items-center gap-3">
        <Portrait avatar={mentor.avatar} name={mentor.name} className="size-11" rounded="xl" />
        <div className="min-w-0">
          <p className="font-heading text-sm font-semibold">{mentor.name}</p>
          <p className="truncate text-xs text-muted-foreground">{mentor.title}</p>
        </div>
      </div>
      <div className="mt-4 rounded-xl border p-3">
        <p className="text-xs font-medium">{mentor.offers[0].title} · 45 min</p>
        <div className="mt-3 space-y-2">
          {days.map((d, di) => (
            <div key={d.date} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">{formatDate(d.date, "EEE d MMM")}</span>
              <div className="flex flex-wrap gap-1.5">
                {d.times.map((t, ti) => (
                  <span
                    key={t}
                    className={cn(
                      "rounded-md border px-2 py-1 text-[11px] font-medium",
                      di === 0 && ti === 1 ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                    )}
                  >
                    {formatTime(t)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-muted/70 p-3 text-xs">
        <p className="flex items-center gap-1.5 font-medium">
          <NotebookPen className="size-3.5 text-primary" /> Session notes &amp; follow-ups
        </p>
        <p className="mt-1 text-muted-foreground">&ldquo;Record a 2-minute update using PREP and share it before our next session.&rdquo;</p>
      </div>
    </div>
  );
}

const VISUALS: Record<LearningFormat, React.ComponentType> = {
  "self-paced": SelfPacedVisual,
  "live-cohort": LiveCohortVisual,
  mentoring: MentoringVisual,
};

export default function ProgramsPage() {
  const openCohorts = cohorts
    .filter((c) => !c.collegeId && c.status !== "completed" && seatsLeft(c) > 0)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const levelFaqs = faqs.filter((f) => LEVEL_FAQ_CATEGORIES.includes(f.category));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b bg-muted/40">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_60%_70%_at_50%_0%,black,transparent)]" />
        <Container className="pt-14 pb-14 text-center md:pt-20 md:pb-20">
          <Eyebrow>Programs &amp; pricing</Eyebrow>
          <h1 className="mx-auto mt-3 max-w-3xl font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-[56px]">
            Three ways to learn. One clear path forward.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Every CDL course is offered in one or more learning levels. Start where you&apos;re comfortable and upgrade any time — your progress
            carries over and you only pay the difference.
          </p>
          <div className="mx-auto mt-10 grid max-w-5xl gap-3 text-left md:grid-cols-3">
            {FORMATS.map((f) => {
              const Icon = LEVELS[f].icon;
              return (
                <a
                  key={f}
                  href={`#${f}`}
                  className="group flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-xs transition hover:border-primary/30 hover:shadow-md"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-heading font-semibold">{FORMAT_META[f].label}</span>
                      <span className="text-[11px] font-medium text-muted-foreground">Level {FORMAT_META[f].level}</span>
                    </span>
                    <span className="block text-sm text-muted-foreground">{FORMAT_META[f].tagline}</span>
                    <span className="mt-2 block text-xs">
                      from <span className="font-semibold">{formatINR(fromPrice(f))}</span>
                      {f === "self-paced" && <span className="text-muted-foreground"> · free starter course</span>}
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Levels in depth */}
      {FORMATS.map((f, i) => {
        const level = LEVELS[f];
        const Visual = VISUALS[f];
        const range = priceRange(f);
        return (
          <section key={f} id={f} className={cn("scroll-mt-20 py-16 md:py-24", i % 2 === 1 && "bg-muted/40")}>
            <Container className={cn("grid items-center gap-12 lg:grid-cols-2 lg:gap-16")}>
              <div className={cn(i % 2 === 1 && "lg:order-2")}>
                <FormatBadge format={f} showLevel />
                <h2 className="mt-4 font-heading text-3xl leading-tight font-bold tracking-tight text-balance md:text-[40px] md:leading-[1.1]">
                  {level.title}
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">{FORMAT_META[f].description}</p>
                <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {level.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-muted-foreground">{level.note}</p>
                <div className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground">Price range</p>
                    <p className="mt-0.5 font-heading text-xl font-bold whitespace-nowrap">
                      {formatINR(range.min)} – {formatINR(range.max)}
                    </p>
                    <p className="text-xs text-muted-foreground">{f === "mentoring" ? "per session" : "per course"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Best for</p>
                    <p className="mt-0.5 text-sm">{level.bestFor}</p>
                  </div>
                </div>
                <p className="mt-8 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Example courses</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {level.examples.map((id) => {
                    const c = getCourse(id);
                    if (!c) return null;
                    return (
                      <Link
                        key={id}
                        href={`/courses/${id}`}
                        className="group inline-flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-sm shadow-xs transition hover:border-primary/30"
                      >
                        <CourseThumbnail course={c} size="sm" className="w-9 rounded-full" />
                        <span className="font-medium group-hover:text-primary">{c.title}</span>
                        <span className="text-xs text-muted-foreground">{formatINR(c.pricing[f] ?? courseStartingPrice(c), { free: true })}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-8">
                  <Button asChild className="h-10 px-4">
                    <Link href={f === "mentoring" ? "/mentors" : "/courses"}>
                      {f === "mentoring" ? "Browse mentors" : `Browse ${FORMAT_META[f].label} courses`} <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className={cn("relative mx-auto w-full max-w-md", i % 2 === 1 && "lg:order-1")}>
                <div className="absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-brand/15 via-primary/5 to-transparent blur-xl" />
                <Visual />
              </div>
            </Container>
          </section>
        );
      })}

      {/* Comparison */}
      <Section id="compare" className="border-t">
        <SectionIntro align="center" eyebrow="Compare levels" title="What's included at each level" />
        <div className="mx-auto mt-12 max-w-5xl overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th scope="col" className="w-[40%] px-5 py-4 font-medium text-muted-foreground">
                  Feature
                </th>
                {FORMATS.map((f) => (
                  <th key={f} scope="col" className={cn("px-4 py-4 text-center", f === "live-cohort" && "bg-brand-soft/60")}>
                    <span className="block font-heading text-[15px] font-semibold">{FORMAT_META[f].label}</span>
                    <span className="text-xs font-normal text-muted-foreground">Level {FORMAT_META[f].level}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {COMPARISON.map((row) => (
                <tr key={row.feature}>
                  <th scope="row" className="px-5 py-3.5 font-normal">
                    {row.feature}
                  </th>
                  {row.values.map((v, i) => (
                    <td key={i} className={cn("px-4 py-3.5 text-center", i === 1 && "bg-brand-soft/30")}>
                      <CellValue value={v} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-muted/40">
                <th scope="row" className="px-5 py-4 font-semibold">
                  Starting price
                </th>
                {FORMATS.map((f) => (
                  <td key={f} className={cn("px-4 py-4 text-center", f === "live-cohort" && "bg-brand-soft/40")}>
                    <span className="font-heading text-base font-bold">{formatINR(fromPrice(f))}</span>
                    {f === "mentoring" && <span className="text-xs text-muted-foreground"> / session</span>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* Packages */}
      <Section id="packages" className="bg-muted/40">
        <SectionIntro
          align="center"
          eyebrow="Packages"
          title="Save with curated bundles and passes"
          description="Combine courses and levels for a specific goal. Prices are illustrative for this prototype — checkout is simulated."
        />
        <PackagesGrid />
      </Section>

      {/* Upcoming cohorts */}
      <Section id="cohorts">
        <SectionIntro
          eyebrow="Live Cohorts"
          title="Upcoming and open cohorts"
          description="Evening cohorts with seats still available. Joining a cohort that's already running? Earlier classes are waiting for you as recordings."
          action={
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href="/courses">
                All courses <ArrowRight />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {openCohorts.map((c) => {
            const course = getCourse(c.courseId);
            const mentor = getMentor(c.mentorId);
            if (!course) return null;
            const filled = pct(c.enrolled, c.seats);
            return (
              <Link
                key={c.id}
                href={`/courses/${course.id}`}
                className="group flex gap-4 rounded-2xl border bg-card p-4 shadow-xs transition hover:border-primary/25 hover:shadow-md"
              >
                <CourseThumbnail course={course} size="sm" className="w-24 shrink-0 self-start sm:w-28" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <AutoStatus status={c.status} label={c.status === "running" ? "In progress" : `Starts ${formatDate(c.startDate, "d MMM")}`} />
                    <span className="text-xs text-muted-foreground">
                      {formatDate(c.startDate, "d MMM")} – {formatDate(c.endDate, "d MMM")}
                    </span>
                  </div>
                  <p className="mt-2 truncate font-heading font-semibold group-hover:text-primary">{c.name}</p>
                  <p className="text-sm text-muted-foreground">{c.scheduleLabel}</p>
                  <div className="mt-3 flex items-center gap-3">
                    {mentor && (
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <Portrait avatar={mentor.avatar} name={mentor.name} className="size-5" />
                        <span className="truncate">{mentor.name}</span>
                      </span>
                    )}
                    <span className="ml-auto flex shrink-0 items-center gap-2 text-xs">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <span className={cn("block h-full rounded-full", filled >= 85 ? "bg-warning" : "bg-brand")} style={{ width: `${filled}%` }} />
                      </span>
                      <span className={cn("font-medium", seatsLeft(c) <= 6 ? "text-warning" : "text-muted-foreground")}>{seatsLeft(c)} seats left</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Colleges */}
      <section className="relative isolate overflow-hidden bg-navy py-16 text-navy-foreground md:py-24">
        <div className="absolute inset-0 -z-10 bg-grid opacity-[0.07]" />
        <div className="absolute -right-40 -bottom-40 -z-10 size-[520px] rounded-full bg-brand/25 blur-3xl" />
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Eyebrow inverted>For colleges &amp; institutions</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl leading-tight font-bold tracking-tight text-balance text-white md:text-[40px] md:leading-[1.1]">
              Bring career readiness to your whole campus
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Give students a college-branded portal, assign programmes by department or year, add your own content such as alumni talks, and
              track engagement and progress in one place.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                { icon: School, text: "College-branded student portal with your logo and colours" },
                { icon: Lock, text: "Institution-only programmes alongside the CDL catalog" },
                { icon: BarChart3, text: "Department-wise progress and engagement reports" },
              ].map((b) => (
                <li key={b.text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                    <b.icon className="size-4 text-teal-300" />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <RequestDemoButton className="h-11 bg-brand px-5 text-[15px] text-brand-foreground hover:bg-brand/90" />
              <Button asChild variant="ghost" className="h-11 px-5 text-[15px] text-white ring-1 ring-white/20 hover:bg-white/10 hover:text-white">
                <Link href="/college">Preview the college portal</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {collegePlans.map((p, i) => (
              <div key={p.id} className={cn("rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10", i === 1 && "bg-white/[0.1] ring-white/25")}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-heading text-lg font-semibold text-white">
                    {p.id}
                    {i === 1 && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 align-middle text-[10px] font-semibold">Most chosen</span>}
                  </p>
                  <p className="text-sm text-white/70">
                    <span className="font-heading text-xl font-bold text-white">{formatINR(p.pricePerSeat)}</span> / student / year
                  </p>
                </div>
                <p className="mt-0.5 text-xs text-white/55">{p.seatsLabel} · indicative pricing</p>
                <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-white/80">
                      <Check className="size-3.5 text-teal-300" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Level FAQs */}
      <Section id="level-faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionIntro
              eyebrow="FAQs"
              title="Learning levels, live sessions & payments"
              description="Still unsure which level fits? A free discovery conversation ends with a suggested level for you."
            />
            <Button asChild className="mt-6 h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
              <Link href="/discover">Start Free Career Discovery</Link>
            </Button>
          </div>
          <Accordion type="single" collapsible defaultValue={levelFaqs[0]?.id} className="rounded-2xl border bg-card px-5 shadow-xs md:px-6">
            {levelFaqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="py-5 text-[15px] font-semibold hover:no-underline">
                  <span>
                    <span className="mb-1 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{f.category}</span>
                    {f.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>
    </>
  );
}
