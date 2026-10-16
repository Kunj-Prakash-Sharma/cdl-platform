"use client";

import { useState } from "react";
import { CheckCircle2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { formatPhone, isValidMobile } from "@/lib/discovery";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demo-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const CALLBACK_TOPICS = [
  "Choosing the right programme",
  "Talking to a mentor",
  "Pricing & offers",
  "My child's career options",
  "College / placement support",
  "Something else",
];

export const CALLBACK_WINDOWS = ["Today, 6–8 PM", "Tomorrow, 10 AM–12 PM", "Tomorrow, 6–8 PM", "Saturday, 11 AM–1 PM"];

/** Simulated callback request — recorded in the demo store and visible in the admin portal. */
export function CallbackDialog({
  open,
  onOpenChange,
  defaultName,
  defaultPhone,
  defaultTopic,
  onRequested,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultPhone?: string;
  defaultTopic?: string;
  onRequested?: (slot: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open && (
          <CallbackForm
            defaultName={defaultName}
            defaultPhone={defaultPhone}
            defaultTopic={defaultTopic}
            onClose={() => onOpenChange(false)}
            onRequested={onRequested}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CallbackForm({
  defaultName,
  defaultPhone,
  defaultTopic,
  onClose,
  onRequested,
}: {
  defaultName?: string;
  defaultPhone?: string;
  defaultTopic?: string;
  onClose: () => void;
  onRequested?: (slot: string) => void;
}) {
  const requestCallback = useDemoStore((s) => s.requestCallback);
  const [name, setName] = useState(defaultName ?? "");
  const [phone, setPhone] = useState((defaultPhone ?? "").replace(/^\+91/, "").replace(/\D/g, ""));
  const [topic, setTopic] = useState(defaultTopic ?? CALLBACK_TOPICS[0]);
  const [slot, setSlot] = useState(CALLBACK_WINDOWS[0]);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Please tell us your name.";
    if (!isValidMobile(phone)) next.phone = "Enter a valid 10-digit mobile number.";
    setErrors(next);
    if (next.name || next.phone) return;
    requestCallback({ name: name.trim(), phone: formatPhone(phone), topic, preferredTime: slot });
    toast.success("Callback requested", { description: `${slot} · demo only, no call will be made.` });
    setDone(true);
    onRequested?.(slot);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-6" />
        </span>
        <DialogTitle className="mt-3 font-heading text-lg">Callback requested</DialogTitle>
        <DialogDescription className="mt-1 max-w-xs">
          A CDL career counsellor will call {formatPhone(phone)} <strong className="text-foreground">{slot.toLowerCase()}</strong> about “{topic.toLowerCase()}”.
        </DialogDescription>
        <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Demo: no call will actually be made. The request appears in the admin portal.</p>
        <Button className="mt-5 h-10 px-5" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 font-heading text-lg">
          <PhoneCall className="size-5 text-brand" /> Request a free callback
        </DialogTitle>
        <DialogDescription>A career counsellor will help you choose the right next step — no obligation.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="cb-name">Name</Label>
          <Input id="cb-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name || undefined} className="h-10" />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cb-phone">Mobile</Label>
          <div className="flex h-10 items-center rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive">
            <span className="pl-2.5 text-sm font-medium text-muted-foreground">+91</span>
            <input
              id="cb-phone"
              inputMode="numeric"
              value={phone}
              maxLength={10}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!errors.phone || undefined}
              className="h-full w-full min-w-0 bg-transparent px-2 text-base outline-none md:text-sm"
            />
          </div>
          {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cb-topic">What would you like to discuss?</Label>
        <Select value={topic} onValueChange={setTopic}>
          <SelectTrigger id="cb-topic" className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CALLBACK_TOPICS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Preferred time (IST)</legend>
        <div className="grid grid-cols-2 gap-2">
          {CALLBACK_WINDOWS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={slot === w}
              onClick={() => setSlot(w)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                slot === w && "border-primary bg-secondary font-medium text-primary",
              )}
            >
              {w}
            </button>
          ))}
        </div>
      </fieldset>
      <DialogFooter>
        <Button type="button" variant="outline" className="h-10" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
          Request callback
        </Button>
      </DialogFooter>
    </form>
  );
}
