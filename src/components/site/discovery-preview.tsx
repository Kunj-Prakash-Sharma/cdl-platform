import { CalendarCheck, SendHorizontal, Sparkles } from "lucide-react";
import { getCohort, getCourse, getMentor } from "@/data";
import { cn } from "@/lib/utils";
import { FormatBadge } from "@/components/shared/badges";
import { Rating } from "@/components/shared/cards";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait } from "@/components/shared/portrait";
import { seatsLeft } from "./commerce";

function Bubble({ from, children, className }: { from: "assistant" | "visitor"; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex", from === "visitor" && "justify-end")}>
      <p
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          from === "assistant" ? "rounded-tl-md bg-muted text-foreground" : "rounded-tr-md bg-primary text-primary-foreground",
          className,
        )}
      >
        {children}
      </p>
    </div>
  );
}

/** Static preview of the free discovery conversation, built from real UI pieces (no images). */
export function ChatPreview({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xl shadow-primary/5", className)}>
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-brand text-white">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Career Discovery</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" /> Free · about 5 minutes
          </p>
        </div>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Step 5 of 9</span>
      </div>
      <div className="h-1 bg-muted">
        <div className="h-full w-[55%] rounded-r-full bg-brand" />
      </div>
      <div className="space-y-3 p-4">
        {!compact && <Bubble from="assistant">Hi Riya! Which of these best describes where you are right now?</Bubble>}
        {!compact && <Bubble from="visitor">College student — final year BBA</Bubble>}
        <Bubble from="assistant">Nice. What kind of work energises you most? Pick as many as you like.</Bubble>
        <div className="flex flex-wrap gap-1.5 pl-1">
          {[
            { label: "Talking to people", on: true },
            { label: "Leading a team", on: true },
            { label: "Solving puzzles", on: false },
            { label: "Creating things", on: false },
          ].map((c) => (
            <span
              key={c.label}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                c.on ? "border-brand/40 bg-brand-soft text-brand" : "bg-background text-muted-foreground",
              )}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <span className="flex h-9 flex-1 items-center rounded-lg bg-muted px-3 text-[13px] text-muted-foreground">Or type your own answer…</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-brand-foreground">
          <SendHorizontal className="size-4" />
        </span>
      </div>
    </div>
  );
}

const SNAPSHOT = [
  { label: "People & persuasion", value: 82, tone: "bg-brand" },
  { label: "Communication", value: 76, tone: "bg-brand" },
  { label: "Leadership", value: 64, tone: "bg-primary/70" },
  { label: "Analytical thinking", value: 48, tone: "bg-primary/40" },
];

export function SnapshotPreview({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border bg-card p-4 text-card-foreground shadow-xl shadow-primary/5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-sm font-semibold">Career snapshot</p>
        <span className="rounded-full border border-dashed border-warning/50 bg-warning-soft px-2 py-0.5 text-[10px] font-medium text-warning">Sample</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Top interest areas</p>
      <div className="mt-3 space-y-2.5">
        {SNAPSHOT.map((s) => (
          <div key={s.label}>
            <div className="flex justify-between text-xs">
              <span className="font-medium">{s.label}</span>
              <span className="text-muted-foreground tabular-nums">{s.value}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted">
              <div className={cn("h-full rounded-full", s.tone)} style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-brand-soft p-3 text-xs">
        <p className="font-semibold text-brand">Suggested next step</p>
        <p className="mt-0.5 text-foreground">Group Discussion Mastery · Live Cohort</p>
      </div>
    </div>
  );
}

function CourseMini({ className }: { className?: string }) {
  const course = getCourse("group-discussion-mastery")!;
  const cohort = getCohort("coh-gdm-oct")!;
  const mentor = getMentor(course.instructorId)!;
  return (
    <div className={cn("rounded-2xl border bg-card p-2 text-card-foreground shadow-xl shadow-primary/5", className)}>
      <CourseThumbnail course={course} />
      <div className="space-y-2.5 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <FormatBadge format="live-cohort" short />
          <Rating value={course.rating} />
        </div>
        <p className="text-xs text-muted-foreground">{cohort.scheduleLabel}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-6" />
            <span className="truncate text-xs font-medium">{mentor.name}</span>
          </span>
          <span className="shrink-0 text-[11px] font-medium text-warning">{seatsLeft(cohort)} seats left</span>
        </div>
      </div>
    </div>
  );
}

function BookedChip() {
  const mentor = getMentor("m-arjun")!;
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card py-2.5 pr-4 pl-2.5 shadow-xl shadow-primary/10">
      <Portrait avatar={mentor.avatar} name={mentor.name} className="size-9" rounded="xl" />
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <CalendarCheck className="size-3.5 text-success" /> Mock interview booked
        </p>
        <p className="text-[11px] text-muted-foreground">with {mentor.name} · Mon, 7:00 PM</p>
      </div>
    </div>
  );
}

/** Hero visual: discovery chat + snapshot + course card, composed from product UI. */
export function HeroCollage() {
  return (
    <div className="relative isolate mx-auto w-full max-w-xl lg:max-w-none" aria-label="Preview of the CDL experience">
      <div className="pointer-events-none absolute inset-x-6 top-10 bottom-6 -z-10 rounded-[48px] bg-gradient-to-br from-brand/20 via-primary/10 to-transparent blur-2xl" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="relative">
          <ChatPreview />
          <div className="relative z-10 -mt-5 ml-6 hidden w-fit lg:block">
            <BookedChip />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-1">
          <SnapshotPreview />
          <CourseMini className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
}
