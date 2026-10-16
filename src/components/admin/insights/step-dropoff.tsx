"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardPlus, Eye, Keyboard, MousePointerClick, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HBarChart } from "./charts";
import { biggestLeakStep, stepRows, typicalStepLoss, type MetricTotals } from "./metrics";
import { ChartCard, InsightCallout, Segmented } from "./ui";

const BACKGROUND_CHIPS = ["Class 8–10", "Class 11–12", "UG · 1st/2nd year", "UG · Final year", "Postgraduate", "Graduate, job seeking", "Working · 0–3 yrs", "Working · 3+ yrs"];

/** Drop-off by conversation step, time on step, and the insight callout for the biggest leak. */
export function StepDropoff({ totals }: { totals: MetricTotals }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [previewOpen, setPreviewOpen] = useState(false);
  const leak = biggestLeakStep;
  const multiple = Math.round(leak.lostPct / typicalStepLoss);
  const recoveredSnapshots = Math.round(totals.conversations * (leak.lostPct / 100) * 0.5);
  const snapshotToPurchase = totals.snapshots ? totals.purchases / totals.snapshots : 0;
  const recoveredPurchases = Math.round(recoveredSnapshots * snapshotToPurchase);
  const chipStepsAvg = Math.round(
    stepRows.filter((s) => ["name", "persona", "stage"].includes(s.id)).reduce((n, s) => n + s.avgSecondsOnStep, 0) / 3,
  );

  const createTask = () =>
    toast.success("Improvement task created", {
      description: "“Replace open-text Background question with chips” added to the product backlog (simulated).",
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Drop-off by conversation step"
          description="Share of started conversations lost at each question · last 30 days"
          action={<Segmented label="View" value={view} onChange={setView} options={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]} />}
        >
          {view === "chart" ? (
            <HBarChart
              label="Lost at this step"
              categoryWidth={150}
              valueFormat={(v) => `${v}%`}
              data={stepRows.map((s) => ({ name: `${s.order}. ${s.label}`, value: s.lostPct, highlight: s.id === leak.id }))}
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Step</TableHead>
                    <TableHead className="text-right">Reached</TableHead>
                    <TableHead className="text-right">Lost here</TableHead>
                    <TableHead className="text-right">Avg. time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stepRows.map((s) => (
                    <TableRow key={s.id} className={cn(s.id === leak.id && "bg-destructive/5")}>
                      <TableCell className="font-medium">
                        {s.order}. {s.label}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s.reachedPct}%</TableCell>
                      <TableCell className={cn("text-right tabular-nums", s.id === leak.id && "font-semibold text-destructive")}>{s.lostPct}%</TableCell>
                      <TableCell className="text-right tabular-nums">{s.avgSecondsOnStep}s</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            {stepRows[stepRows.length - 1].reachedPct}% of started conversations reach the career snapshot. The highlighted bar is the biggest single leak.
          </p>
        </ChartCard>

        <ChartCard className="lg:col-span-2" title="Average time on each step" description="Seconds spent before answering or leaving">
          <HBarChart
            label="Avg. seconds on step"
            categoryWidth={118}
            color="var(--chart-3)"
            valueFormat={(v) => `${v}s`}
            data={stepRows.map((s) => ({ name: s.label, value: s.avgSecondsOnStep, highlight: s.id === leak.id }))}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Tap-to-answer questions take ~{chipStepsAvg}s. Background takes {leak.avgSecondsOnStep}s — typing is the friction. The snapshot is reading time.
          </p>
        </ChartCard>
      </div>

      <InsightCallout
        tone="danger"
        icon={TriangleAlert}
        title={`Biggest drop-off: “${leak.label}” — ${leak.lostPct}% of all started conversations end here`}
        actions={
          <>
            <Button size="sm" variant="outline" className="bg-background" onClick={() => setPreviewOpen(true)}>
              <Eye /> Preview chip-based question
            </Button>
            <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={createTask}>
              <ClipboardPlus /> Create improvement task
            </Button>
          </>
        }
      >
        <p>
          It is the only free-text question in the discovery flow. Visitors lose {multiple}× more here than at a typical step and spend {leak.avgSecondsOnStep}s on it,
          mostly on mobile.{" "}
          <span className="font-semibold text-foreground">Suggested fix:</span> replace the open text with tappable chips (class / course year / working
          experience) and make detail optional. Recovering half of this drop would add about{" "}
          <span className="font-semibold text-foreground tabular-nums">{formatNumber(recoveredSnapshots)}</span> career snapshots and{" "}
          <span className="font-semibold text-foreground tabular-nums">~{formatNumber(recoveredPurchases)}</span> purchases over the same period (illustrative estimate).
        </p>
      </InsightCallout>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Background question: current vs proposed</DialogTitle>
            <DialogDescription>A design preview for discussion — the live discovery flow is unchanged.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <Keyboard className="size-3.5" /> Current · open text
              </p>
              <div className="rounded-2xl rounded-bl-md border bg-card px-3 py-2 text-[13px]">What are you studying, and which year are you in?</div>
              <div className="mt-3 rounded-lg border bg-background px-3 py-2 text-[13px] text-muted-foreground">Type your answer…</div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {leak.avgSecondsOnStep}s average · {leak.lostPct}% leave here
              </p>
            </div>
            <div className="rounded-xl border border-brand/30 bg-brand-soft/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand">
                <MousePointerClick className="size-3.5" /> Proposed · tap to answer
              </p>
              <div className="rounded-2xl rounded-bl-md border bg-card px-3 py-2 text-[13px]">Which of these best describes you right now?</div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {BACKGROUND_CHIPS.map((chip) => (
                  <span key={chip} className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">+ optional “Add a detail” link · target ~{chipStepsAvg + 4}s</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-brand text-brand-foreground hover:bg-brand/90"
              onClick={() => {
                createTask();
                setPreviewOpen(false);
              }}
            >
              <ClipboardPlus /> Create improvement task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
