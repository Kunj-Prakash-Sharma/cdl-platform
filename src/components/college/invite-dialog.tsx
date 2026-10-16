"use client";

import { useMemo, useRef, useState } from "react";
import { CircleAlert, CircleCheck, FileSpreadsheet, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { College } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AIT_STUDENTS, hash } from "./college-data";

export interface Invitation {
  id: string;
  label: string;
  detail: string;
  count: number;
  department: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteStudentsDialog({
  open,
  onOpenChange,
  college,
  onInvited,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  college: College;
  onInvited: (inv: Invitation) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {open && (
          <InviteForm
            college={college}
            onCancel={() => onOpenChange(false)}
            onDone={(inv) => {
              onInvited(inv);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ college, onDone, onCancel }: { college: College; onDone: (inv: Invitation) => void; onCancel: () => void }) {
  const [mode, setMode] = useState("paste");
  const [text, setText] = useState("");
  const [department, setDepartment] = useState("");
  const [file, setFile] = useState<{ name: string; sizeKb: number } | null>(null);
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const seatsLeft = college.seats - college.activeStudents;

  const parsed = useMemo(() => {
    const tokens = text
      .split(/[\s,;]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const seen = new Set<string>();
    const existing = new Set(AIT_STUDENTS.map((s) => s.email.toLowerCase()));
    const valid: string[] = [];
    const invalid: string[] = [];
    const duplicates: string[] = [];
    const enrolled: string[] = [];
    for (const t of tokens) {
      if (!EMAIL_RE.test(t)) invalid.push(t);
      else if (seen.has(t)) duplicates.push(t);
      else if (existing.has(t)) enrolled.push(t);
      else {
        valid.push(t);
        seen.add(t);
      }
    }
    return { valid, invalid, duplicates, enrolled };
  }, [text]);

  // Simulated CSV parse: row counts derived deterministically from the file name/size (contents are never read).
  const csv = useMemo(() => {
    if (!file) return null;
    const h = hash(`${file.name}|${file.sizeKb}`);
    const rows = 18 + (h % 40);
    const invalid = h % 3;
    const duplicates = (h >> 3) % 2;
    return { rows, invalid, duplicates, valid: rows - invalid - duplicates };
  }, [file]);

  const count = mode === "paste" ? parsed.valid.length : (csv?.valid ?? 0);
  const errors = {
    department: !department ? "Choose the department these students belong to." : "",
    source: count === 0 ? (mode === "paste" ? "Add at least one valid email address." : "Choose a CSV file to upload.") : "",
    seats: count > seatsLeft ? `Only ${seatsLeft} seats left on your licence.` : "",
  };
  const valid = !errors.department && !errors.source && !errors.seats;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const inv: Invitation =
      mode === "paste"
        ? {
            id: `inv-${hash(parsed.valid.join(","))}`,
            label: parsed.valid.length === 1 ? parsed.valid[0] : `${parsed.valid[0]} +${parsed.valid.length - 1} more`,
            detail: "Pasted emails",
            count,
            department,
          }
        : { id: `inv-${hash(file!.name)}-${file!.sizeKb}`, label: file!.name, detail: "CSV upload", count, department };
    onDone(inv);
    toast.success(`${count} invitation${count === 1 ? "" : "s"} sent`, {
      description: `Students will receive a ${college.shortName} × CDL sign-in link by email (simulated). ${seatsLeft - count} seats remain.`,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite students</DialogTitle>
        <DialogDescription>
          Invited students get access to {college.shortName}&apos;s assigned programs only. {seatsLeft} of {college.seats} seats are available.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="inv-dept">Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="inv-dept" className="w-full" aria-invalid={touched && Boolean(errors.department)}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {college.departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched && errors.department && <p className="text-xs text-destructive">{errors.department}</p>}
        </div>

        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="w-full">
            <TabsTrigger value="paste">Paste emails</TabsTrigger>
            <TabsTrigger value="csv">Upload CSV</TabsTrigger>
          </TabsList>
          <TabsContent value="paste" className="mt-3 space-y-2">
            <Label htmlFor="inv-emails">Student email addresses</Label>
            <Textarea
              id="inv-emails"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"kavita.m@ait.demo, arpit.g@ait.demo\nsiddharth.r@ait.demo"}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">Separate with commas, spaces or new lines.</p>
            {text.trim() && (
              <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-xs">
                <p className="flex items-center gap-1.5 font-medium text-success">
                  <CircleCheck className="size-3.5" /> {parsed.valid.length} valid
                </p>
                {parsed.invalid.length > 0 && (
                  <p className="flex items-start gap-1.5 text-destructive">
                    <CircleAlert className="mt-px size-3.5 shrink-0" /> {parsed.invalid.length} invalid: {parsed.invalid.slice(0, 3).join(", ")}
                    {parsed.invalid.length > 3 ? "…" : ""}
                  </p>
                )}
                {parsed.duplicates.length > 0 && (
                  <p className="flex items-center gap-1.5 text-warning">
                    <CircleAlert className="size-3.5" /> {parsed.duplicates.length} duplicate{parsed.duplicates.length > 1 ? "s" : ""} skipped
                  </p>
                )}
                {parsed.enrolled.length > 0 && (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <CircleAlert className="size-3.5" /> {parsed.enrolled.length} already enrolled: {parsed.enrolled.join(", ")}
                  </p>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="csv" className="mt-3 space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Choose CSV file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile({ name: f.name, sizeKb: Math.max(1, Math.round(f.size / 1024)) });
                e.target.value = "";
              }}
            />
            {file ? (
              <div className="flex items-center gap-3 rounded-xl border p-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-success-soft text-success">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.sizeKb} KB · parsed locally (simulated)</p>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={() => setFile(null)}>
                  <X />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Upload className="size-6 text-muted-foreground" />
                <span className="text-sm font-medium">Choose a CSV file</span>
                <span className="text-xs text-muted-foreground">Columns: name, email, roll number, year</span>
              </button>
            )}
            {csv && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-success-soft p-2 text-success">
                  <p className="font-heading text-lg font-semibold">{csv.valid}</p>
                  ready to invite
                </div>
                <div className={cn("rounded-lg p-2", csv.invalid ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>
                  <p className="font-heading text-lg font-semibold">{csv.invalid}</p>
                  missing email
                </div>
                <div className={cn("rounded-lg p-2", csv.duplicates ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground")}>
                  <p className="font-heading text-lg font-semibold">{csv.duplicates}</p>
                  duplicates
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        {touched && (errors.source || errors.seats) && <p className="text-xs text-destructive">{errors.source || errors.seats}</p>}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={submit}>
          <Send /> Send {count > 0 ? `${count} ` : ""}invitation{count === 1 ? "" : "s"}
        </Button>
      </DialogFooter>
    </>
  );
}
