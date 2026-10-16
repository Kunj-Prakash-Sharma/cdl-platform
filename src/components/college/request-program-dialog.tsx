"use client";

import { useMemo, useState } from "react";
import { Check, Send } from "lucide-react";
import { toast } from "sonner";
import { publicCourses } from "@/data";
import { FORMAT_META } from "@/data/constants";
import type { College, Course, LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { FormatBadge } from "@/components/shared/badges";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface ProgramRequest {
  courseId: string;
  format: LearningFormat;
  seats: number;
  note: string;
}

export function RequestProgramDialog({
  open,
  onOpenChange,
  college,
  requestedIds,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  college: College;
  requestedIds: string[];
  onRequested: (r: ProgramRequest) => void;
}) {
  const available = useMemo(
    () => publicCourses.filter((c) => !college.assignedCourseIds.includes(c.id)),
    [college.assignedCourseIds],
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* Remount the form each time the dialog opens so it starts clean */}
        {open && <RequestForm available={available} college={college} requestedIds={requestedIds} onDone={(r) => { onRequested(r); onOpenChange(false); }} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function RequestForm({
  available,
  college,
  requestedIds,
  onDone,
  onCancel,
}: {
  available: Course[];
  college: College;
  requestedIds: string[];
  onDone: (r: ProgramRequest) => void;
  onCancel: () => void;
}) {
  const [courseId, setCourseId] = useState<string>("");
  const [format, setFormat] = useState<LearningFormat | "">("");
  const [seats, setSeats] = useState("120");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  const course = available.find((c) => c.id === courseId);
  const seatNum = Number(seats);
  const seatsError = !Number.isInteger(seatNum) || seatNum < 10 || seatNum > college.seats ? `Enter between 10 and ${college.seats} seats.` : "";
  const errors = {
    course: !courseId ? "Choose a program to request." : "",
    format: courseId && !format ? "Choose a learning level." : "",
    seats: seatsError,
  };
  const valid = !errors.course && !errors.format && !errors.seats;

  const submit = () => {
    setTouched(true);
    if (!valid || !course || !format) return;
    onDone({ courseId, format, seats: seatNum, note });
    toast.success("Request sent to CDL (simulated)", {
      description: `${course.title} · ${FORMAT_META[format].label} for ${seatNum} students. Your CDL partner manager will confirm within 2 working days.`,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Request another program</DialogTitle>
        <DialogDescription>
          Pick a program from the CDL public catalog to add to {college.shortName}&apos;s licence. Requests are reviewed by your CDL partner manager.
        </DialogDescription>
      </DialogHeader>

      {available.length === 0 ? (
        <EmptyState title="Every catalog program is already assigned" description="Your licence already includes the full CDL catalog." />
      ) : (
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Program</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup">
              {available.map((c) => {
                const selected = c.id === courseId;
                const requested = requestedIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={requested}
                    onClick={() => {
                      setCourseId(c.id);
                      setFormat(c.formats.includes("live-cohort") ? "live-cohort" : c.formats[0]);
                    }}
                    className={cn(
                      "relative flex items-center gap-3 rounded-xl border p-2.5 text-left transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                      selected && "border-primary bg-secondary ring-1 ring-primary/30 hover:bg-secondary",
                    )}
                  >
                    <CourseThumbnail course={c} size="sm" className="w-16 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{requested ? "Already requested" : c.category}</span>
                    </span>
                    {selected && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {touched && errors.course && <p className="mt-1.5 text-xs text-destructive">{errors.course}</p>}
          </fieldset>

          {course && (
            <div className="rounded-xl border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{course.title}</p>
              <p className="mt-0.5 text-muted-foreground">{course.subtitle}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {course.formats.map((f) => (
                  <FormatBadge key={f} format={f} showLevel />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="req-format">Learning level</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as LearningFormat)} disabled={!course}>
                <SelectTrigger id="req-format" className="w-full" aria-invalid={touched && Boolean(errors.format)}>
                  <SelectValue placeholder={course ? "Choose a level" : "Pick a program first"} />
                </SelectTrigger>
                <SelectContent>
                  {(course?.formats ?? []).map((f) => (
                    <SelectItem key={f} value={f}>
                      {FORMAT_META[f].label} · Level {FORMAT_META[f].level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {touched && errors.format && <p className="text-xs text-destructive">{errors.format}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-seats">Students to enrol</Label>
              <Input id="req-seats" inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value.replace(/[^0-9]/g, ""))} aria-invalid={touched && Boolean(errors.seats)} />
              {touched && errors.seats ? <p className="text-xs text-destructive">{errors.seats}</p> : <p className="text-xs text-muted-foreground">Licence size: {college.seats} seats</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="req-note">Note to CDL (optional)</Label>
            <Textarea id="req-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Second-year MBA students before summer internships, preferably evening batches." />
          </div>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={available.length === 0}>
          <Send /> Send request
        </Button>
      </DialogFooter>
    </>
  );
}
