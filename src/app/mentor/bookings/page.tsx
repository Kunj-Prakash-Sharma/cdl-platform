"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarX2, CheckCircle2, ChevronRight, Search, SearchX } from "lucide-react";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate, formatTime, relativeDay } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { bookingTitle, bookingTypeLabel, endTime, learnerOf, useMentorBookings } from "@/components/mentor/mentor-data";
import { ScheduleDetailSheet, useDetailSheet } from "@/components/mentor/schedule-detail-sheet";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Range = "upcoming" | "past" | "all";
type StatusFilter = "all" | Booking["status"];

export default function MentorBookingsPage() {
  const bookings = useMentorBookings();
  const detail = useDetailSheet();
  const [range, setRange] = useState<Range>("upcoming");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(
    () => ({
      upcoming: bookings.filter((b) => b.date >= DEMO_TODAY && b.status === "confirmed").length,
      today: bookings.filter((b) => b.date === DEMO_TODAY && b.status !== "cancelled").length,
      completed: bookings.filter((b) => b.status === "completed").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (range === "upcoming" && b.date < DEMO_TODAY) return false;
      if (range === "past" && b.date >= DEMO_TODAY) return false;
      if (status !== "all" && b.status !== status) return false;
      if (!q) return true;
      const hay = [learnerOf(b.userId).name, b.topic ?? "", bookingTitle(b), b.id].join(" ").toLowerCase();
      return hay.includes(q);
    });
    return range === "past" ? [...list].reverse() : list;
  }, [bookings, range, status, query]);

  const filtered = status !== "all" || query.trim() !== "";
  const clear = () => {
    setStatus("all");
    setQuery("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Student Bookings" description="Every 1:1 mentoring session and seat booked with you. Open a booking to add notes, complete or cancel it." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} accent="brand" hint="confirmed sessions" />
        <StatCard label="Today" value={stats.today} icon={CalendarCheck} accent="primary" hint={formatDate(DEMO_TODAY, "EEE, d MMM")} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="success" hint="with shared notes" />
        <StatCard label="Cancelled" value={stats.cancelled} icon={CalendarX2} accent="warning" hint="slots released" />
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search learner, topic or booking ID"
                aria-label="Search bookings"
                className="h-9 pl-8"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={filtered ? "No bookings match these filters" : range === "upcoming" ? "No upcoming bookings" : "No past bookings yet"}
            description={
              filtered
                ? "Try a different status or search term."
                : "When learners book you from your public profile, their sessions appear here automatically."
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">Learner</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Date & time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-4 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((b) => {
                    const learner = learnerOf(b.userId);
                    return (
                      <TableRow key={b.id} className="cursor-pointer" onClick={() => detail.show({ kind: "booking", id: b.id })}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2.5">
                            <Portrait avatar={learner.avatar} name={learner.name} className="size-9" />
                            <div>
                              <p className="font-medium">{learner.name}</p>
                              <p className="text-xs text-muted-foreground">{learner.user?.city ?? "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{bookingTitle(b)}</p>
                          <p className="text-xs text-muted-foreground">{bookingTypeLabel(b)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium whitespace-nowrap">{formatDate(b.date, "EEE, d MMM")}</p>
                          <p className="text-xs whitespace-nowrap text-muted-foreground">
                            {formatTime(b.time)} – {formatTime(endTime(b.time, b.durationMin))} · {relativeDay(b.date)}
                          </p>
                        </TableCell>
                        <TableCell className="tabular-nums">{b.durationMin} min</TableCell>
                        <TableCell className="max-w-56">
                          <p className="truncate text-muted-foreground" title={b.topic}>
                            {b.topic ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <AutoStatus status={b.status} />
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              detail.show({ kind: "booking", id: b.id });
                            }}
                          >
                            View <ChevronRight />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <ul className="space-y-2 md:hidden">
              {rows.map((b) => {
                const learner = learnerOf(b.userId);
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => detail.show({ kind: "booking", id: b.id })}
                      className="flex w-full items-start gap-3 rounded-xl border bg-card p-3 text-left shadow-xs"
                    >
                      <Portrait avatar={learner.avatar} name={learner.name} className="size-10" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{learner.name}</span>
                          <AutoStatus status={b.status} />
                        </span>
                        <span className="block truncate text-sm">{bookingTitle(b)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatDate(b.date, "EEE, d MMM")} · {formatTime(b.time)} · {b.durationMin} min
                        </span>
                        {b.topic && <span className="mt-1 block truncate text-xs text-muted-foreground">“{b.topic}”</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="px-1 text-xs text-muted-foreground">
              Showing {rows.length} of {bookings.length} bookings
            </p>
          </>
        )}
      </div>

      <ScheduleDetailSheet target={detail.target} open={detail.open} onOpenChange={detail.setOpen} />
    </div>
  );
}
