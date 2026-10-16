"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CirclePlay, FileArchive, FileSpreadsheet, FileText, ListChecks, Lock, Presentation, Star, BookOpenText } from "lucide-react";
import { courseDurationSec, courseLessons, resources } from "@/data";
import { STAGE_META } from "@/data/constants";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import type { Course, Lesson, Mentor, Resource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoBadge } from "@/components/shared/badges";
import { Rating } from "@/components/shared/cards";
import { Portrait } from "@/components/shared/portrait";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="font-heading text-2xl font-bold tracking-tight">{children}</h2>
      {aside}
    </div>
  );
}

const LESSON_ICON = { video: CirclePlay, reading: BookOpenText, quiz: ListChecks } as const;

export function Curriculum({ course, unlocked, onPreview }: { course: Course; unlocked: boolean; onPreview: (lesson: Lesson) => void }) {
  const [open, setOpen] = useState<string[]>([course.chapters[0]?.id].filter(Boolean) as string[]);
  const lessons = courseLessons(course);
  const allOpen = open.length === course.chapters.length;
  return (
    <section id="curriculum" className="scroll-mt-32">
      <SectionTitle
        aside={
          <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setOpen(allOpen ? [] : course.chapters.map((c) => c.id))}>
            {allOpen ? "Collapse all" : "Expand all"}
          </Button>
        }
      >
        Curriculum
      </SectionTitle>
      <p className="-mt-3 mb-4 text-sm text-muted-foreground">
        {course.chapters.length} chapters · {lessons.length} lessons · {formatDuration(courseDurationSec(course))} total
      </p>
      <Accordion type="multiple" value={open} onValueChange={setOpen} className="overflow-hidden rounded-2xl border bg-card">
        {course.chapters.map((chapter, ci) => (
          <AccordionItem key={chapter.id} value={chapter.id} className="border-b last:border-b-0">
            <AccordionTrigger className="rounded-none bg-muted/40 px-5 py-4 hover:no-underline">
              <span className="flex flex-1 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 pr-3">
                <span className="font-heading text-[15px] font-semibold">
                  <span className="mr-2 text-muted-foreground">{String(ci + 1).padStart(2, "0")}</span>
                  {chapter.title}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {chapter.lessons.length} lessons · {formatDuration(chapter.lessons.reduce((s, l) => s + l.durationSec, 0))}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-0">
              <ul className="divide-y">
                {chapter.lessons.map((lesson) => {
                  const Icon = LESSON_ICON[lesson.kind];
                  return (
                    <li key={lesson.id} className="flex items-center gap-3 px-5 py-3">
                      <Icon className={cn("size-4 shrink-0", lesson.preview ? "text-brand" : "text-muted-foreground")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{lesson.title}</span>
                        {lesson.summary && <span className="block truncate text-xs text-muted-foreground">{lesson.summary}</span>}
                      </span>
                      {lesson.preview ? (
                        <Button variant="outline" size="sm" className="h-7 border-brand/30 text-brand hover:bg-brand-soft hover:text-brand" onClick={() => onPreview(lesson)}>
                          <CirclePlay /> Preview
                        </Button>
                      ) : (
                        !unlocked && <Lock className="size-3.5 text-muted-foreground/60" aria-label="Unlocks after enrolment" />
                      )}
                      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{Math.round(lesson.durationSec / 60)} min</span>
                    </li>
                  );
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

const FILE_ICON: Record<Resource["fileType"], React.ComponentType<{ className?: string }>> = {
  PDF: FileText,
  DOCX: FileText,
  XLSX: FileSpreadsheet,
  PPTX: Presentation,
  ZIP: FileArchive,
};

export function Included({ course, unlocked }: { course: Course; unlocked: boolean }) {
  const files = resources.filter((r) => r.courseId === course.id);
  return (
    <section id="included" className="scroll-mt-32">
      <SectionTitle>What&apos;s included</SectionTitle>
      <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {course.includes.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <ArrowRight className="size-3" />
            </span>
            {item}
          </li>
        ))}
      </ul>
      {files.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {files.map((r) => {
            const Icon = FILE_ICON[r.fileType];
            return (
              <div key={r.id} className="flex gap-3 rounded-xl border bg-card p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{r.description}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-px font-medium">{r.fileType}</span>
                    {r.sizeKb >= 1000 ? `${(r.sizeKb / 1024).toFixed(1)} MB` : `${r.sizeKb} KB`}
                    {unlocked ? (
                      <Link href="/dashboard/resources" className="ml-auto font-medium text-primary hover:underline">
                        Open in dashboard
                      </Link>
                    ) : (
                      <span className="ml-auto inline-flex items-center gap-1">
                        <Lock className="size-3" /> After enrolment
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function InstructorCard({ mentor, onBook }: { mentor: Mentor; onBook?: () => void }) {
  return (
    <section id="instructor" className="scroll-mt-32">
      <SectionTitle>Your instructor</SectionTitle>
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <Portrait avatar={mentor.avatar} name={mentor.name} className="size-24" rounded="xl" />
          <div className="min-w-0 flex-1">
            <Link href={`/mentors/${mentor.id}`} className="font-heading text-xl font-bold hover:text-primary">
              {mentor.name}
            </Link>
            <p className="text-sm text-muted-foreground">{mentor.title}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <Rating value={mentor.rating} count={mentor.reviewCount} />
              <span>{formatNumber(mentor.sessionsDelivered)} sessions delivered</span>
              <span>{mentor.experienceYears} years experience</span>
              <span>{mentor.languages.join(", ")}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{mentor.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild variant="outline" className="h-9">
                <Link href={`/mentors/${mentor.id}`}>View full profile</Link>
              </Button>
              {onBook && (
                <Button variant="ghost" className="h-9" onClick={onBook}>
                  Book a 1:1 session
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function distribution(rating: number) {
  const five = Math.round(Math.min(90, Math.max(40, (rating - 3.9) * 80)));
  const four = Math.round((100 - five) * 0.72);
  const three = Math.round((100 - five - four) * 0.65);
  const two = Math.round((100 - five - four - three) * 0.6);
  const one = Math.max(0, 100 - five - four - three - two);
  return [five, four, three, two, one];
}

export function Reviews({ course }: { course: Course }) {
  const dist = distribution(course.rating);
  return (
    <section id="reviews" className="scroll-mt-32">
      <SectionTitle aside={<DemoBadge>Sample reviews</DemoBadge>}>Learner reviews</SectionTitle>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="rounded-2xl border bg-card p-5">
          <p className="font-heading text-5xl font-bold tracking-tight">{course.rating.toFixed(1)}</p>
          <div className="mt-2 flex gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={cn("size-4", n <= Math.round(course.rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            ))}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{formatNumber(course.reviewCount)} ratings</p>
          <div className="mt-5 space-y-1.5">
            {dist.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted-foreground">{5 - i}</span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-amber-400" style={{ width: `${p}%` }} />
                </span>
                <span className="w-8 text-right text-muted-foreground tabular-nums">{p}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          {course.reviews.map((r) => (
            <figure key={r.name} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <Portrait name={r.name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {STAGE_META[r.stage].label} · {formatDate(r.date)}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={cn("size-3.5", n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                  ))}
                </div>
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed">{r.text}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
