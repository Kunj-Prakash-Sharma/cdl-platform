"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { ArrowRight, CalendarDays, CalendarPlus, CalendarRange, Clapperboard, ListFilter, PlayCircle, Radio, UserRound, Video, X } from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor, getMentorOffer } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatTime } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { CancelBookingDialog } from "@/components/engagement/cancel-booking-dialog";
import { endTime, SESSION_TYPE_META, SESSION_TYPES, startsIn } from "@/components/engagement/engagement-utils";
import { RecordingDialog } from "@/components/engagement/recording-dialog";
import { SessionBookingDialog } from "@/components/engagement/session-booking-dialog";
import { RecordingTile, SessionRow, SessionTile, type SessionActions } from "@/components/engagement/session-card";
import { SessionDetailSheet, type DetailTarget } from "@/components/engagement/session-detail-sheet";
import { SessionTypeBadge } from "@/components/engagement/session-bits";
import { useSessionsModel, type SessionEntry } from "@/components/engagement/use-sessions";
import { EmptyState, PageHeader, SectionHeader, StatCard } from "@/components/shared/page-header";
import { MonthCalendar, type CalendarEvent } from "@/components/shared/month-calendar";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Filters = { mentor: string; course: string; type: string };
const NO_FILTERS: Filters = { mentor: "all", course: "all", type: "all" };

type DetailRef = { kind: "session"; id: string } | { kind: "mentoring"; id: string };

const LEGEND: { label: string; className: string }[] = [
  { label: "Cohort class", className: "bg-secondary border-primary/40" },
  { label: "Booked session", className: "bg-brand-soft border-brand/40" },
  { label: "1:1 mentoring", className: "bg-info-soft border-info/40" },
  { label: "Open to book", className: "bg-muted border-border" },
];

export default function LiveSessionsPage() {
  const model = useSessionsModel();
  const allBookings = useDemoStore((s) => s.bookings);
  const addNotification = useDemoStore((s) => s.addNotification);

  const [tab, setTab] = useState("upcoming");
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [detailRef, setDetailRef] = useState<DetailRef | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [booking, setBooking] = useState<{ open: boolean; sessionId?: string; key: number }>({ open: false, key: 0 });
  const [recordingId, setRecordingId] = useState<string>();
  const [cancelTarget, setCancelTarget] = useState<{ booking: Booking; label: string } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [waitlisted, setWaitlisted] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);

  const matches = (e: SessionEntry) =>
    (filters.mentor === "all" || e.session.mentorId === filters.mentor) &&
    (filters.course === "all" || e.session.courseId === filters.course) &&
    (filters.type === "all" || e.session.type === filters.type);
  const filtersActive = filters.mentor !== "all" || filters.course !== "all" || filters.type !== "all";

  const upcoming = model.upcoming.filter(matches);
  const recordings = model.recordings.filter(matches);
  const bookable = model.bookable.filter(matches);
  const todays = upcoming.filter((e) => e.isToday);
  const hero = todays[0];
  const weekEnd = format(addDays(parseISO(DEMO_TODAY), 7), "yyyy-MM-dd");
  const rest = upcoming.filter((e) => e !== hero);
  const thisWeek = rest.filter((e) => e.session.date < weekEnd);
  const later = rest.filter((e) => e.session.date >= weekEnd);

  const relevant = useMemo(() => [...model.upcoming, ...model.recordings, ...model.bookable], [model]);
  const mentorOptions = useMemo(
    () => Array.from(new Set(relevant.map((e) => e.session.mentorId))).map((id) => getMentor(id)!).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name)),
    [relevant],
  );
  const courseOptions = useMemo(
    () => Array.from(new Set(relevant.map((e) => e.session.courseId))).map((id) => getCourse(id)!).filter(Boolean).sort((a, b) => a.title.localeCompare(b.title)),
    [relevant],
  );

  // ---------- Actions shared by cards, sheet and calendar ----------
  const openDetails = (id: string) => {
    setDetailRef({ kind: "session", id });
    setDetailOpen(true);
  };
  const actions: SessionActions = {
    openDetails,
    book: (id) => {
      const entry = model.byId.get(id);
      if (entry?.booking) return openDetails(id);
      setDetailOpen(false);
      setBooking((b) => ({ open: true, sessionId: id, key: b.key + 1 }));
    },
    join: (id) => {
      const entry = model.byId.get(id);
      toast.success("Opening live classroom (simulated)", {
        description: entry ? `${entry.session.title} — in the full product this opens the live classroom in a new tab.` : undefined,
      });
    },
    waitlist: (id) => {
      const entry = model.byId.get(id);
      if (waitlisted.includes(id) || !entry) return;
      setWaitlisted((w) => [...w, id]);
      addNotification({
        kind: "session",
        title: "You're on the waitlist",
        body: `${entry.session.title} · ${formatDate(entry.session.date, "EEE, d MMM")}. We'll notify you if a seat opens up.`,
        href: "/dashboard/sessions",
      });
      toast.success("Added to the waitlist", { description: "We'll notify you if a seat opens up." });
    },
    isWaitlisted: (id) => waitlisted.includes(id),
    watch: (id) => {
      setDetailOpen(false);
      setRecordingId(id);
    },
  };

  const detail: DetailTarget | null = useMemo(() => {
    if (!detailRef) return null;
    if (detailRef.kind === "session") {
      const entry = model.byId.get(detailRef.id);
      return entry ? { kind: "session", entry } : null;
    }
    const b = allBookings.find((x) => x.id === detailRef.id);
    return b ? { kind: "mentoring", booking: b } : null;
  }, [detailRef, model, allBookings]);

  const openBookingFlow = () => setBooking((b) => ({ open: true, sessionId: undefined, key: b.key + 1 }));
  const askCancel = (b: Booking, label: string) => {
    setCancelTarget({ booking: b, label });
    setCancelOpen(true);
  };

  // ---------- Calendar ----------
  const events: CalendarEvent[] = (() => {
    const list: CalendarEvent[] = [];
    for (const e of model.entries) {
      if (!matches(e)) continue;
      if (e.mine && e.session.status !== "cancelled") {
        list.push({ id: `s:${e.session.id}`, date: e.session.date, time: e.session.time, title: e.session.title.replace(/^Class (\d+): /, "C$1 · "), tone: e.booking ? "brand" : "primary" });
      } else if (e.open && !e.isPast && e.session.status === "scheduled") {
        list.push({ id: `s:${e.session.id}`, date: e.session.date, time: e.session.time, title: e.session.title, tone: "muted" });
      }
    }
    if (filters.type === "all" && filters.course === "all") {
      for (const b of model.mentoring) {
        if (filters.mentor !== "all" && b.mentorId !== filters.mentor) continue;
        const offer = b.offerId ? getMentorOffer(b.offerId)?.offer : undefined;
        list.push({ id: `m:${b.id}`, date: b.date, time: b.time, title: `1:1 · ${offer?.title ?? "Mentoring"}`, tone: "info" });
      }
    }
    return list;
  })();

  const onEventClick = (id: string) => {
    const [kind, ref] = [id.slice(0, 1), id.slice(2)];
    if (kind === "m") setDetailRef({ kind: "mentoring", id: ref });
    else setDetailRef({ kind: "session", id: ref });
    setDetailOpen(true);
  };
  const dayEvents = events.filter((e) => e.date === selectedDate).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));

  const recordingEntry = recordingId ? model.byId.get(recordingId) : undefined;
  const pastCohortClasses = model.entries.filter((e) => e.inCohort && e.isPast);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Live learning"
        title="Live Sessions"
        description="Your cohort classes, booked doubt-clearing hours, workshops and webinars — with recordings of everything you've missed. All times are in IST."
        actions={
          <>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => toast.success("Calendar feed copied", { description: "Subscribe in Google or Outlook Calendar to see your sessions (simulated)." })}
            >
              <CalendarPlus /> Sync calendar
            </Button>
            <Button className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90" onClick={openBookingFlow}>
              <CalendarDays /> Book a session
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upcoming sessions" value={model.upcoming.length} icon={CalendarDays} hint="Cohort classes + bookings" />
        <StatCard
          label="Booked seats"
          value={model.upcoming.filter((e) => e.booking).length}
          icon={CalendarRange}
          accent="brand"
          hint="Doubt-clearing, workshops, webinars"
        />
        <StatCard label="Recordings available" value={model.recordings.length} icon={Clapperboard} accent="info" hint="Watch anytime" />
        <StatCard
          label="Classes held so far"
          value={pastCohortClasses.length}
          icon={Radio}
          accent="success"
          hint={model.cohorts.length ? model.cohorts.map((c) => c.scheduleLabel).join(" · ") : "Join a Live Cohort"}
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <TabsList className="scrollbar-none h-10! w-full justify-start overflow-x-auto sm:w-fit">
            <TabsTrigger value="upcoming" className="px-3">
              Upcoming <Count n={model.upcoming.length} />
            </TabsTrigger>
            <TabsTrigger value="calendar" className="px-3">
              Calendar
            </TabsTrigger>
            <TabsTrigger value="recordings" className="px-3">
              Recordings <Count n={model.recordings.length} />
            </TabsTrigger>
            <TabsTrigger value="browse" className="px-3">
              Browse &amp; book <Count n={model.bookable.length} />
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <ListFilter className="size-3.5" /> Filter
            </span>
            <Select value={filters.mentor} onValueChange={(v) => setFilters((f) => ({ ...f, mentor: v }))}>
              <SelectTrigger className="h-9 w-[calc(50%-4px)] bg-background sm:w-44" aria-label="Filter by instructor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All instructors</SelectItem>
                {mentorOptions.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.course} onValueChange={(v) => setFilters((f) => ({ ...f, course: v }))}>
              <SelectTrigger className="h-9 w-[calc(50%-4px)] bg-background sm:w-48" aria-label="Filter by programme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programmes</SelectItem>
                {courseOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={(v) => setFilters((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="h-9 w-[calc(50%-4px)] bg-background sm:w-40" aria-label="Filter by session type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All session types</SelectItem>
                {SESSION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {SESSION_TYPE_META[t].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filtersActive && (
              <Button variant="ghost" className="h-9" onClick={() => setFilters(NO_FILTERS)}>
                <X /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* ---------------- Upcoming ---------------- */}
        <TabsContent value="upcoming">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              {hero && <TodayHero entry={hero} actions={actions} />}

              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title={filtersActive ? "No sessions match these filters" : "No upcoming sessions"}
                  description={
                    filtersActive ? "Try clearing a filter to see all your sessions." : "Book a doubt-clearing hour, workshop or webinar to see it here."
                  }
                  action={
                    filtersActive ? (
                      <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button onClick={() => setTab("browse")}>Browse sessions</Button>
                    )
                  }
                />
              ) : (
                <>
                  {thisWeek.length > 0 && (
                    <section className="space-y-3">
                      <SectionHeader title="Next 7 days" description={`${thisWeek.length} session${thisWeek.length > 1 ? "s" : ""}`} />
                      {thisWeek.map((e) => (
                        <SessionRow key={e.session.id} entry={e} actions={actions} />
                      ))}
                    </section>
                  )}
                  {later.length > 0 && (
                    <section className="space-y-3">
                      <SectionHeader title="Later" description={`${later.length} session${later.length > 1 ? "s" : ""}`} />
                      {later.map((e) => (
                        <SessionRow key={e.session.id} entry={e} actions={actions} />
                      ))}
                    </section>
                  )}
                </>
              )}
            </div>

            <aside className="space-y-4">
              <CohortPanel model={model} />
              <MentoringPanel bookings={model.mentoring} onOpen={(id) => onEventClick(`m:${id}`)} />
              <div className="rounded-2xl border bg-card p-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
                    <PlayCircle className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Missed a class?</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Recordings are added within 24 hours of every live session.</p>
                    <Button variant="link" className="mt-1 h-auto px-0" onClick={() => setTab("recordings")}>
                      Watch recordings <ArrowRight />
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        {/* ---------------- Calendar ---------------- */}
        <TabsContent value="calendar" className="space-y-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            {LEGEND.map((l) => (
              <span key={l.label} className="inline-flex items-center gap-1.5">
                <span className={cn("size-3 rounded-sm border-l-2", l.className)} /> {l.label}
              </span>
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <MonthCalendar events={events} onEventClick={onEventClick} onDayClick={setSelectedDate} selectedDate={selectedDate} />
            <div className="rounded-xl border bg-card p-4 shadow-xs">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {selectedDate === DEMO_TODAY ? "Today" : formatDate(selectedDate, "EEEE")}
              </p>
              <h3 className="font-heading text-lg font-semibold">{formatDate(selectedDate, "d MMMM yyyy")}</h3>
              <div className="mt-4 space-y-2">
                {dayEvents.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">Nothing scheduled on this day.</p>
                    <Button variant="link" className="mt-1 h-auto" onClick={() => setTab("browse")}>
                      Browse open sessions
                    </Button>
                  </div>
                ) : (
                  dayEvents.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onEventClick(ev.id)}
                      className="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/60"
                    >
                      <span
                        className={cn(
                          "mt-1 size-2.5 shrink-0 rounded-full",
                          ev.tone === "brand" && "bg-brand",
                          ev.tone === "primary" && "bg-primary",
                          ev.tone === "info" && "bg-info",
                          ev.tone === "muted" && "bg-muted-foreground/40",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-muted-foreground">{ev.time ? formatTime(ev.time) : ""} IST</span>
                        <span className="block text-sm leading-snug font-medium">{ev.title}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Tip: click any day or event. On mobile, dots mark days with sessions.</p>
            </div>
          </div>
        </TabsContent>

        {/* ---------------- Recordings ---------------- */}
        <TabsContent value="recordings" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Past classes from your cohorts and recorded open sessions. Recordings stay available for 6 months after your cohort ends.
          </p>
          {recordings.length === 0 ? (
            <EmptyState
              icon={Clapperboard}
              title="No recordings yet"
              description={filtersActive ? "No recordings match these filters." : "Recordings of your live classes will appear here within 24 hours."}
              action={
                filtersActive ? (
                  <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recordings.map((e) => (
                <RecordingTile key={e.session.id} entry={e} onWatch={() => setRecordingId(e.session.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ---------------- Browse & book ---------------- */}
        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading font-semibold">Open sessions anyone can book</p>
              <p className="text-sm text-muted-foreground">Doubt-clearing hours, hands-on workshops and expert webinars — free for CDL learners.</p>
            </div>
            <Button className="h-9 shrink-0" onClick={openBookingFlow}>
              Guided booking <ArrowRight />
            </Button>
          </div>
          {bookable.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No open sessions match"
              description="Try a different instructor, programme or session type."
              action={
                <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {bookable.map((e) => (
                <SessionTile key={e.session.id} entry={e} actions={actions} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <SessionDetailSheet target={detail} open={detailOpen && Boolean(detail)} onOpenChange={setDetailOpen} actions={actions} onCancel={askCancel} />

      <SessionBookingDialog
        key={booking.key}
        open={booking.open}
        onOpenChange={(open) => setBooking((b) => ({ ...b, open }))}
        bookable={model.bookable}
        initialSessionId={booking.sessionId}
        onViewUpcoming={() => {
          setFilters(NO_FILTERS);
          setTab("upcoming");
        }}
        onWaitlist={actions.waitlist}
        isWaitlisted={actions.isWaitlisted}
      />

      <RecordingDialog entry={recordingEntry} open={Boolean(recordingId)} onOpenChange={(o) => !o && setRecordingId(undefined)} />

      <CancelBookingDialog
        booking={cancelTarget?.booking}
        label={cancelTarget?.label ?? ""}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancelled={() => setDetailOpen(false)}
      />
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="rounded-full bg-muted-foreground/10 px-1.5 text-[11px] leading-4 font-semibold tabular-nums text-muted-foreground">{n}</span>;
}

function TodayHero({ entry, actions }: { entry: SessionEntry; actions: SessionActions }) {
  const s = entry.session;
  const mentor = getMentor(s.mentorId);
  const course = getCourse(s.courseId);
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-navy p-5 text-navy-foreground shadow-md sm:p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-[0.12]" />
      <div className="pointer-events-none absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-brand/35 blur-3xl" />
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
                <span className="relative inline-flex size-2 rounded-full bg-white" />
              </span>
              Live today
            </span>
            <SessionTypeBadge type={s.type} className="bg-white/90" />
          </div>
          <h2 className="font-heading text-xl leading-snug font-semibold text-white sm:text-2xl">{s.title}</h2>
          <p className="text-sm text-white/70">
            {course?.title} · {formatTime(s.time)} – {endTime(s.time, s.durationMin)} IST · <span className="font-medium text-white">{startsIn(s.date, s.time)}</span>
          </p>
          {mentor && (
            <div className="flex items-center gap-2 pt-1">
              <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
              <span className="text-sm text-white/85">with {mentor.name}</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="outline" className="h-10 border-white/25 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white" onClick={() => actions.openDetails(s.id)}>
            Details
          </Button>
          <Button className="h-10 bg-brand px-5 text-brand-foreground hover:bg-brand/90" onClick={() => actions.join(s.id)}>
            <Video /> Join live class
          </Button>
        </div>
      </div>
    </div>
  );
}

function CohortPanel({ model }: { model: ReturnType<typeof useSessionsModel> }) {
  if (!model.cohorts.length) {
    return (
      <div className="rounded-2xl border bg-card p-4 shadow-xs">
        <p className="text-sm font-semibold">No Live Cohort yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Upgrade a Self-Paced course to Live Cohort for scheduled evening classes with a mentor and peers.</p>
        <Button asChild variant="link" className="mt-1 h-auto px-0">
          <Link href="/dashboard/learning">
            See my courses <ArrowRight />
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {model.cohorts.map((c) => {
        const sessions = model.entries.filter((e) => e.session.cohortId === c.id && e.session.type === "cohort-class");
        const list = sessions.length ? sessions : model.entries.filter((e) => e.session.cohortId === c.id);
        const done = list.filter((e) => e.isPast).length;
        const next = list.find((e) => !e.isPast);
        const mentor = getMentor(c.mentorId);
        return (
          <div key={c.id} className="rounded-2xl border bg-card p-4 shadow-xs">
            <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">My Live Cohort</p>
            <p className="mt-1 text-sm leading-snug font-semibold">{c.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {c.scheduleLabel} · {formatDate(c.startDate, "d MMM")} – {formatDate(c.endDate, "d MMM")}
            </p>
            {mentor && (
              <div className="mt-3 flex items-center gap-2">
                <Portrait avatar={mentor.avatar} name={mentor.name} className="size-6" />
                <span className="text-xs text-muted-foreground">{mentor.name}</span>
              </div>
            )}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sessions held</span>
                <span className="font-medium tabular-nums">
                  {done} of {list.length}
                </span>
              </div>
              <Progress value={list.length ? (done / list.length) * 100 : 0} className="[&>[data-slot=progress-indicator]]:bg-brand" />
            </div>
            {next && (
              <p className="mt-3 rounded-lg bg-muted/60 px-2.5 py-2 text-xs">
                <span className="text-muted-foreground">Next: </span>
                <span className="font-medium">{next.session.title}</span>
                <span className="text-muted-foreground"> · {next.isToday ? "Today" : formatDate(next.session.date, "EEE d MMM")}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MentoringPanel({ bookings, onOpen }: { bookings: Booking[]; onOpen: (id: string) => void }) {
  const upcoming = bookings.filter((b) => b.status === "confirmed" && b.date >= DEMO_TODAY);
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">1:1 mentoring</p>
        <Link href="/dashboard/mentoring" className="text-xs font-medium text-primary hover:underline">
          Manage
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No upcoming mentoring sessions.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {upcoming.map((b) => {
            const mentor = getMentor(b.mentorId);
            const offer = b.offerId ? getMentorOffer(b.offerId)?.offer : undefined;
            return (
              <button key={b.id} type="button" onClick={() => onOpen(b.id)} className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition hover:bg-muted/60">
                {mentor ? <Portrait avatar={mentor.avatar} name={mentor.name} className="size-8" /> : <UserRound className="size-8" />}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{offer?.title ?? "Mentoring session"}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {formatDate(b.date, "EEE d MMM")} · {formatTime(b.time)} · {mentor?.name}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
