import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  CircleCheck,
  Clock,
  Gauge,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Zap,
} from "lucide-react";
import { activeMentors, courseStartingPrice, courseVideoLessons, faqs, getCourse, platformTotals, publicCourses } from "@/data";
import { FORMAT_META, FORMATS, STAGE_META } from "@/data/constants";
import { formatINR, formatNumber } from "@/lib/format";
import type { LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/shared/badges";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { fromPrice } from "@/components/site/commerce";
import { ChatPreview, HeroCollage } from "@/components/site/discovery-preview";
import { AudienceExplorer } from "@/components/site/landing/audience-explorer";
import { FeaturedCourses } from "@/components/site/landing/featured-courses";
import { MentorHighlights } from "@/components/site/landing/mentor-highlights";
import { Container, Eyebrow, Section, SectionIntro } from "@/components/site/section";

const avgRating = publicCourses.reduce((s, c) => s + c.rating, 0) / publicCourses.length;
const learnersLabel = `${formatNumber(Math.floor(platformTotals.users / 1000) * 1000)}+`;

const STEPS = [
  {
    icon: MessagesSquare,
    step: "Discover",
    title: "A free discovery conversation",
    body: "Answer a few friendly questions about where you are, what you enjoy and what's in your way. No registration, no forms.",
    detail: ["About 5 minutes", "Phone number only"],
    href: "/discover",
    cta: "Start for free",
  },
  {
    icon: Gauge,
    step: "Understand",
    title: "Assessments & your career snapshot",
    body: "Get an instant snapshot of your interests and strengths, then go deeper with interest, personality and employability assessments.",
    detail: ["Instant snapshot", "Downloadable report"],
    href: "/assessment",
    cta: "Explore assessments",
  },
  {
    icon: BookOpenCheck,
    step: "Learn",
    title: "Courses at three levels",
    body: "Build practical skills your way — recorded Self-Paced lessons, guided Live Cohorts in the evening, or One-to-One Mentoring.",
    detail: ["12+ programmes", "Certificates"],
    href: "/courses",
    cta: "Browse courses",
  },
  {
    icon: Sprout,
    step: "Grow",
    title: "Mentoring & ongoing growth",
    body: "Track progress, revisit recordings and get personal guidance from expert mentors as your goals and stage evolve.",
    detail: ["Session notes", "Follow-up plans"],
    href: "/mentors",
    cta: "Meet the mentors",
  },
];

const TRACKS = [
  { label: "Group Discussion", courseId: "group-discussion-mastery", blurb: "Open strong, add value and summarise with impact." },
  { label: "Interview Preparation", courseId: "interview-preparation", blurb: "STAR answers, mock rounds and offer conversations." },
  { label: "Resume Building", courseId: "resume-building", blurb: "Achievement-based resumes that get shortlisted." },
  { label: "Leadership", courseId: "leadership-essentials", blurb: "Ownership, feedback, delegation and influence." },
  { label: "Communication", courseId: "communication-skills", blurb: "Listen well, speak clearly and write with impact." },
  { label: "Personality Development", courseId: "personality-development", blurb: "Self-awareness, confidence and emotional intelligence." },
];

const FORMAT_DETAILS: Record<LearningFormat, { includes: string[]; note: string; anchor: string }> = {
  "self-paced": {
    includes: ["Recorded video lessons", "Chapter-wise curriculum & resources", "Quizzes and progress tracking", "Certificate of completion"],
    note: "Plus a free starter course",
    anchor: "/programs#self-paced",
  },
  "live-cohort": {
    includes: ["Everything in Self-Paced", "Live evening classes, 6:30–9 PM IST", "Recordings within 24 hours", "Doubt-clearing and assignments"],
    note: "Small cohorts with a dedicated mentor",
    anchor: "/programs#live-cohort",
  },
  mentoring: {
    includes: ["A mentor matched to your goals", "Pick your own date and time", "45–75 minute private sessions", "Session notes and a follow-up plan"],
    note: "Single sessions or multi-session packs",
    anchor: "/programs#mentoring",
  },
};

const TESTIMONIALS: { courseId: string; name: string }[] = [
  { courseId: "group-discussion-mastery", name: "Siddharth G." },
  { courseId: "career-clarity-for-parents", name: "Sunita I." },
  { courseId: "interview-preparation", name: "Harsh J." },
  { courseId: "career-transition-blueprint", name: "Aparna S." },
  { courseId: "public-speaking-confidence", name: "Om T." },
  { courseId: "leadership-essentials", name: "Sneha K." },
];

const LANDING_FAQ_IDS = ["f1", "f2", "f3", "f4", "f9", "f6"];

export default function HomePage() {
  const trustMentors = activeMentors.slice(0, 4);
  const testimonials = TESTIMONIALS.flatMap(({ courseId, name }) => {
    const course = getCourse(courseId);
    const review = course?.reviews.find((r) => r.name === name);
    return course && review ? [{ course, review }] : [];
  });
  const landingFaqs = LANDING_FAQ_IDS.map((id) => faqs.find((f) => f.id === id)).filter((f) => f !== undefined);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_70%_60%_at_30%_20%,black,transparent)]" />
        <div className="absolute -top-40 -right-32 -z-10 size-[560px] rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute top-40 -left-40 -z-10 size-[420px] rounded-full bg-primary/[0.07] blur-3xl" />
        <Container className="grid items-center gap-14 pt-10 pb-16 md:pt-16 md:pb-24 lg:grid-cols-[1.02fr_1fr] lg:gap-12 lg:pt-20">
          <div>
            <Link
              href="/discover"
              className="group inline-flex items-center gap-2 rounded-full border bg-card/80 py-1 pr-3 pl-1 text-xs font-medium shadow-xs backdrop-blur transition hover:border-brand/40"
            >
              <span className="rounded-full bg-brand-soft px-2 py-0.5 font-semibold text-brand">Free</span>
              Career discovery — no registration needed
              <ArrowRight className="size-3.5 text-muted-foreground transition group-hover:translate-x-0.5" />
            </Link>
            <h1 className="mt-6 font-heading text-[40px] leading-[1.05] font-bold tracking-tight text-balance sm:text-5xl lg:text-[56px] xl:text-6xl">
              Discover Your Potential. Build Your Career.{" "}
              <span className="bg-gradient-to-r from-brand to-[oklch(0.6_0.12_210)] bg-clip-text text-transparent">Take Your Next Step.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-pretty text-muted-foreground">
              Explore your strengths, gain career clarity and build practical skills — through a free discovery conversation, assessments,
              courses at three levels and one-to-one mentoring with experts.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-brand px-6 text-base text-brand-foreground shadow-md shadow-brand/20 hover:bg-brand/90">
                <Link href="/discover">
                  <Sparkles /> Start Free Career Discovery
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link href="/programs">
                  Explore Programs <ArrowRight />
                </Link>
              </Button>
            </div>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["Free", "About 5 minutes", "No registration"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-brand" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-10 flex items-center gap-4 border-t pt-6">
              <div className="flex -space-x-2.5">
                {trustMentors.map((m) => (
                  <Portrait key={m.id} avatar={m.avatar} name={m.name} className="size-9 ring-2 ring-background" />
                ))}
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="flex">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">average rating</span>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  <span className="font-medium text-foreground">{learnersLabel}</span> learners ·{" "}
                  <span className="font-medium text-foreground">{activeMentors.length}</span> expert mentors
                  <span className="ml-2 rounded border border-dashed px-1.5 py-px text-[10px] tracking-wide uppercase">Demo figures</span>
                </p>
              </div>
            </div>
          </div>
          <HeroCollage />
        </Container>
      </section>

      {/* ---------------- How it works ---------------- */}
      <Section id="how-it-works" className="border-y bg-muted/40">
        <SectionIntro
          align="center"
          eyebrow="How CDL works"
          title="From your first question to a confident next step"
          description="One connected journey. Start free and anonymously, then go as deep as you need — every step builds on the last."
        />
        <ol className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div aria-hidden className="absolute top-[52px] right-[12%] left-[12%] hidden border-t-2 border-dashed border-primary/15 lg:block" />
          {STEPS.map((s, i) => (
            <li key={s.step} className="relative flex flex-col rounded-2xl border bg-card p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl ring-4 ring-muted/40",
                    i === 0 ? "bg-brand text-brand-foreground" : "bg-secondary text-primary",
                  )}
                >
                  <s.icon className="size-5" />
                </span>
                <span className="font-heading text-3xl font-bold text-muted-foreground/25 tabular-nums">0{i + 1}</span>
              </div>
              <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-brand uppercase">{s.step}</p>
              <h3 className="mt-1.5 font-heading text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.detail.map((d) => (
                  <span key={d} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {d}
                  </span>
                ))}
              </div>
              <Link href={s.href} className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-medium text-primary hover:underline">
                {s.cta} <ArrowRight className="size-4" />
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------------- Who it serves ---------------- */}
      <Section id="who-we-serve">
        <SectionIntro
          eyebrow="Who we serve"
          title="Guidance that fits your stage of life"
          description="Whether you're choosing a stream, preparing for placements, landing a first job, stepping into leadership or supporting your child — CDL adapts to where you are."
        />
        <AudienceExplorer />
      </Section>

      {/* ---------------- Featured programs ---------------- */}
      <Section className="bg-muted/40 pt-16 md:pt-24">
        <SectionIntro
          eyebrow="Featured programs"
          title="Programs learners start with"
          description="Practical, mentor-led courses for career clarity, employability and leadership — each available in the format that suits you."
          action={
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href="/courses">
                View all courses <ArrowRight />
              </Link>
            </Button>
          }
        />
        <FeaturedCourses />
      </Section>

      {/* ---------------- Skill tracks ---------------- */}
      <Section>
        <SectionIntro
          eyebrow="Skill tracks"
          title="Build the skills recruiters and teams look for"
          description="Focused tracks you can take on their own or combine into a placement-season plan."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((t) => {
            const course = getCourse(t.courseId);
            if (!course) return null;
            return (
              <Link
                key={t.courseId}
                href={`/courses/${t.courseId}`}
                className="group flex items-start gap-4 rounded-2xl border bg-card p-5 shadow-xs transition hover:border-primary/25 hover:shadow-md"
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                  style={{ backgroundImage: `linear-gradient(135deg, ${course.thumbnail.from}, ${course.thumbnail.to})` }}
                >
                  <CourseIcon theme={course.thumbnail} className="size-6" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-heading font-semibold group-hover:text-primary">{t.label}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{t.blurb}</span>
                  <span className="mt-3 block text-xs text-muted-foreground">
                    {courseVideoLessons(course).length} lessons · {course.durationLabel} · from{" "}
                    <span className="font-semibold text-foreground">{formatINR(courseStartingPrice(course))}</span>
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* ---------------- Three ways to learn ---------------- */}
      <Section className="border-y bg-muted/40">
        <SectionIntro
          align="center"
          eyebrow="Three ways to learn"
          title="Learn at the pace and depth that suits you"
          description="Every course is offered in one or more of three levels. Start on your own and upgrade any time — your progress carries over."
        />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {FORMATS.map((f) => {
            const meta = FORMAT_META[f];
            const details = FORMAT_DETAILS[f];
            const featured = f === "live-cohort";
            return (
              <div
                key={f}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-7 shadow-xs",
                  featured && "border-brand/40 shadow-md ring-1 ring-brand/20",
                )}
              >
                {featured && (
                  <span className="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-brand-foreground">
                    Popular in placement season
                  </span>
                )}
                <FormatBadge format={f} showLevel className="self-start" />
                <h3 className="mt-5 font-heading text-2xl font-bold">{meta.label}</h3>
                <p className="mt-1 text-sm font-medium text-foreground/80">{meta.tagline}</p>
                <p className="mt-3 text-sm text-muted-foreground">{meta.description}</p>
                <ul className="mt-6 space-y-2.5 border-t pt-6">
                  {details.includes.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm">
                      <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto flex items-end justify-between gap-3 pt-8">
                  <div>
                    <p className="text-xs text-muted-foreground">From</p>
                    <p className="font-heading text-2xl font-bold">
                      {formatINR(fromPrice(f))}
                      {f === "mentoring" && <span className="text-sm font-medium text-muted-foreground"> / session</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{details.note}</p>
                  </div>
                  <Button asChild variant={featured ? "default" : "outline"} className="h-10 px-4">
                    <Link href={details.anchor}>
                      Learn more <ArrowRight />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ---------------- Free discovery callout ---------------- */}
      <section className="relative isolate overflow-hidden bg-navy py-16 text-navy-foreground md:py-24">
        <div className="absolute inset-0 -z-10 bg-grid opacity-[0.08]" />
        <div className="absolute -top-32 left-1/3 -z-10 size-[520px] rounded-full bg-brand/25 blur-3xl" />
        <Container className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <Eyebrow inverted>Free career discovery</Eyebrow>
            <h2 className="mt-3 font-heading text-3xl leading-tight font-bold tracking-tight text-balance text-white md:text-[40px] md:leading-[1.1]">
              Not sure where to start? Talk it through — free.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/70">
              A short, friendly conversation that helps you put words to your interests, challenges and goals — and ends with a personal
              career snapshot and suggested next steps.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: "No registration", body: "Just a phone number to start" },
                { icon: Clock, title: "About 5 minutes", body: "Quick replies or your own words" },
                { icon: Zap, title: "Instant snapshot", body: "Interests, strengths & next steps" },
              ].map((b) => (
                <li key={b.title} className="rounded-xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                  <b.icon className="size-5 text-teal-300" />
                  <p className="mt-3 text-sm font-semibold text-white">{b.title}</p>
                  <p className="mt-0.5 text-xs text-white/60">{b.body}</p>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-brand px-6 text-base text-brand-foreground hover:bg-brand/90">
                <Link href="/discover">
                  <Sparkles /> Start Free Career Discovery
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-5 text-base text-white hover:bg-white/10 hover:text-white">
                <Link href="/assessment">Take an assessment instead</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-white/5 ring-1 ring-white/10" />
            <ChatPreview />
          </div>
        </Container>
      </section>

      {/* ---------------- Mentors ---------------- */}
      <Section>
        <SectionIntro
          eyebrow="Expert mentors"
          title="Learn from people who've done the hiring, coaching and leading"
          description="Former recruiters, psychologists, trainers and leaders — available for live cohorts and private one-to-one sessions."
          action={
            <Button asChild variant="outline" className="h-10 px-4">
              <Link href="/mentors">
                Meet all mentors <ArrowRight />
              </Link>
            </Button>
          }
        />
        <MentorHighlights />
      </Section>

      {/* ---------------- Testimonials ---------------- */}
      <Section className="border-y bg-muted/40">
        <SectionIntro
          align="center"
          eyebrow="Learner stories"
          title="What learners say after taking the next step"
          description={
            <>
              Sample testimonials from course reviews in this prototype.{" "}
              <span className="rounded border border-dashed border-warning/50 bg-warning-soft px-1.5 py-0.5 text-xs font-medium text-warning">
                Demo data
              </span>
            </>
          }
        />
        <div className="mt-14 columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
          {testimonials.map(({ course, review }, i) => (
            <figure key={review.name} className={cn("rounded-2xl border bg-card p-6 shadow-xs", i === 0 && "bg-primary text-primary-foreground")}>
              <div className="flex gap-0.5">
                {Array.from({ length: review.rating }, (_, n) => (
                  <Star key={n} className="size-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className={cn("mt-4 text-[15px] leading-relaxed", i === 0 && "text-lg")}>&ldquo;{review.text}&rdquo;</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Portrait name={review.name} className="size-10" />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{review.name}</p>
                  <p className={cn("truncate text-xs", i === 0 ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {STAGE_META[review.stage].label} ·{" "}
                    <Link href={`/courses/${course.id}`} className="underline-offset-2 hover:underline">
                      {course.title}
                    </Link>
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section id="faq">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionIntro
              eyebrow="FAQs"
              title="Questions, answered"
              description="Everything you need to know about getting started, learning levels and payments. Can't find what you're looking for? Start a free discovery conversation and we'll point you in the right direction."
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-10 px-4">
                <Link href="/programs#level-faq">More about learning levels</Link>
              </Button>
            </div>
          </div>
          <Accordion type="single" collapsible defaultValue="f1" className="rounded-2xl border bg-card px-5 shadow-xs md:px-6">
            {landingFaqs.map((f) => (
              <AccordionItem key={f.id} value={f.id}>
                <AccordionTrigger className="py-5 text-[15px] font-semibold hover:no-underline">{f.question}</AccordionTrigger>
                <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">{f.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="pb-16 md:pb-24">
        <Container>
          <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-navy via-primary to-[oklch(0.36_0.1_220)] px-6 py-14 text-center text-white md:px-12 md:py-20">
            <div className="absolute inset-0 -z-10 bg-grid opacity-10" />
            <div className="absolute -bottom-40 left-1/2 -z-10 size-[480px] -translate-x-1/2 rounded-full bg-brand/40 blur-3xl" />
            <h2 className="mx-auto max-w-3xl font-heading text-3xl leading-tight font-bold tracking-tight text-balance md:text-5xl md:leading-[1.08]">
              Your next step starts with one conversation
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
              Discover what fits you in about five minutes — then learn, practise and grow with CDL.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-white px-6 text-base text-primary hover:bg-white/90">
                <Link href="/discover">
                  <Sparkles /> Start Free Career Discovery
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-12 px-6 text-base text-white ring-1 ring-white/25 hover:bg-white/10 hover:text-white">
                <Link href="/courses">Browse all courses</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
