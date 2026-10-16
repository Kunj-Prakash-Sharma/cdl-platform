"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Languages,
  Layers,
  MapPin,
  NotebookPen,
  Search,
  Sparkles,
  Target,
  UserRound,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor, getMentorOffer } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatINR, formatNumber, formatTime, relativeDay } from "@/lib/format";
import type { Booking, Mentor, MentoringOffer } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMentors, useMyBookings } from "@/store/hooks";
import { CancelBookingDialog } from "@/components/engagement/cancel-booking-dialog";
import { CALENDAR_TOAST, endTime } from "@/components/engagement/engagement-utils";
import { RescheduleDialog } from "@/components/engagement/reschedule-dialog";
import { FormatBadge, StatusPill } from "@/components/shared/badges";
import { CourseCard, Rating } from "@/components/shared/cards";
import { MentorBookingDialog } from "@/components/shared/mentor-booking-dialog";
import { EmptyState, PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const FOCUS_AREAS: { label: string; match: string[] }[] = [
  { label: "Career clarity", match: ["Career discovery", "Psychometric interpretation", "Stream selection", "Parent guidance"] },
  { label: "Interviews & placements", match: ["Interview preparation", "Campus placements", "HR rounds", "Salary conversations"] },
  { label: "Communication", match: ["Communication", "Public speaking", "Presentation skills", "Voice & body language", "Workplace communication"] },
  { label: "Group discussions", match: ["Group discussions", "Critical thinking", "Case discussions", "Current affairs"] },
  { label: "Resume & branding", match: ["Resume writing", "LinkedIn profiles", "Personal branding", "Cover letters"] },
  { label: "Leadership", match: ["Leadership", "People management", "Executive presence"] },
  { label: "Career transitions", match: ["Career transitions", "Professional readiness", "Productivity"] },
  { label: "Personal growth", match: ["Personality development", "Emotional intelligence", "Etiquette", "Teen development"] },
];

const VALUE_POINTS = [
  { icon: Target, title: "Matched to your goals", text: "Private sessions with an expert who reviews your discovery snapshot and progress first." },
  { icon: NotebookPen, title: "Notes & follow-ups", text: "Every session ends with written notes and a follow-up checklist you can tick off." },
  { icon: Sparkles, title: "Learning that fits", text: "Mentors recommend the exact courses and live sessions to tackle next." },
];

type BookingDialogState = { mentorId?: string; offerId?: string; open: boolean; key: number };

export default function MentoringPage() {
  const myBookings = useMyBookings();
  const mentors = useMentors();
  const activeMentors = useMemo(() => mentors.filter((m) => m.status === "active"), [mentors]);

  const [focus, setFocus] = useState("All");
  const [query, setQuery] = useState("");
  const [bookingDialog, setBookingDialog] = useState<BookingDialogState>({ open: false, key: 0 });
  const [reschedule, setReschedule] = useState<{ id?: string; open: boolean; key: number }>({ open: false, key: 0 });
  const [cancelId, setCancelId] = useState<string>();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const mentoring = myBookings.filter((b) => b.kind === "mentoring");
  const upcoming = mentoring.filter((b) => b.status === "confirmed" && b.date >= DEMO_TODAY);
  const previous = mentoring.filter((b) => b.status === "completed" || (b.status === "confirmed" && b.date < DEMO_TODAY)).reverse();
  const cancelled = mentoring.filter((b) => b.status === "cancelled");
  const mentorsMet = new Set(mentoring.filter((b) => b.status !== "cancelled").map((b) => b.mentorId)).size;

  const programmes = useMemo(
    () => activeMentors.flatMap((m) => m.offers.filter((o) => o.sessions > 1).map((offer) => ({ mentor: m, offer }))),
    [activeMentors],
  );

  const q = query.trim().toLowerCase();
  const area = FOCUS_AREAS.find((f) => f.label === focus);
  const shownMentors = activeMentors.filter(
    (m) =>
      (!area || m.expertise.some((e) => area.match.includes(e))) &&
      (!q || [m.name, m.title, m.headline, ...m.expertise].join(" ").toLowerCase().includes(q)),
  );

  const openBooking = (mentorId: string, offerId?: string) => setBookingDialog((s) => ({ mentorId, offerId, open: true, key: s.key + 1 }));
  const dialogMentor = bookingDialog.mentorId ? activeMentors.find((m) => m.id === bookingDialog.mentorId) : undefined;
  const rescheduleBooking = reschedule.id ? mentoring.find((b) => b.id === reschedule.id) : undefined;
  const cancelBooking = cancelId ? mentoring.find((b) => b.id === cancelId) : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Level 3 · personal guidance"
        title="One-to-One Mentoring"
        description="Book private sessions with expert mentors, revisit their notes and follow-ups, and pick up the learning they recommend."
        actions={
          <Button asChild className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
            <a href="#find-mentor">
              <Search /> Find a mentor
            </a>
          </Button>
        }
      />

      {/* Level 3 value */}
      <section className="relative isolate overflow-hidden rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
        <div className="pointer-events-none absolute -top-20 -right-20 -z-10 size-64 rounded-full bg-brand-soft blur-2xl" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-3">
            <FormatBadge format="mentoring" showLevel />
            <h2 className="font-heading text-xl font-semibold">Why One-to-One Mentoring?</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Self-Paced courses build knowledge and Live Cohorts build practice. One-to-One Mentoring adds a personal expert who looks at{" "}
              <em>your</em> situation — your interests, assessments and goals — and helps you decide, prepare and act.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <MiniStat label="Upcoming" value={upcoming.length} />
              <MiniStat label="Completed" value={mentoring.filter((b) => b.status === "completed").length} />
              <MiniStat label="Mentors" value={mentorsMet} />
            </div>
          </div>
          <ul className="space-y-3">
            {VALUE_POINTS.map((v) => (
              <li key={v.title} className="flex gap-3 rounded-xl bg-muted/50 p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-xs ring-1 ring-border">
                  <v.icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{v.title}</span>
                  <span className="block text-xs text-muted-foreground">{v.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Upcoming */}
      <section className="space-y-3">
        <SectionHeader title="Upcoming sessions" description="Join from here on the day — the link activates automatically." />
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No upcoming mentoring sessions"
            description="Book a session with a mentor to get personalised guidance."
            action={
              <Button asChild>
                <a href="#find-mentor">Find a mentor</a>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcoming.map((b) => (
              <UpcomingCard
                key={b.id}
                booking={b}
                onReschedule={() => setReschedule((s) => ({ id: b.id, open: true, key: s.key + 1 }))}
                onCancel={() => {
                  setCancelId(b.id);
                  setCancelOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Previous */}
      <section className="space-y-3">
        <SectionHeader title="Previous sessions" description="Session notes, follow-up checklists and learning your mentor recommended." />
        {previous.length === 0 ? (
          <EmptyState icon={NotebookPen} title="No completed sessions yet" description="After each session, your mentor's notes and follow-ups will appear here." />
        ) : (
          <div className="space-y-4">
            {previous.map((b) => (
              <PreviousCard
                key={b.id}
                booking={b}
                checked={checked}
                onToggle={(key, value) => setChecked((c) => ({ ...c, [key]: value }))}
                onBookFollowUp={() => openBooking(b.mentorId, b.offerId)}
              />
            ))}
          </div>
        )}
        {cancelled.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {cancelled.length} cancelled session{cancelled.length > 1 ? "s" : ""}:{" "}
            {cancelled.map((b) => `${getMentorOffer(b.offerId ?? "")?.offer.title ?? "Session"} (${formatDate(b.date, "d MMM")})`).join(", ")}
          </p>
        )}
      </section>

      {/* Programmes */}
      {programmes.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Personalised mentoring programmes" description="Multi-session plans with the same mentor — ideal for a focused goal over a few weeks." />
          <div className="grid gap-4 md:grid-cols-3">
            {programmes.map(({ mentor, offer }) => (
              <ProgrammeCard key={offer.id} mentor={mentor} offer={offer} onBook={() => openBooking(mentor.id, offer.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Find a mentor */}
      <section id="find-mentor" className="scroll-mt-20 space-y-4">
        <SectionHeader title="Find a mentor" description={`${activeMentors.length} approved mentors · sessions run on weekday evenings and weekends (IST)`} />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            {["All", ...FOCUS_AREAS.map((f) => f.label)].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setFocus(label)}
                aria-pressed={focus === label}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition",
                  focus === label ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search mentors or skills" className="h-9 bg-background pl-8" aria-label="Search mentors" />
          </div>
        </div>
        {shownMentors.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="No mentors match"
            description="Try another focus area or search term."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setFocus("All");
                  setQuery("");
                }}
              >
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {shownMentors.map((m) => (
              <MentorOfferCard key={m.id} mentor={m} onBook={(offerId) => openBooking(m.id, offerId)} />
            ))}
          </div>
        )}
      </section>

      {dialogMentor && (
        <MentorBookingDialog
          key={bookingDialog.key}
          mentor={dialogMentor}
          defaultOfferId={bookingDialog.offerId}
          open={bookingDialog.open}
          onOpenChange={(open) => setBookingDialog((s) => ({ ...s, open }))}
          mode="instant"
        />
      )}
      <RescheduleDialog key={reschedule.key} booking={rescheduleBooking} open={reschedule.open} onOpenChange={(open) => setReschedule((s) => ({ ...s, open }))} />
      <CancelBookingDialog
        booking={cancelBooking}
        label={getMentorOffer(cancelBooking?.offerId ?? "")?.offer.title ?? "Mentoring session"}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
      />
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background px-3 py-2">
      <p className="font-heading text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function UpcomingCard({ booking, onReschedule, onCancel }: { booking: Booking; onReschedule: () => void; onCancel: () => void }) {
  const mentor = getMentor(booking.mentorId);
  const offer = booking.offerId ? getMentorOffer(booking.offerId)?.offer : undefined;
  const isToday = booking.date === DEMO_TODAY;
  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-5 shadow-xs", isToday && "border-brand/40 ring-1 ring-brand/15")}>
      <div className="flex items-start gap-4">
        {mentor && <Portrait avatar={mentor.avatar} name={mentor.name} className="size-14" rounded="xl" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill tone="success">Confirmed</StatusPill>
            <StatusPill tone={isToday ? "brand" : "neutral"} dot={false}>
              {relativeDay(booking.date)}
            </StatusPill>
          </div>
          <h3 className="mt-1.5 font-heading leading-snug font-semibold">{offer?.title ?? "Mentoring session"}</h3>
          <p className="text-sm text-muted-foreground">
            with {mentor?.name} · {mentor?.title}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">When</p>
          <p className="font-medium">{formatDate(booking.date, "EEE, d MMM")}</p>
          <p className="text-xs text-muted-foreground">
            {formatTime(booking.time)} – {endTime(booking.time, booking.durationMin)} IST
          </p>
        </div>
        <div className="rounded-xl bg-muted/50 px-3 py-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Duration</p>
          <p className="font-medium">{booking.durationMin} minutes</p>
          <p className="text-xs text-muted-foreground">Private video call</p>
        </div>
      </div>
      {booking.topic && (
        <p className="mt-3 text-sm">
          <span className="text-muted-foreground">Focus: </span>
          {booking.topic}
        </p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {isToday ? (
          <Button
            className="bg-brand text-brand-foreground hover:bg-brand/90"
            onClick={() => toast.success("Opening your mentoring room (simulated)", { description: `Private video call with ${mentor?.name}.` })}
          >
            <Video /> Join session
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                <Button variant="outline" disabled>
                  <Video /> Join
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Join opens on {formatDate(booking.date, "EEE, d MMM")}</TooltipContent>
          </Tooltip>
        )}
        <Button variant="outline" onClick={onReschedule}>
          <CalendarClock /> Reschedule
        </Button>
        <Button variant="ghost" size="icon" aria-label="Add to calendar" onClick={() => toast.success(CALENDAR_TOAST.title, { description: CALENDAR_TOAST.description })}>
          <CalendarPlus />
        </Button>
        <Button variant="ghost" className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function PreviousCard({
  booking,
  checked,
  onToggle,
  onBookFollowUp,
}: {
  booking: Booking;
  checked: Record<string, boolean>;
  onToggle: (key: string, value: boolean) => void;
  onBookFollowUp: () => void;
}) {
  const mentor = getMentor(booking.mentorId);
  const offer = booking.offerId ? getMentorOffer(booking.offerId)?.offer : undefined;
  const followUps = booking.followUps ?? [];
  const done = followUps.filter((_, i) => checked[`${booking.id}:${i}`]).length;
  const courses = (booking.recommendedCourseIds ?? []).map((id) => getCourse(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  return (
    <article className="rounded-2xl border bg-card shadow-xs">
      <header className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {mentor && <Portrait avatar={mentor.avatar} name={mentor.name} className="size-12" rounded="xl" />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading font-semibold">{offer?.title ?? "Mentoring session"}</h3>
              <StatusPill tone="success">Completed</StatusPill>
            </div>
            <p className="text-sm text-muted-foreground">
              {mentor?.name} · {formatDate(booking.date, "EEE, d MMM yyyy")} · {booking.durationMin} min
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success("Notes downloaded", { description: "Session notes PDF prepared (simulated)." })}>
            <Download /> Notes
          </Button>
          <Button onClick={onBookFollowUp}>Book a follow-up</Button>
        </div>
      </header>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          {booking.topic && (
            <p className="text-sm">
              <span className="font-medium">Topic: </span>
              <span className="text-muted-foreground">{booking.topic}</span>
            </p>
          )}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <NotebookPen className="size-4 text-primary" /> Session notes
            </h4>
            {booking.notes ? (
              <blockquote className="mt-2 rounded-xl border-l-4 border-primary/40 bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                {booking.notes}
                <footer className="mt-2 text-xs text-muted-foreground">— {mentor?.name}</footer>
              </blockquote>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Your mentor hasn&apos;t shared notes for this session yet.</p>
            )}
          </div>
          {followUps.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="size-4 text-primary" /> Follow-up checklist
                </h4>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {done} of {followUps.length} done
                </span>
              </div>
              <Progress value={(done / followUps.length) * 100} className="mt-2 [&>[data-slot=progress-indicator]]:bg-brand" />
              <ul className="mt-3 space-y-2">
                {followUps.map((item, i) => {
                  const key = `${booking.id}:${i}`;
                  const id = `fu-${booking.id}-${i}`;
                  return (
                    <li key={key} className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
                      <Checkbox id={id} checked={Boolean(checked[key])} onCheckedChange={(v) => onToggle(key, v === true)} className="mt-0.5" />
                      <label htmlFor={id} className={cn("cursor-pointer text-sm", checked[key] && "text-muted-foreground line-through")}>
                        {item}
                      </label>
                    </li>
                  );
                })}
              </ul>
              {done === followUps.length && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <CheckCircle2 className="size-3.5" /> All follow-ups done — great momentum!
                </p>
              )}
            </div>
          )}
        </div>
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="size-4 text-brand" /> Recommended learning
          </h4>
          {courses.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} compact />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No course recommendations for this session.</p>
          )}
        </div>
      </div>
    </article>
  );
}

function ProgrammeCard({ mentor, offer, onBook }: { mentor: Mentor; offer: MentoringOffer; onBook: () => void }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-secondary/80 via-card to-brand-soft/60 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
          <Layers className="size-3.5" /> {offer.sessions}-session programme
        </span>
        <span className="text-xs text-muted-foreground">{offer.durationMin} min each</span>
      </div>
      <h3 className="mt-3 font-heading leading-snug font-semibold">{offer.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
      <div className="mt-4 flex items-center gap-2.5">
        <Portrait avatar={mentor.avatar} name={mentor.name} className="size-8" />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{mentor.name}</p>
          <p className="truncate text-xs text-muted-foreground">{mentor.title}</p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-5">
        <div>
          <p className="font-heading text-xl font-semibold">{formatINR(offer.price)}</p>
          <p className="text-xs text-muted-foreground">≈ {formatINR(Math.round(offer.price / offer.sessions))} per session</p>
        </div>
        <Button onClick={onBook}>
          Start programme <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function MentorOfferCard({ mentor, onBook }: { mentor: Mentor; onBook: (offerId?: string) => void }) {
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-xs transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <Portrait avatar={mentor.avatar} name={mentor.name} className="size-16" rounded="xl" />
        <div className="min-w-0">
          <h3 className="font-heading font-semibold">{mentor.name}</h3>
          <p className="text-sm text-muted-foreground">{mentor.title}</p>
          <Rating value={mentor.rating} count={mentor.reviewCount} className="mt-1" />
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{mentor.headline}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" /> {mentor.experienceYears} yrs
        </span>
        <span className="inline-flex items-center gap-1">
          <Video className="size-3.5" /> {formatNumber(mentor.sessionsDelivered)} sessions
        </span>
        <span className="inline-flex items-center gap-1">
          <Languages className="size-3.5" /> {mentor.languages.join(", ")}
        </span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" /> {mentor.city}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {mentor.expertise.map((e) => (
          <span key={e} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {e}
          </span>
        ))}
      </div>
      <ul className="mt-4 divide-y rounded-xl border">
        {mentor.offers.map((o) => (
          <li key={o.id}>
            <button type="button" onClick={() => onBook(o.id)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/60">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{o.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {o.durationMin} min{o.sessions > 1 ? ` · ${o.sessions} sessions` : ""}
                </span>
              </span>
              <span className="text-sm font-semibold whitespace-nowrap">{formatINR(o.price)}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <Button asChild variant="outline">
          <Link href={`/mentors/${mentor.id}`}>View profile</Link>
        </Button>
        <Button onClick={() => onBook()}>Book a session</Button>
      </div>
    </div>
  );
}
