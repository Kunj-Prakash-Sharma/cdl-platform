"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, Check, CircleDashed, MessageSquareOff, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusPill } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { getCourse } from "@/data";
import { DISCOVERY_STEPS, STAGE_META } from "@/data/constants";
import type { AnonymousConversation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FOLLOW_UP_META, FOLLOW_UPS, formatSeconds, formatStarted, OUTCOME_META, outcomeOf, stepIndex, type FollowUp, type Outcome } from "./metrics";

type Action = { label: string; description: string; status: FollowUp; toast: string };

function recommendedActions(c: AnonymousConversation, outcome: Outcome): Action[] {
  const early = stepIndex(c.lastStepId) < 4;
  switch (outcome) {
    case "purchased":
      return [
        { label: "Mark as converted", description: "Close the loop — the visitor purchased and now has a learner account.", status: "converted", toast: "Session marked as converted" },
        { label: "Send onboarding welcome", description: "A welcome message with the first live class date (simulated).", status: "converted", toast: "Welcome message queued (simulated)" },
      ];
    case "checkout":
      return [
        { label: "Send checkout reminder", description: "Reminder with the LIVE15 offer, 24 hours after the abandoned checkout.", status: "follow-up-scheduled", toast: "Checkout reminder scheduled (simulated)" },
        { label: "Schedule advisor call", description: "Resolve pricing or batch-timing questions on a short call.", status: "follow-up-scheduled", toast: "Advisor call scheduled for tomorrow, 6–8 PM" },
      ];
    case "viewed":
      return [
        { label: "Send program brochure", description: "Share the program outline and next cohort dates.", status: "nurture", toast: "Brochure added to nurture sequence (simulated)" },
        { label: "Schedule advisor call", description: "Help the visitor choose between Self-Paced and Live Cohort.", status: "follow-up-scheduled", toast: "Advisor call scheduled for tomorrow, 6–8 PM" },
      ];
    case "snapshot":
      return [
        { label: "Share snapshot recap", description: "Send the career snapshot summary with two recommended programs.", status: "nurture", toast: "Snapshot recap queued (simulated)" },
        { label: "Offer an advisor callback", description: "Invite the visitor to talk through the snapshot with an advisor.", status: "callback-requested", toast: "Callback offer sent (simulated)" },
      ];
    default:
      return early
        ? [{ label: "Add to nurture sequence", description: "Three short messages inviting the visitor to resume discovery.", status: "nurture", toast: "Added to nurture sequence (simulated)" }]
        : [
            { label: "Send “resume where you left off”", description: "A link that reopens the conversation at the step they left.", status: "nurture", toast: "Resume link queued (simulated)" },
            { label: "Offer an advisor callback", description: "For visitors who answered most questions but did not finish.", status: "callback-requested", toast: "Callback offer sent (simulated)" },
          ];
  }
}

type Milestone = { id: string; label: string; state: "reached" | "dropped" | "pending" };

function journey(c: AnonymousConversation): Milestone[] {
  const last = stepIndex(c.lastStepId);
  const steps: Milestone[] = DISCOVERY_STEPS.map((s, i) => ({
    id: s.id,
    label: s.label,
    state: c.completed ? "reached" : i < last ? "reached" : i === last ? "dropped" : "pending",
  }));
  const after: Milestone[] = [
    { id: "program", label: "Program viewed", state: c.programViewed ? "reached" : "pending" },
    { id: "checkout", label: "Checkout started", state: c.checkoutStarted ? "reached" : "pending" },
    { id: "purchase", label: "Purchase completed", state: c.purchased ? "reached" : "pending" },
  ];
  return [...steps, ...after];
}

export function ConversationSheet({
  conversation,
  followUp,
  onFollowUpChange,
  onOpenChange,
}: {
  conversation: AnonymousConversation | undefined;
  followUp: FollowUp;
  onFollowUpChange: (id: string, v: FollowUp) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const c = conversation;
  return (
    <Sheet open={!!c} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {c && <SheetBody c={c} followUp={followUp} onFollowUpChange={onFollowUpChange} />}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({ c, followUp, onFollowUpChange }: { c: AnonymousConversation; followUp: FollowUp; onFollowUpChange: (id: string, v: FollowUp) => void }) {
  const outcome = outcomeOf(c);
  const started = formatStarted(c.startedAt);
  const program = c.programViewed ? getCourse(c.programViewed) : undefined;
  const steps = journey(c);
  const actions = recommendedActions(c, outcome);

  return (
    <>
      <SheetHeader className="border-b bg-muted/40 px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <SheetTitle className="font-mono text-lg font-semibold">{c.id}</SheetTitle>
          <StatusPill tone={OUTCOME_META[outcome].tone}>{OUTCOME_META[outcome].label}</StatusPill>
          <StatusPill tone={c.completed ? "success" : "danger"} dot={false}>
            {c.completed ? "Completed" : "Abandoned"}
          </StatusPill>
        </div>
        <SheetDescription>
          Anonymous discovery session · {started.day}, {started.time} · {c.source} · {c.device}
          {c.city ? ` · ${c.city}` : ""}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-5 py-5">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Messages", v: String(c.messages) },
            { k: "Duration", v: formatSeconds(c.durationSec) },
            { k: "Stage", v: c.stage ? STAGE_META[c.stage].label : "Not shared" },
            { k: "Interest", v: c.interestCategory ?? "Not reached" },
          ].map((s) => (
            <div key={s.k} className="rounded-lg border bg-card px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">{s.k}</dt>
              <dd className="truncate text-sm font-semibold">{s.v}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-1.5">
          <Label htmlFor={`fu-${c.id}`}>Suggested follow-up status</Label>
          <Select value={followUp} onValueChange={(v) => onFollowUpChange(c.id, v as FollowUp)}>
            <SelectTrigger id={`fu-${c.id}`} className="h-9 w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLLOW_UPS.map((f) => (
                <SelectItem key={f} value={f}>
                  {FOLLOW_UP_META[f].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Journey</h3>
          <ol className="relative space-y-0">
            {steps.map((s, i) => (
              <li key={s.id} className="relative flex gap-3 pb-3 last:pb-0">
                {i < steps.length - 1 && (
                  <span className={cn("absolute top-6 bottom-0 left-[11px] w-px", s.state === "reached" ? "bg-success/40" : "bg-border")} />
                )}
                <span
                  className={cn(
                    "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-popover",
                    s.state === "reached" && "bg-success text-white",
                    s.state === "dropped" && "bg-destructive text-white",
                    s.state === "pending" && "border border-dashed border-muted-foreground/40 bg-popover text-muted-foreground/60",
                  )}
                >
                  {s.state === "reached" ? <Check className="size-3.5" /> : s.state === "dropped" ? <X className="size-3.5" /> : <CircleDashed className="size-3" />}
                </span>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 pt-0.5">
                  <span className={cn("text-sm", s.state === "pending" ? "text-muted-foreground" : "font-medium")}>
                    {i === DISCOVERY_STEPS.length && <span className="mr-1.5 text-[11px] font-normal tracking-wide text-muted-foreground uppercase">After chat ·</span>}
                    {s.label}
                  </span>
                  {s.state === "dropped" && <span className="text-xs font-medium text-destructive">Left the conversation here</span>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Transcript</h3>
          {c.transcript ? (
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-xl border bg-muted/30 p-3">
              {c.transcript.map((m, i) => (
                <div key={i} className={cn("flex", m.from === "visitor" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug",
                      m.from === "visitor" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-card",
                    )}
                  >
                    <p>{m.text}</p>
                    <p className={cn("mt-0.5 text-[10px]", m.from === "visitor" ? "text-primary-foreground/70" : "text-muted-foreground")}>{m.at}</p>
                  </div>
                </div>
              ))}
              {!c.completed && (
                <p className="pt-1 text-center text-[11px] font-medium text-destructive">Visitor left without answering</p>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
              <MessageSquareOff className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">Transcript not retained for this sample session</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Only step-level events (reached / left) are kept for most anonymous sessions. Open V-20488, V-20486 or V-20483 to see example transcripts.</p>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Program viewed</h3>
          {program ? (
            <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <CourseThumbnail course={program} size="sm" className="w-24 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{program.title}</p>
                <p className="text-xs text-muted-foreground">
                  {program.category} · {c.purchased ? "Purchased" : c.checkoutStarted ? "Checkout started, not completed" : "Viewed, no checkout"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${program.id}`}>
                  Open <ArrowUpRight />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed bg-muted/40 p-3 text-sm text-muted-foreground">No program page was opened in this session.</p>
          )}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold">Recommended follow-up</h3>
          <ul className="space-y-2">
            {actions.map((a) => (
              <li key={a.label} className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-brand text-brand-foreground hover:bg-brand/90"
                  onClick={() => {
                    onFollowUpChange(c.id, a.status);
                    toast.success(a.toast, { description: `${c.id} follow-up status → ${FOLLOW_UP_META[a.status].label}` });
                  }}
                >
                  {a.label.split(" ")[0]}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-info" />
          This session is anonymous. Contact details are masked and it is not linked to any identified learner profile.
        </p>
      </div>
    </>
  );
}
