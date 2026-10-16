"use client";

import { useMemo, useState } from "react";
import { FolderDown, Lock, Search, X } from "lucide-react";
import { getCourse, resources } from "@/data";
import type { Resource } from "@/lib/types";
import { useMyEnrollments } from "@/store/hooks";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResourceCard, ResourcePreviewDialog } from "@/components/learner/resource-card";
import { FILE_META } from "@/components/learner/utils";

const TYPES = Object.keys(FILE_META) as Resource["fileType"][];

export default function LearningResourcesPage() {
  const enrollments = useMyEnrollments();
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [type, setType] = useState("all");
  const [preview, setPreview] = useState<Resource | null>(null);

  const enrolledIds = useMemo(() => new Set(enrollments.map((e) => e.courseId)), [enrollments]);
  const courseIds = [...new Set(resources.map((r) => r.courseId))];
  const matches = resources.filter((r) => {
    if (courseId !== "all" && r.courseId !== courseId) return false;
    if (type !== "all" && r.fileType !== type) return false;
    const t = q.trim().toLowerCase();
    return !t || `${r.title} ${r.description} ${getCourse(r.courseId)?.title}`.toLowerCase().includes(t);
  });
  const unlocked = matches.filter((r) => enrolledIds.has(r.courseId));
  const locked = matches.filter((r) => !enrolledIds.has(r.courseId));
  const filtered = q || courseId !== "all" || type !== "all";
  const reset = () => {
    setQ("");
    setCourseId("all");
    setType("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Learn"
        title="Learning Resources"
        description="Worksheets, templates and guides from your programmes. Downloads are simulated in this prototype."
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 shadow-xs md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search resources" className="h-9 pl-8" aria-label="Search resources" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="h-9 w-full sm:w-56" aria-label="Filter by course">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {courseIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {getCourse(id)?.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 w-full sm:w-36" aria-label="Filter by file type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All file types</SelectItem>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtered && (
            <Button variant="ghost" className="h-9" onClick={reset}>
              <X /> Clear
            </Button>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-semibold md:text-lg">From your programmes</h2>
          <p className="text-sm text-muted-foreground">{unlocked.length} resources unlocked</p>
        </div>
        {unlocked.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {unlocked.map((r) => (
              <ResourceCard key={r.id} resource={r} onPreview={setPreview} />
            ))}
          </div>
        ) : (
          <EmptyState icon={FolderDown} title={filtered ? "No unlocked resources match" : "No resources yet"} description={filtered ? "Try clearing the filters." : "Resources unlock when you enrol in a programme."} action={filtered ? <Button size="sm" onClick={reset}>Clear filters</Button> : undefined} />
        )}
      </section>

      {locked.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold md:text-lg">
              <Lock className="size-4 text-muted-foreground" /> From other programmes
            </h2>
            <p className="text-sm text-muted-foreground">Included when you enrol in these programmes</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {locked.map((r) => (
              <ResourceCard key={r.id} resource={r} locked onPreview={setPreview} />
            ))}
          </div>
        </section>
      )}

      <ResourcePreviewDialog resource={preview} onOpenChange={(o) => !o && setPreview(null)} />
    </div>
  );
}
