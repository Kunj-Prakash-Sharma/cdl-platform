"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, parseISO } from "date-fns";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Compass,
  Flame,
  GraduationCap,
  MapPin,
  PlayCircle,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { courseLessons, findLesson, getMentor, getMentorOffer } from "@/data";
import { DEMO_TODAY, STAGE_META } from "@/data/constants";
import { formatDayShort, formatDuration, formatTime, relativeDay } from "@/lib/format";
import { recommendCourses } from "@/lib/recommend";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourseProgress, useCurrentUser, useMyBookings, useMyEnrollments } from "@/store/hooks";
import { FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { computeProgress, nextCohortClass, useContinueCourse, useMyAssignments, useMyCertificates, useRecentActivity, useTouchLesson, useUpcomingSessions } from "@/components/learner/hooks";
import { CareerSnapshotCard, LearningLevelCard, Panel, ProfileReminderBanner, QuickAccessGrid, RecentActivityCard } from "@/components/learner/overview-parts";
import { ParentOverview } from "@/components/learner/parent-overview";
import { highestFormat, LESSON_KIND_LABEL, lessonContextLabel, profileChecklist, profileCompletion } from "@/components/learner/utils";
import { ProgressRing, SessionRow, TealProgress } from "@/components/learner/widgets";

export default function DashboardOverviewPage() {
  const { isParent } = useCurrentUser();
  return <div className="mx-auto max-w-7xl space-y-6">{isParent ? <ParentOverview /> : <LearnerOverview />}</div>;
}

function LearnerOverview() {
  const { user } = useCurrentUser();
  const enrollments = useMyEnrollments();
  const lessonProgress = useDemoStore((s) => s.lessonProgress);
  const results = useDemoStore((s) => s.assessmentResults);
  const discovery = useDemoStore((s) => s.discovery.result);
  const bookings = useMyBookings();
  const certificates = useMyCertificates();
  const upcoming = useUpcomingSessions(3);
  const activity = useRecentActivity(7);

  const stats = useMemo(() => {
    let lessonsDone = 0;
    let inProgress = 0;
    for (const e of enrollments) {
      const p = computeProgress(e.course, lessonProgress[e.courseId]);
      lessonsDone += p.done;
      if (!p.isComplete) inProgress++;
    }
    return { lessonsDone, inProgress };
  }, [enrollments, lessonProgress]);

  const compass = useMemo(
    () => results.filter((r) => r.userId === user.id && r.assessmentId === "career-compass").sort((a, b) => b.completedOn.localeCompare(a.completedOn))[0],
    [results, user.id],
  );
  const level = highestFormat(enrollments.map((e) => e.format));
  const mentoring = bookings.filter((b) => b.kind === "mentoring");
  const mentoringNote = mentoring.length
    ? `You've also used One-to-One Mentoring: ${mentoring.filter((b) => b.status === "completed").length} session completed, ${mentoring.filter((b) => b.status === "confirmed" && b.date >= DEMO_TODAY).length} upcoming.`
    : undefined;
  const completion = profileCompletion(user);
  const missing = profileChecklist(user).filter((c) => !c.done);
  const nextSession = upcoming[0]?.session;

  return (
    <>
      <ProfileReminderBanner />

      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl bg-navy text-navy-foreground shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,color-mix(in_oklch,var(--brand)_45%,transparent),transparent_60%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 p-5 md:p-7 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <Portrait avatar={user.avatar} name={user.name} className="size-14 ring-2 ring-white/25 md:size-16" />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-white/60 uppercase">My Self dashboard</p>
              <h1 className="mt-1 font-heading text-2xl font-semibold text-white md:text-[28px]">Welcome back, {user.name.split(" ")[0]}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {STAGE_META[user.stage].label} · {user.education}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {user.city}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-4 rounded-xl bg-white/8 p-3 pr-4 ring-1 ring-white/15 transition hover:bg-white/12 lg:w-80"
          >
            <ProgressRing value={completion} tone="white" size={60} stroke={6}>
              <span className="font-heading text-sm font-semibold text-white tabular-nums">{completion}%</span>
            </ProgressRing>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">Profile {completion === 100 ? "complete" : "completion"}</span>
              <span className="block text-xs text-white/70">{missing.length ? `Next: ${missing[0].label.toLowerCase()}` : "Great — recommendations are fully personalised"}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.82_0.1_186)]">
                {missing.length ? "Complete profile" : "Review profile"} <ArrowRight className="size-3" />
              </span>
            </span>
          </Link>
        </div>
        <div className="relative grid grid-cols-2 border-t border-white/10 md:grid-cols-4">
          <HeroStat icon={BookOpen} label="Programmes in progress" value={String(stats.inProgress)} />
          <HeroStat icon={Flame} label="Lessons completed" value={String(stats.lessonsDone)} />
          <HeroStat icon={Award} label="Certificates earned" value={String(certificates.length)} />
          <HeroStat
            icon={CalendarClock}
            label="Next live class"
            value={nextSession ? `${relativeDay(nextSession.date)}, ${formatTime(nextSession.time)}` : "None scheduled"}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <ContinueLearningCard className="lg:col-span-2" />
        <NextStepsCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="My programmes"
          description={`${enrollments.length} enrolled · ${stats.inProgress} in progress`}
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/learning">
                View all <ArrowRight />
              </Link>
            </Button>
          }
          className="lg:col-span-2"
        >
          {enrollments.length ? (
            <ul className="divide-y">
              {enrollments.map((e) => (
                <ProgrammeRow key={e.id} enrollment={e} />
              ))}
            </ul>
          ) : (
            <EmptyState icon={BookOpen} title="No programmes yet" description="Browse the catalog to find your first programme." action={<Button asChild size="sm"><Link href="/courses">Browse courses</Link></Button>} />
          )}
        </Panel>
        <Panel
          title="Upcoming sessions"
          description="Your cohort classes and reserved seats"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/sessions">
                Calendar <ArrowRight />
              </Link>
            </Button>
          }
        >
          {upcoming.length ? (
            <div className="space-y-2.5">
              {upcoming.map((u) => (
                <SessionRow key={u.session.id} session={u.session} booked={u.booked} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Join a Live Cohort or reserve a workshop seat." action={<Button asChild size="sm"><Link href="/dashboard/sessions">Browse sessions</Link></Button>} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <LearningLevelCard level={level} mentoringNote={mentoringNote} />
        <CareerSnapshotCard result={compass} discovery={discovery} />
        <RecentActivityCard items={activity} />
      </div>

      <QuickAccessGrid />
    </>
  );
}

function HeroStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 md:px-7 [&:not(:first-child)]:md:border-l [&:nth-child(2n)]:border-l md:[&:nth-child(2n)]:border-l [&:nth-child(n+3)]:border-t md:[&:nth-child(n+3)]:border-t-0 border-white/10">
      <span className="hidden size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white sm:flex">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-heading text-lg font-semibold text-white tabular-nums">{value}</p>
        <p className="truncate text-xs text-white/65">{label}</p>
      </div>
    </div>
  );
}

function ContinueLearningCard({ className }: { className?: string }) {
  const enrollment = useContinueCourse();
  if (!enrollment) {
    return (
      <Panel title="Continue learning" className={className}>
        <EmptyState icon={PlayCircle} title="You're all caught up" description="Every enrolled programme is complete. Explore something new." action={<Button asChild size="sm"><Link href="/courses">Browse courses</Link></Button>} />
      </Panel>
    );
  }
  return <ContinueLearningBody enrollment={enrollment} className={className} />;
}

function ContinueLearningBody({ enrollment, className }: { enrollment: NonNullable<ReturnType<typeof useContinueCourse>>; className?: string }) {
  const { course } = enrollment;
  const progress = useCourseProgress(course);
  const found = progress.nextLessonId ? findLesson(course, progress.nextLessonId) : undefined;
  const mentor = getMentor(course.instructorId);
  const nextClass = nextCohortClass(enrollment.cohortId);
  const touch = useTouchLesson();
  const router = useRouter();
  const all = courseLessons(course);
  const at = all.findIndex((l) => l.id === found?.lesson.id);
  const upNext = all.slice(at + 1).filter((l) => !progress.completed.includes(l.id)).slice(0, 3);
  return (
    <section className={cn("flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs", className)}>
      <div className="grid flex-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Link href={`/dashboard/learn/${course.id}`} className="group relative block p-2 md:pr-0" aria-label={`Resume ${course.title}`}>
          <CourseThumbnail course={course} showCategory={false} className="h-full min-h-44" />
          <span className="absolute inset-2 flex items-center justify-center rounded-xl bg-black/0 transition group-hover:bg-black/15 md:right-0">
            <span className="flex size-14 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg transition group-hover:scale-105">
              <PlayCircle className="size-7" />
            </span>
          </span>
        </Link>
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-brand uppercase">Continue learning</span>
            <FormatBadge format={enrollment.format} short />
          </div>
          <div>
            <h2 className="font-heading text-xl leading-snug font-semibold">{course.title}</h2>
            {found && (
              <p className="mt-1 text-sm text-muted-foreground">
                {lessonContextLabel(course, found.lesson.id)} · <span className="font-medium text-foreground">{found.lesson.title}</span> · {LESSON_KIND_LABEL[found.lesson.kind]}, {formatDuration(found.lesson.durationSec)}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.done} of {progress.total} lessons complete
              </span>
              <span className="font-semibold tabular-nums">{progress.percent}%</span>
            </div>
            <TealProgress value={progress.percent} className="h-2" />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {mentor && (
              <span className="inline-flex items-center gap-1.5">
                <Portrait avatar={mentor.avatar} name={mentor.name} className="size-5" />
                {mentor.name}
              </span>
            )}
            {nextClass && (
              <span className="inline-flex items-center gap-1 font-medium text-brand">
                <CalendarClock className="size-3.5" />
                Live class {relativeDay(nextClass.date).toLowerCase()} · {formatTime(nextClass.time)}
              </span>
            )}
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <Button asChild className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90">
              <Link href={`/dashboard/learn/${course.id}`}>
                <PlayCircle /> Resume lesson
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10">
              <Link href="/dashboard/learning">My learning</Link>
            </Button>
          </div>
        </div>
      </div>
      {upNext.length > 0 && (
        <div className="border-t bg-muted/30 px-5 py-4">
          <p className="mb-2.5 text-xs font-medium text-muted-foreground">Coming up in this course</p>
          <ul className="grid gap-2 sm:grid-cols-3">
            {upNext.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => {
                    touch(course.id, l.id);
                    router.push(`/dashboard/learn/${course.id}`);
                  }}
                  className="flex h-full w-full items-start gap-2.5 rounded-lg border bg-card p-2.5 text-left transition hover:border-primary/25 hover:shadow-xs"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                    {l.kind === "video" ? <PlayCircle className="size-3.5" /> : l.kind === "quiz" ? <ClipboardCheck className="size-3.5" /> : <BookOpen className="size-3.5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-[13px] leading-snug font-medium">{l.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {LESSON_KIND_LABEL[l.kind]} · {formatDuration(l.durationSec)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ProgrammeRow({ enrollment }: { enrollment: ReturnType<typeof useMyEnrollments>[number] }) {
  const progress = useCourseProgress(enrollment.course);
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <Link href={`/dashboard/learn/${enrollment.courseId}`} className="w-20 shrink-0 sm:w-24" tabIndex={-1} aria-hidden="true">
        <CourseThumbnail course={enrollment.course} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link href={`/dashboard/learn/${enrollment.courseId}`} className="truncate text-sm font-medium hover:text-primary">
            {enrollment.course.title}
          </Link>
          <FormatBadge format={enrollment.format} short className="h-5 px-2 text-[11px]" />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <TealProgress value={progress.percent} className="flex-1" />
          <span className="w-10 text-right text-xs font-semibold tabular-nums">{progress.percent}%</span>
        </div>
      </div>
      <Button asChild variant={progress.isComplete ? "ghost" : "outline"} size="sm" className="hidden shrink-0 sm:inline-flex">
        <Link href={progress.isComplete ? "/dashboard/certificates" : `/dashboard/learn/${enrollment.courseId}`}>{progress.isComplete ? "Certificate" : "Continue"}</Link>
      </Button>
    </li>
  );
}

type Step = { id: string; icon: LucideIcon; tone: string; title: string; detail: string; href: string; cta: string };

function NextStepsCard() {
  const { user } = useCurrentUser();
  const assignments = useMyAssignments();
  const bookings = useMyBookings();
  const enrollments = useMyEnrollments();

  const steps = useMemo(() => {
    const out: Step[] = [];
    const open = assignments
      .filter((a) => a.status === "not-started" || a.status === "in-progress")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const urgent = open.filter((a) => differenceInCalendarDays(parseISO(a.dueDate), parseISO(DEMO_TODAY)) <= 5);
    for (const a of urgent.slice(0, 1)) {
      const overdue = a.dueDate < DEMO_TODAY;
      out.push({
        id: a.id,
        icon: ClipboardCheck,
        tone: overdue ? "bg-destructive/10 text-destructive" : "bg-warning-soft text-warning",
        title: `${a.status === "in-progress" ? "Finish" : "Start"} “${a.title}”`,
        detail: `${a.course.title} · ${overdue ? "overdue" : "due"} ${relativeDay(a.dueDate).toLowerCase()} · ${a.points} pts`,
        href: `/dashboard/assignments/${a.id}`,
        cta: a.status === "in-progress" ? "Continue assignment" : a.kind === "quiz" ? "Start quiz" : "Start assignment",
      });
    }
    const mentoring = bookings.find((b) => b.kind === "mentoring" && b.status === "confirmed" && b.date >= DEMO_TODAY);
    if (mentoring) {
      const offer = mentoring.offerId ? getMentorOffer(mentoring.offerId)?.offer : undefined;
      out.push({
        id: mentoring.id,
        icon: UserRound,
        tone: "bg-secondary text-primary",
        title: `Prepare for your ${offer?.title.split(" + ")[0].toLowerCase() ?? "mentoring session"}`,
        detail: `with ${getMentor(mentoring.mentorId)?.name} · ${formatDayShort(mentoring.date)}, ${formatTime(mentoring.time)}`,
        href: "/dashboard/mentoring",
        cta: "View session",
      });
    }
    if (urgent.length > 1) {
      const a = urgent[1];
      out.push({
        id: a.id,
        icon: ClipboardCheck,
        tone: "bg-info-soft text-info",
        title: `${a.kind === "quiz" ? "Take" : "Start"} “${a.title}”`,
        detail: `${a.course.title} · due ${relativeDay(a.dueDate).toLowerCase()}`,
        href: `/dashboard/assignments/${a.id}`,
        cta: "Open",
      });
    }
    const rec = recommendCourses({ stage: user.stage, interests: user.interests, goals: user.goals, exclude: enrollments.map((e) => e.courseId) }, 1)[0];
    if (rec) {
      out.push({
        id: `rec-${rec.course.id}`,
        icon: Sparkles,
        tone: "bg-brand-soft text-brand",
        title: `Explore ${rec.course.title}`,
        detail: rec.reason,
        href: `/courses/${rec.course.id}`,
        cta: "View programme",
      });
    }
    return out.slice(0, 3);
  }, [assignments, bookings, enrollments, user]);

  const [primary, ...rest] = steps;
  return (
    <Panel title="Recommended next step" description="Picked from your deadlines, sessions and goals">
      {primary ? (
        <div className="flex h-full flex-col gap-4">
          <div className="rounded-xl border bg-muted/40 p-4">
            <span className={cn("flex size-9 items-center justify-center rounded-lg", primary.tone)}>
              <primary.icon className="size-4" />
            </span>
            <p className="mt-3 leading-snug font-semibold">{primary.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{primary.detail}</p>
            <Button asChild className="mt-3 h-9 w-full bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href={primary.href}>
                {primary.cta} <ArrowRight />
              </Link>
            </Button>
          </div>
          {rest.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Also coming up</p>
              <ul className="space-y-2">
                {rest.map((s) => (
                  <li key={s.id}>
                    <Link href={s.href} className="group flex items-start gap-2.5 rounded-lg p-1.5 -m-1.5 transition hover:bg-muted">
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", s.tone)}>
                        <s.icon className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm leading-snug font-medium group-hover:text-primary">{s.title}</span>
                        <span className="line-clamp-1 block text-xs text-muted-foreground">{s.detail}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={Compass} title="You're on track" description="No deadlines this week. Keep learning at your pace." />
      )}
    </Panel>
  );
}
