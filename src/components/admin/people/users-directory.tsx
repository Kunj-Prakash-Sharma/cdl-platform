"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, GraduationCap, Search, ShieldCheck, UserRound, Users, UsersRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { collegeStudents, users } from "@/data";
import { STAGE_META, STAGES } from "@/data/constants";
import { relativeDay } from "@/lib/format";
import type { LearnerStage, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { COMPLETION_BANDS, inBand, KIND_LABEL, profileToRow, studentToRow, type CompletionBand, type UserKind } from "./people-utils";
import { UserSheet } from "./user-sheet";

export function UsersDirectory() {
  const overrides = useDemoStore((s) => s.profileOverrides);
  const enrollments = useDemoStore((s) => s.enrollments);
  const colleges = useDemoStore((s) => s.colleges);

  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | UserKind>("all");
  const [stage, setStage] = useState<"all" | LearnerStage>("all");
  const [status, setStatus] = useState<"all" | UserProfile["status"]>("all");
  const [band, setBand] = useState<CompletionBand>("all");
  const [hasEnrol, setHasEnrol] = useState<"all" | "yes" | "no">("all");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, UserProfile["status"]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const b2c = users.map((u) => profileToRow({ ...u, ...overrides[u.id] }, enrollments));
    const students = collegeStudents.map((s) => studentToRow(s, colleges.find((c) => c.id === s.collegeId)));
    return [...b2c, ...students].map((r) => (statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r));
  }, [overrides, enrollments, colleges, statusOverrides]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (kind !== "all" && r.kind !== kind) return false;
      if (stage !== "all" && r.stage !== stage) return false;
      if (status !== "all" && r.status !== status) return false;
      if (!inBand(r.profileCompletion, band)) return false;
      if (hasEnrol === "yes" && r.programs === 0) return false;
      if (hasEnrol === "no" && r.programs > 0) return false;
      if (q && ![r.name, r.email, r.city, r.phone, r.collegeShort, r.institution].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, query, kind, stage, status, band, hasEnrol]);

  const counts = {
    individual: rows.filter((r) => r.kind === "individual").length,
    parent: rows.filter((r) => r.kind === "parent").length,
    student: rows.filter((r) => r.kind === "college-student").length,
    inactive: rows.filter((r) => r.status !== "active").length,
    avgProfile: Math.round(rows.reduce((n, r) => n + r.profileCompletion, 0) / rows.length),
  };
  const hasFilters = query || kind !== "all" || stage !== "all" || status !== "all" || band !== "all" || hasEnrol !== "all";
  const reset = () => {
    setQuery("");
    setKind("all");
    setStage("all");
    setStatus("all");
    setBand("all");
    setHasEnrol("all");
  };
  const selected = rows.find((r) => r.id === selectedId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Individual learners, parents and college students — profiles, enrolments, orders and assessment results."
        actions={
          <Button variant="outline" className="h-9" onClick={() => toast.success("User export prepared", { description: `${filtered.length} profiles as CSV (simulated — phone numbers stay masked).` })}>
            <Download /> Export
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Profiles shown" value={rows.length} icon={Users} hint="Sample of 19,960 users" />
        <StatCard label="Individuals" value={counts.individual} icon={UserRound} accent="brand" hint="B2C learners" />
        <StatCard label="Parents" value={counts.parent} icon={UsersRound} accent="info" hint="Guiding a child" />
        <StatCard label="College students" value={counts.student} icon={GraduationCap} accent="success" hint={`Across ${new Set(collegeStudents.map((s) => s.collegeId)).size} colleges`} />
        <StatCard label="Avg. profile completion" value={`${counts.avgProfile}%`} icon={UserRound} accent="warning" hint="Target 80%" />
        <StatCard label="Inactive / invited" value={counts.inactive} icon={UserRound} hint="Need re-engagement" />
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-info/25 bg-info-soft/50 p-3.5 text-[13px] text-foreground/80">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-info" />
        <p>
          <span className="font-semibold text-foreground">Identified profiles only.</span> These are signed-in accounts. Anonymous discovery sessions are analysed separately in Conversion &
          Conversations and are never merged into these profiles. Phone numbers are masked.
        </p>
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-xs md:p-5">
        <div className="flex flex-col gap-2 xl:flex-row xl:flex-wrap xl:items-center">
          <div className="relative w-full xl:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search users" placeholder="Search name, email, city, college…" className="h-9 pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <FilterSelect label="User type" value={kind} onChange={(v) => setKind(v as typeof kind)} options={[["all", "All user types"], ...(Object.entries(KIND_LABEL) as [string, string][])]} />
            <FilterSelect label="Learner stage" value={stage} onChange={(v) => setStage(v as typeof stage)} options={[["all", "All stages"], ...STAGES.map((s) => [s, STAGE_META[s].label] as [string, string])]} />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as typeof status)}
              options={[
                ["all", "All statuses"],
                ["active", "Active"],
                ["invited", "Invited"],
                ["inactive", "Inactive"],
              ]}
            />
            <FilterSelect label="Profile completion" value={band} onChange={(v) => setBand(v as CompletionBand)} options={COMPLETION_BANDS.map((b) => [b.value, b.label] as [string, string])} />
            <FilterSelect
              label="Enrolments"
              value={hasEnrol}
              onChange={(v) => setHasEnrol(v as typeof hasEnrol)}
              options={[
                ["all", "Any enrolments"],
                ["yes", "Has enrolments"],
                ["no", "No enrolments"],
              ]}
            />
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={reset} className="self-start xl:self-auto">
              <X /> Clear
            </Button>
          )}
          <span className="text-xs text-muted-foreground xl:ml-auto">
            {filtered.length} of {rows.length} profiles
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Users}
            title="No users match these filters"
            description="Try widening the stage, status or profile completion filters."
            action={
              <Button variant="outline" size="sm" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <Table className="min-w-[960px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Programs</TableHead>
                  <TableHead className="w-40">Profile</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow
                    key={r.id}
                    tabIndex={0}
                    className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                    onClick={() => setSelectedId(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelectedId(r.id);
                    }}
                    aria-label={`Open ${r.name}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Portrait avatar={r.avatar} name={r.name} className="size-9" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{r.name}</p>
                          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                            {KIND_LABEL[r.kind]}
                            {r.collegeShort && (
                              <span className="rounded bg-secondary px-1.5 text-[10px] font-semibold text-primary">{r.collegeShort}</span>
                            )}
                            <span className="truncate">· {r.city}</span>
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">{r.phone}</TableCell>
                    <TableCell className="text-[13px] whitespace-nowrap">{STAGE_META[r.stage].label}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.programs}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={r.profileCompletion}
                          className={cn(
                            "h-1.5 flex-1",
                            r.profileCompletion >= 80
                              ? "[&>[data-slot=progress-indicator]]:bg-brand"
                              : r.profileCompletion >= 50
                                ? "[&>[data-slot=progress-indicator]]:bg-info"
                                : "[&>[data-slot=progress-indicator]]:bg-warning",
                          )}
                        />
                        <span className="w-9 text-right text-xs tabular-nums">{r.profileCompletion}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px] whitespace-nowrap">{relativeDay(r.lastActive)}</TableCell>
                    <TableCell>
                      <AutoStatus status={r.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <UserSheet
        user={selected}
        status={selected?.status ?? "active"}
        onStatusChange={(id, s) => setStatusOverrides((o) => ({ ...o, [id]: s }))}
        onOpenUser={(id) => setSelectedId(id)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full sm:w-auto sm:min-w-40" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
