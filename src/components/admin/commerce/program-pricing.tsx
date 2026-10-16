"use client";

import { useMemo, useState } from "react";
import { Check, Pencil, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, FORMAT_META, FORMATS } from "@/data/constants";
import { formatINR } from "@/lib/format";
import type { Course, LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AutoStatus } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { FilterBar, FilterSelect, ResultsMeta, SearchField, TableCard, TableEmptyRow } from "@/components/admin/content/admin-kit";
import { useCourses } from "@/store/hooks";
import { useCommerceAdmin } from "./commerce-store";
import { CommerceSection } from "./commerce-utils";

type Draft = Partial<Record<LearningFormat, string>>;
type DraftErrors = Partial<Record<LearningFormat, string>>;

const MAX_PRICE = 200000;

function validateDraft(course: Course, draft: Draft): DraftErrors {
  const errors: DraftErrors = {};
  for (const f of course.formats) {
    const raw = (draft[f] ?? "").trim();
    if (!raw) errors[f] = "Required";
    else if (!/^\d+$/.test(raw)) errors[f] = "Whole rupees only";
    else if (Number(raw) > MAX_PRICE) errors[f] = `Max ${formatINR(MAX_PRICE)}`;
  }
  return errors;
}

export function ProgramPricing() {
  const courses = useCourses();
  const overrides = useCommerceAdmin((s) => s.priceOverrides);
  const setCoursePricing = useCommerceAdmin((s) => s.setCoursePricing);
  const resetCoursePricing = useCommerceAdmin((s) => s.resetCoursePricing);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [errors, setErrors] = useState<DraftErrors>({});

  const publicCourses = useMemo(() => courses.filter((c) => !c.collegeId), [courses]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return publicCourses
      .filter((c) => (category === "all" ? true : c.category === category))
      .filter((c) => !q || c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
      .map((c) => ({ course: c, pricing: { ...c.pricing, ...overrides[c.id] }, edited: !!overrides[c.id] }));
  }, [publicCourses, overrides, search, category]);

  const editedCount = Object.keys(overrides).length;

  const startEdit = (course: Course, pricing: Course["pricing"]) => {
    const d: Draft = {};
    for (const f of course.formats) d[f] = String(pricing[f] ?? 0);
    setDraft(d);
    setErrors({});
    setEditingId(course.id);
  };

  const cancel = () => {
    setEditingId(null);
    setErrors({});
  };

  const save = (course: Course) => {
    const errs = validateDraft(course, draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Check the highlighted prices", { description: "Prices must be whole rupees between ₹0 (Free) and ₹2,00,000." });
      return;
    }
    const next: Partial<Record<LearningFormat, number>> = {};
    for (const f of course.formats) next[f] = Number(draft[f]);
    const unchanged = course.formats.every((f) => next[f] === course.pricing[f]);
    if (unchanged) resetCoursePricing(course.id);
    else setCoursePricing(course.id, next);
    setEditingId(null);
    toast.success("Saved for this demo session", { description: `${course.title} — programme prices updated.` });
  };

  const reset = (course: Course) => {
    resetCoursePricing(course.id);
    if (editingId === course.id) setEditingId(null);
    toast.success("Prices restored", { description: `${course.title} is back to its catalogue prices.` });
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };

  return (
    <CommerceSection
      id="programme-pricing-heading"
      title="Programme-level pricing"
      description="List price per learning level for every public programme. Use the pencil to edit a row inline."
    >
      <FilterBar
        right={
          editedCount > 0 ? (
            <span className="text-xs text-muted-foreground">
              {editedCount} {editedCount === 1 ? "programme" : "programmes"} edited this session
            </span>
          ) : undefined
        }
      >
        <SearchField value={search} onChange={setSearch} placeholder="Search programmes…" label="Search programmes" />
        <FilterSelect
          label="Filter by category"
          value={category}
          onValueChange={setCategory}
          allLabel="All categories"
          options={CATEGORIES.map((c) => ({ value: c, label: c }))}
        />
      </FilterBar>
      <TableCard footer={<ResultsMeta shown={rows.length} total={publicCourses.length} noun="programmes" onReset={clearFilters} />}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-64">Programme</TableHead>
              {FORMATS.map((f) => (
                <TableHead key={f} className="min-w-32 text-right">
                  {FORMAT_META[f].label}
                </TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableEmptyRow
                colSpan={6}
                action={
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            )}
            {rows.map(({ course, pricing, edited }) => {
              const isEditing = editingId === course.id;
              return (
                <TableRow key={course.id} className={cn(isEditing && "bg-brand-soft/40 hover:bg-brand-soft/40")}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <CourseThumbnail course={course} size="sm" className="w-16 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{course.title}</p>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {course.category}
                          {edited && <span className="rounded bg-warning-soft px-1.5 py-px text-[10px] font-semibold text-warning uppercase">Edited</span>}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {FORMATS.map((f) => {
                    const offered = course.formats.includes(f);
                    if (!offered)
                      return (
                        <TableCell key={f} className="text-right">
                          <span className="text-xs text-muted-foreground">Not offered</span>
                        </TableCell>
                      );
                    if (isEditing) {
                      const id = `price-${course.id}-${f}`;
                      return (
                        <TableCell key={f} className="text-right">
                          <div className="relative ml-auto w-28">
                            <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <Input
                              id={id}
                              inputMode="numeric"
                              aria-label={`${course.title} — ${FORMAT_META[f].label} price in rupees`}
                              aria-invalid={!!errors[f]}
                              value={draft[f] ?? ""}
                              onChange={(e) => setDraft((d) => ({ ...d, [f]: e.target.value.replace(/[^\d]/g, "") }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") save(course);
                                if (e.key === "Escape") cancel();
                              }}
                              className="h-8 bg-background pl-6 text-right tabular-nums"
                            />
                          </div>
                          {errors[f] ? (
                            <p className="mt-1 text-[11px] font-medium text-destructive">{errors[f]}</p>
                          ) : (
                            <p className="mt-1 text-[11px] text-muted-foreground">0 = Free</p>
                          )}
                        </TableCell>
                      );
                    }
                    const value = pricing[f] ?? 0;
                    const base = course.pricing[f] ?? 0;
                    return (
                      <TableCell key={f} className="text-right tabular-nums">
                        {value === 0 ? <span className="font-medium text-success">Free</span> : <span className="font-medium">{formatINR(value)}</span>}
                        {edited && value !== base && (
                          <span className="block text-[11px] text-muted-foreground line-through">{base === 0 ? "Free" : formatINR(base)}</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <AutoStatus status={course.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-1">
                        <Button size="icon-sm" className="bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => save(course)} aria-label={`Save prices for ${course.title}`}>
                          <Check />
                        </Button>
                        <Button size="icon-sm" variant="outline" onClick={cancel} aria-label="Cancel editing">
                          <X />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1">
                        {edited && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon-sm" variant="ghost" onClick={() => reset(course)} aria-label={`Restore catalogue prices for ${course.title}`}>
                                <RotateCcw />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Restore catalogue prices</TooltipContent>
                          </Tooltip>
                        )}
                        <Button size="icon-sm" variant="ghost" onClick={() => startEdit(course, pricing)} aria-label={`Edit prices for ${course.title}`}>
                          <Pencil />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableCard>
    </CommerceSection>
  );
}
