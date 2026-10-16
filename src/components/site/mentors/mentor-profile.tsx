"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowLeft, BadgeCheck, Briefcase, CalendarDays, Clock, Languages, MapPin, MessagesSquare, Star, UserX } from "lucide-react";
import { getMentor } from "@/data";
import { STAGE_META } from "@/data/constants";
import { formatINR, formatNumber, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCourses, useMentors, useMentorSlots } from "@/store/hooks";
import { FormatBadge } from "@/components/shared/badges";
import { CourseCard } from "@/components/shared/cards";
import { MentorBookingDialog } from "@/components/shared/mentor-booking-dialog";
import { EmptyState } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";

export function MentorProfile({ mentorId }: { mentorId: string }) {
  const mentors = useMentors();
  const mentor = mentors.find((m) => m.id === mentorId) ?? getMentor(mentorId)!;
  const courses = useCourses();
  const programs = useMemo(
    () => courses.filter((c) => c.instructorId === mentor.id && c.status === "published" && !c.collegeId),
    [courses, mentor.id],
  );
  const slots = useMentorSlots(mentor, 7);
  const [open, setOpen] = useState(false);
  const [offerId, setOfferId] = useState<string | undefined>(undefined);

  const reviews = useMemo(
    () =>
      programs
        .flatMap((c) => c.reviews.map((r) => ({ ...r, course: c })))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3),
    [programs],
  );

  if (mentor.status !== "active") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon={UserX}
          title="This mentor profile isn't available"
          description={
            mentor.status === "pending-approval"
              ? `${mentor.name}'s profile is awaiting review by the CDL team and isn't bookable yet.`
              : `${mentor.name} isn't taking sessions at the moment.`
          }
          action={
            <Button asChild>
              <Link href="/mentors">Browse available mentors</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const book = (id?: string) => {
    setOfferId(id);
    setOpen(true);
  };
  const firstName = mentor.name.replace(/^Dr\.\s+/, "").split(" ")[0];
  const openCount = slots.reduce((n, d) => n + d.slots.filter((s) => s.available).length, 0);
  const from = Math.min(...mentor.offers.map((o) => o.price));

  return (
    <>
      <section className="relative isolate overflow-hidden border-b bg-muted/40">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_60%_80%_at_80%_0%,black,transparent)]" />
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <Link href="/mentors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All mentors
          </Link>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-28 shadow-lg ring-4 ring-background md:size-36" rounded="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">{mentor.name}</h1>
                <BadgeCheck className="size-6 text-brand" aria-label="Verified mentor" />
              </div>
              <p className="mt-1 text-lg font-medium text-foreground/80">{mentor.title}</p>
              <p className="mt-2 max-w-2xl text-muted-foreground">{mentor.headline}</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="size-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">{mentor.rating.toFixed(1)}</span> ({formatNumber(mentor.reviewCount)} reviews)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessagesSquare className="size-4" /> {formatNumber(mentor.sessionsDelivered)} sessions delivered
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-4" /> {mentor.experienceYears} years experience
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {mentor.city}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="size-4" /> {mentor.languages.join(", ")}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
              <Button className="h-11 bg-brand px-5 text-[15px] text-brand-foreground hover:bg-brand/90" onClick={() => book()}>
                <CalendarDays /> Book a session
              </Button>
              {programs.length > 0 && (
                <Button asChild variant="outline" className="h-11 px-5 text-[15px]">
                  <a href="#programs">View programs</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:px-6 lg:grid-cols-[1fr_360px] lg:gap-12">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="font-heading text-2xl font-bold">About {firstName}</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{mentor.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {mentor.expertise.map((e) => (
                <span key={e} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-primary">
                  {e}
                </span>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Teaches in</span>
              {mentor.formats.map((f) => (
                <FormatBadge key={f} format={f} showLevel />
              ))}
            </div>
          </section>

          <section id="offers" className="scroll-mt-24">
            <h2 className="font-heading text-2xl font-bold">Session formats &amp; pricing</h2>
            <p className="mt-1 text-sm text-muted-foreground">Private online sessions. Choose a date and time on the next step.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {mentor.offers.map((o) => (
                <div key={o.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-heading font-semibold">{o.title}</p>
                    <span className="font-heading text-lg font-bold whitespace-nowrap">{formatINR(o.price)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">{o.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <Clock className="size-3.5" /> {o.durationMin} min{o.sessions > 1 ? " each" : ""}
                    </span>
                    <span className="rounded-md bg-muted px-2 py-1">
                      {o.sessions} {o.sessions > 1 ? "sessions" : "session"}
                    </span>
                    {o.sessions > 1 && <span className="rounded-md bg-brand-soft px-2 py-1 font-medium text-brand">{formatINR(Math.round(o.price / o.sessions))} / session</span>}
                  </div>
                  <Button variant="outline" className="mt-5 h-9 self-start" onClick={() => book(o.id)}>
                    Book this session
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {programs.length > 0 && (
            <section id="programs" className="scroll-mt-24">
              <h2 className="font-heading text-2xl font-bold">Programs with {firstName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Courses and live cohorts {firstName} teaches on CDL.</p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {programs.map((c) => (
                  <CourseCard key={c.id} course={c} compact />
                ))}
              </div>
            </section>
          )}

          {reviews.length > 0 && (
            <section>
              <h2 className="font-heading text-2xl font-bold">What learners say</h2>
              <p className="mt-1 text-sm text-muted-foreground">Sample reviews from {firstName}&apos;s programmes (demo data).</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {reviews.map((r) => (
                  <figure key={r.course.id + r.name} className="flex flex-col rounded-2xl border bg-card p-5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={cn("size-3.5", n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                      ))}
                    </div>
                    <blockquote className="mt-3 flex-1 text-sm leading-relaxed">&ldquo;{r.text}&rdquo;</blockquote>
                    <figcaption className="mt-4 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{r.name}</span> · {STAGE_META[r.stage].label} · {r.course.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside>
          <div className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5">
              <div className="flex items-center justify-between">
                <p className="font-heading font-semibold">Availability</p>
                <span className="text-xs text-muted-foreground">Next 7 days · IST</span>
              </div>
              {slots.length ? (
                <ul className="mt-4 space-y-3">
                  {slots.map((d) => (
                    <li key={d.date} className="flex gap-3">
                      <div className="w-11 shrink-0 rounded-lg bg-muted py-1 text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase">{format(parseISO(d.date), "EEE")}</p>
                        <p className="font-heading text-base leading-tight font-bold">{format(parseISO(d.date), "d")}</p>
                      </div>
                      <div className="flex flex-wrap content-center gap-1.5">
                        {d.slots.map((s) => (
                          <span
                            key={s.time}
                            className={cn(
                              "rounded-md border px-2 py-1 text-xs font-medium",
                              s.available ? "border-brand/30 bg-brand-soft text-brand" : "text-muted-foreground/60 line-through",
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
                <p className="mt-4 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No open slots this week — you can book further ahead.</p>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                {openCount} open {openCount === 1 ? "slot" : "slots"} this week · crossed-out times are taken
              </p>
              <Button className="mt-4 h-11 w-full bg-brand text-[15px] text-brand-foreground hover:bg-brand/90" onClick={() => book()}>
                Book a session · from {formatINR(from)}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Prototype — booking and payment are simulated.</p>
            </div>
          </div>
        </aside>
      </div>

      <MentorBookingDialog key={offerId ?? "any"} mentor={mentor} open={open} onOpenChange={setOpen} defaultOfferId={offerId} mode="checkout" />
    </>
  );
}
