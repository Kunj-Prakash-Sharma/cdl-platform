"use client";

import { useMemo, useState } from "react";
import { Plus, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { DEMO_TODAY, FORMAT_META, FORMATS } from "@/data/constants";
import { formatDate, formatINR, relativeDay } from "@/lib/format";
import type { PromoCode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoStatus } from "@/components/shared/badges";
import { Field, FilterBar, FilterSelect, ResultsMeta, SearchField, TableCard, TableEmptyRow, UsageBar } from "@/components/admin/content/admin-kit";
import { useDemoStore } from "@/store/demo-store";
import { appliesToLabel, CommerceSection, discountLabel } from "./commerce-utils";

const APPLIES_OPTIONS: { value: PromoCode["appliesTo"]; label: string }[] = [
  { value: "all", label: "All programmes" },
  ...FORMATS.map((f) => ({ value: f, label: FORMAT_META[f].label })),
  { value: "bundle", label: "Bundles" },
];

/** A code is expired when flagged so, or when its end date is before the demo's "today". */
export const isExpired = (p: PromoCode) => p.status === "expired" || p.validTill < DEMO_TODAY;

export function PromoCodesSection({ onCreate }: { onCreate: () => void }) {
  const promoCodes = useDemoStore((s) => s.promoCodes);
  const updatePromoCode = useDemoStore((s) => s.updatePromoCode);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [applies, setApplies] = useState("all");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return promoCodes
      .map((p) => ({ ...p, status: isExpired(p) ? ("expired" as const) : p.status }))
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter((p) => (applies === "all" ? true : p.appliesTo === applies))
      .filter((p) => !q || p.code.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [promoCodes, search, status, applies]);

  const clear = () => {
    setSearch("");
    setStatus("all");
    setApplies("all");
  };

  const toggle = (p: PromoCode, active: boolean) => {
    updatePromoCode(p.code, { status: active ? "active" : "paused" });
    toast.success(active ? `${p.code} is active` : `${p.code} paused`, {
      description: active ? "Learners can apply it in the simulated checkout." : "The code is rejected at checkout until you reactivate it.",
    });
  };

  return (
    <CommerceSection
      id="promo-codes-heading"
      title="Promo codes"
      description="Discount codes learners can apply in the simulated checkout."
      action={
        <Button onClick={onCreate} className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90">
          <Plus />
          New promo code
        </Button>
      }
    >
      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Search code or description…" label="Search promo codes" />
        <FilterSelect
          label="Filter by status"
          value={status}
          onValueChange={setStatus}
          allLabel="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "paused", label: "Paused" },
            { value: "expired", label: "Expired" },
          ]}
        />
        <FilterSelect label="Filter by applies to" value={applies} onValueChange={setApplies} allLabel="Applies to: any" options={APPLIES_OPTIONS} />
      </FilterBar>
      <TableCard footer={<ResultsMeta shown={rows.length} total={promoCodes.length} noun="codes" onReset={clear} />}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead className="min-w-52">Description</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Applies to</TableHead>
              <TableHead>Valid till</TableHead>
              <TableHead className="min-w-36">Redemptions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">On / off</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableEmptyRow
                colSpan={8}
                icon={TicketPercent}
                title={promoCodes.length ? "No promo codes match" : "No promo codes yet"}
                description={promoCodes.length ? "Try another search or clear the filters." : "Create your first code to offer a discount at checkout."}
                action={
                  promoCodes.length ? (
                    <Button variant="outline" size="sm" onClick={clear}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button size="sm" onClick={onCreate}>
                      New promo code
                    </Button>
                  )
                }
              />
            )}
            {rows.map((p) => {
              const expired = p.status === "expired";
              const original = promoCodes.find((x) => x.code === p.code)!;
              return (
                <TableRow key={p.code}>
                  <TableCell>
                    <span className="rounded-md border border-dashed bg-muted/50 px-2 py-1 font-mono text-xs font-semibold tracking-wide">{p.code}</span>
                  </TableCell>
                  <TableCell className="max-w-64 whitespace-normal text-muted-foreground">{p.description}</TableCell>
                  <TableCell className="font-medium tabular-nums">{discountLabel(p)}</TableCell>
                  <TableCell>{appliesToLabel(p.appliesTo)}</TableCell>
                  <TableCell>
                    <span className="tabular-nums">{formatDate(p.validTill)}</span>
                    <span className={expired ? "block text-xs text-destructive" : "block text-xs text-muted-foreground"}>
                      {expired ? "Ended" : relativeDay(p.validTill).replace(/^In /, "Ends in ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <UsageBar value={p.uses} max={p.maxUses} />
                  </TableCell>
                  <TableCell>
                    <AutoStatus status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {expired ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0} className="inline-flex rounded-full focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                            <Switch checked={false} disabled aria-label={`${p.code} has expired and can't be activated`} />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Expired codes can&apos;t be reactivated — create a new code instead.</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Switch
                        checked={p.status === "active"}
                        onCheckedChange={(v) => toggle(original, v)}
                        aria-label={p.status === "active" ? `Pause ${p.code}` : `Activate ${p.code}`}
                        className="data-checked:bg-brand"
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
      <p className="text-xs text-muted-foreground">Expired codes stay on record for reporting and can&apos;t be switched back on.</p>
    </CommerceSection>
  );
}

// ---------------------------------------------------------------- Create dialog

interface PromoForm {
  code: string;
  description: string;
  discountType: PromoCode["discountType"];
  value: string;
  appliesTo: PromoCode["appliesTo"];
  validTill: string;
  maxUses: string;
}

type PromoErrors = Partial<Record<keyof PromoForm, string>>;

const MIN_DATE = "2026-10-16";

function validatePromo(v: PromoForm, existing: PromoCode[]): PromoErrors {
  const e: PromoErrors = {};
  if (!v.code) e.code = "Enter a code.";
  else if (!/^[A-Z0-9]+$/.test(v.code)) e.code = "Use capital letters A–Z and digits 0–9 only (no spaces or symbols).";
  else if (v.code.length < 4 || v.code.length > 16) e.code = "Codes must be 4–16 characters long.";
  else if (existing.some((p) => p.code.toLowerCase() === v.code.toLowerCase())) e.code = `${v.code} already exists — choose a different code.`;

  if (!v.description.trim()) e.description = "Add a description so the team knows what this code is for.";
  else if (v.description.trim().length > 120) e.description = "Keep it under 120 characters.";

  const n = Number(v.value);
  if (!v.value.trim()) e.value = "Enter a discount value.";
  else if (!Number.isInteger(n)) e.value = "Use a whole number.";
  else if (v.discountType === "percent" && (n < 1 || n > 90)) e.value = "Percentage discounts must be between 1% and 90%.";
  else if (v.discountType === "flat" && (n < 50 || n > 10000)) e.value = "Flat discounts must be between ₹50 and ₹10,000.";

  if (!v.validTill) e.validTill = "Choose an end date.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(v.validTill)) e.validTill = "Use a valid date.";
  else if (v.validTill <= DEMO_TODAY) e.validTill = `The end date must be after today (${formatDate(DEMO_TODAY)}).`;

  const m = Number(v.maxUses);
  if (!v.maxUses.trim()) e.maxUses = "Enter a redemption limit.";
  else if (!Number.isInteger(m) || m < 1) e.maxUses = "Allow at least 1 redemption.";
  else if (m > 100000) e.maxUses = "Limit can't exceed 1,00,000.";
  return e;
}

const EMPTY_FORM: PromoForm = {
  code: "",
  description: "",
  discountType: "percent",
  value: "",
  appliesTo: "all",
  validTill: "2026-11-30",
  maxUses: "500",
};

export function CreatePromoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <CreatePromoForm onClose={() => onOpenChange(false)} />}
    </Dialog>
  );
}

function CreatePromoForm({ onClose }: { onClose: () => void }) {
  const promoCodes = useDemoStore((s) => s.promoCodes);
  const addPromoCode = useDemoStore((s) => s.addPromoCode);
  const [form, setForm] = useState<PromoForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validatePromo(form, promoCodes) : {};
  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const valueNum = Number(form.value);
  const previewValid = form.value && Number.isInteger(valueNum) && valueNum > 0;
  const preview = previewValid
    ? `${form.discountType === "percent" ? `${valueNum}% off` : `${formatINR(valueNum)} off`} ${
        form.appliesTo === "all" ? "any programme" : form.appliesTo === "bundle" ? "bundles" : `${FORMAT_META[form.appliesTo].label} programmes`
      }`
    : null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validatePromo(form, promoCodes);
    if (Object.keys(errs).length) return;
    addPromoCode({
      code: form.code,
      description: form.description.trim(),
      discountType: form.discountType,
      value: Number(form.value),
      appliesTo: form.appliesTo,
      validTill: form.validTill,
      maxUses: Number(form.maxUses),
      uses: 0,
      status: "active",
    });
    toast.success(`Promo code ${form.code} created`, {
      description: `${discountLabel({ discountType: form.discountType, value: Number(form.value) })} · valid till ${formatDate(form.validTill)}. It works in the simulated checkout now.`,
    });
    onClose();
  };

  const err = (k: keyof PromoForm) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `promo-${k}-error` : undefined,
  });

  return (
    <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Create promo code</DialogTitle>
        <DialogDescription>New codes are active immediately in the simulated checkout.</DialogDescription>
      </DialogHeader>
      <form id="create-promo-form" onSubmit={submit} noValidate className="-mx-4 space-y-4 overflow-y-auto px-4 pb-1">
        <Field id="promo-code" label="Code" required error={errors.code} hint="4–16 characters, capital letters and digits only.">
          <Input
            id="promo-code"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s+/g, ""))}
            placeholder="e.g. DIWALI25"
            maxLength={20}
            autoComplete="off"
            className="h-9 font-mono tracking-wide uppercase"
            {...err("code")}
          />
        </Field>
        <Field id="promo-description" label="Description" required error={errors.description}>
          <Textarea
            id="promo-description"
            rows={2}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="e.g. Diwali offer — 25% off all live cohorts"
            {...err("description")}
          />
        </Field>

        <div className="space-y-2">
          <Label className="text-[13px]" id="promo-type-label">
            Discount type<span className="text-destructive">*</span>
          </Label>
          <RadioGroup
            aria-labelledby="promo-type-label"
            value={form.discountType}
            onValueChange={(v) => set("discountType", v as PromoCode["discountType"])}
            className="grid grid-cols-2 gap-2"
          >
            {[
              { v: "percent", label: "Percentage", hint: "1–90% off" },
              { v: "flat", label: "Flat amount", hint: "₹50–₹10,000 off" },
            ].map((o) => (
              <Label
                key={o.v}
                htmlFor={`promo-type-${o.v}`}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 font-normal has-data-checked:border-brand has-data-checked:bg-brand-soft/50"
              >
                <RadioGroupItem id={`promo-type-${o.v}`} value={o.v} className="mt-0.5" />
                <span>
                  <span className="block text-[13px] font-medium">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.hint}</span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="promo-value" label={form.discountType === "percent" ? "Discount (%)" : "Discount (₹)"} required error={errors.value}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                {form.discountType === "percent" ? "%" : "₹"}
              </span>
              <Input
                id="promo-value"
                inputMode="numeric"
                value={form.value}
                onChange={(e) => set("value", e.target.value.replace(/[^\d]/g, ""))}
                placeholder={form.discountType === "percent" ? "20" : "500"}
                className="h-9 pl-7 tabular-nums"
                {...err("value")}
              />
            </div>
          </Field>
          <Field id="promo-applies" label="Applies to" required>
            <Select value={form.appliesTo} onValueChange={(v) => set("appliesTo", v as PromoCode["appliesTo"])}>
              <SelectTrigger id="promo-applies" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {APPLIES_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="promo-valid" label="Valid till" required error={errors.validTill} hint={`Must be after ${formatDate(DEMO_TODAY)}.`}>
            <Input id="promo-valid" type="date" min={MIN_DATE} value={form.validTill} onChange={(e) => set("validTill", e.target.value)} className="h-9" {...err("validTill")} />
          </Field>
          <Field id="promo-max" label="Max redemptions" required error={errors.maxUses}>
            <Input
              id="promo-max"
              inputMode="numeric"
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value.replace(/[^\d]/g, ""))}
              className="h-9 tabular-nums"
              {...err("maxUses")}
            />
          </Field>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-dashed bg-muted/40 px-3 py-2.5 text-[13px]">
          <TicketPercent className="mt-0.5 size-4 shrink-0 text-brand" />
          <p>
            {preview && form.code ? (
              <>
                <span className="font-mono font-semibold">{form.code}</span> gives <span className="font-medium">{preview}</span>
                {form.validTill && /^\d{4}-\d{2}-\d{2}$/.test(form.validTill) && <> until {formatDate(form.validTill)}</>}
                {Number(form.maxUses) > 0 && <>, for up to {Number(form.maxUses).toLocaleString("en-IN")} redemptions</>}.
              </>
            ) : (
              <span className="text-muted-foreground">Fill in the code and discount to preview what learners will get.</span>
            )}
          </p>
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="create-promo-form" className="bg-brand text-brand-foreground hover:bg-brand/90">
          Create code
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
