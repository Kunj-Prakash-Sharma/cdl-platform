"use client";

import Link from "next/link";
import { ArrowRight, Clock, Gift, Pencil, ShieldCheck, UserRoundPen, UserX } from "lucide-react";
import { getCourse } from "@/data";
import { formatINR } from "@/lib/format";
import { GUIDE } from "@/lib/discovery";
import type { LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { LogoMark } from "@/components/brand/logo";
import { FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Button } from "@/components/ui/button";

const appear = "animate-in fade-in-0 slide-in-from-bottom-2 duration-300";

export function GuideAvatar({ className, online }: { className?: string; online?: boolean }) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <LogoMark className="size-full rounded-full" />
      {online && <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-success ring-2 ring-background" aria-hidden="true" />}
    </span>
  );
}

/** Intro card at the top of the conversation. */
export function ChatHero() {
  return (
    <div className="flex flex-col items-center px-2 pt-2 pb-4 text-center">
      <GuideAvatar online className="size-14" />
      <h1 className="mt-3 font-heading text-lg font-semibold sm:text-xl">Free Career Discovery</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        with {GUIDE.name}, your CDL career guide
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs">
        {[
          { icon: Gift, label: "Free" },
          { icon: Clock, label: "About 3 minutes" },
          { icon: UserX, label: "No registration" },
        ].map((b) => (
          <span key={b.label} className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-muted-foreground">
            <b.icon className="size-3.5 text-brand" />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Row wrapper for assistant-side content: avatar on the first message of a group, gutter otherwise. */
export function AssistantRow({ showAvatar, children, wide }: { showAvatar: boolean; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2.5", appear)}>
      <div className={cn("w-8 shrink-0", wide && "hidden sm:block")}>{showAvatar && <GuideAvatar className="size-8" />}</div>
      <div className={cn("min-w-0", wide ? "flex-1" : "max-w-[85%] sm:max-w-[78%]")}>
        {showAvatar && <p className="mb-1 text-xs font-medium text-muted-foreground">{GUIDE.name} · CDL</p>}
        {children}
      </div>
    </div>
  );
}

export function AssistantBubble({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("w-fit rounded-2xl rounded-tl-md border bg-card px-3.5 py-2.5 text-[15px] leading-relaxed shadow-xs", className)}>{children}</div>
  );
}

export function NoteBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-warning/50 bg-warning-soft px-3 py-1 text-xs font-medium text-warning">
      <ShieldCheck className="size-3.5" />
      {children}
    </div>
  );
}

export function VisitorBubble({ children, onEdit, editLabel }: { children: React.ReactNode; onEdit?: () => void; editLabel?: string }) {
  return (
    <div className={cn("group flex items-center justify-end gap-1.5", appear)}>
      {onEdit && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={editLabel ?? "Edit answer"}
          className="text-muted-foreground opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 max-md:hidden"
        >
          <Pencil />
        </Button>
      )}
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-[15px] leading-relaxed text-primary-foreground shadow-xs sm:max-w-[70%]">
        {children}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <AssistantRow showAvatar>
      <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md border bg-card px-4 py-3.5 shadow-xs" role="status" aria-label={`${GUIDE.name} is typing`}>
        {[0, 150, 300].map((d) => (
          <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
    </AssistantRow>
  );
}

export function SystemDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-3 py-1 text-xs text-muted-foreground", appear)}>
      <span className="h-px flex-1 bg-border" />
      {children}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Inline, restrained course suggestion dropped into the conversation. */
export function CourseSuggestion({ lead, courseId, format, reason }: { lead: string; courseId: string; format: LearningFormat; reason: string }) {
  const course = getCourse(courseId);
  if (!course) return null;
  const price = course.pricing[format] ?? 0;
  return (
    <div className="w-full max-w-sm space-y-2">
      <AssistantBubble>{lead}</AssistantBubble>
      <Link
        href={`/courses/${course.id}`}
        className="group flex gap-3 rounded-2xl border bg-card p-2.5 shadow-xs transition hover:border-primary/30 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <CourseThumbnail course={course} size="sm" className="w-24 shrink-0 self-start" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold group-hover:text-primary">{course.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{reason}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <FormatBadge format={format} short className="h-5 px-2 text-[11px]" />
            <span className="text-xs font-semibold">{formatINR(price, { free: true })}</span>
            <ArrowRight className="ml-auto size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
      </Link>
    </div>
  );
}

/** Reminder shown when a visitor says their circumstances changed. */
export function ProfileReminderCard() {
  const isLoggedIn = useDemoStore((s) => s.isLoggedIn);
  return (
    <div className="w-full max-w-sm rounded-2xl border border-info/25 bg-info-soft p-3.5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-info ring-1 ring-info/20">
          <UserRoundPen className="size-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Update your profile</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Changed course, job or goals? Keeping your CDL profile current means your dashboard, mentors and recommendations stay relevant.
          </p>
          <Button asChild size="sm" variant="outline" className="mt-2.5 bg-background">
            <Link href={isLoggedIn ? "/dashboard/profile" : "/login"}>
              {isLoggedIn ? "Update my profile" : "Log in to update"} <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
