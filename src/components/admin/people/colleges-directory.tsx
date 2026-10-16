"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Armchair, Building, CircleCheck, GraduationCap, Hourglass, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AutoStatus } from "@/components/shared/badges";
import { EmptyState, PageHeader, StatCard } from "@/components/shared/page-header";
import { collegePlans } from "@/data";
import { formatDate, formatNumber } from "@/lib/format";
import type { College } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { COLLEGE_TYPES, CollegeSheet } from "./college-sheet";

const STATUSES: { value: College["status"]; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "onboarding", label: "Onboarding" },
  { value: "pending-review", label: "Pending review" },
  { value: "paused", label: "Paused" },
];

export function CollegesDirectory() {
  const colleges = useDemoStore((s) => s.colleges);
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get("open"));
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | College["status"]>("all");
  const [plan, setPlan] = useState<string>("all");
  const [type, setType] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colleges.filter((c) => {
      if (status !== "all" && c.status !== status) return false;
      if (plan !== "all" && c.plan !== plan) return false;
      if (type !== "all" && c.type !== type) return false;
      if (q && ![c.name, c.shortName, c.city, c.state, c.contactName].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [colleges, query, status, plan, type]);

  const seats = colleges.reduce((n, c) => n + c.seats, 0);
  const students = colleges.reduce((n, c) => n + c.activeStudents, 0);
  const active = colleges.filter((c) => c.status === "active").length;
  const inProgress = colleges.filter((c) => c.status === "onboarding" || c.status === "pending-review").length;
  const hasFilters = query || status !== "all" || plan !== "all" || type !== "all";
  const reset = () => {
    setQuery("");
    setStatus("all");
    setPlan("all");
    setType("all");
  };
  const selected = colleges.find((c) => c.id === selectedId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="People"
        title="Colleges"
        description="Partner institutions, their access packages, assigned programs and branded student portals."
        actions={
          <Button asChild className="h-9 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
            <Link href="/admin/colleges/new">
              <Plus /> Add college
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Partner colleges" value={colleges.length} icon={Building} hint={`${active} active`} />
        <StatCard label="Onboarding / review" value={inProgress} icon={Hourglass} accent="warning" hint="Awaiting go-live" />
        <StatCard label="Licensed seats" value={formatNumber(seats)} icon={Armchair} accent="info" hint="Across all plans" />
        <StatCard label="Active students" value={formatNumber(students)} icon={GraduationCap} accent="brand" hint="Signed in this term" />
        <StatCard label="Seat utilisation" value={`${seats ? Math.round((students / seats) * 100) : 0}%`} icon={CircleCheck} accent="success" hint="Active ÷ licensed" />
      </div>

      <section className="rounded-2xl border bg-card p-4 shadow-xs md:p-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative w-full lg:w-64">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search colleges" placeholder="Search name, city, contact…" className="h-9 pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9 w-full sm:w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filter by plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                {collegePlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-2 h-9 w-full sm:w-44" aria-label="Filter by type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institution types</SelectItem>
                {COLLEGE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
          <span className="text-xs text-muted-foreground lg:ml-auto">
            {filtered.length} of {colleges.length} colleges
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Building}
            title="No colleges match these filters"
            description="Clear the filters or onboard a new institution."
            action={
              <Button variant="outline" size="sm" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Institution</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead className="w-44">Students / seats</TableHead>
                  <TableHead className="text-right">Programs</TableHead>
                  <TableHead>Onboarding status</TableHead>
                  <TableHead>Licence ends</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const util = c.seats ? Math.round((c.activeStudents / c.seats) * 100) : 0;
                  return (
                    <TableRow
                      key={c.id}
                      tabIndex={0}
                      className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none"
                      onClick={() => setSelectedId(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") setSelectedId(c.id);
                      }}
                      aria-label={`Open ${c.name}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: c.brandColor }}>
                            {c.shortName}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium">{c.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.contactName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">
                        {c.city}
                        <span className="block text-xs text-muted-foreground">{c.state}</span>
                      </TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">{c.type}</TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">{c.plan}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between text-xs tabular-nums">
                          <span className="font-medium">{formatNumber(c.activeStudents)}</span>
                          <span className="text-muted-foreground">/ {formatNumber(c.seats)}</span>
                        </div>
                        <Progress value={util} className="mt-1 h-1 [&>[data-slot=progress-indicator]]:bg-brand" aria-label={`${util}% of seats active`} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{c.assignedCourseIds.length}</TableCell>
                      <TableCell>
                        <AutoStatus status={c.status} />
                        {c.status !== "active" && <span className="mt-1 block text-[11px] text-muted-foreground">Started {formatDate(c.onboardedOn, "d MMM")}</span>}
                      </TableCell>
                      <TableCell className="text-[13px] whitespace-nowrap">{formatDate(c.licenceEnds)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <CollegeSheet
        college={selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}
