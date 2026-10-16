"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, NotebookPen, Search, SearchX, Sparkles, UserRoundSearch } from "lucide-react";
import { formatINR, formatNumber } from "@/lib/format";
import type { Mentor } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMentors } from "@/store/hooks";
import { MentorCard } from "@/components/shared/cards";
import { MentorBookingDialog } from "@/components/shared/mentor-booking-dialog";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TOPICS: { id: string; label: string; match?: RegExp }[] = [
  { id: "all", label: "All mentors" },
  { id: "career", label: "Career discovery", match: /career discovery|psychometric|stream|parent/i },
  { id: "communication", label: "Communication & speaking", match: /communication|speaking|presentation|voice/i },
  { id: "interviews", label: "Interviews & placements", match: /interview|placement|hr round|salary|group discussion/i },
  { id: "resume", label: "Resume & branding", match: /resume|linkedin|branding|cover letter/i },
  { id: "leadership", label: "Leadership", match: /leadership|management|executive/i },
  { id: "growth", label: "Personal growth", match: /personality|emotional|etiquette|teen/i },
  { id: "transition", label: "Career transitions", match: /transition|readiness|productivity/i },
];

const matchesTopic = (m: Mentor, topicId: string) => {
  const t = TOPICS.find((x) => x.id === topicId);
  return !t?.match || m.expertise.some((e) => t.match!.test(e)) || t.match.test(m.title);
};

export function MentorDirectory() {
  const mentors = useMentors();
  const active = useMemo(() => mentors.filter((m) => m.status === "active"), [mentors]);
  const [topic, setTopic] = useState("all");
  const [query, setQuery] = useState("");
  const [booking, setBooking] = useState<Mentor | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      active.filter((m) => {
        if (!matchesTopic(m, topic)) return false;
        if (!q) return true;
        const hay = [m.name, m.title, m.headline, m.city, ...m.expertise, ...m.languages].join(" ").toLowerCase();
        return q.split(/\s+/).every((w) => hay.includes(w));
      }),
    [active, topic, q],
  );

  const stats = useMemo(() => {
    const sessions = active.reduce((s, m) => s + m.sessionsDelivered, 0);
    const rating = active.length ? active.reduce((s, m) => s + m.rating, 0) / active.length : 0;
    const languages = new Set(active.flatMap((m) => m.languages)).size;
    const from = Math.min(...active.flatMap((m) => m.offers.map((o) => o.price)));
    return { sessions, rating, languages, from };
  }, [active]);

  const openBooking = (m: Mentor) => {
    setBooking(m);
    setBookingOpen(true);
  };

  return (
    <>
      <section className="relative isolate overflow-hidden border-b bg-muted/40">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_60%_80%_at_80%_0%,black,transparent)]" />
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 md:px-6 md:pt-16 md:pb-12">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">One-to-One Mentoring · Level 3</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-5xl">
            Learn from mentors who&apos;ve been there
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Recruiters, psychologists, coaches and leaders — book a private session for interview practice, career decisions or leadership
            challenges. Pick a time that suits you.
          </p>
          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Average rating", value: stats.rating.toFixed(1) },
              { label: "Sessions delivered", value: formatNumber(stats.sessions) },
              { label: "Languages", value: String(stats.languages) },
              { label: "Sessions from", value: formatINR(stats.from) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border bg-card px-4 py-3 shadow-xs">
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd className="mt-0.5 font-heading text-xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-muted-foreground">Demo figures for the prototype.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0" role="group" aria-label="Filter by expertise">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={topic === t.id}
                onClick={() => setTopic(t.id)}
                className={cn(
                  "h-8 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition",
                  topic === t.id ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, skill, city, language"
              aria-label="Search mentors"
              className="h-10 bg-card pl-9"
            />
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? "mentor" : "mentors"} available
        </p>

        {results.length ? (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((m) => (
              <MentorCard
                key={m.id}
                mentor={m}
                className="transition hover:shadow-md"
                action={
                  <div className="flex gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openBooking(m)}>
                      Book
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/mentors/${m.id}`}>View profile</Link>
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No mentors match"
            description="Try a different expertise area or a broader search term."
            className="mt-4"
            action={
              <Button
                onClick={() => {
                  setTopic("all");
                  setQuery("");
                }}
              >
                Show all mentors
              </Button>
            }
          />
        )}

        <div className="mt-16 rounded-3xl border bg-card p-6 shadow-xs md:p-10">
          <h2 className="font-heading text-2xl font-bold">How one-to-one mentoring works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icon: UserRoundSearch, title: "Choose a mentor", body: "Compare expertise, languages, ratings and session types on each profile." },
              { icon: CalendarCheck, title: "Pick a session & slot", body: "Choose the session length and an open evening or weekend slot that suits you." },
              { icon: NotebookPen, title: "Meet & follow up", body: "Meet online, then find private notes, follow-ups and recommended courses in your dashboard." },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                  <s.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-brand">Step {i + 1}</p>
                  <p className="font-heading font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-muted/60 p-5 sm:flex-row sm:items-center">
            <Sparkles className="size-5 shrink-0 text-brand" />
            <p className="flex-1 text-sm">
              <span className="font-semibold">Not sure who to pick?</span> Your free career discovery snapshot suggests a mentor and session type.
            </p>
            <Button asChild className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
              <Link href="/discover">
                Start free discovery <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {booking && <MentorBookingDialog key={booking.id} mentor={booking} open={bookingOpen} onOpenChange={setBookingOpen} mode="checkout" />}
    </>
  );
}
