"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, CalendarCheck, Check, Clock, Hourglass, Mail, MapPin, Power, Search, Star, UserCheck, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AutoStatus } from "@/components/shared/badges";
import { Rating } from "@/components/shared/cards";
import { CourseIcon } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { coursesByMentor, getMentorOffer, getSession, getUser } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatDayShort, formatINR, formatNumber, formatTime } from "@/lib/format";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useMentors, useMentorSlots } from "@/store/hooks";
import { WEEKDAY_SHORT } from "./people-utils";

const STATUS_LABEL: Record<Mentor["status"], string> = { active: "Active", "pending-approval": "Pending approval", inactive: "Inactive" };

function availabilitySummary(m: Mentor) {
  const days = [...m.availability.weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => WEEKDAY_SHORT[d]);
  const times = m.availability.times.map(formatTime);
  return { days: days.join(", "), times: times.length > 2 ? `${times[0]} – ${times[times.length - 1]}` : times.join(", ") };
}

type Pending = { mentor: Mentor; action: "approve" | "reject" | "activate" | "deactivate" };

const ACTION_COPY: Record<Pending["action"], { title: (n: string) => string; body: string; cta: string; status: Mentor["status"]; toast: string }> = {
  approve: { title: (n) => `Approve ${n}?`, body: "Their profile and offers become visible in the mentor directory and learners can book sessions.", cta: "Approve mentor", status: "active", toast: "Mentor approved" },
  reject: { title: (n) => `Reject ${n}'s application?`, body: "The profile stays hidden from learners. You can reactivate it later from this page.", cta: "Reject application", status: "inactive", toast: "Application rejected" },
  activate: { title: (n) => `Activate ${n}?`, body: "Their profile and open slots become bookable again.", cta: "Activate", status: "active", toast: "Mentor activated" },
  deactivate: { title: (n) => `Deactivate ${n}?`, body: "Learners can no longer book new sessions. Existing confirmed bookings are kept.", cta: "Deactivate", status: "inactive", toast: "Mentor deactivated" },
};

export function MentorsDirectory() {
  const mentors = useMentors();
  const bookings = useDemoStore((s) => s.bookings);
  const setMentorStatus = useDemoStore((s) => s.setMentorStatus);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Mentor["status"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mentors.filter((m) => {
      if (status !== "all" && m.status !== status) return false;
      if (q && ![m.name, m.title, m.city, ...m.expertise].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mentors, query, status]);

  const pendingMentors = mentors.filter((m) => m.status === "pending-approval");
  const active = mentors.filter((m) => m.status === "active");
  const upcomingBookings = bookings.filter((b) => b.date >= DEMO_TODAY && b.status === "confirmed").length;
  const avgRating = active.length ? active.reduce((n, m) => n + m.rating, 0) / active.length : 0;
  const selected = mentors.find((m) => m.id === selectedId);

  const runAction = () => {
    if (!pending) return;
    const copy = ACTION_COPY[pending.action];
    setMentorStatus(pending.mentor.id, copy.status);
    toast.success(copy.toast, { description: `${pending.mentor.name} is now ${STATUS_LABEL[copy.status].toLowerCase()}.` });
    setPending(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow="People" title="Mentors" description="Mentor profiles, assigned courses, availability, bookings and approvals." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Mentors" value={mentors.length} icon={Users} hint={`${active.length} active`} />
        <StatCard label="Pending approval" value={pendingMentors.length} icon={Hourglass} accent="warning" hint={pendingMentors.length ? "Review below" : "All caught up"} />
        <StatCard label="Avg. rating" value={avgRating.toFixed(2)} icon={Star} accent="success" hint="Active mentors" />
        <StatCard label="Sessions delivered" value={formatNumber(mentors.reduce((n, m) => n + m.sessionsDelivered, 0))} icon={CalendarCheck} accent="brand" hint="All-time" />
        <StatCard label="Upcoming bookings" value={upcomingBookings} icon={Clock} accent="info" hint="Confirmed, from today" />
      </div>

      {pendingMentors.length > 0 && (
        <section className="rounded-2xl border border-warning/30 bg-warning-soft/40 p-4 md:p-5">
          <h2 className="font-heading text-[15px] font-semibold">Awaiting approval</h2>
          <p className="text-[13px] text-muted-foreground">New mentor applications. Review the profile, then approve or reject.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {pendingMentors.map((m) => (
              <div key={m.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center md:flex-col md:items-stretch xl:flex-row xl:items-center">
                <Portrait avatar={m.avatar} name={m.name} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.title} · {m.experienceYears} yrs · {m.city}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{m.expertise.join(" · ")}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedId(m.id)}>
                    Review
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPending({ mentor: m, action: "reject" })}>
                    <X /> Reject
                  </Button>
                  <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setPending({ mentor: m, action: "approve" })}>
                    <Check /> Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-2xl border bg-card p-4 shadow-xs md:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search mentors" placeholder="Search name, expertise, city…" className="h-9 pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as Mentor["status"][]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground sm:ml-auto">
            {filtered.length} of {mentors.length} mentors
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState className="mt-4" icon={UserCheck} title="No mentors match" description="Try a different search or status." />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <Table className="min-w-[980px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead className="text-right">Courses</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => {
                  const av = availabilitySummary(m);
                  const assigned = coursesByMentor(m.id);
                  return (
                    <TableRow
                      key={m.id}
                      tabIndex={0}
                      className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                      onClick={() => setSelectedId(m.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedId(m.id);
                      }}
                      aria-label={`Open ${m.name}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Portrait avatar={m.avatar} name={m.name} className="size-9" />
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium">{m.name}</p>
                            <p className="max-w-48 truncate text-xs text-muted-foreground">{m.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-56 items-center gap-1 whitespace-nowrap">
                          {m.expertise.slice(0, 1).map((e) => (
                            <span key={e} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
                              {e}
                            </span>
                          ))}
                          {m.expertise.length > 1 && <span className="px-1 text-[11px] text-muted-foreground">+{m.expertise.length - 1}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums" title={assigned.map((c) => c.title).join(", ")}>
                        {assigned.length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(m.sessionsDelivered)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {m.reviewCount ? <Rating value={m.rating} count={m.reviewCount} /> : <span className="text-xs text-muted-foreground">New — no reviews</span>}
                      </TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">
                        {av.days}
                        <span className="block text-xs text-muted-foreground">{av.times}</span>
                      </TableCell>
                      <TableCell>
                        <AutoStatus status={m.status} label={STATUS_LABEL[m.status]} />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        {m.status === "pending-approval" ? (
                          <div className="flex justify-end gap-1">
                            <Button size="xs" variant="outline" onClick={() => setPending({ mentor: m, action: "reject" })}>
                              Reject
                            </Button>
                            <Button size="xs" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => setPending({ mentor: m, action: "approve" })}>
                              Approve
                            </Button>
                          </div>
                        ) : (
                          <Button size="xs" variant="ghost" onClick={() => setSelectedId(m.id)}>
                            View <ArrowUpRight />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
          {selected && <MentorBody key={selected.id} m={selected} onAction={(action) => setPending({ mentor: selected, action })} />}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!pending}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
      >
        <AlertDialogContent>
          {pending && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{ACTION_COPY[pending.action].title(pending.mentor.name)}</AlertDialogTitle>
                <AlertDialogDescription>{ACTION_COPY[pending.action].body}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant={pending.action === "reject" || pending.action === "deactivate" ? "destructive" : "default"} onClick={runAction}>
                  {ACTION_COPY[pending.action].cta}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MentorBody({ m, onAction }: { m: Mentor; onAction: (a: Pending["action"]) => void }) {
  const bookings = useDemoStore((s) => s.bookings);
  const slots = useMentorSlots(m, 7);
  const courses = coursesByMentor(m.id);
  const upcoming = useMemo(
    () => bookings.filter((b) => b.mentorId === m.id && b.date >= DEMO_TODAY && b.status === "confirmed").sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [bookings, m.id],
  );
  const av = availabilitySummary(m);

  return (
    <>
      <SheetHeader className="border-b bg-muted/40 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 pr-8">
          <Portrait avatar={m.avatar} name={m.name} className="size-14" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-semibold">{m.name}</SheetTitle>
            <SheetDescription className="truncate">{m.title}</SheetDescription>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <AutoStatus status={m.status} label={STATUS_LABEL[m.status]} />
              <Rating value={m.rating} count={m.reviewCount} />
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {m.status === "pending-approval" && (
            <>
              <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => onAction("approve")}>
                <Check /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction("reject")}>
                <X /> Reject
              </Button>
            </>
          )}
          {m.status === "active" && (
            <Button size="sm" variant="destructive" onClick={() => onAction("deactivate")}>
              <Power /> Deactivate
            </Button>
          )}
          {m.status === "inactive" && (
            <Button size="sm" onClick={() => onAction("activate")}>
              <Power /> Activate
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href={`/mentors/${m.id}`}>
              Public profile <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-5 py-5">
        <section>
          <p className="text-[13px] leading-relaxed text-foreground/85">{m.bio}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {m.city}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="size-3.5" /> {m.email}
            </span>
            <span>{m.experienceYears} yrs experience</span>
            <span>{m.languages.join(", ")}</span>
            <span>Joined {formatDate(m.joinedOn, "MMM yyyy")}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {m.expertise.map((e) => (
              <span key={e} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
                {e}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-semibold">Offers & rates</h3>
          <ul className="divide-y rounded-xl border bg-card">
            {m.offers.map((o) => (
              <li key={o.id} className="flex items-start gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">{o.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-semibold tabular-nums">{formatINR(o.price)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.durationMin} min{o.sessions > 1 ? ` × ${o.sessions}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-semibold">Assigned courses ({courses.length})</h3>
          {courses.length ? (
            <ul className="space-y-1.5">
              {courses.map((c) => (
                <li key={c.id}>
                  <Link href={`/courses/${c.id}`} className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-[13px] transition hover:border-primary/30">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundImage: `linear-gradient(135deg, ${c.thumbnail.from}, ${c.thumbnail.to})` }}>
                      <CourseIcon theme={c.thumbnail} className="size-3.5 text-white" />
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{c.title}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">No courses assigned — mentoring sessions only.</p>
          )}
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold">Next 7 days availability</h3>
          <p className="mb-2.5 text-xs text-muted-foreground">
            Weekly pattern: {av.days} · {m.availability.times.map(formatTime).join(", ")}
          </p>
          {slots.length ? (
            <ul className="space-y-2">
              {slots.map((day) => (
                <li key={day.date} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                  <span className="w-28 shrink-0 text-xs font-medium">{formatDayShort(day.date)}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {day.slots.map((s) => (
                      <span
                        key={s.time}
                        className={cn(
                          "rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums ring-1 ring-inset",
                          s.available ? "bg-success-soft text-success ring-success/20" : "bg-muted text-muted-foreground line-through ring-border",
                        )}
                      >
                        {formatTime(s.time)}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">No slots in the next 7 days.</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">Green = open · struck through = booked, teaching or blocked.</p>
        </section>

        <section>
          <h3 className="mb-2.5 text-sm font-semibold">Upcoming bookings ({upcoming.length})</h3>
          {upcoming.length ? (
            <ul className="divide-y rounded-xl border bg-card">
              {upcoming.map((b) => {
                const learner = getUser(b.userId);
                const what = b.kind === "live-session" ? getSession(b.sessionId ?? "")?.title : getMentorOffer(b.offerId ?? "")?.offer.title;
                return (
                  <li key={b.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Portrait avatar={learner?.avatar} name={learner?.name ?? "Learner"} className="size-8" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {learner?.name ?? "Learner"} · {what ?? "Session"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{b.topic ?? "Live session seat"}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-medium">{formatDayShort(b.date)}</p>
                      <p className="text-muted-foreground">{formatTime(b.time)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">No upcoming bookings.</p>
          )}
        </section>
      </div>
    </>
  );
}
