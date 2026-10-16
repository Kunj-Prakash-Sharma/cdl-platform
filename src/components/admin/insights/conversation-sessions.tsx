"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquareText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { conversations } from "@/data";
import { DISCOVERY_STEPS, STAGE_META } from "@/data/constants";
import type { AnonymousConversation, DiscoveryStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  FOLLOW_UP_META,
  FOLLOW_UPS,
  formatSeconds,
  formatStarted,
  lastCompletedStep,
  OUTCOME_META,
  outcomeOf,
  stepLabel,
  type FollowUp,
} from "./metrics";
import { ChartCard, Segmented } from "./ui";

const PAGE_SIZE = 10;
const SOURCES = Array.from(new Set(conversations.map((c) => c.source)));

type StatusFilter = "all" | "completed" | "abandoned";

export function ConversationSessions({
  followUps,
  onFollowUpChange,
  onOpen,
}: {
  followUps: Record<string, FollowUp>;
  onFollowUpChange: (id: string, v: FollowUp) => void;
  onOpen: (c: AnonymousConversation) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [step, setStep] = useState<"all" | DiscoveryStep["id"]>("all");
  const [source, setSource] = useState<string>("all");
  const [follow, setFollow] = useState<"all" | FollowUp>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => {
      if (status === "completed" && !c.completed) return false;
      if (status === "abandoned" && c.completed) return false;
      if (step !== "all" && c.lastStepId !== step) return false;
      if (source !== "all" && c.source !== source) return false;
      if (follow !== "all" && (followUps[c.id] ?? c.followUp) !== follow) return false;
      if (q) {
        const hay = [c.id, c.city, c.source, c.device, c.interestCategory, c.stage ? STAGE_META[c.stage].label : ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query, status, step, source, follow, followUps]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const hasFilters = query || status !== "all" || step !== "all" || source !== "all" || follow !== "all";
  const completedCount = conversations.filter((c) => c.completed).length;

  const reset = () => {
    setQuery("");
    setStatus("all");
    setStep("all");
    setSource("all");
    setFollow("all");
    setPage(0);
  };

  return (
    <ChartCard
      title="Anonymous conversation sessions"
      description={`Sample of ${conversations.length} recent discovery sessions · ${completedCount} completed, ${conversations.length - completedCount} abandoned. Click a row for the full journey.`}
    >
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative w-full lg:w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search sessions"
            placeholder="Search session, city, interest…"
            className="h-9 pl-8"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <Segmented
          label="Completion"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(0);
          }}
          options={[
            { value: "all", label: "All" },
            { value: "completed", label: "Completed" },
            { value: "abandoned", label: "Abandoned" },
          ]}
        />
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Select
            value={step}
            onValueChange={(v) => {
              setStep(v as typeof step);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by last step">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All last steps</SelectItem>
              {DISCOVERY_STEPS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.id === "snapshot" ? "Reached snapshot" : `Left at ${s.label}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={source}
            onValueChange={(v) => {
              setSource(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filter by source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={follow}
            onValueChange={(v) => {
              setFollow(v as typeof follow);
              setPage(0);
            }}
          >
            <SelectTrigger className="col-span-2 h-9 w-full sm:w-48" aria-label="Filter by follow-up status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All follow-up statuses</SelectItem>
              {FOLLOW_UPS.map((f) => (
                <SelectItem key={f} value={f}>
                  {FOLLOW_UP_META[f].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={reset} className="self-start lg:self-auto">
            <X /> Clear
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={MessageSquareText}
          title="No sessions match these filters"
          description="Try a different step, source or follow-up status."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Last completed question</TableHead>
                  <TableHead className="text-right">Msgs · time</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead className="w-44">Follow-up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((c) => {
                  const started = formatStarted(c.startedAt);
                  const outcome = OUTCOME_META[outcomeOf(c)];
                  const lastDone = lastCompletedStep(c);
                  const fu = followUps[c.id] ?? c.followUp;
                  return (
                    <TableRow
                      key={c.id}
                      tabIndex={0}
                      onClick={() => onOpen(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onOpen(c);
                      }}
                      className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                      aria-label={`Open session ${c.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[13px] font-semibold">{c.id}</span>
                          {c.transcript && <MessageSquareText className="size-3.5 text-brand" aria-label="Transcript available" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{c.city ?? "—"}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-[13px]">{started.day}</div>
                        <div className="text-xs text-muted-foreground">{started.time}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[13px]">{c.source}</div>
                        <div className="text-xs text-muted-foreground">{c.device}</div>
                      </TableCell>
                      <TableCell className="text-[13px]">{c.stage ? STAGE_META[c.stage].label : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <div className="text-[13px] font-medium">{lastDone ? lastDone.label : <span className="font-normal text-muted-foreground">None</span>}</div>
                        {!c.completed && <div className="text-xs text-destructive">Left at {stepLabel(c.lastStepId)}</div>}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <div className="text-[13px]">{c.messages} msgs</div>
                        <div className="text-xs text-muted-foreground">{formatSeconds(c.durationSec)}</div>
                      </TableCell>
                      <TableCell className="text-[13px]">{c.interestCategory ?? <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        <StatusPill tone={outcome.tone}>{outcome.label}</StatusPill>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                        <Select value={fu} onValueChange={(v) => onFollowUpChange(c.id, v as FollowUp)}>
                          <SelectTrigger size="sm" className="h-7 w-40 text-xs" aria-label={`Follow-up status for ${c.id}`}>
                            <span className="flex items-center gap-1.5">
                              <span className={cn("size-1.5 rounded-full", DOT[FOLLOW_UP_META[fu].tone])} />
                              <SelectValue />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {FOLLOW_UPS.map((f) => (
                              <SelectItem key={f} value={f}>
                                {FOLLOW_UP_META[f].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              Showing {current * PAGE_SIZE + 1}–{Math.min(filtered.length, (current + 1) * PAGE_SIZE)} of {filtered.length} sessions
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}>
                <ChevronLeft />
              </Button>
              <span className="px-2 tabular-nums">
                {current + 1} / {pages}
              </span>
              <Button variant="outline" size="icon-sm" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  );
}

const DOT: Record<string, string> = {
  neutral: "bg-muted-foreground/50",
  warning: "bg-warning",
  info: "bg-info",
  brand: "bg-brand",
  success: "bg-success",
  danger: "bg-destructive",
  primary: "bg-primary",
};
