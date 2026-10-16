"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  Clock,
  CloudUpload,
  FileVideo,
  MessageCircleQuestion,
  Star,
  Timer,
  Users,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { getCohort } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatCompact, formatDate, formatDuration, formatNumber, formatTime, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ActivityChart } from "@/components/mentor/activity-chart";
import { ContentThumb, UploadVideoDialog } from "@/components/mentor/content-dialogs";
import {
  bookingTitle,
  chapterTitle,
  completeness,
  CONTENT_STATUS_LABEL,
  courseShort,
  endTime,
  learnerOf,
  myCohorts,
  myCourses,
  mySessions,
  profileChecklist,
  startsIn,
  useMentorBookings,
  useMentorContent,
  useMentorProfile,
  useMentorThreads,
  useScheduleItems,
  type ScheduleItem,
} from "@/components/mentor/mentor-data";
import { Panel } from "@/components/mentor/panel";
import { ScheduleDetailSheet, useDetailSheet } from "@/components/mentor/schedule-detail-sheet";
import { AutoStatus, DemoBadge, FormatBadge, StatusPill } from "@/components/shared/badges";
import { Rating } from "@/components/shared/cards";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const WEEK_END = format(addDays(parseISO(DEMO_TODAY), 7), "yyyy-MM-dd");

export default function MentorDashboardPage() {
  const mentor = useMentorProfile();
  const bookings = useMentorBookings();
  const items = useScheduleItems();
  const threads = useMentorThreads();
  const content = useMentorContent();
  const detail = useDetailSheet();
  const [uploadOpen, setUploadOpen] = useState(false);

  const today = items.filter((i) => i.date === DEMO_TODAY);
  const week = items.filter((i) => i.date > DEMO_TODAY && i.date <= WEEK_END);
  const todayMinutes = today.reduce((s, i) => s + i.durationMin, 0);

  const recentBookings = useMemo(
    () =>
      bookings
        .filter((b) => b.kind === "mentoring")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [bookings],
  );

  const questions = useMemo(() => {
    const rank = { unanswered: 0, answered: 1, resolved: 2 } as const;
    return [...threads].sort((a, b) => rank[a.status] - rank[b.status] || b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  }, [threads]);
  const unanswered = threads.filter((t) => t.status === "unanswered").length;

  const pending = content.filter((c) => c.status !== "published");

  // Activity this month — derived from demo data so it reacts to sessions you complete.
  const monthPrefix = DEMO_TODAY.slice(0, 7);
  const deliveredSessions = mySessions.filter((s) => s.status === "completed" && s.date.startsWith(monthPrefix));
  const deliveredBookings = bookings.filter((b) => b.kind === "mentoring" && b.status === "completed" && b.date.startsWith(monthPrefix));
  const deliveredCount = deliveredSessions.length + deliveredBookings.length;
  const deliveredMinutes = [...deliveredSessions, ...deliveredBookings].reduce((s, x) => s + x.durationMin, 0);
  const learnersReached = myCourses.reduce((s, c) => s + c.learners, 0);

  const checklist = profileChecklist(mentor);
  const profilePct = completeness(checklist);
  const missing = checklist.find((c) => !c.done);

  const statusLabel = mentor.status === "active" ? "Approved & active" : mentor.status === "pending-approval" ? "Pending approval" : "Inactive";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={formatDate(DEMO_TODAY, "EEEE, d MMMM yyyy")}
        title={`Good morning, ${mentor.name.split(" ")[0]}`}
        description={`You have ${today.length} session${today.length === 1 ? "" : "s"} today and ${unanswered} unanswered question${unanswered === 1 ? "" : "s"} from learners.`}
        actions={
          <>
            <Button variant="outline" className="h-10 px-4" asChild>
              <Link href="/mentor/schedule">
                <CalendarPlus /> Manage availability
              </Link>
            </Button>
            <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={() => setUploadOpen(true)}>
              <CloudUpload /> Upload video
            </Button>
          </>
        }
      />

      {/* Profile status */}
      <section className="grid grid-cols-1 gap-4 rounded-2xl border bg-card p-5 shadow-xs lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:items-center">
        <div className="flex items-center gap-4">
          <Portrait avatar={mentor.avatar} name={mentor.name} className="size-16" rounded="xl" />
          <div className="min-w-0">
            <p className="font-heading text-lg font-semibold">{mentor.name}</p>
            <p className="truncate text-sm text-muted-foreground">{mentor.title}</p>
            <div className="mt-1.5">
              <AutoStatus status={mentor.status === "active" ? "approved" : mentor.status} label={statusLabel} />
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 lg:bg-transparent lg:p-0">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Profile completeness</span>
            <span className="font-semibold tabular-nums">{profilePct}%</span>
          </div>
          <Progress value={profilePct} className="mt-2 h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
          {missing && (
            <Link href="/mentor/profile" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Next: {missing.label.toLowerCase()} <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
        <div className="rounded-xl bg-muted/40 p-3 lg:bg-transparent lg:p-0">
          <p className="text-sm text-muted-foreground">Learner rating</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-heading text-xl font-semibold">
            <Star className="size-5 fill-amber-400 text-amber-400" /> {mentor.rating.toFixed(1)}
            <span className="text-xs font-normal text-muted-foreground">({formatNumber(mentor.reviewCount)} reviews)</span>
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3 lg:bg-transparent lg:p-0">
          <p className="text-sm text-muted-foreground">Sessions delivered</p>
          <p className="mt-0.5 font-heading text-xl font-semibold tabular-nums">{formatNumber(mentor.sessionsDelivered)}</p>
          <p className="text-xs text-muted-foreground">since joining {formatDate(mentor.joinedOn, "MMM yyyy")}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's schedule */}
        <Panel
          className="lg:col-span-2"
          icon={<CalendarClock className="mt-0.5 size-5 text-brand" />}
          title="Today's schedule"
          description={`${formatDate(DEMO_TODAY, "EEE, d MMM")} · ${today.length} sessions · ${formatDuration(todayMinutes * 60)} of teaching`}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/schedule">
                Full calendar <ArrowRight />
              </Link>
            </Button>
          }
        >
          {today.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Nothing scheduled today — enjoy the breather.</p>
          ) : (
            <ol className="relative space-y-3">
              {today.map((item, idx) => (
                <TimelineRow key={item.id} item={item} last={idx === today.length - 1} onView={() => detail.show({ kind: item.kind, id: item.id })} />
              ))}
            </ol>
          )}
        </Panel>

        {/* Questions */}
        <Panel
          icon={<MessageCircleQuestion className="mt-0.5 size-5 text-brand" />}
          title="Recent questions"
          description={unanswered ? `${unanswered} waiting for your answer` : "All caught up"}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/questions">
                Answer <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="pt-3"
        >
          <ul className="divide-y">
            {questions.map((t) => (
              <li key={t.id}>
                <Link href="/mentor/questions" className="-mx-2 block rounded-lg px-2 py-3 transition hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <AutoStatus status={t.status} />
                    <span className="ml-auto text-[11px] text-muted-foreground">{relativeDay(t.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm font-medium">{t.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.authorName} · {courseShort(t.courseId)}
                  </p>
                </Link>
              </li>
            ))}
            {questions.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No questions on your courses yet.</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming 7 days */}
        <Panel
          icon={<CalendarDays className="mt-0.5 size-5 text-brand" />}
          title="Upcoming sessions"
          description={`Next 7 days · ${week.length} scheduled`}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/schedule">
                Schedule <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="pt-3"
        >
          <ul className="space-y-1">
            {week.slice(0, 6).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => detail.show({ kind: item.kind, id: item.id })}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted/50"
                >
                  <span className="flex w-12 shrink-0 flex-col items-center rounded-lg border bg-background py-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase">{formatDate(item.date, "EEE")}</span>
                    <span className="font-heading text-base leading-tight font-semibold">{formatDate(item.date, "d")}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatTime(item.time)} · {item.durationMin} min · {item.subtitle}
                    </span>
                  </span>
                  <KindPill item={item} />
                </button>
              </li>
            ))}
            {week.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No sessions in the next 7 days.</li>}
          </ul>
        </Panel>

        {/* New bookings */}
        <Panel
          icon={<Users className="mt-0.5 size-5 text-brand" />}
          title="Student bookings"
          description="Most recent 1:1 bookings"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/bookings">
                All bookings <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="pt-3"
        >
          <ul className="space-y-1">
            {recentBookings.map((b) => {
              const learner = learnerOf(b.userId);
              const isNew = b.createdAt.slice(0, 10) >= format(addDays(parseISO(DEMO_TODAY), -3), "yyyy-MM-dd");
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => detail.show({ kind: "booking", id: b.id })}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-muted/50"
                  >
                    <Portrait avatar={learner.avatar} name={learner.name} className="size-9" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{learner.name}</span>
                        {isNew && b.status === "confirmed" && (
                          <StatusPill tone="brand" dot={false} className="h-5 px-1.5 text-[10px]">
                            New
                          </StatusPill>
                        )}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {bookingTitle(b)} · {formatDate(b.date, "EEE, d MMM")}, {formatTime(b.time)}
                      </span>
                    </span>
                    <AutoStatus status={b.status} className="hidden sm:inline-flex" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Assigned programmes */}
        <Panel
          className="lg:col-span-2"
          title="Assigned programmes"
          description="Courses you lead on CDL"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/courses">
                My courses <ArrowRight />
              </Link>
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {myCourses.map((c) => {
              const cohorts = myCohorts.filter((x) => x.courseId === c.id);
              return (
                <Link
                  key={c.id}
                  href={`/mentor/courses/${c.id}`}
                  className="group flex flex-col gap-3 rounded-xl border p-3 transition hover:border-primary/30 hover:shadow-md"
                >
                  <CourseThumbnail course={c} />
                  <div className="space-y-2 px-1">
                    <div className="flex flex-wrap gap-1.5">
                      {c.formats.map((f) => (
                        <FormatBadge key={f} format={f} short />
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" /> {formatCompact(c.learners)} learners
                      </span>
                      <Rating value={c.rating} count={c.reviewCount} />
                    </div>
                    <div className="space-y-1">
                      {cohorts.map((co) => (
                        <div key={co.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate">{co.name.split(" · ")[1] ?? co.name}</span>
                          <AutoStatus status={co.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>

        {/* Pending */}
        <Panel
          title="Pending content & assignments"
          description="Items waiting on you or on admin review"
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mentor/content">
                Library <ArrowRight />
              </Link>
            </Button>
          }
          bodyClassName="pt-3 space-y-3"
        >
          <ul className="divide-y">
            {pending.map((c) => (
              <li key={c.id}>
                <Link href="/mentor/content" className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-muted/50">
                  <ContentThumb courseId={c.courseId} durationSec={c.durationSec} className="w-16" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {courseShort(c.courseId)} · {chapterTitle(c.courseId, c.chapterId)}
                    </span>
                  </span>
                  <AutoStatus status={c.status} label={CONTENT_STATUS_LABEL[c.status]} />
                </Link>
              </li>
            ))}
            {pending.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground">
                <FileVideo className="mr-1.5 inline size-4" />
                No drafts or videos in review.
              </li>
            )}
          </ul>
          <div className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning-soft/60 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-warning ring-1 ring-warning/20">
              <ClipboardList className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Assignments to review</p>
              <p className="text-xs text-muted-foreground">Rewrite a weak email — 14 submissions awaiting review</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.info("Assignment grading opens in Phase 2", {
                  description: "14 Communication Skills submissions are queued for you (illustrative).",
                })
              }
            >
              Review
            </Button>
          </div>
        </Panel>
      </div>

      {/* Activity summary */}
      <Panel
        title="Activity summary"
        description={`${formatDate(DEMO_TODAY, "MMMM yyyy")} so far · weekly delivery mix for the last 8 weeks`}
        action={<DemoBadge />}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="grid grid-cols-2 gap-3 self-start">
            <StatCard label="Sessions delivered" value={deliveredCount} icon={Video} accent="brand" hint="this month" />
            <StatCard label="Hours taught" value={`${(deliveredMinutes / 60).toFixed(1)}h`} icon={Timer} accent="info" hint="this month" />
            <StatCard label="Average rating" value={mentor.rating.toFixed(1)} icon={BadgeCheck} accent="success" hint={`${formatNumber(mentor.reviewCount)} reviews`} />
            <StatCard label="Learners reached" value={formatCompact(learnersReached)} icon={Users} accent="primary" hint="across your programmes" />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Sessions per week</p>
            <ActivityChart />
          </div>
        </div>
      </Panel>

      <ScheduleDetailSheet target={detail.target} open={detail.open} onOpenChange={detail.setOpen} />
      <UploadVideoDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}

function KindPill({ item }: { item: ScheduleItem }) {
  if (item.kind === "booking") return <StatusPill tone="brand" className="hidden sm:inline-flex">1:1</StatusPill>;
  const type = item.session?.type;
  return (
    <StatusPill tone={type === "cohort-class" ? "primary" : "warning"} className="hidden sm:inline-flex">
      {type === "cohort-class" ? "Cohort" : type === "workshop" ? "Workshop" : "Doubt hour"}
    </StatusPill>
  );
}

function TimelineRow({ item, last, onView }: { item: ScheduleItem; last: boolean; onView: () => void }) {
  const learner = item.booking ? learnerOf(item.booking.userId) : undefined;
  const cohort = item.session?.cohortId ? getCohort(item.session.cohortId) : undefined;
  const timing = startsIn(item.date, item.time, item.durationMin);
  const isBooking = item.kind === "booking";

  const join = () =>
    isBooking
      ? toast.success(`Opening session room with ${learner?.firstName}`, { description: "Simulated video room — no call is started in this prototype." })
      : toast.success("Starting live class (simulated)", { description: `${item.session?.booked ?? 0} learners will be admitted from the waiting room.` });

  return (
    <li className="relative grid grid-cols-[64px_1fr] gap-3 sm:grid-cols-[76px_1fr]">
      <div className="pt-3 text-right">
        <p className="text-sm font-semibold tabular-nums">{formatTime(item.time)}</p>
        <p className="text-[11px] text-muted-foreground">{formatTime(endTime(item.time, item.durationMin))}</p>
      </div>
      <div className="relative pl-5">
        <span
          className={cn(
            "absolute top-4 left-0 size-2.5 -translate-x-1/2 rounded-full ring-4 ring-card",
            isBooking ? "bg-brand" : "bg-primary",
          )}
        />
        {!last && <span className="absolute top-6 -bottom-3 left-0 w-px -translate-x-1/2 bg-border" />}
        <div className={cn("rounded-xl border p-3", isBooking ? "border-brand/25 bg-brand-soft/30" : "border-primary/15 bg-secondary/50")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {learner ? (
                <Portrait avatar={learner.avatar} name={learner.name} className="size-10" />
              ) : (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Users className="size-4.5" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{isBooking ? learner?.name : item.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {isBooking ? `${bookingTitle(item.booking!)} · ${item.booking?.topic ?? ""}` : `${cohort?.name ?? item.subtitle} · ${item.session?.booked} learners`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <StatusPill tone={isBooking ? "brand" : "primary"} dot={false} className="h-5 px-2 text-[10px]">
                    {isBooking ? "1:1 Mentoring" : "Live Cohort class"}
                  </StatusPill>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" /> {item.durationMin} min{timing ? ` · ${timing}` : ""}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" onClick={onView}>
                View
              </Button>
              <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={join}>
                <Video /> {isBooking ? "Join" : "Start"} <span className="sr-only">(simulated)</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
