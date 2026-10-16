"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Award, BookOpen, CalendarDays, CheckCircle2, Clock, Compass, Library, PlayCircle, UserRound } from "lucide-react";
import { courseLessons, getUser } from "@/data";
import { FORMAT_META, FORMATS } from "@/data/constants";
import { formatDuration } from "@/lib/format";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useMyEnrollments } from "@/store/hooks";
import { FormatBadge } from "@/components/shared/badges";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeProgress, useUpcomingSessions } from "@/components/learner/hooks";
import { Panel } from "@/components/learner/overview-parts";
import { ChildProgramCard, ProgramCard } from "@/components/learner/program-card";
import { CHILD_LESSONS_DONE, CHILD_USER_ID } from "@/components/learner/utils";
import { SessionRow } from "@/components/learner/widgets";

type TabKey = "progress" | "completed" | "all";

export default function MyLearningPage() {
  const { user, isParent } = useCurrentUser();
  const enrollments = useMyEnrollments();
  const childEnrollments = useMyEnrollments(CHILD_USER_ID);
  const lessonProgress = useDemoStore((s) => s.lessonProgress);
  const upcoming = useUpcomingSessions(4);
  const [tab, setTab] = useState<TabKey>("progress");
  const childName = user.childName ?? getUser(CHILD_USER_ID)?.name.split(" ")[0] ?? "Child";

  const mine = useMemo(
    () =>
      enrollments
        .map((e) => ({ e, p: computeProgress(e.course, lessonProgress[e.courseId]) }))
        .sort((a, b) => Number(a.p.isComplete) - Number(b.p.isComplete) || b.e.enrolledOn.localeCompare(a.e.enrolledOn)),
    [enrollments, lessonProgress],
  );
  const child = useMemo(
    () =>
      isParent
        ? childEnrollments.map((e) => ({ e, complete: (CHILD_LESSONS_DONE[e.courseId] ?? 0) >= courseLessons(e.course).length }))
        : [],
    [childEnrollments, isParent],
  );

  const stats = useMemo(() => {
    let seconds = 0;
    for (const { e } of mine) {
      for (const l of courseLessons(e.course)) if (lessonProgress[e.courseId]?.includes(l.id)) seconds += l.durationSec;
    }
    return {
      inProgress: mine.filter((m) => !m.p.isComplete).length,
      completed: mine.filter((m) => m.p.isComplete).length,
      seconds,
    };
  }, [mine, lessonProgress]);

  const show = (complete: boolean) => tab === "all" || (tab === "completed" ? complete : !complete);
  const visibleMine = mine.filter((m) => show(m.p.isComplete));
  const visibleChild = child.filter((c) => show(c.complete));
  const nothing = visibleMine.length === 0 && visibleChild.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="My Self"
        title="My Learning"
        description={isParent ? `Your parent programme and ${childName}'s courses, in one place.` : "Your enrolled programmes, progress and upcoming cohort classes."}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/library">
                <Library /> Video library
              </Link>
            </Button>
            <Button asChild>
              <Link href="/courses">
                <Compass /> Browse courses
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Enrolled programmes" value={mine.length + child.length} icon={BookOpen} hint={isParent ? `incl. ${child.length} for ${childName}` : "across all levels"} />
        <StatCard label="In progress" value={stats.inProgress} icon={PlayCircle} accent="brand" hint="keep the streak going" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="success" hint={stats.completed ? "certificates ready" : "finish one to earn a certificate"} />
        <StatCard label="Time learned" value={formatDuration(stats.seconds)} icon={Clock} accent="info" hint="from completed lessons" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
            <TabsList className="h-9">
              <TabsTrigger value="progress" className="px-3">
                In progress ({stats.inProgress + child.filter((c) => !c.complete).length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="px-3">
                Completed ({stats.completed + child.filter((c) => c.complete).length})
              </TabsTrigger>
              <TabsTrigger value="all" className="px-3">
                All ({mine.length + child.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {nothing ? (
            <EmptyState
              icon={tab === "completed" ? Award : BookOpen}
              title={tab === "completed" ? "No completed programmes yet" : enrollments.length ? "Nothing in progress" : "You haven't enrolled in a programme yet"}
              description={tab === "completed" ? "Finish all lessons in a programme to earn your certificate." : "Explore Self-Paced courses, Live Cohorts and One-to-One Mentoring."}
              action={
                <Button asChild>
                  <Link href="/courses">Browse courses</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {isParent && visibleMine.length > 0 && <h2 className="pt-1 font-heading text-base font-semibold">Your programme</h2>}
              {visibleMine.map(({ e }) => (
                <ProgramCard key={e.id} enrollment={e} owner={isParent ? "You" : undefined} />
              ))}
              {isParent && visibleChild.length > 0 && <h2 className="pt-2 font-heading text-base font-semibold">{childName}&apos;s programmes</h2>}
              {visibleChild.map(({ e }) => (
                <ChildProgramCard key={e.id} enrollment={e} childName={childName} />
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Panel
            title="Upcoming cohort sessions"
            description="Classes from your Live Cohorts"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/sessions">All</Link>
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
              <EmptyState icon={CalendarDays} title="No live classes" description="Upgrade a course to a Live Cohort to learn with peers." />
            )}
          </Panel>

          <Panel title="Learning levels" description="How CDL programmes are delivered">
            <ul className="space-y-3">
              {FORMATS.map((f) => (
                <li key={f} className="space-y-1">
                  <FormatBadge format={f} showLevel />
                  <p className="text-xs text-muted-foreground">{FORMAT_META[f].description}</p>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/dashboard/mentoring">
                <UserRound /> Book a mentor session
              </Link>
            </Button>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
