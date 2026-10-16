"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, CalendarPlus, Clapperboard, Clock3, List, Radio, Users, Video, XCircle } from "lucide-react";
import { cohorts, courses, getCohort, getMentor, getUser, liveSessions } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDayShort, formatDuration, formatTime, relativeDay } from "@/lib/format";
import type { LiveSession } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useMentors } from "@/store/hooks";
import { AutoStatus, StatusPill } from "@/components/shared/badges";
import { MonthCalendar, type CalendarEvent } from "@/components/shared/month-calendar";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClearFiltersButton,
  ConfirmDialog,
  DetailRow,
  Field,
  FilterBar,
  FilterSelect,
  InfoNote,
  ResultsMeta,
  SearchField,
  TableCard,
  TableEmptyRow,
  UsageBar,
} from "./admin-kit";
import { useAdminContent } from "./admin-content-store";

type Session = LiveSession & { recordingItemId?: string; isNew?: boolean };

const TYPE_META: Record<LiveSession["type"], { label: string; tone: "primary" | "brand" | "info" | "warning" }> = {
  "cohort-class": { label: "Cohort class", tone: "primary" },
  "doubt-clearing": { label: "Doubt clearing", tone: "info" },
  workshop: { label: "Workshop", tone: "brand" },
  webinar: { label: "Webinar", tone: "warning" },
};
const TYPE_TONE: Record<LiveSession["type"], CalendarEvent["tone"]> = { "cohort-class": "primary", "doubt-clearing": "info", workshop: "brand", webinar: "warning" };
const STATUS_OPTIONS = ["scheduled", "live", "completed", "cancelled"].map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));
const publicCourses = courses.filter((c) => c.status === "published");
const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id;

function useSessions(): Session[] {
  const added = useAdminContent((s) => s.scheduledSessions);
  const overrides = useAdminContent((s) => s.sessionOverrides);
  return useMemo(
    () =>
      [...added.map((s) => ({ ...s, isNew: true })), ...liveSessions]
        .map((s): Session => ({ ...s, ...overrides[s.id] }))
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [added, overrides],
  );
}

export function SessionAdmin() {
  const sessions = useSessions();
  const mentors = useMentors();
  const [q, setQ] = useState("");
  const [instructor, setInstructor] = useState("all");
  const [course, setCourse] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [when, setWhen] = useState("upcoming");
  const [openId, setOpenId] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = sessions.filter((s) => {
      if (instructor !== "all" && s.mentorId !== instructor) return false;
      if (course !== "all" && s.courseId !== course) return false;
      if (type !== "all" && s.type !== type) return false;
      if (status !== "all" && s.status !== status) return false;
      if (when === "upcoming" && s.date < DEMO_TODAY) return false;
      if (when === "past" && s.date >= DEMO_TODAY) return false;
      if (term) {
        const hay = `${s.title} ${courseTitle(s.courseId)} ${getMentor(s.mentorId)?.name ?? ""} ${s.cohortId ? (getCohort(s.cohortId)?.name ?? "") : ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    return when === "past" ? list.reverse() : list;
  }, [sessions, q, instructor, course, type, status, when]);

  const stats = useMemo(() => {
    const week = sessions.filter((s) => s.date >= DEMO_TODAY && s.date <= "2026-10-21" && s.status !== "cancelled");
    const upcoming = sessions.filter((s) => s.date >= DEMO_TODAY && s.status === "scheduled");
    const fill = upcoming.length ? Math.round((upcoming.reduce((n, s) => n + s.booked / s.capacity, 0) / upcoming.length) * 100) : 0;
    return {
      week: week.length,
      seats: upcoming.reduce((n, s) => n + s.booked, 0),
      fill,
      recordings: sessions.filter((s) => s.recording).length,
    };
  }, [sessions]);

  const events: CalendarEvent[] = useMemo(
    () =>
      sessions
        .filter((s) => (instructor === "all" || s.mentorId === instructor) && (course === "all" || s.courseId === course))
        .map((s) => ({ id: s.id, date: s.date, time: s.time, title: s.title.replace(/^Class \d+: /, ""), tone: s.status === "cancelled" ? "muted" : TYPE_TONE[s.type] })),
    [sessions, instructor, course],
  );

  const hasFilters = q !== "" || instructor !== "all" || course !== "all" || type !== "all" || status !== "all" || when !== "upcoming";
  const reset = () => {
    setQ("");
    setInstructor("all");
    setCourse("all");
    setType("all");
    setStatus("all");
    setWhen("upcoming");
  };
  const open = sessions.find((s) => s.id === openId);
  const usedMentors = mentors.filter((m) => sessions.some((s) => s.mentorId === m.id));
  const usedCourses = Array.from(new Set(sessions.map((s) => s.courseId))).map((id) => ({ value: id, label: courseTitle(id) }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Live Sessions"
        description="Cohort classes, doubt-clearing hours, workshops and webinars — instructors, schedule, bookings and recordings. All times IST."
        actions={
          <Button className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90" onClick={() => setScheduling(true)}>
            <CalendarPlus className="size-4" />
            Schedule session
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sessions this week" value={stats.week} icon={CalendarDays} hint="15–21 Oct" />
        <StatCard label="Seats booked (upcoming)" value={stats.seats.toLocaleString("en-IN")} icon={Users} accent="brand" hint="Across scheduled sessions" />
        <StatCard label="Average fill rate" value={`${stats.fill}%`} icon={Radio} accent="info" hint="Booked ÷ capacity" />
        <StatCard label="Recordings available" value={stats.recordings} icon={Clapperboard} accent="success" hint="Completed sessions" />
      </div>

      <Tabs defaultValue="list" className="gap-4">
        <TabsList className="h-9!">
          <TabsTrigger value="list" className="px-3">
            <List className="size-3.5" />
            Directory
          </TabsTrigger>
          <TabsTrigger value="calendar" className="px-3">
            <CalendarDays className="size-3.5" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          <FilterBar right={<ResultsMeta shown={filtered.length} total={sessions.length} noun="sessions" onReset={reset} />}>
            <SearchField value={q} onChange={setQ} placeholder="Search session, course, cohort…" label="Search sessions" />
            <FilterSelect label="When" value={when} onValueChange={setWhen} allLabel="All dates" options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} className="sm:w-32" />
            <FilterSelect label="Instructor" allLabel="All instructors" value={instructor} onValueChange={setInstructor} options={usedMentors.map((m) => ({ value: m.id, label: m.name }))} />
            <FilterSelect label="Course" allLabel="All courses" value={course} onValueChange={setCourse} options={usedCourses} className="sm:w-52" />
            <FilterSelect label="Type" allLabel="All types" value={type} onValueChange={setType} options={Object.entries(TYPE_META).map(([v, m]) => ({ value: v, label: m.label }))} className="sm:w-40" />
            <FilterSelect label="Status" allLabel="All statuses" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} className="sm:w-36" />
            <ClearFiltersButton visible={hasFilters} onClick={reset} />
          </FilterBar>
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Session</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Date & time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recording</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableEmptyRow colSpan={7} icon={CalendarDays} action={<Button variant="outline" size="sm" onClick={reset}>Reset filters</Button>} />
                )}
                {filtered.map((s) => {
                  const m = getMentor(s.mentorId);
                  const cohort = s.cohortId ? getCohort(s.cohortId) : undefined;
                  return (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => setOpenId(s.id)}>
                      <TableCell>
                        <div className="min-w-[260px] max-w-[340px]">
                          <p className="truncate font-medium">{s.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {courseTitle(s.courseId)}
                            {cohort ? ` · ${cohort.name.split(" · ")[1] ?? cohort.name}` : ""}
                            {s.collegeId ? " · AIT" : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {m && (
                          <div className="flex items-center gap-2">
                            <Portrait avatar={m.avatar} name={m.name} className="size-7" />
                            <span className="text-[13px] whitespace-nowrap">{m.name}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDayShort(s.date)} · {formatTime(s.time)}
                        <div className="text-[11px] text-muted-foreground">
                          {relativeDay(s.date)} · {formatDuration(s.durationMin * 60)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill tone={TYPE_META[s.type].tone} dot={false}>
                          {TYPE_META[s.type].label}
                        </StatusPill>
                      </TableCell>
                      <TableCell>
                        <UsageBar value={s.booked} max={s.capacity} className="w-28" />
                      </TableCell>
                      <TableCell>
                        <AutoStatus status={s.status} />
                      </TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">
                        {s.recording ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <Video className="size-3.5" />
                            {formatDuration(s.recording.durationSec)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-3">
          <FilterBar>
            <FilterSelect label="Instructor" allLabel="All instructors" value={instructor} onValueChange={setInstructor} options={usedMentors.map((m) => ({ value: m.id, label: m.name }))} />
            <FilterSelect label="Course" allLabel="All courses" value={course} onValueChange={setCourse} options={usedCourses} className="sm:w-52" />
            <div className="flex flex-wrap gap-2 text-xs sm:ml-auto">
              {Object.entries(TYPE_META).map(([k, m]) => (
                <StatusPill key={k} tone={m.tone}>
                  {m.label}
                </StatusPill>
              ))}
            </div>
          </FilterBar>
          <MonthCalendar events={events} onEventClick={setOpenId} />
        </TabsContent>
      </Tabs>

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-xl">{open && <SessionDetail key={open.id} session={open} />}</SheetContent>
      </Sheet>

      <Dialog open={scheduling} onOpenChange={setScheduling}>
        {scheduling && <ScheduleForm onDone={() => setScheduling(false)} />}
      </Dialog>
    </div>
  );
}

function SessionDetail({ session }: { session: Session }) {
  const mentors = useMentors();
  const enrollments = useDemoStore((s) => s.enrollments);
  const bookings = useDemoStore((s) => s.bookings);
  const contentItems = useDemoStore((s) => s.contentItems);
  const overrideSession = useAdminContent((s) => s.overrideSession);
  const [date, setDate] = useState(session.date);
  const [time, setTime] = useState(session.time);
  const [rescheduleError, setRescheduleError] = useState<string>();
  const [cancelling, setCancelling] = useState(false);
  const [recordingId, setRecordingId] = useState<string>(session.recordingItemId ?? "");

  const cohort = session.cohortId ? getCohort(session.cohortId) : undefined;
  const attendees = useMemo(() => {
    const out: { id: string; name: string; source: string }[] = [];
    const seen = new Set<string>();
    if (session.cohortId)
      for (const e of enrollments)
        if (e.cohortId === session.cohortId && !seen.has(e.userId)) {
          seen.add(e.userId);
          out.push({ id: e.userId, name: getUser(e.userId)?.name ?? e.userId, source: "Cohort enrolment" });
        }
    for (const b of bookings)
      if (b.sessionId === session.id && b.status !== "cancelled" && !seen.has(b.userId)) {
        seen.add(b.userId);
        out.push({ id: b.userId, name: getUser(b.userId)?.name ?? b.userId, source: "Booked seat" });
      }
    return out;
  }, [enrollments, bookings, session.cohortId, session.id]);
  const courseItems = contentItems.filter((c) => c.courseId === session.courseId);
  const past = session.status === "completed" || session.date < DEMO_TODAY;
  const editable = session.status === "scheduled";

  return (
    <>
      <SheetHeader className="border-b px-5 pt-5 pb-4 pr-12">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          <StatusPill tone={TYPE_META[session.type].tone} dot={false}>
            {TYPE_META[session.type].label}
          </StatusPill>
          <AutoStatus status={session.status} />
        </div>
        <SheetTitle className="text-lg font-semibold">{session.title}</SheetTitle>
        <SheetDescription>
          {courseTitle(session.courseId)}
          {cohort ? ` · ${cohort.name}` : ""}
        </SheetDescription>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="divide-y rounded-xl border px-4">
          <DetailRow label="When">
            {formatDayShort(session.date)} · {formatTime(session.time)} IST
          </DetailRow>
          <DetailRow label="Duration">{formatDuration(session.durationMin * 60)}</DetailRow>
          <DetailRow label="Seats">
            {session.booked} / {session.capacity}
          </DetailRow>
          <DetailRow label="About">
            <span className="font-normal text-muted-foreground">{session.description}</span>
          </DetailRow>
        </div>

        <section className="space-y-2">
          <h3 className="font-heading text-sm font-semibold">Instructor allocation</h3>
          <Select
            value={session.mentorId}
            onValueChange={(v) => {
              overrideSession(session.id, { mentorId: v });
              toast.success("Instructor updated", { description: `${getMentor(v)?.name} will lead “${session.title}”.` });
            }}
          >
            <SelectTrigger className="h-9! w-full" aria-label="Instructor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mentors
                .filter((m) => m.status === "active")
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <Portrait avatar={m.avatar} name={m.name} className="size-5" />
                    {m.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </section>

        {editable && (
          <section className="space-y-2">
            <h3 className="font-heading text-sm font-semibold">Reschedule</h3>
            <div className="flex flex-wrap items-end gap-2">
              <Field id="rs-date" label="Date" className="flex-1">
                <Input id="rs-date" type="date" min={DEMO_TODAY} value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
              </Field>
              <Field id="rs-time" label="Time (IST)" className="w-32">
                <Input id="rs-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9" />
              </Field>
              <Button
                variant="outline"
                className="h-9"
                onClick={() => {
                  if (!date || date < DEMO_TODAY) return setRescheduleError("Pick today or a future date.");
                  if (!time) return setRescheduleError("Pick a start time.");
                  if (date === session.date && time === session.time) return setRescheduleError("Choose a different date or time.");
                  setRescheduleError(undefined);
                  overrideSession(session.id, { date, time });
                  toast.success("Session rescheduled", { description: `${formatDayShort(date)} · ${formatTime(time)} IST — attendees are notified (simulated).` });
                }}
              >
                Save
              </Button>
            </div>
            {rescheduleError && <p className="text-xs font-medium text-destructive">{rescheduleError}</p>}
          </section>
        )}

        <section className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="font-heading text-sm font-semibold">Booking list</h3>
            <span className="text-xs text-muted-foreground">{session.booked} booked</span>
          </div>
          {attendees.length ? (
            <ul className="divide-y rounded-xl border">
              {attendees.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-3 py-2">
                  <Portrait avatar={getUser(a.id)?.avatar} name={a.name} className="size-7" />
                  <span className="flex-1 text-[13px] font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground">{a.source}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No named demo learners on this session yet.</p>
          )}
          {session.booked > attendees.length && (
            <p className="text-xs text-muted-foreground">+ {session.booked - attendees.length} more learners (synthetic count for the demo).</p>
          )}
        </section>

        {past && session.status !== "cancelled" && (
          <section className="space-y-2">
            <h3 className="font-heading text-sm font-semibold">Recording</h3>
            {session.recording && (
              <InfoNote tone="brand" icon={Video}>
                Recording available · {formatDuration(session.recording.durationSec)} · {session.recording.views} views
                {session.recordingItemId ? ` · linked to “${contentItems.find((c) => c.id === session.recordingItemId)?.title ?? "library item"}”` : ""}
              </InfoNote>
            )}
            <div className="flex flex-wrap gap-2">
              <Select value={recordingId} onValueChange={setRecordingId}>
                <SelectTrigger className="h-9! min-w-0 flex-1" aria-label="Recording from the video library">
                  <SelectValue placeholder="Attach from video library…" />
                </SelectTrigger>
                <SelectContent>
                  {courseItems.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-9"
                disabled={!recordingId}
                onClick={() => {
                  const item = contentItems.find((c) => c.id === recordingId);
                  if (!item) return;
                  overrideSession(session.id, { recordingItemId: item.id, recording: { durationSec: item.durationSec, views: session.recording?.views ?? 0 } });
                  toast.success("Recording attached", { description: item.title });
                }}
              >
                Attach
              </Button>
              {!session.recording && (
                <Button
                  className="h-9"
                  onClick={() => {
                    overrideSession(session.id, { recording: { durationSec: session.durationMin * 60 - 240, views: 0 } });
                    toast.success("Recording marked available", { description: "Attendees can now watch it from Live Sessions → Recordings." });
                  }}
                >
                  Mark available
                </Button>
              )}
            </div>
          </section>
        )}
      </div>
      {editable && (
        <div className="flex justify-end border-t bg-muted/30 px-5 py-3.5">
          <Button variant="destructive" onClick={() => setCancelling(true)}>
            <XCircle className="size-4" />
            Cancel session
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        title="Cancel this session?"
        description={`${session.booked} booked learners will be notified (simulated). The session stays on record as cancelled.`}
        confirmLabel="Cancel session"
        destructive
        onConfirm={() => {
          overrideSession(session.id, { status: "cancelled" });
          toast.success("Session cancelled", { description: session.title });
          setCancelling(false);
        }}
      />
    </>
  );
}

function ScheduleForm({ onDone }: { onDone: () => void }) {
  const mentors = useMentors();
  const addSession = useAdminContent((s) => s.addSession);
  const [form, setForm] = useState({ title: "", courseId: "", cohortId: "none", mentorId: "", date: "2026-10-22", time: "19:00", duration: "60", type: "workshop" as LiveSession["type"], capacity: "40" });
  const [submitted, setSubmitted] = useState(false);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const courseCohorts = cohorts.filter((c) => c.courseId === form.courseId);

  const e: Record<string, string> = {};
  if (form.title.trim().length < 5) e.title = "Add a title (5+ characters).";
  if (!form.courseId) e.courseId = "Choose a course.";
  if (!form.mentorId) e.mentorId = "Assign an instructor.";
  if (!form.date || form.date < DEMO_TODAY) e.date = "Pick today or a later date.";
  if (!form.time) e.time = "Pick a time.";
  const d = Number(form.duration);
  if (!Number.isInteger(d) || d < 15 || d > 240) e.duration = "15–240 minutes.";
  const cap = Number(form.capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 500) e.capacity = "1–500 seats.";
  const err = submitted ? e : {};

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Schedule a live session</DialogTitle>
        <DialogDescription>Adds the session to the directory and calendar for this demo session.</DialogDescription>
      </DialogHeader>
      <form
        id="schedule-form"
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          setSubmitted(true);
          if (Object.keys(e).length) return;
          const course = courses.find((c) => c.id === form.courseId)!;
          addSession({
            id: `ses-new-${Date.now().toString(36)}`,
            title: form.title.trim(),
            courseId: form.courseId,
            cohortId: form.cohortId === "none" ? undefined : form.cohortId,
            mentorId: form.mentorId,
            date: form.date,
            time: form.time,
            durationMin: d,
            type: form.type,
            audience: course.audience,
            capacity: cap,
            booked: 0,
            status: "scheduled",
            description: `${TYPE_META[form.type].label} for ${course.title} learners.`,
          });
          toast.success("Session scheduled", { description: `${form.title.trim()} · ${formatDayShort(form.date)} · ${formatTime(form.time)} IST` });
          onDone();
        }}
      >
        <Field id="ss-title" label="Title" required error={err.title} className="sm:col-span-2">
          <Input id="ss-title" value={form.title} onChange={(ev) => set("title", ev.target.value)} placeholder="e.g. Salary negotiation workshop" className="h-9" aria-invalid={!!err.title} />
        </Field>
        <Field id="ss-course" label="Course" required error={err.courseId} className="sm:col-span-2">
          <Select value={form.courseId || undefined} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v, cohortId: "none" }))}>
            <SelectTrigger id="ss-course" className="h-9! w-full" aria-invalid={!!err.courseId}>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {publicCourses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="ss-cohort" label="Cohort (optional)">
          <Select value={form.cohortId} onValueChange={(v) => set("cohortId", v)} disabled={!courseCohorts.length}>
            <SelectTrigger id="ss-cohort" className="h-9! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Open to all learners</SelectItem>
              {courseCohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="ss-mentor" label="Instructor" required error={err.mentorId}>
          <Select value={form.mentorId || undefined} onValueChange={(v) => set("mentorId", v)}>
            <SelectTrigger id="ss-mentor" className="h-9! w-full" aria-invalid={!!err.mentorId}>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {mentors
                .filter((m) => m.status === "active")
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="ss-date" label="Date" required error={err.date}>
          <Input id="ss-date" type="date" min={DEMO_TODAY} value={form.date} onChange={(ev) => set("date", ev.target.value)} className="h-9" />
        </Field>
        <Field id="ss-time" label="Time (IST)" required error={err.time}>
          <Input id="ss-time" type="time" value={form.time} onChange={(ev) => set("time", ev.target.value)} className="h-9" />
        </Field>
        <Field id="ss-type" label="Type" required>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
            <SelectTrigger id="ss-type" className="h-9! w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="ss-dur" label="Minutes" required error={err.duration}>
            <Input id="ss-dur" type="number" value={form.duration} onChange={(ev) => set("duration", ev.target.value)} className="h-9" />
          </Field>
          <Field id="ss-cap" label="Capacity" required error={err.capacity}>
            <Input id="ss-cap" type="number" value={form.capacity} onChange={(ev) => set("capacity", ev.target.value)} className="h-9" />
          </Field>
        </div>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" form="schedule-form" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Clock3 className="size-4" />
          Schedule
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
