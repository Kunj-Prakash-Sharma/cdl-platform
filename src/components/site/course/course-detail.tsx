"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  CirclePlay,
  Clock,
  Infinity as InfinityIcon,
  Award,
  Package,
  PlayCircle,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cohortsForCourse, courseDurationSec, courseLessons, courseVideoLessons, getCollege, getCourse, sessionsForCourse } from "@/data";
import { DEMO_TODAY, FORMAT_META, STAGE_META } from "@/data/constants";
import { formatDate, formatDuration, formatINR, formatNumber, formatTime } from "@/lib/format";
import type { Course, LearningFormat, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourseProgress, useCourses, useCurrentUser, useEnrollment, useHydrated, useMentors } from "@/store/hooks";
import { AutoStatus, FormatBadge } from "@/components/shared/badges";
import { CourseCard, Rating } from "@/components/shared/cards";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { MentorBookingDialog } from "@/components/shared/mentor-booking-dialog";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { formatLevel, mentoringOfferForCourse, nextCohort, packageSavings, seatsLeft } from "../commerce";
import { Curriculum, Included, InstructorCard, Reviews, SectionTitle } from "./course-content";

const FORMAT_POINTS: Record<LearningFormat, string[]> = {
  "self-paced": ["Start instantly", "Recorded lessons & resources", "12 months access"],
  "live-cohort": ["Live evening classes", "Recordings & doubt-clearing", "Assignments with feedback"],
  mentoring: ["Private session with the instructor", "Pick your own slot", "Notes & follow-up plan"],
};

export function CourseDetail({ courseId }: { courseId: string }) {
  const router = useRouter();
  const courses = useCourses();
  const mentors = useMentors();
  const course = courses.find((c) => c.id === courseId) ?? getCourse(courseId)!;
  const instructor = mentors.find((m) => m.id === course.instructorId);
  const mentorAvailable = instructor?.status === "active";
  const college = course.collegeId ? getCollege(course.collegeId) : undefined;

  const hydrated = useHydrated();
  const isLoggedIn = useDemoStore((s) => s.isLoggedIn);
  const packages = useDemoStore((s) => s.packages);
  const setCheckout = useDemoStore((s) => s.setCheckout);
  const enroll = useDemoStore((s) => s.enroll);
  const addNotification = useDemoStore((s) => s.addNotification);
  const { userId } = useCurrentUser();
  const rawEnrollment = useEnrollment(course.id);
  const enrollment = hydrated && isLoggedIn ? rawEnrollment : undefined;
  const progress = useCourseProgress(course);

  const purchasable = course.formats.filter((f) => f !== "mentoring" || mentorAvailable);
  const upgradeFormats = enrollment ? purchasable.filter((f) => f !== "mentoring" && formatLevel(f) > formatLevel(enrollment.format)) : [];
  const [chosen, setChosen] = useState<LearningFormat | null>(null);
  const format: LearningFormat = chosen && course.formats.includes(chosen) ? chosen : (upgradeFormats[0] ?? course.formats[0]);
  /** Enrolled learner looking at a level they already have (or a lower one). */
  const ownsFormat = !!enrollment && format !== "mentoring" && formatLevel(format) <= formatLevel(enrollment.format);

  const [preview, setPreview] = useState<Lesson | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingOfferId, setBookingOfferId] = useState<string | undefined>(undefined);

  const isPublished = course.status === "published";
  const institutional = !!course.collegeId;
  const price = course.pricing[format] ?? 0;
  const cohort = nextCohort(course.id);
  const bundle = packages.find((p) => p.active && p.format === "bundle" && p.courseIds.includes(courseId) && p.courseIds.length > 1);
  const firstPreview = courseLessons(course).find((l) => l.preview);
  const related = course.relatedIds.map((id) => courses.find((c) => c.id === id)).filter((c): c is Course => !!c && c.status === "published");
  const defaultOffer = mentoringOfferForCourse(course, instructor);

  const openBooking = (offerId?: string) => {
    setBookingOfferId(offerId ?? defaultOffer?.id);
    setBookingOpen(true);
  };

  const buy = (f: LearningFormat = format) => {
    if (f === "mentoring") {
      openBooking();
      return;
    }
    if (enrollment && formatLevel(f) <= formatLevel(enrollment.format)) {
      router.push(`/dashboard/learn/${course.id}`);
      return;
    }
    if ((course.pricing[f] ?? 0) === 0) {
      if (!isLoggedIn) {
        toast.info("Log in to enrol for free", { description: "It takes about a minute — no payment needed." });
        router.push("/login");
        return;
      }
      enroll({ userId, courseId: course.id, format: f, source: "free" });
      addNotification({ kind: "enrollment", title: "Enrolment confirmed", body: `You're enrolled in ${course.title} · ${FORMAT_META[f].label}.`, href: `/dashboard/learn/${course.id}` });
      toast.success("You're enrolled!", {
        description: `${course.title} is now in My Learning.`,
        action: { label: "Start learning", onClick: () => router.push(`/dashboard/learn/${course.id}`) },
      });
      return;
    }
    setCheckout({ kind: "course", refId: course.id, format: f });
    router.push("/checkout");
  };

  const chooseBundle = () => {
    if (!bundle) return;
    setCheckout({ kind: "package", refId: bundle.id });
    router.push("/checkout");
  };

  const ctaLabel =
    format === "mentoring"
      ? "Choose a session time"
      : price === 0
        ? "Enroll for free"
        : enrollment
          ? `Upgrade to ${FORMAT_META[format].label}`
          : format === "live-cohort"
            ? "Enroll in Live Cohort"
            : "Buy now";

  const lessons = courseLessons(course);
  const videos = courseVideoLessons(course);

  const purchaseCard = (
    <PurchasePanel
      course={course}
      format={format}
      price={price}
      enrollment={enrollment}
      showBuy={!ownsFormat}
      progressPercent={progress.percent}
      upgradeFormats={upgradeFormats}
      ctaLabel={ctaLabel}
      onBuy={() => buy()}
      onSelectFormat={setChosen}
      institutional={institutional}
      collegeName={college?.name}
      isPublished={isPublished}
      bundle={bundle ? { name: bundle.name, price: bundle.price, savings: packageSavings(bundle), count: bundle.courseIds.length } : undefined}
      onChooseBundle={chooseBundle}
      cohortLabel={cohort ? `${cohort.scheduleLabel} · from ${formatDate(cohort.startDate, "d MMM")}` : undefined}
    />
  );

  return (
    <div className="pb-24 lg:pb-0">
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b bg-muted/40">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_60%_80%_at_80%_0%,black,transparent)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:px-6 md:py-12 lg:grid-cols-[1fr_440px] lg:items-center">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground">
                Courses
              </Link>
              <span>/</span>
              <span>{institutional ? "Institution courses" : course.category}</span>
            </nav>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {course.tags.map((t) => (
                <span key={t} className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-4 font-heading text-3xl leading-[1.1] font-bold tracking-tight text-balance md:text-5xl">{course.title}</h1>
            <p className="mt-3 text-lg text-muted-foreground">{course.subtitle}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <Rating value={course.rating} count={course.reviewCount} className="text-sm" />
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4" /> {formatNumber(course.learners)} learners
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" /> {course.durationLabel} · {formatDuration(courseDurationSec(course))} of content
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle className="size-4" /> {videos.length} video lessons · {lessons.length} total
              </span>
            </div>
            {instructor && (
              <Link href={`/mentors/${instructor.id}`} className="group mt-6 inline-flex items-center gap-3">
                <Portrait avatar={instructor.avatar} name={instructor.name} className="size-10" />
                <span className="text-sm">
                  <span className="text-muted-foreground">Taught by </span>
                  <span className="font-semibold group-hover:text-primary">{instructor.name}</span>
                  <span className="block text-xs text-muted-foreground">{instructor.title}</span>
                </span>
              </Link>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">For</span>
              {course.audience.map((a) => (
                <span key={a} className="rounded-md bg-card px-2 py-0.5 text-xs font-medium ring-1 ring-border">
                  {STAGE_META[a].plural}
                </span>
              ))}
              <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
              {course.formats.map((f) => (
                <FormatBadge key={f} format={f} showLevel />
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Last updated {formatDate(course.lastUpdated, "MMMM yyyy")}</p>
          </div>
          <div className="relative">
            <CourseThumbnail course={course} size="lg" className="rounded-2xl shadow-xl shadow-primary/10" />
            {firstPreview && (
              <button
                type="button"
                onClick={() => setPreview(firstPreview)}
                className="group absolute inset-0 flex items-center justify-center rounded-2xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label={`Watch free preview: ${firstPreview.title}`}
              >
                <span className="flex items-center gap-2 rounded-full bg-white/95 py-2 pr-4 pl-2 text-sm font-semibold text-primary shadow-lg transition group-hover:scale-105">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand text-white">
                    <CirclePlay className="size-4" />
                  </span>
                  Watch free preview
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Section nav */}
      <div className="sticky top-16 z-30 border-b bg-background/90 backdrop-blur">
        <nav className="scrollbar-none mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6" aria-label="Course sections">
          {[
            { href: "#formats", label: institutional ? "Access" : "Learning options" },
            { href: "#overview", label: "Overview" },
            { href: "#curriculum", label: "Curriculum" },
            { href: "#included", label: "What's included" },
            { href: "#instructor", label: "Instructor" },
            { href: "#reviews", label: "Reviews" },
          ].map((l) => (
            <a key={l.href} href={l.href} className="shrink-0 border-b-2 border-transparent px-3 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground">
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_360px] lg:gap-12">
        <div className="min-w-0 space-y-14">
          {!isPublished && !institutional && (
            <div className="flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <p className="font-semibold">This course isn&apos;t open for enrolment right now</p>
                <p className="mt-0.5 text-muted-foreground">It has been temporarily unpublished by the CDL team. Explore related courses below.</p>
              </div>
            </div>
          )}

          {/* Formats / access */}
          <section id="formats" className="scroll-mt-32">
            {institutional ? (
              <div className="rounded-2xl border bg-card p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Building2 className="size-5" />
                </span>
                <h2 className="mt-4 font-heading text-xl font-bold">Available to {college?.name ?? "partner college"} students via their college portal</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  This is an institution-provided programme from the {college?.shortName ?? "college"} Training &amp; Placement Cell, delivered on CDL. It
                  isn&apos;t sold to individual learners. Students access it — free of charge — from their college-branded dashboard.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild className="h-10">
                    <Link href="/campus">
                      Go to {college?.shortName ?? "campus"} student portal <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-10">
                    <a href="#related">Explore similar public courses</a>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <SectionTitle>Choose how you want to learn</SectionTitle>
                <div role="radiogroup" aria-label="Learning format" className={cn("grid gap-3", course.formats.length === 3 ? "md:grid-cols-3" : "sm:grid-cols-2")}>
                  {course.formats.map((f) => {
                    const selected = f === format;
                    const p = course.pricing[f] ?? 0;
                    const unavailable = f === "mentoring" && !mentorAvailable;
                    return (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={unavailable}
                        onClick={() => setChosen(f)}
                        className={cn(
                          "relative flex flex-col rounded-2xl border bg-card p-4 text-left transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-60",
                          selected && "border-primary ring-2 ring-primary/15",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <FormatBadge format={f} short />
                          <span
                            className={cn(
                              "flex size-5 items-center justify-center rounded-full border-2 transition",
                              selected ? "border-primary bg-primary" : "border-muted-foreground/30",
                            )}
                          >
                            {selected && <span className="size-2 rounded-full bg-white" />}
                          </span>
                        </span>
                        <span className="mt-4 font-heading text-2xl font-bold">
                          {p === 0 ? "Free" : formatINR(p)}
                          {f === "mentoring" && p > 0 && <span className="text-xs font-medium text-muted-foreground"> / session</span>}
                        </span>
                        <span className="mt-0.5 text-xs text-muted-foreground">Level {FORMAT_META[f].level} · {FORMAT_META[f].tagline}</span>
                        <ul className="mt-3 space-y-1.5 border-t pt-3">
                          {FORMAT_POINTS[f].map((pt) => (
                            <li key={pt} className="flex items-center gap-2 text-xs">
                              <CircleCheck className="size-3.5 shrink-0 text-brand" /> {pt}
                            </li>
                          ))}
                        </ul>
                        {enrollment?.format === f && (
                          <span className="absolute -top-2.5 right-3 rounded-full bg-success px-2 py-0.5 text-[10px] font-semibold text-white">Your plan</span>
                        )}
                        {unavailable && <span className="mt-2 text-xs text-muted-foreground">Mentor currently unavailable</span>}
                      </button>
                    );
                  })}
                </div>
                <FormatDetail
                  course={course}
                  format={format}
                  onBook={openBooking}
                  instructorName={instructor?.name}
                  offers={mentorAvailable ? (instructor?.offers ?? []) : []}
                  mentorId={instructor?.id}
                />
              </>
            )}
          </section>

          <section id="overview" className="scroll-mt-32">
            <SectionTitle>About this course</SectionTitle>
            <p className="text-[15px] leading-relaxed text-muted-foreground">{course.description}</p>
            <div className="mt-6 rounded-2xl border bg-card p-6">
              <p className="font-heading font-semibold">What you&apos;ll learn</p>
              <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {course.outcomes.map((o) => (
                  <li key={o} className="flex gap-2.5 text-sm">
                    <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {o}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Curriculum course={course} unlocked={!!enrollment} onPreview={setPreview} />
          <Included course={course} unlocked={!!enrollment} />
          {instructor && <InstructorCard mentor={instructor} onBook={mentorAvailable && instructor.offers.length ? () => openBooking() : undefined} />}
          <Reviews course={course} />

          {related.length > 0 && (
            <section id="related" className="scroll-mt-32">
              <SectionTitle
                aside={
                  <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
                    Browse all courses
                  </Link>
                }
              >
                Related courses
              </SectionTitle>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {related.map((c) => (
                  <CourseCard key={c.id} course={c} compact />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-32">{purchaseCard}</div>
        </aside>
      </div>

      {/* Mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 py-3 pr-4 pl-32 shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.15)] backdrop-blur sm:pl-4 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 sm:justify-between">
          <div className="min-w-0 text-right sm:text-left">
            {institutional ? (
              <p className="text-xs text-muted-foreground">College portal only</p>
            ) : ownsFormat ? (
              <p className="text-xs font-medium text-success">You&apos;re enrolled</p>
            ) : (
              <>
                <p className="font-heading text-lg leading-tight font-bold">{price === 0 ? "Free" : formatINR(price)}</p>
                <p className="truncate text-[11px] text-muted-foreground">{FORMAT_META[format].label}</p>
              </>
            )}
          </div>
          {institutional ? (
            <Button asChild className="h-10">
              <Link href="/campus">Open portal</Link>
            </Button>
          ) : ownsFormat ? (
            <Button asChild className="h-10 bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href={`/dashboard/learn/${course.id}`}>Continue learning</Link>
            </Button>
          ) : (
            <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" disabled={!isPublished} onClick={() => buy()}>
              {format === "mentoring" ? "Book session" : price === 0 ? "Enroll free" : enrollment ? "Upgrade" : "Buy now"}
            </Button>
          )}
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="p-4 pr-12">
            <DialogTitle>Free preview · {preview?.title}</DialogTitle>
            <DialogDescription>{course.title} — simulated playback for the prototype.</DialogDescription>
          </DialogHeader>
          {preview && <VideoPlayer course={course} lesson={preview} contextLabel="Free preview" className="rounded-none" />}
          <div className="flex flex-col gap-3 border-t bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Enjoyed it? Unlock all {lessons.length} lessons{institutional ? " via your college portal" : ""}.
            </p>
            {!institutional && !enrollment && isPublished && (
              <Button
                className="bg-brand text-brand-foreground hover:bg-brand/90"
                onClick={() => {
                  setPreview(null);
                  buy();
                }}
              >
                {ctaLabel}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {instructor && mentorAvailable && (
        <MentorBookingDialog key={bookingOfferId ?? "none"} mentor={instructor} open={bookingOpen} onOpenChange={setBookingOpen} defaultOfferId={bookingOfferId} mode="checkout" />
      )}
    </div>
  );
}

function FormatDetail({
  course,
  format,
  onBook,
  offers,
  instructorName,
  mentorId,
}: {
  course: Course;
  format: LearningFormat;
  onBook: (offerId?: string) => void;
  offers: { id: string; title: string; description: string; durationMin: number; price: number; sessions: number }[];
  instructorName?: string;
  mentorId?: string;
}) {
  if (format === "self-paced") {
    const facts = [
      { icon: Zap, title: "Start instantly", body: "Access right after enrolment" },
      { icon: PlayCircle, title: `${courseVideoLessons(course).length} video lessons`, body: `${formatDuration(courseDurationSec(course))} of content` },
      { icon: InfinityIcon, title: "12 months access", body: "Rewatch any lesson, any time" },
      { icon: Award, title: "Certificate", body: "On completing all lessons" },
    ];
    return (
      <div className="mt-4 grid gap-3 rounded-2xl border bg-muted/40 p-4 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map((f) => (
          <div key={f.title} className="flex gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
            <f.icon className="mt-0.5 size-4 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (format === "live-cohort") {
    const list = cohortsForCourse(course.id).filter((c) => c.status !== "completed");
    const assigned = nextCohort(course.id);
    const classes = assigned ? sessionsForCourse(course.id).filter((s) => s.cohortId === assigned.id && s.date >= DEMO_TODAY && s.type === "cohort-class").slice(0, 3) : [];
    return (
      <div className="mt-4 rounded-2xl border bg-muted/40 p-4">
        {list.length === 0 ? (
          <p className="p-2 text-sm text-muted-foreground">New cohort dates will be announced soon — enrol now to reserve a seat in the next evening cohort.</p>
        ) : (
          <div className="space-y-3">
            {list.map((c) => {
              const mine = assigned?.id === c.id;
              return (
                <div key={c.id} className={cn("rounded-xl bg-card p-4 ring-1 ring-border", mine && "ring-2 ring-brand/40")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    <AutoStatus status={c.status} label={c.status === "running" ? "In progress" : "Upcoming"} />
                    {mine && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">You&apos;ll join this cohort</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" /> {c.scheduleLabel}
                    </span>
                    <span>
                      {formatDate(c.startDate, "d MMM")} – {formatDate(c.endDate, "d MMM yyyy")}
                    </span>
                    <span className={cn("font-medium", seatsLeft(c) <= 6 ? "text-warning" : "text-foreground")}>{seatsLeft(c)} of {c.seats} seats left</span>
                  </div>
                </div>
              );
            })}
            {classes.length > 0 && (
              <div className="rounded-xl bg-card p-4 ring-1 ring-border">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Next live classes</p>
                <ul className="mt-2 divide-y">
                  {classes.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">{formatDate(s.date, "EEE, d MMM")}</span>
                      <span className="min-w-0 flex-1 truncate">{s.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatTime(s.time)} IST</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {assigned?.status === "running" && (
              <p className="px-1 text-xs text-muted-foreground">Joining mid-way? Recordings of earlier classes are available in your dashboard straight away.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border bg-muted/40 p-4">
      {offers.length === 0 ? (
        <p className="p-2 text-sm text-muted-foreground">
          One-to-one sessions with {instructorName ?? "this mentor"} aren&apos;t available right now.{" "}
          <Link href="/mentors" className="font-medium text-primary hover:underline">
            Browse other mentors
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          {offers.map((o) => (
            <div key={o.id} className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-border sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{o.description}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {o.durationMin} min{o.sessions > 1 ? ` · ${o.sessions} sessions` : ""} · with {instructorName}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <span className="font-heading text-lg font-bold">{formatINR(o.price)}</span>
                <Button size="sm" className="h-8 px-3" onClick={() => onBook(o.id)}>
                  Book this session
                </Button>
              </div>
            </div>
          ))}
          {mentorId && (
            <Link href={`/mentors/${mentorId}`} className="inline-flex items-center gap-1 px-1 text-sm font-medium text-primary hover:underline">
              See {instructorName}&apos;s availability <ArrowUpRight className="size-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function PurchasePanel({
  course,
  format,
  price,
  enrollment,
  showBuy,
  progressPercent,
  upgradeFormats,
  ctaLabel,
  onBuy,
  onSelectFormat,
  institutional,
  collegeName,
  isPublished,
  bundle,
  onChooseBundle,
  cohortLabel,
}: {
  course: Course;
  format: LearningFormat;
  price: number;
  enrollment?: { format: LearningFormat };
  showBuy: boolean;
  progressPercent: number;
  upgradeFormats: LearningFormat[];
  ctaLabel: string;
  onBuy: () => void;
  onSelectFormat: (f: LearningFormat) => void;
  institutional: boolean;
  collegeName?: string;
  isPublished: boolean;
  bundle?: { name: string; price: number; savings: number; count: number };
  onChooseBundle: () => void;
  cohortLabel?: string;
}) {
  if (institutional) {
    return (
      <div className="rounded-2xl border bg-card p-6 shadow-lg shadow-primary/5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
          <Building2 className="size-5" />
        </span>
        <p className="mt-4 font-heading text-lg font-bold">Institution-only course</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Available to {collegeName ?? "partner college"} students via their college portal. Not available for individual purchase.
        </p>
        <Button asChild className="mt-5 h-11 w-full">
          <Link href="/campus">Open the college portal</Link>
        </Button>
        <Button asChild variant="ghost" className="mt-2 h-10 w-full">
          <Link href="/courses">Browse public courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-lg shadow-primary/5">
      <div className="p-6">
        {enrollment && (
          <div className="mb-5 rounded-xl bg-success-soft p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CircleCheck className="size-4" /> You&apos;re enrolled · {FORMAT_META[enrollment.format].label}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Progress value={progressPercent} className="h-1.5 flex-1 bg-white [&>[data-slot=progress-indicator]]:bg-brand" />
              <span className="text-xs font-medium tabular-nums">{progressPercent}%</span>
            </div>
            <Button asChild className="mt-4 h-10 w-full bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href={`/dashboard/learn/${course.id}`}>
                Continue learning <ArrowRight />
              </Link>
            </Button>
          </div>
        )}

        {showBuy && (
          <>
            {enrollment && (
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {format === "mentoring" ? "Add one-to-one guidance" : "Upgrade your plan"}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <FormatBadge format={format} showLevel />
              {enrollment && upgradeFormats.length > 1 && (
                <div className="flex gap-1">
                  {upgradeFormats.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => onSelectFormat(f)}
                      className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", f === format ? "bg-primary text-primary-foreground" : "bg-muted")}
                    >
                      L{FORMAT_META[f].level}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="mt-4 font-heading text-4xl font-bold tracking-tight">
              {price === 0 ? "Free" : formatINR(price)}
              {format === "mentoring" && price > 0 && <span className="text-base font-medium text-muted-foreground"> / session</span>}
            </p>
            {enrollment && format !== "mentoring" && price > 0 && (
              <p className="mt-1 text-xs text-success">Credit for your {FORMAT_META[enrollment.format].label} purchase is applied at checkout.</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {format === "live-cohort" && cohortLabel ? cohortLabel : FORMAT_META[format].tagline}
            </p>
            <Button className="mt-5 h-12 w-full bg-brand text-base text-brand-foreground shadow-md shadow-brand/20 hover:bg-brand/90" disabled={!isPublished} onClick={onBuy}>
              {ctaLabel}
            </Button>
            {!isPublished && <p className="mt-2 text-center text-xs text-muted-foreground">Enrolment is paused for this course.</p>}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Prototype — no payment will be processed
            </p>
          </>
        )}

        {bundle && !enrollment && (
          <button
            type="button"
            onClick={onChooseBundle}
            className="group mt-5 flex w-full items-center gap-3 rounded-xl border border-dashed border-brand/40 bg-brand-soft/60 p-3 text-left transition hover:bg-brand-soft"
          >
            <Package className="size-5 shrink-0 text-brand" />
            <span className="min-w-0 flex-1 text-xs">
              <span className="block font-semibold text-foreground">Part of the {bundle.name}</span>
              <span className="text-muted-foreground">
                {bundle.count} courses for {formatINR(bundle.price)} · save {formatINR(bundle.savings)}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-brand transition group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
      <div className="border-t bg-muted/40 p-6">
        <p className="text-sm font-semibold">This course includes</p>
        <ul className="mt-3 space-y-2">
          {course.includes.map((i) => (
            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand" /> {i}
            </li>
          ))}
        </ul>
        <Link href="/programs#compare" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Compare learning levels <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
