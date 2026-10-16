"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Check, Layers, Package, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCourse } from "@/data";
import { formatINR, pct } from "@/lib/format";
import type { PricingPackage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormatBadge } from "@/components/shared/badges";
import { Field, FilterSelect } from "@/components/admin/content/admin-kit";
import { CommerceSection } from "./commerce-utils";
import { useDemoStore } from "@/store/demo-store";

export function BundlePill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2.5 text-xs font-medium whitespace-nowrap text-warning ring-1 ring-warning/25 ring-inset",
        className,
      )}
    >
      <Layers className="size-3.5" />
      Bundle
    </span>
  );
}

const saving = (p: Pick<PricingPackage, "price" | "compareAt">) => (p.compareAt && p.compareAt > p.price ? pct(p.compareAt - p.price, p.compareAt) : 0);

export function PackagesSection() {
  const packages = useDemoStore((s) => s.packages);
  const updatePackage = useDemoStore((s) => s.updatePackage);
  const [editing, setEditing] = useState<PricingPackage | null>(null);
  const [view, setView] = useState("all");

  const shown = useMemo(
    () => packages.filter((p) => (view === "all" ? true : view === "active" ? p.active : !p.active)),
    [packages, view],
  );

  const toggle = (p: PricingPackage, active: boolean) => {
    updatePackage(p.id, { active });
    toast.success(active ? `${p.name} is live on checkout` : `${p.name} hidden from checkout`, {
      description: active ? "Learners can now buy this package in the simulated checkout." : "Existing buyers keep their access.",
    });
  };

  return (
    <CommerceSection
      id="packages-heading"
      title="Packages"
      description="Passes and bundles offered on the pricing page and in the simulated checkout."
      action={
        <FilterSelect
          label="Filter packages"
          value={view}
          onValueChange={setView}
          allLabel={`All packages (${packages.length})`}
          options={[
            { value: "active", label: `Active (${packages.filter((p) => p.active).length})` },
            { value: "inactive", label: `Inactive (${packages.filter((p) => !p.active).length})` },
          ]}
          className="sm:w-48"
        />
      }
    >
      {shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed bg-muted/40 px-6 py-10 text-center">
          <Package className="mb-2 size-5 text-muted-foreground" />
          <p className="font-heading text-sm font-semibold">No packages in this view</p>
          <Button variant="link" size="sm" onClick={() => setView("all")}>
            Show all packages
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => (
            <PackageCard key={p.id} pkg={p} onEdit={() => setEditing(p)} onToggle={(v) => toggle(p, v)} />
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <EditPackageForm
            key={editing.id}
            pkg={editing}
            onDone={(patch) => {
              updatePackage(editing.id, patch);
              toast.success(`${editing.name} updated`, { description: "New pricing applies to the simulated checkout straight away." });
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>
    </CommerceSection>
  );
}

function PackageCard({ pkg, onEdit, onToggle }: { pkg: PricingPackage; onEdit: () => void; onToggle: (active: boolean) => void }) {
  const save = saving(pkg);
  const courseTitles = pkg.courseIds.map((id) => getCourse(id)?.title ?? id);
  const extra = pkg.features.length - 4;
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md",
        pkg.highlight && pkg.active && "border-brand/40 ring-1 ring-brand/20",
        !pkg.active && "bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {pkg.format === "bundle" ? <BundlePill /> : <FormatBadge format={pkg.format} short />}
          {pkg.highlight && (
            <span className="inline-flex h-6 items-center gap-1 rounded-full bg-brand-soft px-2 text-[11px] font-semibold text-brand">
              <Sparkles className="size-3" />
              Most popular
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${pkg.name}`}>
          <Pencil />
        </Button>
      </div>

      <h3 className={cn("mt-3 font-heading text-base font-semibold", !pkg.active && "text-muted-foreground")}>{pkg.name}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{pkg.description}</p>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-2xl font-semibold tracking-tight tabular-nums">{formatINR(pkg.price)}</span>
        {pkg.compareAt && pkg.compareAt > pkg.price && (
          <>
            <span className="text-sm text-muted-foreground tabular-nums line-through">{formatINR(pkg.compareAt)}</span>
            <span className="rounded-md bg-success-soft px-1.5 py-0.5 text-xs font-semibold text-success">Save {save}%</span>
          </>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <CalendarClock className="size-3.5" />
          {pkg.validity} access
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-foreground">
              <Package className="size-3.5" />
              {pkg.courseIds.length} {pkg.courseIds.length === 1 ? "programme" : "programmes"}
            </button>
          </TooltipTrigger>
          <TooltipContent className="block max-w-64">
            <ul className="space-y-0.5">
              {courseTitles.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </div>

      <ul className="mt-3 mb-4 space-y-1.5 border-t pt-3 text-[13px]">
        {pkg.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 size-3.5 shrink-0 text-brand" />
            <span>{f}</span>
          </li>
        ))}
        {extra > 0 && <li className="pl-5.5 text-xs text-muted-foreground">+{extra} more</li>}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <Switch id={`pkg-active-${pkg.id}`} checked={pkg.active} onCheckedChange={onToggle} className="data-checked:bg-brand" />
          <Label htmlFor={`pkg-active-${pkg.id}`} className="text-[13px] font-medium">
            {pkg.active ? "Active on checkout" : "Hidden"}
          </Label>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
      </div>
    </article>
  );
}

const VALIDITY_OPTIONS = ["1 month", "3 months", "4 months", "6 months", "9 months", "12 months", "24 months"];

type PackageErrors = Partial<Record<"price" | "compareAt" | "validity" | "description" | "features", string>>;

function validatePackage(v: { price: string; compareAt: string; validity: string; description: string; features: string[] }): PackageErrors {
  const e: PackageErrors = {};
  const price = Number(v.price);
  if (!v.price.trim()) e.price = "Enter a price.";
  else if (!Number.isFinite(price) || !Number.isInteger(price)) e.price = "Use whole rupees, e.g. 4999.";
  else if (price <= 0) e.price = "Price must be greater than ₹0.";
  else if (price > 1000000) e.price = "Price can't exceed ₹10,00,000.";
  if (v.compareAt.trim()) {
    const c = Number(v.compareAt);
    if (!Number.isFinite(c) || !Number.isInteger(c)) e.compareAt = "Use whole rupees.";
    else if (!e.price && c < price) e.compareAt = "Compare-at price must be the same as or higher than the price.";
  }
  if (!v.validity) e.validity = "Choose a validity period.";
  if (!v.description.trim()) e.description = "Add a short description.";
  else if (v.description.trim().length > 200) e.description = "Keep it under 200 characters.";
  if (!v.features.some((f) => f.trim())) e.features = "Add at least one feature.";
  return e;
}

function EditPackageForm({
  pkg,
  onDone,
  onCancel,
}: {
  pkg: PricingPackage;
  onDone: (patch: Partial<PricingPackage>) => void;
  onCancel: () => void;
}) {
  const [price, setPrice] = useState(String(pkg.price));
  const [compareAt, setCompareAt] = useState(pkg.compareAt ? String(pkg.compareAt) : "");
  const [validity, setValidity] = useState(pkg.validity);
  const [description, setDescription] = useState(pkg.description);
  const [features, setFeatures] = useState<string[]>(pkg.features);
  const [newFeature, setNewFeature] = useState("");
  const [active, setActive] = useState(pkg.active);
  const [submitted, setSubmitted] = useState(false);

  const values = { price, compareAt, validity, description, features };
  const errors = submitted ? validatePackage(values) : {};
  const validityOptions = VALIDITY_OPTIONS.includes(pkg.validity) ? VALIDITY_OPTIONS : [pkg.validity, ...VALIDITY_OPTIONS];

  const previewPrice = Number(price);
  const previewCompare = Number(compareAt);
  const previewSave =
    Number.isFinite(previewPrice) && previewPrice > 0 && previewCompare > previewPrice ? pct(previewCompare - previewPrice, previewCompare) : 0;

  const addFeature = () => {
    const f = newFeature.trim();
    if (!f) return;
    if (features.some((x) => x.toLowerCase() === f.toLowerCase())) {
      toast.error("That feature is already listed");
      return;
    }
    setFeatures([...features, f]);
    setNewFeature("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const errs = validatePackage(values);
    if (Object.keys(errs).length) return;
    onDone({
      price: Number(price),
      compareAt: compareAt.trim() ? Number(compareAt) : undefined,
      validity,
      description: description.trim(),
      features: features.map((f) => f.trim()).filter(Boolean),
      active,
    });
  };

  return (
    <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit {pkg.name}</DialogTitle>
        <DialogDescription>Changes apply to the pricing page and simulated checkout for this demo.</DialogDescription>
      </DialogHeader>
      <form id="edit-package-form" onSubmit={submit} noValidate className="-mx-4 space-y-4 overflow-y-auto px-4 pb-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pkg-price" label="Price (₹)" required error={errors.price}>
            <Input
              id="pkg-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
              aria-invalid={!!errors.price}
              aria-describedby={errors.price ? "pkg-price-error" : undefined}
            />
          </Field>
          <Field id="pkg-compare" label="Compare-at price (₹)" error={errors.compareAt} hint="Optional — shown struck through.">
            <Input
              id="pkg-compare"
              inputMode="numeric"
              value={compareAt}
              placeholder="e.g. 8497"
              onChange={(e) => setCompareAt(e.target.value.replace(/[^\d]/g, ""))}
              aria-invalid={!!errors.compareAt}
              aria-describedby={errors.compareAt ? "pkg-compare-error" : undefined}
            />
          </Field>
        </div>

        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-[13px]">
          <span className="text-muted-foreground">Learners will see </span>
          <span className="font-semibold tabular-nums">{previewPrice > 0 ? formatINR(previewPrice) : "—"}</span>
          {previewSave > 0 && (
            <>
              {" "}
              <span className="text-muted-foreground tabular-nums line-through">{formatINR(previewCompare)}</span>{" "}
              <span className="font-semibold text-success">Save {previewSave}%</span>
            </>
          )}
        </div>

        <Field id="pkg-validity" label="Validity" required error={errors.validity}>
          <Select value={validity} onValueChange={setValidity}>
            <SelectTrigger id="pkg-validity" className="h-9 w-full">
              <SelectValue placeholder="Choose validity" />
            </SelectTrigger>
            <SelectContent position="popper">
              {validityOptions.map((v) => (
                <SelectItem key={v} value={v}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field id="pkg-desc" label="Description" required error={errors.description} hint={`${description.trim().length}/200 characters`}>
          <Textarea
            id="pkg-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "pkg-desc-error" : undefined}
          />
        </Field>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pkg-new-feature" className="text-[13px]">
              Features<span className="text-destructive">*</span>
            </Label>
            <span className="text-xs text-muted-foreground">{features.length} listed</span>
          </div>
          {features.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {features.map((f, i) => (
                <li key={`${f}-${i}`} className="flex items-center gap-2 py-1.5 pr-1.5 pl-3 text-[13px]">
                  <Check className="size-3.5 shrink-0 text-brand" />
                  <span className="min-w-0 flex-1">{f}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Remove feature: ${f}`}
                    onClick={() => setFeatures(features.filter((_, j) => j !== i))}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input
              id="pkg-new-feature"
              value={newFeature}
              placeholder="e.g. 2 doubt-clearing sessions"
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
              className="h-9"
            />
            <Button type="button" variant="outline" className="h-9" onClick={addFeature} disabled={!newFeature.trim()}>
              <Plus />
              Add
            </Button>
          </div>
          {errors.features && <p className="text-xs font-medium text-destructive">{errors.features}</p>}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5">
          <div>
            <Label htmlFor="pkg-active" className="text-[13px]">
              Active on checkout
            </Label>
            <p className="text-xs text-muted-foreground">Inactive packages are hidden from learners.</p>
          </div>
          <Switch id="pkg-active" checked={active} onCheckedChange={setActive} className="data-checked:bg-brand" />
        </div>
      </form>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" form="edit-package-form">
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
