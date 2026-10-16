"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, BellRing, Building, CalendarClock, ClipboardList, GraduationCap, Power, Receipt, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AutoStatus, FormatBadge, StatusPill } from "@/components/shared/badges";
import { Portrait } from "@/components/shared/portrait";
import { getAssessment, getCourse, getMentor, getMentorOffer, getSession } from "@/data";
import { DEMO_LEARNER_ID, DEMO_PARENT_ID, STAGE_META } from "@/data/constants";
import { formatDate, formatINR, formatTime, relativeDay } from "@/lib/format";
import type { Enrollment, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { useCourseProgress } from "@/store/hooks";
import { hash, KIND_LABEL, type DirectoryUser } from "./people-utils";

export function UserSheet({
  user,
  status,
  onStatusChange,
  onOpenUser,
  onOpenChange,
}: {
  user: DirectoryUser | undefined;
  status: UserProfile["status"];
  onStatusChange: (id: string, s: UserProfile["status"]) => void;
  onOpenUser: (id: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!user} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {user && <Body key={user.id} u={user} status={status} onStatusChange={onStatusChange} onOpenUser={onOpenUser} />}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon: Icon, children, count }: { title: string; icon: typeof UserRound; children: React.ReactNode; count?: number }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-muted-foreground" />
        {title}
        {count !== undefined && <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium text-muted-foreground tabular-nums">{count}</span>}
      </h3>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-[13px] text-muted-foreground">{children}</p>;
}

function Body({
  u,
  status,
  onStatusChange,
  onOpenUser,
}: {
  u: DirectoryUser;
  status: UserProfile["status"];
  onStatusChange: (id: string, s: UserProfile["status"]) => void;
  onOpenUser: (id: string) => void;
}) {
  const enrollments = useDemoStore((s) => s.enrollments);
  const orders = useDemoStore((s) => s.orders);
  const bookings = useDemoStore((s) => s.bookings);
  const results = useDemoStore((s) => s.assessmentResults);
  const addNotification = useDemoStore((s) => s.addNotification);

  const myEnrollments = enrollments.filter((e) => e.userId === u.id);
  const myOrders = orders.filter((o) => o.userId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const myBookings = bookings.filter((b) => b.userId === u.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const myResults = results.filter((r) => r.userId === u.id);
  const active = status === "active";
  const childId = u.childName === "Arjun" ? "u-arjun-i" : undefined;

  const toggleStatus = () => {
    const next = active ? "inactive" : "active";
    onStatusChange(u.id, next);
    toast.success(next === "active" ? `${u.name} activated` : `${u.name} deactivated`, {
      description: next === "active" ? "They can sign in and access their programs again." : "Sign-in is blocked; enrolments and progress are kept.",
    });
  };

  const notify = () => {
    if (u.id === DEMO_LEARNER_ID || u.id === DEMO_PARENT_ID) {
      addNotification({ kind: "announcement", title: "A message from the CDL team", body: "Your placement-season check-in is ready — review your plan on the dashboard.", href: "/dashboard" });
    }
    toast.success(`Notification sent to ${u.name}`, {
      description: u.id === DEMO_LEARNER_ID || u.id === DEMO_PARENT_ID ? "It now appears in their notification centre." : "In-app + SMS notification (simulated).",
    });
  };

  return (
    <>
      <SheetHeader className="border-b bg-muted/40 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 pr-8">
          <Portrait avatar={u.avatar} name={u.name} className="size-14" />
          <div className="min-w-0">
            <SheetTitle className="truncate text-lg font-semibold">{u.name}</SheetTitle>
            <SheetDescription className="truncate">
              {KIND_LABEL[u.kind]}
              {u.collegeShort ? ` · ${u.collegeShort}` : ""} · {STAGE_META[u.stage].label}
            </SheetDescription>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <AutoStatus status={status} />
              <StatusPill tone="neutral" dot={false}>
                Profile {u.profileCompletion}%
              </StatusPill>
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant={active ? "destructive" : "default"} onClick={toggleStatus}>
            <Power /> {active ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" variant="outline" onClick={notify}>
            <BellRing /> Send notification
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.success("Profile reminder reset", {
                description: `${u.name} will see the “complete your profile” prompt on next sign-in (${100 - u.profileCompletion}% left).`,
              })
            }
          >
            <RotateCcw /> Reset profile reminder
          </Button>
        </div>
      </SheetHeader>

      <div className="space-y-6 px-5 py-5">
        <Section title="Profile" icon={UserRound}>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-[13px] sm:grid-cols-2">
            <Item k="Phone" v={<span className="font-mono text-xs">{u.phone}</span>} />
            <Item k="Email" v={u.email ?? "Not provided"} />
            <Item k="City" v={u.city} />
            <Item k="Last active" v={relativeDay(u.lastActive)} />
            {u.joinedOn && <Item k="Joined" v={formatDate(u.joinedOn)} />}
            <Item k="Education" v={u.education} />
            {u.occupation && <Item k="Occupation" v={u.occupation} />}
            {u.institution && <Item k="Institution" v={u.institution} />}
          </dl>
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Profile completion</span>
              <span className="font-medium text-foreground tabular-nums">{u.profileCompletion}%</span>
            </div>
            <Progress value={u.profileCompletion} className="h-1.5 [&>[data-slot=progress-indicator]]:bg-brand" />
          </div>
          {u.childName && (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-[13px]">
              <span>
                Parent of <span className="font-medium">{u.childName}</span>
                {u.childStage ? ` · ${STAGE_META[u.childStage].label}` : ""}
              </span>
              {childId && (
                <Button size="xs" variant="ghost" onClick={() => onOpenUser(childId)}>
                  View profile <ArrowUpRight />
                </Button>
              )}
            </div>
          )}
        </Section>

        <Section title="Interests & goals" icon={GraduationCap}>
          <div className="flex flex-wrap gap-1.5">
            {u.interests.map((i) => (
              <span key={i} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary">
                {i}
              </span>
            ))}
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-foreground/85">
            {u.goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </Section>

        {u.student ? (
          <Section title="College programs" icon={Building} count={u.student.assignedCourseIds.length}>
            <p className="mb-2 text-xs text-muted-foreground">
              {u.institution} · Roll no. {u.student.rollNo} · {u.student.assessmentCompleted ? "Career assessment completed" : "Career assessment pending"}
            </p>
            <ul className="space-y-2">
              {u.student.assignedCourseIds.map((id) => {
                const course = getCourse(id);
                const pct = u.student?.progress[id] ?? 0;
                return (
                  <li key={id} className="rounded-lg border bg-card px-3 py-2">
                    <div className="flex items-center justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium">{course?.title ?? id}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-1.5 h-1 [&>[data-slot=progress-indicator]]:bg-brand" />
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : (
          <Section title="Enrolments" icon={ClipboardList} count={myEnrollments.length}>
            {myEnrollments.length ? (
              <ul className="space-y-2">
                {myEnrollments.map((e) => (
                  <EnrollmentRow key={e.id} e={e} />
                ))}
              </ul>
            ) : (
              <Empty>No enrolments yet.</Empty>
            )}
          </Section>
        )}

        {!u.student && (
          <Section title="Orders" icon={Receipt} count={myOrders.length}>
            {myOrders.length ? (
              <ul className="divide-y rounded-lg border bg-card">
                {myOrders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{o.items[0]?.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.id} · {formatDate(o.createdAt)} · {o.method}
                      </p>
                    </div>
                    <span className="font-medium tabular-nums">{formatINR(o.total)}</span>
                    <AutoStatus status={o.paymentStatus} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No orders.</Empty>
            )}
          </Section>
        )}

        {!u.student && (
          <Section title="Bookings" icon={CalendarClock} count={myBookings.length}>
            {myBookings.length ? (
              <ul className="divide-y rounded-lg border bg-card">
                {myBookings.map((b) => {
                  const mentor = getMentor(b.mentorId);
                  const title = b.kind === "live-session" ? getSession(b.sessionId ?? "")?.title : getMentorOffer(b.offerId ?? "")?.offer.title;
                  return (
                    <li key={b.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{title ?? "Mentoring session"}</p>
                        <p className="text-xs text-muted-foreground">
                          {mentor?.name} · {formatDate(b.date, "EEE, d MMM")} · {formatTime(b.time)}
                        </p>
                      </div>
                      <AutoStatus status={b.status} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>No mentoring or live-session bookings.</Empty>
            )}
          </Section>
        )}

        <Section title="Assessment results" icon={ClipboardList} count={myResults.length}>
          {myResults.length ? (
            <ul className="divide-y rounded-lg border bg-card">
              {myResults.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{getAssessment(r.assessmentId)?.title ?? r.assessmentId}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(r.completedOn)}
                      {r.topInterests.length ? ` · ${r.topInterests.slice(0, 2).join(", ")}` : ` · ${r.strengths.slice(0, 2).join(", ")}`}
                    </p>
                  </div>
                  <Button asChild size="xs" variant="outline">
                    <Link href={`/assessment/report/${r.id}`}>
                      Report <ArrowUpRight />
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>{u.student?.assessmentCompleted ? "Completed via the college portal — report shared with the institution." : "No assessments completed yet."}</Empty>
          )}
        </Section>

        <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-info" />
          Identified learner profile. It is stored separately from anonymous discovery analytics, which never link back to named accounts.
        </p>
      </div>
    </>
  );
}

function Item({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="truncate">{v}</dd>
    </div>
  );
}

function EnrollmentRow({ e }: { e: Enrollment }) {
  const course = getCourse(e.courseId);
  const progress = useCourseProgress(e.courseId);
  // Lesson-level progress is tracked live for the demo learner; other learners show their last synced value.
  const pct = e.userId === DEMO_LEARNER_ID ? progress.percent : 10 + (hash(e.userId + e.courseId) % 81);
  return (
    <li className="rounded-lg border bg-card px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/courses/${e.courseId}`} className="min-w-0 flex-1 truncate text-[13px] font-medium hover:underline">
          {course?.title ?? e.courseId}
        </Link>
        <FormatBadge format={e.format} short />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Progress value={pct} className="h-1 flex-1 [&>[data-slot=progress-indicator]]:bg-brand" />
        <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <p className={cn("mt-1 text-[11px] text-muted-foreground")}>
        Enrolled {formatDate(e.enrolledOn)} · {e.source === "free" ? "Free" : e.source === "college" ? "College licence" : "Purchased"}
        {e.userId === DEMO_LEARNER_ID ? ` · ${progress.done}/${progress.total} lessons` : ""}
      </p>
    </li>
  );
}
