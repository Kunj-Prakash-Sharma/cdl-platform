"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronDown, ListChecks, PhoneCall, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { DISCOVERY_STEPS } from "@/data/constants";
import { formatDate, formatINR } from "@/lib/format";
import {
  FOLLOW_UPS,
  PRICE_RANGES,
  SITUATION_CHANGED,
  answerText,
  applyAnswer,
  buildDiscoveryResult,
  clearedAnswer,
  formatPhone,
  getFlow,
  isAnswered,
  nodeInput,
  nodeMessages,
  stepFor,
  suggestMentorId,
  summaryLabel,
  type AssistantMessage,
  type FollowUpId,
  type NodeId,
} from "@/lib/discovery";
import type { DiscoveryAnswers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { demoTimestamp, useDemoStore } from "@/store/demo-store";
import { useHydrated } from "@/store/hooks";
import { getMentor } from "@/data";
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
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { AnswersList, RelevantList } from "./answers-panel";
import { CallbackDialog } from "./callback-dialog";
import {
  AssistantBubble,
  AssistantRow,
  ChatHero,
  CourseSuggestion,
  NoteBubble,
  ProfileReminderCard,
  SystemDivider,
  TypingIndicator,
  VisitorBubble,
} from "./chat-parts";
import { CardsComposer, MultiComposer, PhoneComposer, SingleComposer, TextComposer, chipBase } from "./composer";
import { SnapshotCard } from "./snapshot-card";

// ---------------------------------------------------------------- transcript model

type Extra = { kind: "followup"; id: FollowUpId | "custom"; question: string } | { kind: "callback"; slot: string };

type ChatItem =
  | { key: string; type: "assistant"; message: AssistantMessage }
  | { key: string; type: "visitor"; text: string; node?: NodeId }
  | { key: string; type: "reminder" }
  | { key: string; type: "snapshot" }
  | { key: string; type: "followup-answer"; id: FollowUpId | "custom" }
  | { key: string; type: "divider"; text: string };

const isAssistantSide = (i: ChatItem) => i.type !== "visitor" && i.type !== "divider";

type Returning = "none" | "ask";

const WELCOME_BACK = {
  same: "Nothing changed — show my snapshot",
  update: "Yes, update my details",
};

export function DiscoveryExperience() {
  const hydrated = useHydrated();
  if (!hydrated) return <ChatSkeleton />;
  return <DiscoveryChat />;
}

function ChatSkeleton() {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex flex-1 flex-col bg-muted/40">
        <div className="h-13 border-b bg-background" />
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-8">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="size-14 rounded-full" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
          <Skeleton className="h-16 w-3/4 rounded-2xl" />
        </div>
      </div>
      <div className="hidden w-[340px] border-l bg-card lg:block" />
    </div>
  );
}

function DiscoveryChat() {
  const discovery = useDemoStore((s) => s.discovery);
  const saveDiscovery = useDemoStore((s) => s.saveDiscovery);
  const resetDiscovery = useDemoStore((s) => s.resetDiscovery);
  const packages = useDemoStore((s) => s.packages);

  const { answers, result } = discovery;
  const flow = useMemo(() => getFlow(answers), [answers]);
  const stepIndex = Math.min(Math.max(discovery.stepIndex, 0), flow.length - 1);
  const current = flow[stepIndex];
  const activePackageIds = useMemo(() => packages.filter((p) => p.active).map((p) => p.id), [packages]);

  const [returning, setReturning] = useState<Returning>(() => (current === "snapshot" && result ? "ask" : "none"));
  const [resumed, setResumed] = useState(() => stepIndex > 0 && current !== "snapshot");
  const [typing, setTyping] = useState(false);
  /** After "Yes, update my details": walk through every step from the stage onwards with answers prefilled. */
  const [walkthrough, setWalkthrough] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** Show the typing indicator for a moment before the next assistant messages appear. */
  const think = (ms = 850) => {
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setTyping(false), ms);
  };

  // ------------------------------------------------------------ actions

  const commit = (next: { answers: DiscoveryAnswers; stepIndex: number; node: NodeId }) => {
    const nextResult = next.node === "snapshot" ? buildDiscoveryResult(next.answers, { activePackageIds, createdAt: demoTimestamp() }) : undefined;
    saveDiscovery({ answers: next.answers, stepIndex: next.stepIndex, result: nextResult, startedAt: discovery.startedAt ?? demoTimestamp() });
    setResumed(false);
    setReturning("none");
    think(next.node === "snapshot" ? 1500 : 850);
  };

  const answer = (node: NodeId, patch: Partial<DiscoveryAnswers>) => {
    const next = applyAnswer(answers, node, patch);
    if (!walkthrough) return commit(next);
    const nextFlow = getFlow(next.answers);
    const index = nextFlow.indexOf(node) + 1;
    if (nextFlow[index] === "snapshot") setWalkthrough(false);
    commit({ answers: next.answers, stepIndex: index, node: nextFlow[index] });
  };

  const editStep = (node: NodeId) => {
    const index = flow.indexOf(node);
    if (index < 0) return;
    saveDiscovery({ stepIndex: index });
    setReturning("none");
    setResumed(false);
    setPanelOpen(false);
    think(450);
  };

  const cancelEdit = () => {
    setWalkthrough(false);
    commit(applyAnswer(answers, current, {}));
  };

  const back = () => {
    if (stepIndex === 0) return;
    const prev = flow[stepIndex - 1];
    const cleared = { ...answers, ...clearedAnswer(prev) };
    saveDiscovery({ answers: cleared, stepIndex: getFlow(cleared).indexOf(prev), result: undefined });
    setReturning("none");
    setResumed(false);
    setTyping(false);
  };

  const restart = () => {
    resetDiscovery();
    setExtras([]);
    setWalkthrough(false);
    setReturning("none");
    setResumed(false);
    setPanelOpen(false);
    toast("Conversation restarted", { description: "Your previous answers were cleared." });
    think(700);
  };

  const situationChanged = () => {
    saveDiscovery({ answers: { ...answers, freeText: { ...answers.freeText, situationChanged: "yes" } } });
    think(900);
  };

  const welcomeBack = (choice: string) => {
    if (choice === WELCOME_BACK.same) {
      setReturning("none");
      think(600);
      return;
    }
    saveDiscovery({ stepIndex: flow.indexOf("stage") });
    setReturning("none");
    setWalkthrough(true);
    think(900);
  };

  const askFollowUp = (id: FollowUpId | "custom", question: string) => {
    setExtras((e) => [...e, { kind: "followup", id, question }]);
    think(900);
  };

  // ------------------------------------------------------------ transcript

  const items = useMemo<ChatItem[]>(() => {
    const out: ChatItem[] = [];
    if (returning === "ask") {
      out.push(
        { key: "wb-1", type: "assistant", message: { kind: "text", text: `Welcome back, ${answers.name ?? "there"}! 👋` } },
        {
          key: "wb-2",
          type: "assistant",
          message: {
            kind: "text",
            text: `Last time we put together your career snapshot${result?.createdAt ? ` (${formatDate(result.createdAt)})` : ""}. Has anything changed since then — your education, job or goals?`,
          },
        },
      );
      return out;
    }
    for (let i = 0; i <= stepIndex; i++) {
      const node = flow[i];
      const isCurrent = i === stepIndex;
      if (isCurrent && resumed) out.push({ key: "resumed", type: "divider", text: "Welcome back — let's pick up where you left off" });
      if (node === "stage" && walkthrough) {
        out.push(
          { key: "upd-1", type: "assistant", message: { kind: "text", text: "No problem — let's refresh your details. I'll keep everything that still applies." } },
          { key: "upd-2", type: "reminder" },
        );
      } else if (isCurrent && node !== "snapshot" && isAnswered(node, answers)) {
        out.push({ key: `edit-${node}`, type: "divider", text: `Updating: ${summaryLabel(node, answers)}` });
      }
      nodeMessages(node, answers).forEach((message, j) => out.push({ key: `${node}-m${j}`, type: "assistant", message }));
      if (node === "background" && answers.freeText?.situationChanged) {
        out.push(
          { key: "sc-v", type: "visitor", text: SITUATION_CHANGED },
          { key: "sc-1", type: "assistant", message: { kind: "text", text: "Thanks for telling me — I'll go with what's true for you today." } },
          { key: "sc-2", type: "reminder" },
          { key: "sc-3", type: "assistant", message: { kind: "text", text: "So, where do things stand right now?" } },
        );
      }
      if (node === "snapshot") {
        if (result) out.push({ key: "snapshot", type: "snapshot" });
        extras.forEach((x, j) => {
          if (x.kind === "followup") {
            out.push({ key: `fq-${j}`, type: "visitor", text: x.question }, { key: `fa-${j}`, type: "followup-answer", id: x.id });
          } else {
            out.push({
              key: `cb-${j}`,
              type: "assistant",
              message: { kind: "text", text: `All set — a CDL counsellor will call you ${x.slot.toLowerCase()}. (Demo: no call will actually be made.)` },
            });
          }
        });
      } else if (!isCurrent) {
        out.push({ key: `${node}-a`, type: "visitor", text: answerText(node, answers), node });
      }
    }
    return out;
  }, [answers, extras, flow, result, resumed, returning, stepIndex, walkthrough]);

  // While "typing", hide the trailing assistant group and show the indicator instead.
  let visibleCount = items.length;
  if (typing) {
    while (visibleCount > 0 && isAssistantSide(items[visibleCount - 1])) visibleCount--;
  }
  const visible = items.slice(0, visibleCount);
  let groupStartIndex = visible.length;
  while (groupStartIndex > 0 && isAssistantSide(visible[groupStartIndex - 1])) groupStartIndex--;

  // Auto-scroll: keep the start of the latest assistant group in view (long snapshot cards), else the bottom.
  const scrollKey = `${visible.length}-${typing}-${current}-${returning}`;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const anchor = el.querySelector<HTMLElement>("[data-latest-group]");
    const bottom = el.scrollHeight - el.clientHeight;
    const top = el.querySelector("[data-first-step]") ? 0 : anchor ? Math.min(bottom, anchor.offsetTop - 16) : bottom;
    el.scrollTo({ top, behavior: "smooth" });
  }, [scrollKey]);

  // ------------------------------------------------------------ progress

  const step = returning === "ask" ? stepFor("snapshot") : stepFor(current);
  const totalSteps = DISCOVERY_STEPS.length;
  const editing = current !== "snapshot" && isAnswered(current, answers) && returning === "none";
  const mentor = getMentor(suggestMentorId(answers));

  // ------------------------------------------------------------ render

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted/40">
        {/* Toolbar */}
        <div className="border-b bg-background">
          <div className="mx-auto flex h-13 max-w-3xl items-center gap-2 px-2 sm:gap-3 sm:px-4">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={back} disabled={stepIndex === 0 || returning === "ask" || typing} aria-label="Back — undo last answer">
              <ArrowLeft /> <span className="max-sm:sr-only">Back</span>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="truncate font-medium">
                  <span className="text-muted-foreground">
                    Step {step.order} of {totalSteps} ·{" "}
                  </span>
                  {step.label}
                </span>
              </div>
              <div className="mt-1.5 flex gap-1" aria-hidden="true">
                {DISCOVERY_STEPS.map((s) => (
                  <span
                    key={s.id}
                    className={cn("h-1.5 flex-1 rounded-full bg-muted", s.order < step.order && "bg-brand", s.order === step.order && "bg-brand/45")}
                  />
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 lg:hidden"
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              aria-controls="discovery-answers-panel"
            >
              <ListChecks /> <span className="max-[380px]:sr-only">Answers</span>
              <ChevronDown className={cn("transition", panelOpen && "rotate-180")} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setRestartOpen(true)} aria-label="Restart conversation" title="Restart conversation">
              <RotateCcw />
            </Button>
          </div>
          {/* Mobile answers panel */}
          <Collapsible open={panelOpen} onOpenChange={setPanelOpen} className="lg:hidden">
            <CollapsibleTrigger className="sr-only">Toggle your answers</CollapsibleTrigger>
            <CollapsibleContent id="discovery-answers-panel" className="max-h-[55dvh] overflow-y-auto border-t bg-card px-4 py-4">
              <div className="mx-auto max-w-3xl space-y-5">
                <AnswersList flow={flow} answers={answers} current={returning === "ask" ? "snapshot" : current} onEdit={editStep} disabled={typing} />
                <RelevantList answers={answers} compact />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain" aria-live="polite">
          <div className="mx-auto max-w-3xl space-y-3 px-3 pt-6 pb-8 sm:px-6">
            <div {...(current === "contact" && returning === "none" ? { "data-first-step": "" } : {})}>
              <ChatHero />
            </div>
            {visible.map((item, index) => {
              const prev = visible[index - 1];
              const firstInGroup = !prev || !isAssistantSide(prev);
              const anchor = index === groupStartIndex ? { "data-latest-group": "" } : {};
              return (
                <div key={item.key} {...anchor}>
                  <ChatItemView
                    item={item}
                    answers={answers}
                    firstInGroup={firstInGroup}
                    resultReady={!!result}
                    mentorId={mentor?.id}
                    onEdit={editStep}
                    onCallback={() => setCallbackOpen(true)}
                    disabled={typing}
                  />
                </div>
              );
            })}
            {typing && (
              <div data-latest-group="">
                <TypingIndicator />
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t bg-background/95 backdrop-blur">
          <div className="mx-auto max-w-3xl px-3 pt-3 sm:px-6">
            {editing && !typing && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-secondary px-3 py-1.5 text-xs">
                <span className="font-medium text-primary">
                  {walkthrough ? "Reviewing your details — confirm or change each answer." : "Editing your answer — later answers are kept where they still apply."}
                </span>
                <button type="button" onClick={cancelEdit} className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" /> {walkthrough ? "Skip to snapshot" : "Cancel"}
                </button>
              </div>
            )}
            <div className={cn("transition-opacity", typing && "pointer-events-none opacity-50")} aria-busy={typing}>
              {returning === "ask" ? (
                <SingleComposer label="Quick reply" options={[WELCOME_BACK.same, WELCOME_BACK.update]} onSelect={welcomeBack} />
              ) : current === "snapshot" ? (
                <SingleComposer
                  key="followups"
                  label="Continue the conversation"
                  options={FOLLOW_UPS.filter((f) => !extras.some((x) => x.kind === "followup" && x.id === f.id)).map((f) => f.question)}
                  onSelect={(q) => {
                    const f = FOLLOW_UPS.find((x) => x.question === q);
                    if (f) askFollowUp(f.id, f.question);
                  }}
                  customPlaceholder="Ask a question…"
                  onCustom={(q) => askFollowUp("custom", q)}
                  extraChips={
                    <button type="button" className={cn(chipBase, "border-brand/40 bg-brand-soft text-brand hover:bg-brand-soft/70")} onClick={() => setCallbackOpen(true)}>
                      <PhoneCall className="size-3.5" /> Request a callback
                    </button>
                  }
                />
              ) : (
                <NodeComposer key={`${current}-${stepIndex}`} node={current} answers={answers} onAnswer={answer} onAside={situationChanged} />
              )}
            </div>
          </div>
          {/* Leaves room for the floating demo switcher at bottom-left. */}
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-end px-3 text-right text-[11px] leading-tight text-muted-foreground sm:px-6">
            <span className="max-w-[60%] sm:max-w-none">Free · No registration · Demo data only</span>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-l bg-card lg:block" aria-label="Your discovery summary">
        <div className="space-y-7 p-5">
          <AnswersList flow={flow} answers={answers} current={returning === "ask" ? "snapshot" : current} onEdit={editStep} disabled={typing} />
          <RelevantList answers={answers} />
          <div className="rounded-xl border bg-background p-4">
            <p className="text-sm font-semibold">Prefer to talk to a person?</p>
            <p className="mt-1 text-xs text-muted-foreground">A CDL career counsellor can call you back at a time that suits you.</p>
            <Button variant="outline" className="mt-3 h-9 w-full" onClick={() => setCallbackOpen(true)}>
              <PhoneCall /> Request a callback
            </Button>
          </div>
        </div>
      </aside>

      <CallbackDialog
        open={callbackOpen}
        onOpenChange={setCallbackOpen}
        defaultName={answers.name}
        defaultPhone={answers.phone}
        defaultTopic={answers.persona === "parent" ? "My child's career options" : undefined}
        onRequested={(slot) => {
          if (current === "snapshot" && returning === "none") {
            setExtras((e) => [...e, { kind: "callback", slot }]);
          }
        }}
      />

      <AlertDialog open={restartOpen} onOpenChange={setRestartOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart the conversation?</AlertDialogTitle>
            <AlertDialogDescription>All your answers{result ? " and your career snapshot" : ""} will be cleared and we&apos;ll start again from the beginning.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep going</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={restart}>
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------- item rendering

function ChatItemView({
  item,
  answers,
  firstInGroup,
  resultReady,
  mentorId,
  onEdit,
  onCallback,
  disabled,
}: {
  item: ChatItem;
  answers: DiscoveryAnswers;
  firstInGroup: boolean;
  resultReady: boolean;
  mentorId?: string;
  onEdit: (node: NodeId) => void;
  onCallback: () => void;
  disabled: boolean;
}) {
  switch (item.type) {
    case "divider":
      return <SystemDivider>{item.text}</SystemDivider>;
    case "visitor":
      return (
        <VisitorBubble
          onEdit={item.node && !disabled ? () => onEdit(item.node!) : undefined}
          editLabel={item.node ? `Edit ${summaryLabel(item.node, answers).toLowerCase()}` : undefined}
        >
          {item.text}
        </VisitorBubble>
      );
    case "reminder":
      return (
        <AssistantRow showAvatar={firstInGroup}>
          <ProfileReminderCard />
        </AssistantRow>
      );
    case "snapshot":
      return resultReady ? <SnapshotSlot answers={answers} onCallback={onCallback} /> : null;
    case "followup-answer":
      return (
        <AssistantRow showAvatar={firstInGroup}>
          <FollowUpAnswer id={item.id} mentorId={mentorId} onCallback={onCallback} />
        </AssistantRow>
      );
    case "assistant": {
      const m = item.message;
      return (
        <AssistantRow showAvatar={firstInGroup}>
          {m.kind === "text" ? (
            <AssistantBubble>{m.text}</AssistantBubble>
          ) : m.kind === "note" ? (
            <NoteBubble>{m.text}</NoteBubble>
          ) : (
            <CourseSuggestion lead={m.lead} courseId={m.courseId} format={m.format} reason={m.reason} />
          )}
        </AssistantRow>
      );
    }
  }
}

function SnapshotSlot({ answers, onCallback }: { answers: DiscoveryAnswers; onCallback: () => void }) {
  const result = useDemoStore((s) => s.discovery.result);
  if (!result) return null;
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-3 pt-1 duration-500 sm:pl-10.5">
      <SnapshotCard result={result} answers={answers} onRequestCallback={onCallback} />
    </div>
  );
}

function FollowUpAnswer({ id, mentorId, onCallback }: { id: FollowUpId | "custom"; mentorId?: string; onCallback: () => void }) {
  const mentor = mentorId ? getMentor(mentorId) : undefined;
  const packages = useDemoStore((s) => s.packages);
  const suggestedId = useDemoStore((s) => s.discovery.result?.suggestedPackageId);
  const pkg = packages.find((p) => p.id === suggestedId && p.active);

  const link = (href: string, label: string) => (
    <Button asChild variant="outline" size="sm" className="h-8 bg-background">
      <Link href={href}>
        {label} <ArrowRight />
      </Link>
    </Button>
  );
  const callback = (
    <Button variant="outline" size="sm" className="h-8 bg-background" onClick={onCallback}>
      <PhoneCall /> Request a callback
    </Button>
  );

  const content: Record<FollowUpId | "custom", { text: React.ReactNode; actions: React.ReactNode }> = {
    "live-cohort": {
      text: "A Live Cohort is a small group (usually 25–40 learners) that meets for guided evening sessions — typically 7:00–8:30 PM IST, twice a week. You get everything in Self-Paced, plus live classes with a mentor, recordings if you miss one, doubt-clearing and assignments with feedback.",
      actions: link("/programs", "Compare learning formats"),
    },
    "mentor-first": {
      text: (
        <>
          Absolutely. You can book a one-to-one session{mentor ? ` with a mentor like ${mentor.name}` : ""} before committing to a programme — or request a free callback
          and a counsellor will help you choose.
        </>
      ),
      actions: (
        <>
          {mentor && link(`/mentors/${mentor.id}`, `View ${mentor.name.replace(/^Dr\. /, "").split(" ")[0]}'s profile`)}
          {callback}
        </>
      ),
    },
    cost: {
      text: (
        <>
          Career Discovery Fundamentals is free. Other Self-Paced courses start from {formatINR(PRICE_RANGES.selfPacedFrom)}, Live Cohorts range from{" "}
          {formatINR(PRICE_RANGES.liveFrom)} to {formatINR(PRICE_RANGES.liveTo)}, and One-to-One Mentoring sessions start from {formatINR(PRICE_RANGES.mentoringFrom)}.
          {pkg && (
            <>
              {" "}
              Your suggested <strong>{pkg.name}</strong> is {formatINR(pkg.price)}
              {pkg.compareAt ? ` (save ${formatINR(pkg.compareAt - pkg.price)})` : ""}.
            </>
          )}
        </>
      ),
      actions: link("/courses", "Explore all courses"),
    },
    assessment: {
      text: "Yes — the CDL Career Compass is an 18-question reflection (about 12 minutes) on your interests, work style and personality. You'll get an illustrative report with strengths, development areas and suggested learning.",
      actions: link("/assessment/career-compass", "Take the Career Compass"),
    },
    certificate: {
      text: "Yes — you receive a certificate of completion when you finish a course's lessons and assignments. It's a CDL learning certificate, not a university credential.",
      actions: link("/courses", "Browse courses"),
    },
    custom: {
      text: "Great question! I'm a demo guide, so I can only answer a few common questions for now. Pick one below — or request a callback and a CDL counsellor will help you personally.",
      actions: callback,
    },
  };
  const c = content[id];
  return (
    <div className="space-y-2">
      <AssistantBubble>{c.text}</AssistantBubble>
      <div className="flex flex-wrap gap-2">{c.actions}</div>
    </div>
  );
}

// ---------------------------------------------------------------- composer per node

function NodeComposer({
  node,
  answers,
  onAnswer,
  onAside,
}: {
  node: NodeId;
  answers: DiscoveryAnswers;
  onAnswer: (node: NodeId, patch: Partial<DiscoveryAnswers>) => void;
  onAside: () => void;
}) {
  const spec = nodeInput(node, answers);
  switch (spec.kind) {
    case "phone":
      return <PhoneComposer onSubmit={(digits) => onAnswer("contact", { phone: formatPhone(digits) })} />;
    case "text":
      return (
        <TextComposer
          label={summaryLabel(node, answers)}
          placeholder={spec.placeholder}
          suggestions={spec.suggestions}
          aside={spec.aside}
          minLength={spec.minLength}
          maxLength={spec.maxLength}
          initial={node === "name" ? answers.name : node === "childName" ? answers.childName : node === "background" ? answers.background : undefined}
          onAside={onAside}
          onSubmit={(text) => {
            const value = node === "background" ? text : text.replace(/\b\w/g, (c) => c.toUpperCase());
            onAnswer(node, node === "name" ? { name: value } : node === "childName" ? { childName: value } : { background: value });
          }}
        />
      );
    case "cards":
      return (
        <CardsComposer
          options={spec.options}
          value={node === "persona" ? answers.persona : answers.stage}
          onSelect={(value) =>
            onAnswer(node, node === "persona" ? { persona: value as DiscoveryAnswers["persona"] } : { stage: value as DiscoveryAnswers["stage"] })
          }
        />
      );
    case "multi":
      return (
        <MultiComposer
          options={spec.options}
          max={spec.max}
          customPlaceholder={spec.customPlaceholder}
          initial={node === "interests" ? answers.interests : answers.challenges}
          onSubmit={(values) => onAnswer(node, node === "interests" ? { interests: values } : { challenges: values })}
        />
      );
    case "single":
      return (
        <SingleComposer
          label="Choose one"
          options={spec.options}
          value={answers.goals[0]}
          customPlaceholder={spec.customPlaceholder}
          onSelect={(goal) => onAnswer("goals", { goals: [goal] })}
        />
      );
    case "none":
      return (
        <div className="flex items-center justify-between gap-3 py-2 text-sm text-muted-foreground">
          Something went wrong with this step.
          <Button variant="outline" size="sm" onClick={() => onAnswer(node, {})}>
            Continue <ArrowRight />
          </Button>
        </div>
      );
  }
}
