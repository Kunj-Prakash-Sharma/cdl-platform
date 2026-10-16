"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Layers, PhoneCall, Sparkles, Target, TrendingUp } from "lucide-react";
import { getCourse, getMentor } from "@/data";
import { DEMO_TODAY, STAGE_META } from "@/data/constants";
import { formatDate, formatINR } from "@/lib/format";
import { interestProfile, suggestMentorId, trackOf } from "@/lib/discovery";
import type { DiscoveryAnswers, DiscoveryResult, LearningFormat } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { useMentors } from "@/store/hooks";
import { DemoBadge, FormatBadge } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { Portrait, avatarFromName } from "@/components/shared/portrait";
import { Rating } from "@/components/shared/cards";
import { Button } from "@/components/ui/button";

export function SnapshotCard({
  result,
  answers,
  onRequestCallback,
}: {
  result: DiscoveryResult;
  answers: DiscoveryAnswers;
  onRequestCallback: () => void;
}) {
  const router = useRouter();
  const setCheckout = useDemoStore((s) => s.setCheckout);
  const packages = useDemoStore((s) => s.packages);
  const mentors = useMentors();

  const profile = useMemo(() => interestProfile(answers).slice(0, 4), [answers]);
  const track = trackOf(answers);
  const pkg = useMemo(() => {
    const active = packages.filter((p) => p.active);
    return active.find((p) => p.id === result.suggestedPackageId) ?? active[0];
  }, [packages, result.suggestedPackageId]);
  const mentor = useMemo(() => {
    const id = suggestMentorId(answers);
    const m = mentors.find((x) => x.id === id && x.status === "active");
    return m ?? getMentor("m-meera");
  }, [answers, mentors]);

  const who = track === "parent" ? answers.childName : answers.name;
  const stageLabel = track === "parent" ? `Parent of ${answers.childName ?? "a learner"}` : answers.stage ? STAGE_META[answers.stage].label : "";

  const enroll = (courseId: string, format: LearningFormat) => {
    setCheckout({ kind: "course", refId: courseId, format });
    router.push("/checkout");
  };
  const buyPackage = (id: string) => {
    setCheckout({ kind: "package", refId: id });
    router.push("/checkout");
  };

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-md" aria-label="Your career snapshot">
      {/* Header */}
      <div className="relative isolate overflow-hidden bg-navy px-5 py-6 text-navy-foreground sm:px-7">
        <svg className="absolute -top-16 -right-10 -z-10 size-64 opacity-25" viewBox="0 0 200 200" aria-hidden="true">
          {[30, 50, 70, 90].map((r) => (
            <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="white" strokeOpacity={0.35} />
          ))}
        </svg>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-white/15">
            <Sparkles className="size-3.5 text-brand-soft" /> Career snapshot
          </span>
          <DemoBadge>Illustrative demo result</DemoBadge>
        </div>
        <h2 className="mt-3 max-w-2xl font-heading text-xl leading-snug font-semibold text-balance sm:text-2xl">{result.headline}</h2>
        <div className="mt-4 flex items-center gap-3">
          <Portrait avatar={avatarFromName(who ?? "Learner")} name={who ?? "Learner"} className="size-10 ring-2 ring-white/20" />
          <div className="text-sm">
            <p className="font-semibold">{track === "parent" ? `${answers.childName}'s snapshot` : answers.name}</p>
            <p className="text-white/65">
              {stageLabel} · {formatDate(DEMO_TODAY)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 px-5 py-6 sm:px-7">
        <p className="text-[15px] leading-relaxed text-foreground/90">{result.summary}</p>

        {/* Interests + development */}
        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-xl border bg-background p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Compass className="size-4 text-brand" /> Interest areas
            </h3>
            <ul className="mt-3 space-y-2.5">
              {profile.map((p, i) => (
                <li key={p.key}>
                  <div className="flex items-baseline justify-between gap-2 text-[13px]">
                    <span className={i < 3 ? "font-medium" : "text-muted-foreground"}>{p.label}</span>
                    <span className="text-[11px] text-muted-foreground">{i === 0 ? "Strongest" : i < 3 ? "Strong" : "Moderate"}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${p.value}%`, opacity: i < 3 ? 1 : 0.45 }} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {answers.interests.map((i) => (
                <span key={i} className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                  {i}
                </span>
              ))}
            </div>
          </section>
          <section className="rounded-xl border bg-background p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-warning" /> Development areas
            </h3>
            <ul className="mt-3 space-y-2">
              {result.developmentAreas.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" />
                  {d}
                </li>
              ))}
            </ul>
            {answers.goals[0] && (
              <div className="mt-4 rounded-lg bg-secondary px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-primary uppercase">
                  <Target className="size-3.5" /> Next goal
                </p>
                <p className="mt-0.5 text-sm font-medium">{answers.goals[0]}</p>
              </div>
            )}
          </section>
        </div>

        {/* Recommendations */}
        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h3 className="font-heading text-base font-semibold">Recommended for you</h3>
              <p className="text-sm text-muted-foreground">Three programmes matched to your answers.</p>
            </div>
          </div>
          <ul className="mt-3 space-y-3">
            {result.recommendations.map((r, i) => {
              const course = getCourse(r.courseId);
              if (!course) return null;
              const price = course.pricing[r.format] ?? 0;
              return (
                <li key={r.courseId} className="flex flex-col gap-3 rounded-xl border bg-background p-3 sm:flex-row sm:items-stretch">
                  <div className="relative sm:w-44 sm:shrink-0">
                    <CourseThumbnail course={course} showCategory={false} className="h-full max-sm:aspect-[2.2/1]" />
                    <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-primary">#{i + 1} match</span>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <FormatBadge format={r.format} />
                      <Rating value={course.rating} count={course.reviewCount} />
                    </div>
                    <p className="mt-1.5 font-heading font-semibold">{course.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Why it fits: </span>
                      {r.reason}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-auto sm:pt-3">
                      <span className="mr-auto font-heading text-lg font-semibold">{formatINR(price, { free: true })}</span>
                      <Button asChild variant="outline" className="h-9">
                        <Link href={`/courses/${course.id}`}>View program</Link>
                      </Button>
                      {price > 0 ? (
                        <Button className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90" onClick={() => enroll(course.id, r.format)}>
                          Enroll <ArrowRight />
                        </Button>
                      ) : (
                        <Button asChild className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90">
                          <Link href={`/courses/${course.id}`}>
                            Start free <ArrowRight />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Package + mentor */}
        <div className="grid gap-4 lg:grid-cols-5">
          {pkg && (
            <section className="relative overflow-hidden rounded-xl border border-brand/25 bg-brand-soft/60 p-4 lg:col-span-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-brand uppercase">
                <Layers className="size-3.5" /> Suggested programme
              </p>
              <h3 className="mt-1.5 font-heading text-base font-semibold">{pkg.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{pkg.description}</p>
              <ul className="mt-2.5 space-y-1 text-[13px]">
                {pkg.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="mr-auto">
                  <span className="font-heading text-lg font-semibold">{formatINR(pkg.price)}</span>
                  {pkg.compareAt && <span className="ml-2 text-sm text-muted-foreground line-through">{formatINR(pkg.compareAt)}</span>}
                  {pkg.compareAt && (
                    <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">Save {formatINR(pkg.compareAt - pkg.price)}</span>
                  )}
                  <p className="text-xs text-muted-foreground">Valid {pkg.validity}</p>
                </div>
                <Button className="h-9 px-3.5" onClick={() => buyPackage(pkg.id)}>
                  Get this programme <ArrowRight />
                </Button>
              </div>
            </section>
          )}
          {mentor && (
            <section className="flex flex-col rounded-xl border bg-background p-4 lg:col-span-2">
              <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Mentor who can help</p>
              <div className="mt-2.5 flex items-center gap-3">
                <Portrait avatar={mentor.avatar} name={mentor.name} className="size-12" rounded="xl" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{mentor.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{mentor.title}</p>
                  <Rating value={mentor.rating} count={mentor.reviewCount} className="mt-0.5" />
                </div>
              </div>
              <p className="mt-2.5 line-clamp-2 text-xs text-muted-foreground">{mentor.headline}</p>
              <Button asChild variant="outline" className="mt-3 h-9 lg:mt-auto">
                <Link href={`/mentors/${mentor.id}`}>Talk to {mentor.name.replace(/^Dr\. /, "").split(" ")[0]}</Link>
              </Button>
            </section>
          )}
        </div>

        {/* CTAs */}
        <section className="rounded-xl bg-muted/60 p-4">
          <p className="text-sm font-semibold">What would you like to do next?</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="h-10 justify-start bg-background" onClick={onRequestCallback}>
              <PhoneCall className="text-brand" /> Request a callback
            </Button>
            <Button asChild variant="outline" className="h-10 justify-start bg-background">
              <Link href="/assessment/career-compass">
                <Compass className="text-brand" /> Take full assessment
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-10 justify-start bg-background">
              <Link href="/courses">
                <Layers className="text-brand" /> Explore the platform
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            This snapshot is generated from your answers using simple, transparent rules — it is not a psychometric assessment. For a deeper view, take the 12-minute
            Career Compass.
          </p>
        </section>
      </div>
    </article>
  );
}
