"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ClipboardList, Compass, Gauge, History, Plus, Target, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getAssessment, getCourse, getUser } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatDayShort } from "@/lib/format";
import { recommendCourses } from "@/lib/recommend";
import type { Course } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser, useMyBookings, useMyEnrollments } from "@/store/hooks";
import { DemoBadge } from "@/components/shared/badges";
import { CourseCard } from "@/components/shared/cards";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DimensionBars } from "@/components/learner/assessment-bits";
import { computeProgress, useMyAssignments } from "@/components/learner/hooks";
import { Panel } from "@/components/learner/overview-parts";
import { CHILD_USER_ID, GOAL_DONE_PREFIX, parseGoal } from "@/components/learner/utils";
import { OwnerTag, ProgressRing, TealProgress } from "@/components/learner/widgets";

type TrackerItem = { id: string; label: string; detail: string; done: boolean; auto: boolean; href?: string };

export default function MyDevelopmentPage() {
  const { user, userId, isParent } = useCurrentUser();
  const child = getUser(CHILD_USER_ID)!;
  const childName = user.childName ?? child.name.split(" ")[0];
  const subjectId = isParent ? CHILD_USER_ID : userId;
  const results = useDemoStore((s) => s.assessmentResults);
  const lessonProgress = useDemoStore((s) => s.lessonProgress);
  const updateProfile = useDemoStore((s) => s.updateProfile);
  const enrollments = useMyEnrollments();
  const childEnrollments = useMyEnrollments(CHILD_USER_ID);
  const bookings = useMyBookings();
  const assignments = useMyAssignments();
  const [manual, setManual] = useState<Record<string, boolean>>({ tmay: true });
  const [newGoal, setNewGoal] = useState("");
  const [goalError, setGoalError] = useState("");

  const compass = useMemo(
    () => results.filter((r) => r.userId === subjectId && r.assessmentId === "career-compass").sort((a, b) => b.completedOn.localeCompare(a.completedOn)),
    [results, subjectId],
  );
  const latest = compass[0];
  const previous = compass[1];
  const ei = useMemo(
    () => results.filter((r) => r.userId === subjectId && r.assessmentId === "employability-index").sort((a, b) => b.completedOn.localeCompare(a.completedOn))[0],
    [results, subjectId],
  );

  const tracker: TrackerItem[] = useMemo(() => {
    if (isParent) {
      const family = bookings.find((b) => b.kind === "mentoring" && b.status !== "cancelled");
      const cdf = getCourse("career-discovery-fundamentals")!;
      return [
        { id: "cdf", label: `${childName} completed Career Discovery Fundamentals`, detail: "Interests, clusters and a 12-month plan", done: childEnrollments.some((e) => e.courseId === cdf.id), auto: true },
        { id: "compass", label: `${childName} took the Career Compass`, detail: latest ? `Completed ${formatDate(latest.completedOn)}` : "Not taken yet", done: Boolean(latest), auto: true, href: latest ? `/assessment/report/${latest.id}` : undefined },
        { id: "family", label: "Book a Parent + Child planning session", detail: family ? `${formatDayShort(family.date)} with Dr. Meera Kapoor` : "Align on streams together", done: Boolean(family), auto: true, href: "/dashboard/mentoring" },
        { id: "webinar", label: "Attend “Choosing a stream after Class 10”", detail: "Parents' Circle webinar · Sat, 24 Oct", done: Boolean(manual.webinar), auto: false },
        { id: "guide", label: "Read the Stream & subject guide together", detail: "Science, Commerce and Humanities pathways", done: Boolean(manual.guide), auto: false, href: "/dashboard/resources" },
        { id: "talk", label: "Arrange two conversations with professionals", detail: `In fields ${childName} is curious about`, done: Boolean(manual.talk), auto: false },
      ];
    }
    const resume = getCourse("resume-building")!;
    const gd = getCourse("group-discussion-mastery")!;
    const resumeDone = computeProgress(resume, lessonProgress[resume.id]).isComplete;
    const gdProgress = computeProgress(gd, lessonProgress[gd.id]);
    const review = assignments.find((a) => a.id === "as-rsb-final");
    const star = assignments.find((a) => a.id === "as-inp-star");
    const mock = bookings.find((b) => b.kind === "mentoring" && b.offerId === "o-arjun-mock" && b.status !== "cancelled");
    return [
      { id: "resume", label: "Complete Resume Building", detail: resumeDone ? "All lessons complete · certificate earned" : "Finish the remaining lessons", done: resumeDone, auto: true, href: "/dashboard/learn/resume-building" },
      { id: "review", label: "Get your resume reviewed by a mentor", detail: review?.status === "graded" ? `Scored ${review.score}/${review.points} · feedback from Farah` : "Submit your revised resume", done: review?.status === "graded", auto: true, href: review ? `/dashboard/assignments/${review.id}` : undefined },
      { id: "star", label: "Write three STAR stories", detail: star ? (star.status === "not-started" ? `Assignment due ${formatDayShort(star.dueDate)}` : star.status === "in-progress" ? "Draft saved" : "Submitted for review") : "Part of Interview Preparation", done: star?.status === "submitted" || star?.status === "graded", auto: true, href: star ? `/dashboard/assignments/${star.id}` : undefined },
      { id: "mock", label: "Book a mock interview", detail: mock ? `${mock.status === "completed" ? "Done" : "Booked"} · ${formatDayShort(mock.date)} with Arjun Malhotra` : "Practise with an expert", done: Boolean(mock), auto: true, href: "/dashboard/mentoring" },
      { id: "gd", label: "Finish the GD Mastery cohort", detail: `${gdProgress.done} of ${gdProgress.total} lessons · ${gdProgress.percent}%`, done: gdProgress.isComplete, auto: true, href: "/dashboard/learn/group-discussion-mastery" },
      { id: "tmay", label: "Practise “Tell me about yourself” (60–90 s)", detail: "Record yourself twice and compare", done: Boolean(manual.tmay), auto: false },
      { id: "research", label: "Research five target companies", detail: "Use the company research worksheet", done: Boolean(manual.research), auto: false, href: "/dashboard/resources" },
      { id: "questions", label: "Prepare three questions to ask interviewers", detail: "Role, team and growth questions", done: Boolean(manual.questions), auto: false },
    ];
  }, [isParent, bookings, childEnrollments, childName, latest, lessonProgress, assignments, manual]);
  const trackerDone = tracker.filter((t) => t.done).length;
  const trackerPct = Math.round((trackerDone / tracker.length) * 100);

  const recommended = useMemo(() => {
    const subject = isParent ? child : user;
    const enrolled = new Set((isParent ? childEnrollments : enrollments).map((e) => e.courseId));
    const out: { course: Course; reason: string }[] = [];
    for (const id of latest?.recommendedCourseIds ?? []) {
      const c = getCourse(id);
      if (c && !enrolled.has(id)) out.push({ course: c, reason: `Suggested by ${isParent ? `${childName}'s` : "your"} Career Compass result.` });
    }
    const more = recommendCourses(
      { stage: subject.stage, interests: subject.interests, goals: subject.goals.map((g) => parseGoal(g).text), exclude: [...enrolled, ...out.map((o) => o.course.id)] },
      3,
    );
    for (const r of more) out.push({ course: r.course, reason: r.reason });
    return out.slice(0, 3);
  }, [isParent, child, user, childEnrollments, enrollments, latest, childName]);

  const goals = user.goals.map((g, i) => ({ ...parseGoal(g), raw: g, i }));
  const saveGoals = (next: string[], message: string) => {
    updateProfile(userId, { goals: next });
    toast.success(message);
  };
  const addGoal = () => {
    const text = newGoal.trim();
    if (text.length < 4) {
      setGoalError("Describe your goal in a few words.");
      return;
    }
    if (goals.some((g) => g.text.toLowerCase() === text.toLowerCase())) {
      setGoalError("You already have this goal.");
      return;
    }
    saveGoals([...user.goals, text], "Goal added");
    setNewGoal("");
    setGoalError("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="My Self"
        title="My Development"
        description={isParent ? `${childName}'s strengths and next steps, plus your own goals as a parent.` : "Your strengths, growth areas, placement readiness and learning goals in one place."}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/dashboard/assessments">
                <History /> Assessment history
              </Link>
            </Button>
            {!isParent && (
              <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href="/assessment/employability-index">
                  <Gauge /> Employability Readiness Index
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title={
            <span className="flex flex-wrap items-center gap-2">
              {isParent && <OwnerTag tone="brand">{childName}</OwnerTag>}
              Assessment summary
            </span>
          }
          description={latest ? `${getAssessment(latest.assessmentId)?.title} · ${formatDate(latest.completedOn)}${previous ? ` · marker shows ${formatDate(previous.completedOn, "MMM yyyy")} attempt` : ""}` : undefined}
          action={<DemoBadge>Illustrative</DemoBadge>}
        >
          {latest ? (
            <>
              <DimensionBars result={latest} previous={previous} />
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/assessment/report/${latest.id}`}>
                    View full report <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/assessments">Compare attempts</Link>
                </Button>
              </div>
            </>
          ) : (
            <EmptyState icon={Compass} title="No Career Compass result yet" description="Take the 12-minute assessment to see your interest, personality and skill profile." action={<Button asChild size="sm"><Link href="/assessment/career-compass">Start Career Compass</Link></Button>} />
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Strengths & development areas" description="From the latest results">
            {latest ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-success">
                    <TrendingUp className="size-3.5" /> Strengths
                  </p>
                  <ul className="space-y-1.5">
                    {latest.strengths.map((s) => (
                      <li key={s} className="flex items-center gap-2 rounded-lg bg-success-soft/60 px-2.5 py-1.5 text-sm">
                        <CheckCircle2 className="size-4 text-success" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-warning">
                    <Target className="size-3.5" /> Development areas
                  </p>
                  <ul className="space-y-1.5">
                    {[...new Set([...latest.developmentAreas, ...(ei?.developmentAreas ?? [])])].map((d) => (
                      <li key={d} className="flex items-center gap-2 rounded-lg bg-warning-soft/70 px-2.5 py-1.5 text-sm">
                        <Target className="size-4 text-warning" /> {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Complete an assessment to see this.</p>
            )}
          </Panel>
          {!isParent && (
            <Panel title="Employability Readiness" description={ei ? `Self-check · ${formatDate(ei.completedOn)}` : "8-question self-check"} action={<DemoBadge>Illustrative</DemoBadge>}>
              {ei ? (
                <>
                  <DimensionBars result={ei} groups={["skill"]} compact />
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                    <Link href="/assessment/employability-index">Retake the index</Link>
                  </Button>
                </>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/assessment/employability-index">Take the Employability Readiness Index</Link>
                </Button>
              )}
            </Panel>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={isParent ? "Stream decision checklist" : "Resume & interview preparation"}
          description={isParent ? `Steps to help ${childName} choose after Class 10` : "Your placement-season readiness tracker"}
          action={
            <ProgressRing value={trackerPct} size={48} stroke={5}>
              <span className="text-[11px] font-semibold tabular-nums">{trackerPct}%</span>
            </ProgressRing>
          }
        >
          <p className="mb-3 text-xs text-muted-foreground">
            {trackerDone} of {tracker.length} done · items marked “auto” update from your courses, assignments and bookings.
          </p>
          <ul className="space-y-2">
            {tracker.map((t) => (
              <li key={t.id} className={cn("flex items-start gap-3 rounded-xl border p-3", t.done && "bg-muted/40")}>
                {t.auto ? (
                  <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", t.done ? "bg-brand text-white" : "border-2 border-border")} aria-label={t.done ? "Done" : "Not done"}>
                    {t.done && <Check className="size-3" />}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setManual((m) => ({ ...m, [t.id]: !m[t.id] }));
                      if (!t.done) toast.success("Nice — marked as done", { description: t.label });
                    }}
                    className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition", t.done ? "border-brand bg-brand text-white" : "border-border hover:border-brand")}
                    aria-pressed={t.done}
                    aria-label={`Mark “${t.label}” as ${t.done ? "not done" : "done"}`}
                  >
                    {t.done && <Check className="size-3" />}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", t.done && "text-muted-foreground line-through decoration-muted-foreground/40")}>{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", t.auto ? "bg-secondary text-primary" : "bg-muted text-muted-foreground")}>{t.auto ? "Auto" : "Self"}</span>
                {t.href && (
                  <Link href={t.href} className="shrink-0 text-muted-foreground hover:text-primary" aria-label={`Open ${t.label}`}>
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <TealProgress value={trackerPct} className="mt-4" />
        </Panel>

        <Panel title={isParent ? "Your goals as a parent" : "Learning goals"} description="Saved to your profile — recommendations use them too">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              addGoal();
            }}
          >
            <div className="flex-1">
              <Input
                value={newGoal}
                onChange={(e) => {
                  setNewGoal(e.target.value);
                  if (goalError) setGoalError("");
                }}
                placeholder={isParent ? "e.g. Visit two colleges with Arjun" : "e.g. Get shortlisted for 3 marketing roles"}
                aria-label="New goal"
                aria-invalid={Boolean(goalError)}
                className="h-9"
              />
              {goalError && <p className="mt-1 text-xs text-destructive">{goalError}</p>}
            </div>
            <Button type="submit" className="h-9">
              <Plus /> Add goal
            </Button>
          </form>
          {goals.length ? (
            <ul className="mt-4 space-y-2">
              {goals.map((g) => (
                <li key={g.raw} className={cn("group flex items-center gap-3 rounded-xl border p-3", g.done && "bg-success-soft/40")}>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...user.goals];
                      next[g.i] = g.done ? g.text : `${GOAL_DONE_PREFIX}${g.text}`;
                      saveGoals(next, g.done ? "Goal reopened" : "Goal completed — well done!");
                    }}
                    className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition", g.done ? "border-success bg-success text-white" : "border-border hover:border-success")}
                    aria-label={g.done ? `Reopen goal: ${g.text}` : `Complete goal: ${g.text}`}
                  >
                    {g.done && <Check className="size-3" />}
                  </button>
                  <span className={cn("flex-1 text-sm", g.done && "text-muted-foreground line-through")}>{g.text}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove goal: ${g.text}`}
                    onClick={() =>
                      saveGoals(
                        user.goals.filter((_, i) => i !== g.i),
                        "Goal removed",
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-4" icon={ClipboardList} title="No goals yet" description="Add one or two goals so we can tailor recommendations." />
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {goals.filter((g) => g.done).length} of {goals.length} goals completed · last reviewed {formatDate(DEMO_TODAY)}
          </p>
        </Panel>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold md:text-lg">
              Recommended {isParent ? `for ${childName}` : "for you"} <DemoBadge>Illustrative</DemoBadge>
            </h2>
            <p className="text-sm text-muted-foreground">Based on assessment results, stage and goals — simple transparent rules.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">
              All courses <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommended.map((r) => (
            <CourseCard key={r.course.id} course={r.course} reason={r.reason} />
          ))}
        </div>
      </section>
    </div>
  );
}
