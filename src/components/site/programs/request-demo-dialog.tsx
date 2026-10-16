"use client";

import { useState } from "react";
import { Building2, CircleCheck, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Form = { name: string; designation: string; institution: string; city: string; size: string; email: string; phone: string; message: string };
const EMPTY: Form = { name: "", designation: "", institution: "", city: "", size: "", email: "", phone: "", message: "" };

function validate(f: Form) {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim()) e.name = "Please enter your name.";
  if (!f.institution.trim()) e.institution = "Please enter your institution's name.";
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid work email.";
  if (f.phone && !/^[6-9]\d{9}$/.test(f.phone)) e.phone = "Enter a 10-digit Indian mobile number.";
  if (!f.size) e.size = "Choose an approximate number of students.";
  return e;
}

/** Simulated B2B lead form — nothing is sent anywhere. */
export function RequestDemoButton({ className, variant = "default", label = "Request a demo" }: { className?: string; variant?: "default" | "outline"; label?: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSent(true);
    toast.success("Demo request received", { description: `Thanks, ${form.name.split(" ")[0]} — our partnerships team would reach out within one working day (simulated).` });
  };

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      window.setTimeout(() => {
        setSent(false);
        setForm(EMPTY);
        setErrors({});
      }, 200);
    }
  };

  return (
    <>
      <Button className={className} variant={variant} onClick={() => setOpen(true)}>
        <Building2 /> {label}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          {sent ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success-soft text-success">
                <CircleCheck className="size-7" />
              </span>
              <DialogTitle className="mt-4 text-lg">Request received</DialogTitle>
              <DialogDescription className="mt-1 max-w-sm">
                We&apos;d schedule a 30-minute walkthrough of the college portal for {form.institution}. This is a prototype, so no email or call
                will actually follow.
              </DialogDescription>
              <Button className="mt-6" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <DialogHeader>
                <DialogTitle>Request a campus demo</DialogTitle>
                <DialogDescription>See how colleges assign programmes, add their own content and track student progress.</DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field id="rd-name" label="Your name" error={errors.name}>
                  <Input id="rd-name" value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} placeholder="Dr. Anita Rao" />
                </Field>
                <Field id="rd-designation" label="Designation (optional)">
                  <Input id="rd-designation" value={form.designation} onChange={(e) => set("designation", e.target.value)} placeholder="Head, Training & Placement" />
                </Field>
                <Field id="rd-inst" label="Institution" error={errors.institution} className="sm:col-span-2">
                  <Input id="rd-inst" value={form.institution} onChange={(e) => set("institution", e.target.value)} aria-invalid={!!errors.institution} placeholder="e.g. Lakeview Institute of Management" />
                </Field>
                <Field id="rd-city" label="City (optional)">
                  <Input id="rd-city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Nagpur" />
                </Field>
                <Field id="rd-size" label="Students" error={errors.size}>
                  <Select value={form.size} onValueChange={(v) => set("size", v)}>
                    <SelectTrigger id="rd-size" className="w-full" aria-invalid={!!errors.size}>
                      <SelectValue placeholder="Approximate number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<250">Up to 250</SelectItem>
                      <SelectItem value="250-1000">250 – 1,000</SelectItem>
                      <SelectItem value="1000+">More than 1,000</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="rd-email" label="Work email" error={errors.email}>
                  <Input id="rd-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errors.email} placeholder="name@college.edu.in" />
                </Field>
                <Field id="rd-phone" label="Mobile (optional)" error={errors.phone}>
                  <Input
                    id="rd-phone"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    aria-invalid={!!errors.phone}
                    placeholder="10-digit number"
                  />
                </Field>
                <Field id="rd-msg" label="What would you like to see? (optional)" className="sm:col-span-2">
                  <Textarea id="rd-msg" rows={3} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Placement readiness for 600 final-year students…" />
                </Field>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">Prototype form — details stay in your browser and are not sent anywhere.</p>
              <DialogFooter className="mt-5">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Send /> Send request
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ id, label, error, className, children }: { id: string; label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
