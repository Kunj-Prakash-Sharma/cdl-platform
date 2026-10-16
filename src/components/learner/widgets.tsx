"use client";

import Link from "next/link";
import { CalendarClock, MessageCircleQuestion, Presentation, Radio, Video } from "lucide-react";
import { getCourse, getMentor } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatTime, relativeDay } from "@/lib/format";
import type { LiveSession } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Portrait } from "@/components/shared/portrait";
import { Progress } from "@/components/ui/progress";

/** Teal progress bar used for every learning-progress indicator in My Self. */
export function TealProgress({ value, className }: { value: number; className?: string }) {
  return <Progress value={value} className={cn("h-1.5 [&>[data-slot=progress-indicator]]:bg-brand", className)} aria-label={`${value}% complete`} />;
}

/** Circular meter (profile completion, readiness). */
export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  className,
  children,
  tone = "brand",
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  children?: React.ReactNode;
  tone?: "brand" | "primary" | "white";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = tone === "brand" ? "var(--brand)" : tone === "primary" ? "var(--primary)" : "white";
  const track = tone === "white" ? "rgba(255,255,255,0.18)" : "var(--muted)";
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.max(0, Math.min(100, value)) / 100) * c}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children ?? <span className="font-heading text-sm font-semibold tabular-nums">{value}%</span>}</div>
    </div>
  );
}

const SESSION_TYPE: Record<LiveSession["type"], { label: string; icon: typeof Radio }> = {
  "cohort-class": { label: "Cohort class", icon: Radio },
  "doubt-clearing": { label: "Doubt-clearing", icon: MessageCircleQuestion },
  workshop: { label: "Workshop", icon: Presentation },
  webinar: { label: "Webinar", icon: Video },
};

/** Date tile + details row for an upcoming live session. */
export function SessionRow({ session, booked, className }: { session: LiveSession; booked?: boolean; className?: string }) {
  const mentor = getMentor(session.mentorId);
  const course = getCourse(session.courseId);
  const type = SESSION_TYPE[session.type];
  const isToday = session.date === DEMO_TODAY;
  return (
    <Link
      href="/dashboard/sessions"
      className={cn(
        "group flex items-start gap-3 rounded-xl border bg-card p-3 transition hover:border-primary/25 hover:shadow-xs focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <div className={cn("flex w-12 shrink-0 flex-col items-center rounded-lg py-1.5 text-center", isToday ? "bg-brand text-brand-foreground" : "bg-secondary text-primary")}>
        <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">{formatDate(session.date, "MMM")}</span>
        <span className="font-heading text-lg leading-none font-semibold">{formatDate(session.date, "d")}</span>
        <span className="mt-0.5 text-[10px] font-medium opacity-80">{formatDate(session.date, "EEE")}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1 text-[11px] font-semibold", session.type === "cohort-class" ? "text-brand" : "text-info")}>
          <type.icon className="size-3" />
          {type.label}
          {booked && <span className="font-medium text-success">· Seat reserved</span>}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-snug font-medium group-hover:text-primary">{session.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{course?.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarClock className="size-3.5" />
            {relativeDay(session.date)} · {formatTime(session.time)} IST
          </span>
          {mentor && (
            <span className="inline-flex items-center gap-1.5">
              <Portrait avatar={mentor.avatar} name={mentor.name} className="size-4" />
              {mentor.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Small "Arjun's" style label used in parent mode. */
export function OwnerTag({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "brand" }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-semibold",
        tone === "primary" ? "bg-secondary text-primary" : "bg-brand-soft text-brand",
      )}
    >
      {children}
    </span>
  );
}
