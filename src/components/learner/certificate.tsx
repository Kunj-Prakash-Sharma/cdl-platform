"use client";

import { Copy, Info, Printer } from "lucide-react";
import { toast } from "sonner";
import { getMentor } from "@/data";
import { formatDate } from "@/lib/format";
import type { Course, LearningFormat } from "@/lib/types";
import { FORMAT_META } from "@/data/constants";
import { LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { courseHoursLabel } from "./utils";

export const PROGRAMME_DIRECTOR = "Dr. Shalini Bhave";

export interface CertificateData {
  id: string;
  learnerName: string;
  course: Course;
  issuedOn: string;
  format?: LearningFormat;
}

const SCRIPT_FONT = { fontFamily: '"Segoe Script", "Brush Script MT", "Lucida Handwriting", cursive' } as const;

/** The certificate artwork. Scales with its container (container-query units) so it works in dialogs and print. */
export function CertificateDocument({ data }: { data: CertificateData }) {
  const mentor = getMentor(data.course.instructorId);
  return (
    <div className="@container w-full">
      <div
        className="relative aspect-[1.414/1] w-full overflow-hidden rounded-[0.6cqw] bg-navy p-[2.2cqw] text-navy shadow-md print:shadow-none"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >
        {/* Frame */}
        <div className="relative flex size-full flex-col items-center overflow-hidden rounded-[0.4cqw] bg-white px-[6cqw] pt-[4.2cqw] pb-[3.2cqw] text-center">
          <div className="pointer-events-none absolute inset-[1.2cqw] rounded-[0.3cqw] border-[0.25cqw] border-double border-navy/35" />
          <div className="pointer-events-none absolute inset-[1.9cqw] rounded-[0.2cqw] border border-brand/40" />
          {/* Corner ornaments */}
          {["top-[1.2cqw] left-[1.2cqw]", "top-[1.2cqw] right-[1.2cqw] rotate-90", "bottom-[1.2cqw] right-[1.2cqw] rotate-180", "bottom-[1.2cqw] left-[1.2cqw] -rotate-90"].map((pos) => (
            <svg key={pos} viewBox="0 0 40 40" className={`pointer-events-none absolute size-[6cqw] ${pos}`} aria-hidden="true">
              <path d="M2 38V8a6 6 0 0 1 6-6h30" fill="none" stroke="oklch(0.24 0.075 268)" strokeWidth="2.4" />
              <path d="M8 38V14a6 6 0 0 1 6-6h24" fill="none" stroke="oklch(0.53 0.1 186)" strokeWidth="1.2" />
              <circle cx="8" cy="8" r="2.4" fill="oklch(0.53 0.1 186)" />
            </svg>
          ))}
          {/* Watermark */}
          <svg viewBox="0 0 40 40" className="pointer-events-none absolute top-1/2 left-1/2 size-[38cqw] -translate-x-1/2 -translate-y-1/2 opacity-[0.035]" aria-hidden="true">
            <path d="M27.5 13.2A10 10 0 1 0 27.5 26.8" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M17 24.5 21.5 19.5 24.5 22 30 15.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="flex items-center gap-[1.2cqw]">
            <LogoMark className="size-[4.6cqw]" />
            <div className="text-left leading-none">
              <p className="font-heading text-[2.1cqw] font-bold tracking-tight">Career Design Lab</p>
              <p className="mt-[0.5cqw] text-[1.1cqw] font-medium tracking-[0.18em] text-navy/55 uppercase">Discover · Learn · Grow</p>
            </div>
          </div>

          <p className="mt-[3.2cqw] text-[1.35cqw] font-semibold tracking-[0.42em] text-brand uppercase">Certificate of Completion</p>
          <p className="mt-[2cqw] text-[1.55cqw] text-navy/65">This is to certify that</p>
          <p className="mt-[1cqw] font-heading text-[4.6cqw] leading-none font-bold tracking-tight">{data.learnerName}</p>
          <div className="mt-[1.4cqw] h-px w-[34cqw] bg-gradient-to-r from-transparent via-navy/30 to-transparent" />
          <p className="mt-[1.4cqw] text-[1.55cqw] text-navy/65">has successfully completed the programme</p>
          <p className="mt-[0.8cqw] font-heading text-[2.9cqw] leading-tight font-semibold text-primary">{data.course.title}</p>
          <p className="mt-[1cqw] text-[1.35cqw] text-navy/60">
            {data.format ? `${FORMAT_META[data.format].label} · ` : ""}
            {courseHoursLabel(data.course)} of guided learning · completed on {formatDate(data.issuedOn, "d MMMM yyyy")}
          </p>

          <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[3cqw]">
            <div className="flex flex-col items-center">
              <span className="text-[2.6cqw] leading-none text-navy/85" style={SCRIPT_FONT}>
                {mentor?.name.replace(/^Dr\.\s+/, "") ?? "Course Mentor"}
              </span>
              <span className="mt-[0.6cqw] h-px w-full bg-navy/35" />
              <span className="mt-[0.6cqw] text-[1.25cqw] font-semibold">{mentor?.name}</span>
              <span className="text-[1.05cqw] text-navy/55">Course Mentor · {mentor?.title}</span>
            </div>
            {/* Seal */}
            <div className="relative flex size-[10cqw] items-center justify-center rounded-full bg-brand text-white shadow-sm">
              <div className="absolute inset-[0.6cqw] rounded-full border border-dashed border-white/60" />
              <div className="text-center leading-none">
                <p className="text-[0.9cqw] font-semibold tracking-[0.2em] uppercase">CDL</p>
                <p className="mt-[0.4cqw] font-heading text-[1.6cqw] font-bold">2026</p>
                <p className="mt-[0.4cqw] text-[0.8cqw] tracking-wider uppercase opacity-80">Completed</p>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[2.6cqw] leading-none text-navy/85" style={SCRIPT_FONT}>
                Shalini Bhave
              </span>
              <span className="mt-[0.6cqw] h-px w-full bg-navy/35" />
              <span className="mt-[0.6cqw] text-[1.25cqw] font-semibold">{PROGRAMME_DIRECTOR}</span>
              <span className="text-[1.05cqw] text-navy/55">Programme Director, CDL</span>
            </div>
          </div>

          <div className="mt-[2.4cqw] flex w-full items-center justify-between text-[1.05cqw] text-navy/55">
            <span>
              Certificate ID: <span className="font-mono font-semibold text-navy/80">{data.id}</span>
            </span>
            <span className="italic">Illustrative certificate — not a verifiable credential</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CertificateDialog({
  data,
  open,
  onOpenChange,
  onPrint,
}: {
  data: CertificateData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrint: (data: CertificateData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 p-5 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Certificate preview</DialogTitle>
          <DialogDescription>{data ? `${data.course.title} · ${data.id}` : ""}</DialogDescription>
        </DialogHeader>
        {data && <CertificateDocument data={data} />}
        <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Illustrative certificate generated for this prototype — it is not a verifiable credential and has no registry entry.
        </p>
        <DialogFooter className="-mx-5 -mb-5">
          <Button
            variant="outline"
            onClick={() => {
              if (!data) return;
              void navigator.clipboard?.writeText(data.id).catch(() => undefined);
              toast.success("Certificate ID copied", { description: data.id });
            }}
          >
            <Copy /> Copy certificate ID
          </Button>
          <Button className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => data && onPrint(data)}>
            <Printer /> Download / Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
