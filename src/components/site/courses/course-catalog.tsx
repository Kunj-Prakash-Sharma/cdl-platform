"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { courseStartingPrice, getMentor } from "@/data";
import { CATEGORIES, FORMAT_META, FORMATS, STAGE_META, STAGES } from "@/data/constants";
import type { Course, CourseCategory, LearnerStage, LearningFormat } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCourses } from "@/store/hooks";
import { CourseCard } from "@/components/shared/cards";
import { EmptyState } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type PriceBucket = "any" | "free" | "under-1500" | "1500-3000" | "above-3000";
type SortKey = "popular" | "rating" | "price" | "newest";

const PRICE_OPTIONS: { value: PriceBucket; label: string }[] = [
  { value: "any", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "under-1500", label: "Under ₹1,500" },
  { value: "1500-3000", label: "₹1,500 – ₹3,000" },
  { value: "above-3000", label: "Above ₹3,000" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "price", label: "Price: low to high" },
  { value: "newest", label: "Newest" },
];

interface Filters {
  categories: CourseCategory[];
  stages: LearnerStage[];
  formats: LearningFormat[];
  price: PriceBucket;
}

const EMPTY_FILTERS: Filters = { categories: [], stages: [], formats: [], price: "any" };

function inBucket(price: number, bucket: PriceBucket) {
  switch (bucket) {
    case "any":
      return true;
    case "free":
      return price === 0;
    case "under-1500":
      return price > 0 && price < 1500;
    case "1500-3000":
      return price >= 1500 && price <= 3000;
    case "above-3000":
      return price > 3000;
  }
}

function matches(course: Course, f: Filters, q: string) {
  if (f.categories.length && !f.categories.includes(course.category)) return false;
  if (f.stages.length && !course.audience.some((a) => f.stages.includes(a))) return false;
  if (f.formats.length && !course.formats.some((x) => f.formats.includes(x))) return false;
  if (!inBucket(courseStartingPrice(course), f.price)) return false;
  if (q) {
    const hay = [course.title, course.subtitle, course.category, ...course.tags, getMentor(course.instructorId)?.name ?? ""].join(" ").toLowerCase();
    if (!q.split(/\s+/).every((word) => hay.includes(word))) return false;
  }
  return true;
}

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export function CourseCatalog() {
  const all = useCourses();
  const catalog = useMemo(() => all.filter((c) => c.status === "published" && !c.collegeId), [all]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("popular");
  const [sheetOpen, setSheetOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    const list = catalog.filter((c) => matches(c, filters, q));
    const sorted = [...list];
    if (sort === "popular") sorted.sort((a, b) => b.learners - a.learners);
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    if (sort === "price") sorted.sort((a, b) => courseStartingPrice(a) - courseStartingPrice(b));
    if (sort === "newest") sorted.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
    return sorted;
  }, [catalog, filters, q, sort]);

  const counts = useMemo(() => {
    const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, catalog.filter((x) => x.category === c).length])) as Record<CourseCategory, number>;
    const byStage = Object.fromEntries(STAGES.map((s) => [s, catalog.filter((x) => x.audience.includes(s)).length])) as Record<LearnerStage, number>;
    const byFormat = Object.fromEntries(FORMATS.map((f) => [f, catalog.filter((x) => x.formats.includes(f)).length])) as Record<LearningFormat, number>;
    return { byCategory, byStage, byFormat };
  }, [catalog]);

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...filters.categories.map((c) => ({ key: `c-${c}`, label: c, remove: () => setFilters((f) => ({ ...f, categories: toggle(f.categories, c) })) })),
    ...filters.stages.map((s) => ({ key: `s-${s}`, label: STAGE_META[s].plural, remove: () => setFilters((f) => ({ ...f, stages: toggle(f.stages, s) })) })),
    ...filters.formats.map((x) => ({ key: `f-${x}`, label: FORMAT_META[x].label, remove: () => setFilters((f) => ({ ...f, formats: toggle(f.formats, x) })) })),
    ...(filters.price !== "any"
      ? [{ key: "price", label: PRICE_OPTIONS.find((p) => p.value === filters.price)!.label, remove: () => setFilters((f) => ({ ...f, price: "any" as const })) }]
      : []),
  ];
  const activeCount = chips.length;

  const resetAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuery("");
  };

  const highlightFormat = filters.formats.length === 1 ? filters.formats[0] : undefined;

  const panel = (idPrefix: string) => (
    <FilterPanel idPrefix={idPrefix} filters={filters} setFilters={setFilters} counts={counts} />
  );

  return (
    <>
      <section className="relative isolate overflow-hidden border-b bg-muted/40">
        <div className="absolute inset-0 -z-10 bg-dots [mask-image:radial-gradient(ellipse_60%_80%_at_80%_0%,black,transparent)]" />
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-10 md:px-6 md:pt-16 md:pb-12">
          <p className="text-xs font-semibold tracking-[0.14em] text-brand uppercase">Course catalog</p>
          <h1 className="mt-3 max-w-3xl font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance md:text-5xl">
            Courses for every stage of your career
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Career discovery, communication, employability, leadership and personal growth — each offered as Self-Paced, Live Cohort or One-to-One
            Mentoring.
          </p>
          <div className="relative mt-8 max-w-2xl">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses, skills or mentors — e.g. interview, GD, leadership"
              aria-label="Search courses"
              className="h-12 rounded-xl bg-card pl-12 text-base shadow-xs md:text-base"
            />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 md:py-12 lg:grid-cols-[250px_1fr] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">
            <div className="flex items-center justify-between">
              <p className="font-heading font-semibold">Filters</p>
              {activeCount > 0 && (
                <Button variant="link" size="sm" className="h-auto px-0" onClick={() => setFilters(EMPTY_FILTERS)}>
                  Clear all
                </Button>
              )}
            </div>
            {panel("d")}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Showing <span className="font-semibold text-foreground">{results.length}</span> of {catalog.length} courses
              {q && (
                <>
                  {" "}
                  for &ldquo;<span className="font-medium text-foreground">{query.trim()}</span>&rdquo;
                </>
              )}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" className="h-9 lg:hidden" onClick={() => setSheetOpen(true)}>
                <SlidersHorizontal /> Filters
                {activeCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">{activeCount}</span>
                )}
              </Button>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-9 w-[180px] bg-card" aria-label="Sort courses">
                  <SelectValue>{SORT_OPTIONS.find((o) => o.value === sort)?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.remove}
                  className="inline-flex h-7 items-center gap-1 rounded-full border bg-card pr-2 pl-3 text-xs font-medium transition hover:border-destructive/40 hover:text-destructive"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label} <X className="size-3.5" />
                </button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear all
              </Button>
            </div>
          )}

          {results.length ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((c) => (
                <CourseCard key={c.id} course={c} highlightFormat={highlightFormat && c.formats.includes(highlightFormat) ? highlightFormat : undefined} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={SearchX}
              title="No courses match these filters"
              description="Try removing a filter or searching for a broader skill, like “communication” or “interview”."
              className="mt-6 py-16"
              action={<Button onClick={resetAll}>Reset search &amp; filters</Button>}
            />
          )}

          <div className="mt-12 flex flex-col items-start gap-4 rounded-2xl border bg-gradient-to-r from-brand-soft to-secondary p-6 sm:flex-row sm:items-center">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-card text-brand shadow-xs">
              <Sparkles className="size-5" />
            </span>
            <div className="flex-1">
              <p className="font-heading font-semibold">Not sure which course fits?</p>
              <p className="text-sm text-muted-foreground">A free 5-minute discovery conversation suggests courses and a learning level for you.</p>
            </div>
            <Button asChild className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90">
              <Link href="/discover">
                Start free discovery <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="w-[88%] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>{results.length} courses match</SheetDescription>
          </SheetHeader>
          <div className="px-4">{panel("m")}</div>
          <SheetFooter className="flex-row gap-2 border-t">
            <Button variant="outline" className="h-10 flex-1" onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear all
            </Button>
            <Button className="h-10 flex-1" onClick={() => setSheetOpen(false)}>
              Show {results.length} courses
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b py-5 last:border-b-0">
      <legend className="sr-only">{title}</legend>
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase" aria-hidden>
        {title}
      </p>
      <div className="space-y-2.5">{children}</div>
    </fieldset>
  );
}

function CheckRow({ id, label, count, checked, onChange }: { id: string; label: React.ReactNode; count: number; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="flex-1 cursor-pointer text-sm font-normal">
        {label}
      </Label>
      <span className={cn("text-xs tabular-nums", count ? "text-muted-foreground" : "text-muted-foreground/50")}>{count}</span>
    </div>
  );
}

function FilterPanel({
  idPrefix,
  filters,
  setFilters,
  counts,
}: {
  idPrefix: string;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  counts: { byCategory: Record<CourseCategory, number>; byStage: Record<LearnerStage, number>; byFormat: Record<LearningFormat, number> };
}) {
  return (
    <div>
      <FilterGroup title="Category">
        {CATEGORIES.map((c) => (
          <CheckRow
            key={c}
            id={`${idPrefix}-cat-${c}`}
            label={c}
            count={counts.byCategory[c]}
            checked={filters.categories.includes(c)}
            onChange={() => setFilters((f) => ({ ...f, categories: toggle(f.categories, c) }))}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Learner stage">
        {STAGES.map((s) => (
          <CheckRow
            key={s}
            id={`${idPrefix}-stage-${s}`}
            label={STAGE_META[s].plural}
            count={counts.byStage[s]}
            checked={filters.stages.includes(s)}
            onChange={() => setFilters((f) => ({ ...f, stages: toggle(f.stages, s) }))}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Learning format">
        {FORMATS.map((x) => (
          <CheckRow
            key={x}
            id={`${idPrefix}-fmt-${x}`}
            label={
              <span>
                {FORMAT_META[x].label} <span className="text-xs text-muted-foreground">· L{FORMAT_META[x].level}</span>
              </span>
            }
            count={counts.byFormat[x]}
            checked={filters.formats.includes(x)}
            onChange={() => setFilters((f) => ({ ...f, formats: toggle(f.formats, x) }))}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Starting price">
        <RadioGroup value={filters.price} onValueChange={(v) => setFilters((f) => ({ ...f, price: v as PriceBucket }))} className="gap-2.5">
          {PRICE_OPTIONS.map((p) => (
            <div key={p.value} className="flex items-center gap-2.5">
              <RadioGroupItem id={`${idPrefix}-price-${p.value}`} value={p.value} />
              <Label htmlFor={`${idPrefix}-price-${p.value}`} className="cursor-pointer text-sm font-normal">
                {p.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FilterGroup>
    </div>
  );
}
