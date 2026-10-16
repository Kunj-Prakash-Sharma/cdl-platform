"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarDays, GraduationCap, HeartHandshake, MapPin, School, Video } from "lucide-react";
import { getMentor, getMentorOffer, getUser, resources } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDayShort, formatTime, relativeDay } from "@/lib/format";
import { recommendCourses } from "@/lib/recommend";
import type { Resource } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useMyBookings, useMyEnrollments } from "@/store/hooks";
import { CourseCard } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { useRecentActivity, useUpcomingSessions } from "./hooks";
import { CareerSnapshotCard, Panel, ProfileReminderBanner, QuickAccessGrid, RecentActivityCard } from "./overview-parts";
import { ChildProgramCard, ProgramCard } from "./program-card";
import { ResourceCard, ResourcePreviewDialog } from "./resource-card";
import { CHILD_USER_ID, profileChecklist, profileCompletion } from "./utils";
import { OwnerTag, ProgressRing, SessionRow } from "./widgets";

/** Parent-mode overview: Sunita supporting Arjun (Class 10). */
export function ParentOverview() {
  const { user } = useCurrentUser();
  const child = getUser(CHILD_USER_ID)!;
  const childName = user.childName ?? child.name.split(" ")[0];
  const myEnrollments = useMyEnrollments();
  const childEnrollments = useMyEnrollments(CHILD_USER_ID);
  const results = useDemoStore((s) => s.assessmentResults);
  const bookings = useMyBookings();
  const upcoming = useUpcomingSessions(3);
  const activity = useRecentActivity(6);
  const [preview, setPreview] = useState<Resource | null>(null);

  const childResult = useMemo(
    () => results.filter((r) => r.userId === CHILD_USER_ID && r.assessmentId === "career-compass").sort((a, b) => b.completedOn.localeCompare(a.completedOn))[0],
    [results],
  );
  const familySession = bookings.find((b) => b.kind === "mentoring" && b.status === "confirmed" && b.date >= DEMO_TODAY);
  const familyMentor = familySession ? getMentor(familySession.mentorId) : undefined;
  const familyOffer = familySession?.offerId ? getMentorOffer(familySession.offerId)?.offer : undefined;
  const completion = profileCompletion(user);
  const missing = profileChecklist(user).filter((c) => !c.done);

  const myCourseIds = new Set(myEnrollments.map((e) => e.courseId));
  const parentResources = resources.filter((r) => myCourseIds.has(r.courseId) || r.courseId === "career-discovery-fundamentals").slice(0, 3);
  const forChild = recommendCourses(
    { stage: child.stage, interests: child.interests, goals: child.goals, exclude: childEnrollments.map((e) => e.courseId) },
    2,
  );

  return (
    <>
      <ProfileReminderBanner />

      <section className="relative overflow-hidden rounded-2xl bg-navy text-navy-foreground shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_100%_0%,color-mix(in_oklch,var(--brand)_45%,transparent),transparent_60%)]" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 p-5 md:p-7 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex shrink-0 -space-x-3">
              <Portrait avatar={user.avatar} name={user.name} className="size-14 ring-2 ring-navy md:size-16" />
              <Portrait avatar={child.avatar} name={child.name} className="size-14 ring-2 ring-navy md:size-16" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-wider text-white/60 uppercase">Welcome back, {user.name.split(" ")[0]}</p>
              <h1 className="mt-1 font-heading text-2xl font-semibold text-white md:text-[28px]">Supporting {childName}&apos;s journey</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <School className="size-4" />
                  {child.education} · {child.institution}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {child.city}
                </span>
              </p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="flex items-center gap-4 rounded-xl bg-white/8 p-3 pr-4 ring-1 ring-white/15 transition hover:bg-white/12 lg:w-80">
            <ProgressRing value={completion} tone="white" size={60} stroke={6}>
              <span className="font-heading text-sm font-semibold text-white tabular-nums">{completion}%</span>
            </ProgressRing>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">Your profile</span>
              <span className="block text-xs text-white/70">{missing.length ? `Next: ${missing[0].label.toLowerCase()}` : "Complete"}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[oklch(0.82_0.1_186)]">
                Update profile <ArrowRight className="size-3" />
              </span>
            </span>
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-base font-semibold md:text-lg">{childName}&apos;s programmes</h2>
              <p className="text-sm text-muted-foreground">Progress from {childName}&apos;s learner account</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/learning">
                All learning <ArrowRight />
              </Link>
            </Button>
          </div>
          {childEnrollments.map((e) => (
            <ChildProgramCard key={e.id} enrollment={e} childName={childName} />
          ))}
        </section>

        <Panel title="Coming up" description="Sessions for you and your family">
          <div className="space-y-2.5">
            {familySession && (
              <Link href="/dashboard/mentoring" className="block rounded-xl border border-brand/30 bg-brand-soft/50 p-3 transition hover:shadow-xs">
                <div className="flex items-center gap-2">
                  <OwnerTag tone="brand">Parent + child</OwnerTag>
                  <span className="text-xs text-muted-foreground">{familySession.durationMin} min · online</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{familyOffer?.title ?? "Mentoring session"}</p>
                <p className="text-xs text-muted-foreground">{familySession.topic}</p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {familyMentor && <Portrait avatar={familyMentor.avatar} name={familyMentor.name} className="size-5" />}
                  <span className="font-medium">{familyMentor?.name}</span>
                  <span className="inline-flex items-center gap-1 text-brand">
                    <CalendarClock className="size-3.5" />
                    {formatDayShort(familySession.date)}, {formatTime(familySession.time)}
                  </span>
                </div>
              </Link>
            )}
            {upcoming.map((u) => (
              <SessionRow key={u.session.id} session={u.session} booked={u.booked} />
            ))}
            {!familySession && upcoming.length === 0 && <EmptyState icon={CalendarDays} title="Nothing scheduled" description="Book a parent webinar or a family planning session." />}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/sessions">
                <Video /> Sessions
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/mentoring">
                <HeartHandshake /> Mentoring
              </Link>
            </Button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CareerSnapshotCard result={childResult} title={`${childName}'s assessment snapshot`} subjectName={childName} />
        <section className="space-y-4 lg:col-span-2">
          <div>
            <h2 className="font-heading text-base font-semibold md:text-lg">Your programme</h2>
            <p className="text-sm text-muted-foreground">Learning alongside {childName} as a parent</p>
          </div>
          {myEnrollments.length ? (
            myEnrollments.map((e) => <ProgramCard key={e.id} enrollment={e} owner="Your programme" />)
          ) : (
            <EmptyState icon={GraduationCap} title="No parent programme yet" description="Career Clarity for Parents helps you guide stream and subject choices." action={<Button asChild size="sm"><Link href="/courses/career-clarity-for-parents">View programme</Link></Button>} />
          )}
          <div className="rounded-2xl border bg-card p-4 shadow-xs">
            <p className="text-sm font-semibold">Upcoming for your cohort</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Parents&apos; Circle · last Saturday of every month, 6:00 PM IST. Next: “Choosing a stream after Class 10” — {relativeDay("2026-10-24").toLowerCase()}.
            </p>
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-base font-semibold md:text-lg">Recommended for parents</h2>
            <p className="text-sm text-muted-foreground">Guides from your programme and next steps for {childName}</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/resources">
              All resources <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {parentResources.slice(0, 2).map((r) => (
            <ResourceCard key={r.id} resource={r} locked={!myCourseIds.has(r.courseId)} onPreview={setPreview} />
          ))}
          {forChild.map((rec) => (
            <CourseCard key={rec.course.id} course={rec.course} highlightFormat={rec.format} reason={`For ${childName}: ${rec.reason.replace(/^Because /, "").replace(/^./, (c) => c.toLowerCase())}`} compact />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentActivityCard items={activity} className="lg:col-span-1" />
        <div className="lg:col-span-2">
          <QuickAccessGrid gridClassName="lg:grid-cols-3" />
        </div>
      </div>

      <ResourcePreviewDialog resource={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </>
  );
}
