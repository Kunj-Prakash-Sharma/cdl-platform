"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  Download,
  Megaphone,
  Pin,
  Radio,
  TrendingUp,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor } from "@/data";
import { formatDate, formatDayShort, formatTime, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/shared/badges";
import { SectionHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { brandGradient, CoBrandLockup, tint, useAitCollege } from "@/components/college/brand";
import { overallProgress, sessionTopic } from "@/components/college/college-data";
import {
  ANNOUNCEMENTS,
  ATTENDED,
  CAMPUS_ASSIGNMENTS,
  daysUntil,
  firstName,
  isOpen,
  MAKEUP_TODAY,
  MY_PAST,
  NEXT_CLASS,
  STUDENT,
  STUDENT_COURSES,
} from "@/components/campus/campus-data";
import { CampusProgramCard, ProgressRing } from "@/components/campus/ui";

const TAG_TONE = { Drive: "info", Deadline: "danger", Workshop: "brand", Update: "neutral" } as const;

export default function CampusHomePage() {
  const college = useAitCollege();
  const overall = overallProgress(STUDENT);
  const due = CAMPUS_ASSIGNMENTS.filter((a) => isOpen(a.status));
  const continueCourse = [...STUDENT_COURSES].filter((c) => (STUDENT.progress[c.id] ?? 0) < 100).sort((a, b) => (STUDENT.progress[b.id] ?? 0) - (STUDENT.progress[a.id] ?? 0))[0] ?? STUDENT_COURSES[0];
  const nextMentor = NEXT_CLASS ? getMentor(NEXT_CLASS.mentorId) : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Branded hero */}
      <section className="relative overflow-hidden rounded-2xl text-white shadow-sm" style={{ backgroundImage: brandGradient(college.brandColor) }}>
        <div className="absolute inset-0 bg-grid opacity-[0.08]" aria-hidden="true" />
        <div className="relative grid grid-cols-1 gap-6 p-5 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <CoBrandLockup college={college} />
            <p className="mt-5 text-xs font-semibold tracking-wider text-white/70 uppercase">
              {college.shortName} × CDL Placement Readiness
            </p>
            <h1 className="mt-1 font-heading text-2xl leading-tight font-semibold md:text-[32px]">Welcome back, {firstName}</h1>
            <p className="mt-2 max-w-xl text-sm text-white/80 md:text-[15px]">
              {STUDENT.department} · {STUDENT.year} · {college.name}. Placement season starts with pre-placement talks on 27 Oct — keep your momentum going.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild className="h-10 bg-white px-4 text-foreground hover:bg-white/90">
                <Link href={`/campus/learn/${continueCourse.id}`}>
                  Continue {continueCourse.title} <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-10 px-4 text-white ring-1 ring-white/30 hover:bg-white/15 hover:text-white">
                <Link href="/campus/sessions">
                  <CalendarDays /> My schedule
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-5 rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm">
            <ProgressRing value={overall} size={104} stroke={9} color="white" track="rgba(255,255,255,0.22)">
              <span className="font-heading text-2xl font-semibold tabular-nums">{overall}%</span>
              <span className="text-[11px] text-white/70">overall</span>
            </ProgressRing>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-white/65">Programs</dt>
                <dd className="font-medium">{STUDENT_COURSES.length} assigned by {college.shortName}</dd>
              </div>
              <div>
                <dt className="text-xs text-white/65">Live classes</dt>
                <dd className="font-medium">
                  {ATTENDED.length} of {MY_PAST.length} attended
                </dd>
              </div>
              <div>
                <dt className="text-xs text-white/65">Due soon</dt>
                <dd className="font-medium">{due.length} assignments</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionHeader
            title="Your assigned programs"
            description={`Provided through ${college.shortName}'s ${college.plan} licence.`}
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/campus/courses">
                  All programs <ArrowRight />
                </Link>
              </Button>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {STUDENT_COURSES.map((c) => (
              <CampusProgramCard key={c.id} course={c} progress={STUDENT.progress[c.id] ?? 0} college={college} compact />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Next live class" />
          {NEXT_CLASS ? (
            <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="h-1.5" style={{ backgroundColor: college.brandColor }} />
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <StatusPill tone="brand">{relativeDay(NEXT_CLASS.date)}</StatusPill>
                  <span className="text-xs text-muted-foreground">Batch A · Class {NEXT_CLASS.title.match(/\d+/)?.[0]}</span>
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold">{sessionTopic(NEXT_CLASS.title)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(NEXT_CLASS.date, "EEEE, d MMM")} · {formatTime(NEXT_CLASS.time)} IST · {NEXT_CLASS.durationMin} min
                  </p>
                </div>
                {nextMentor && (
                  <div className="flex items-center gap-2.5">
                    <Portrait avatar={nextMentor.avatar} name={nextMentor.name} className="size-8" />
                    <div className="text-sm leading-tight">
                      <p className="font-medium">{nextMentor.name}</p>
                      <p className="text-xs text-muted-foreground">CDL mentor</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    className="h-9 flex-1"
                    variant="outline"
                    onClick={() => toast.success("Added to your calendar", { description: `${sessionTopic(NEXT_CLASS.title)} · ${formatDayShort(NEXT_CLASS.date)}, ${formatTime(NEXT_CLASS.time)} (simulated)` })}
                  >
                    <CalendarPlus /> Add to calendar
                  </Button>
                  <Button asChild className="h-9 flex-1">
                    <Link href="/campus/sessions">
                      <Video /> Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {MAKEUP_TODAY && (
            <Link href="/campus/sessions" className="flex items-center gap-3 rounded-xl border border-dashed bg-card p-3 text-sm transition hover:bg-muted/50">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Radio className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">Make-up class today, {formatTime(MAKEUP_TODAY.time)}</span>
                <span className="block truncate text-xs text-muted-foreground">Batch B · {sessionTopic(MAKEUP_TODAY.title)} — open to Batch A</span>
              </span>
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-xs lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold md:text-lg">
                <Megaphone className="size-4" style={{ color: college.brandColor }} /> Announcements from the T&amp;P cell
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Training &amp; Placement Cell, {college.name}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {ANNOUNCEMENTS.map((a) => (
              <li
                key={a.id}
                className={cn("rounded-xl border p-4", a.pinned && "border-transparent")}
                style={a.pinned ? { backgroundColor: tint(college.brandColor, 6), boxShadow: `inset 0 0 0 1px ${tint(college.brandColor, 25, "transparent")}` } : undefined}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone={TAG_TONE[a.tag]}>{a.tag}</StatusPill>
                  {a.pinned && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: college.brandColor }}>
                      <Pin className="size-3" /> Pinned
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">{relativeDay(a.date) === "Today" ? "Today" : formatDate(a.date, "d MMM")}</span>
                </div>
                <p className="mt-2 text-sm font-semibold">{a.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <SectionHeader
              title="Assignments due"
              action={
                <Link href="/campus/assignments" className="text-sm font-medium text-primary hover:underline">
                  View all
                </Link>
              }
            />
            <ul className="mt-3 divide-y">
              {due.slice(0, 4).map((a) => (
                <li key={a.id}>
                  <Link href="/campus/assignments" className="group flex items-start gap-3 py-3">
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <ClipboardCheck className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 text-sm font-medium group-hover:text-primary">{a.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {a.provider === "college" ? `${college.shortName} T&P cell` : getCourse(a.courseId)?.title} · due {formatDate(a.dueDate, "d MMM")}
                      </span>
                    </span>
                    <span className={cn("shrink-0 text-xs font-medium", daysUntil(a.dueDate) > 5 ? "text-muted-foreground" : "text-warning")}>
                      {relativeDay(a.dueDate)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <SectionHeader title="Quick links" />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <QuickLink href="/campus/courses" icon={BookOpen} label="My programs" />
              <QuickLink href="/campus/sessions" icon={Video} label="Recordings" />
              <QuickLink href="/campus/progress" icon={TrendingUp} label="My progress" />
              <button
                type="button"
                onClick={() => toast.success("Drive calendar downloaded", { description: `${college.shortName}-campus-drive-2026.pdf (simulated)` })}
                className="flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm font-medium transition hover:bg-muted/60"
              >
                <Download className="size-4 text-muted-foreground" />
                Drive calendar
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: typeof BookOpen; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-start gap-2 rounded-xl border p-3 text-sm font-medium transition hover:bg-muted/60">
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </Link>
  );
}
