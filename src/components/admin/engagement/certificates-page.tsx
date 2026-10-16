"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Award, Ban, CalendarCheck, Download, Eye, RefreshCcw, Users } from "lucide-react";
import { certificates, getCourse, getUser } from "@/data";
import { DEMO_TODAY } from "@/data/constants";
import { formatDate } from "@/lib/format";
import type { Certificate } from "@/lib/types";
import { LogoMark } from "@/components/brand/logo";
import { StatusPill } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ClearFiltersButton, Field, FilterBar, FilterSelect, ResultsMeta, SearchField, TableCard, TableEmptyRow } from "@/components/admin/content/admin-kit";
import { CERT_SIGNATORIES, REVOKE_REASONS } from "./engagement-data";
import { useEngagementStore } from "./engagement-store";

type Row = Certificate & { learner: string; course: string; status: "issued" | "revoked" | "reissued"; effectiveDate: string };

const RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "year", label: "This year (2026)" },
];
const STATUS_TONE = { issued: "success", reissued: "info", revoked: "danger" } as const;

function inRange(date: string, range: string) {
  if (range === "all") return true;
  if (range === "year") return date.startsWith("2026");
  const days = Number(range);
  const diff = (Date.parse(DEMO_TODAY) - Date.parse(date)) / 86400000;
  return diff >= 0 && diff <= days;
}

export function CertificatesPage() {
  const overrides = useEngagementStore((s) => s.certOverrides);
  const reissue = useEngagementStore((s) => s.reissueCertificate);
  const [q, setQ] = useState("");
  const [course, setCourse] = useState("all");
  const [range, setRange] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const rows: Row[] = useMemo(
    () =>
      certificates
        .map((c) => {
          const o = overrides[c.id];
          return {
            ...c,
            learner: getUser(c.userId)?.name ?? c.userId,
            course: getCourse(c.courseId)?.title ?? c.courseId,
            status: o?.status ?? "issued",
            effectiveDate: o?.status === "reissued" && o.issuedOn ? o.issuedOn : c.issuedOn,
          };
        })
        .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate)),
    [overrides],
  );
  const filtered = rows.filter(
    (r) => (course === "all" || r.courseId === course) && inRange(r.effectiveDate, range) && (!q.trim() || `${r.id} ${r.learner} ${r.course}`.toLowerCase().includes(q.trim().toLowerCase())),
  );
  const courseOptions = Array.from(new Set(certificates.map((c) => c.courseId))).map((id) => ({ value: id, label: getCourse(id)?.title ?? id }));
  const stats = {
    total: rows.filter((r) => r.status !== "revoked").length,
    month: rows.filter((r) => r.effectiveDate.startsWith(DEMO_TODAY.slice(0, 7))).length,
    learners: new Set(rows.map((r) => r.userId)).size,
    revoked: rows.filter((r) => r.status === "revoked").length,
  };
  const hasFilters = q !== "" || course !== "all" || range !== "all";
  const reset = () => {
    setQ("");
    setCourse("all");
    setRange("all");
  };
  const preview = rows.find((r) => r.id === previewId);
  const revoking = rows.find((r) => r.id === revokeId);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Engagement"
        title="Certificates"
        description="Completion certificates issued to learners. Certificates in this prototype are illustrative and not verifiable credentials."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Certificates issued" value={stats.total} icon={Award} hint="Currently valid" />
        <StatCard label="Issued this month" value={stats.month} icon={CalendarCheck} accent="brand" hint="October 2026" />
        <StatCard label="Unique learners" value={stats.learners} icon={Users} accent="info" />
        <StatCard label="Revoked" value={stats.revoked} icon={Ban} accent="warning" hint="This demo session" />
      </div>
      <div className="space-y-3">
        <FilterBar right={<ResultsMeta shown={filtered.length} total={rows.length} noun="certificates" onReset={reset} />}>
          <SearchField value={q} onChange={setQ} placeholder="Search ID, learner or course…" label="Search certificates" />
          <FilterSelect label="Course" allLabel="All courses" value={course} onValueChange={setCourse} options={courseOptions} className="sm:w-56" />
          <FilterSelect label="Issued" allLabel="Any date" value={range} onValueChange={setRange} options={RANGES} />
          <ClearFiltersButton visible={hasFilters} onClick={reset} />
        </FilterBar>
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Certificate ID</TableHead>
                <TableHead>Learner</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Issued on</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && <TableEmptyRow colSpan={7} icon={Award} />}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs font-semibold">{r.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Portrait avatar={getUser(r.userId)?.avatar} name={r.learner} className="size-7" />
                      <span className="text-[13px] font-medium whitespace-nowrap">{r.learner}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate">{r.course}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(r.effectiveDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.hours}</TableCell>
                  <TableCell>
                    <StatusPill tone={STATUS_TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusPill>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => setPreviewId(r.id)}>
                        <Eye className="size-3.5" />
                        Preview
                      </Button>
                      {r.status === "revoked" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            reissue(r.id, DEMO_TODAY);
                            toast.success("Certificate reissued", { description: `${r.id} · ${r.learner} · dated ${formatDate(DEMO_TODAY)}` });
                          }}
                        >
                          <RefreshCcw className="size-3.5" />
                          Reissue
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setRevokeId(r.id)}>
                          <Ban className="size-3.5" />
                          Revoke
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreviewId(null)}>
        {preview && (
          <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Certificate preview</DialogTitle>
              <DialogDescription>
                {preview.id} · {preview.learner}
              </DialogDescription>
            </DialogHeader>
            <CertificateArt row={preview} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewId(null)}>
                Close
              </Button>
              <Button onClick={() => toast.info("PDF download is simulated in this prototype")}>
                <Download className="size-4" />
                Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!revoking} onOpenChange={(o) => !o && setRevokeId(null)}>
        {revoking && <RevokeForm key={revoking.id} row={revoking} onDone={() => setRevokeId(null)} />}
      </Dialog>
    </div>
  );
}

function CertificateArt({ row }: { row: Row }) {
  return (
    <div className="rounded-xl bg-navy p-2 sm:p-3">
      <div className="relative overflow-hidden rounded-lg border-[3px] border-double border-[oklch(0.78_0.09_80)] bg-[oklch(0.99_0.006_85)] px-5 py-7 text-center text-navy sm:px-12 sm:py-10">
        {(["top-2 left-2", "top-2 right-2 rotate-90", "bottom-2 right-2 rotate-180", "bottom-2 left-2 -rotate-90"] as const).map((pos) => (
          <svg key={pos} viewBox="0 0 40 40" className={`absolute size-7 sm:size-10 ${pos}`} aria-hidden="true">
            <path d="M2 38V8a6 6 0 0 1 6-6h30" fill="none" stroke="oklch(0.7 0.1 80)" strokeWidth="2" />
            <path d="M8 38V14a6 6 0 0 1 6-6h24" fill="none" stroke="oklch(0.7 0.1 80)" strokeWidth="1" />
          </svg>
        ))}
        {row.status === "revoked" && (
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span className="rotate-[-18deg] rounded-md border-4 border-destructive/60 px-4 py-1 text-2xl font-black tracking-[0.3em] text-destructive/60 uppercase">Revoked</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2">
          <LogoMark className="size-8 sm:size-10" />
          <span className="font-heading text-sm font-bold tracking-tight sm:text-base">Career Design Lab</span>
        </div>
        <p className="mt-5 text-[10px] font-semibold tracking-[0.35em] text-[oklch(0.55_0.09_75)] uppercase sm:text-xs">Certificate of Completion</p>
        <p className="mt-3 text-xs text-navy/60 sm:text-sm">This is to certify that</p>
        <p className="mt-2 font-serif text-2xl leading-tight font-semibold italic sm:text-4xl">{row.learner}</p>
        <p className="mt-3 text-xs text-navy/60 sm:text-sm">has successfully completed the programme</p>
        <p className="mt-1.5 font-heading text-base font-semibold sm:text-xl">{row.course}</p>
        <p className="mt-1 text-[11px] text-navy/60 sm:text-xs">
          {row.hours} learning hour{row.hours === 1 ? "" : "s"} · Issued {formatDate(row.effectiveDate)}
        </p>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:mt-9 sm:gap-12">
          {CERT_SIGNATORIES.map((s) => (
            <div key={s.name}>
              <p className="font-serif text-base text-navy/80 italic sm:text-xl">{s.signature}</p>
              <div className="mx-auto mt-1 h-px w-full bg-navy/30" />
              <p className="mt-1.5 text-[10px] font-semibold sm:text-xs">{s.name}</p>
              <p className="text-[9px] text-navy/60 sm:text-[11px]">{s.role}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 font-mono text-[10px] text-navy/60 sm:text-[11px]">Certificate ID {row.id}</p>
        <p className="mt-1 text-[10px] font-medium text-[oklch(0.5_0.12_40)]">Illustrative — not a verifiable credential</p>
      </div>
    </div>
  );
}

function RevokeForm({ row, onDone }: { row: Row; onDone: () => void }) {
  const revoke = useEngagementStore((s) => s.revokeCertificate);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Revoke certificate?</DialogTitle>
        <DialogDescription>
          {row.id} issued to {row.learner} for {row.course}. The learner sees it as revoked in their dashboard (demo session only).
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Field id="rv-reason" label="Reason" required error={submitted && !reason ? "Choose a reason." : undefined}>
          <Select value={reason || undefined} onValueChange={setReason}>
            <SelectTrigger id="rv-reason" className="h-9! w-full" aria-invalid={submitted && !reason}>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REVOKE_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id="rv-note" label="Internal note" hint="Optional">
          <Textarea id="rv-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            setSubmitted(true);
            if (!reason) return;
            revoke(row.id, reason, note.trim() || undefined);
            toast.success("Certificate revoked", { description: `${row.id} · ${reason}` });
            onDone();
          }}
        >
          Revoke certificate
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
