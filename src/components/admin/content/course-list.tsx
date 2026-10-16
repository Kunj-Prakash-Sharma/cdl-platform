"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BookOpen,
  BookPlus,
  CircleCheck,
  Clapperboard,
  Ellipsis,
  Eye,
  EyeOff,
  Pencil,
  Send,
  Trash2,
  Users,
  FilePen,
} from "lucide-react";
import { courseLessons, courseVideoLessons, getCollege, getMentor } from "@/data";
import { CATEGORIES, DEMO_TODAY, FORMAT_META, FORMATS } from "@/data/constants";
import { formatCompact, formatDate, formatNumber } from "@/lib/format";
import type { Course } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { AutoStatus, FormatBadge, StatusPill } from "@/components/shared/badges";
import { PageHeader, StatCard } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClearFiltersButton, ConfirmDialog, FilterBar, FilterSelect, ResultsMeta, SearchField, TableCard, TableEmptyRow } from "./admin-kit";
import { useAdminContent } from "./admin-content-store";
import { COURSE_STATUS_META, priceRange, useAdminCourses, type AdminCourse } from "./course-utils";

const STATUS_OPTIONS = (Object.keys(COURSE_STATUS_META) as Course["status"][]).map((s) => ({ value: s, label: COURSE_STATUS_META[s].label }));

export function CourseList() {
  const router = useRouter();
  const courses = useAdminCourses();
  const contentItems = useDemoStore((s) => s.contentItems);
  const setCourseStatus = useDemoStore((s) => s.setCourseStatus);
  const updateCustomCourse = useDemoStore((s) => s.updateCustomCourse);
  const removeCourse = useAdminContent((s) => s.removeCourse);

  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [format, setFormat] = useState("all");
  const [removeTarget, setRemoveTarget] = useState<AdminCourse | null>(null);

  const pendingByCourse = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of contentItems) if (c.status === "in-review") map.set(c.courseId, (map.get(c.courseId) ?? 0) + 1);
    return map;
  }, [contentItems]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return courses.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (status !== "all" && c.status !== status) return false;
      if (format !== "all" && !c.formats.includes(format as Course["formats"][number])) return false;
      if (term) {
        const mentor = getMentor(c.instructorId)?.name ?? "";
        if (![c.title, c.subtitle, c.id, mentor, ...c.tags].some((s) => s.toLowerCase().includes(term))) return false;
      }
      return true;
    });
  }, [courses, q, category, status, format]);

  const stats = useMemo(
    () => ({
      total: courses.length,
      published: courses.filter((c) => c.status === "published").length,
      pipeline: courses.filter((c) => c.status === "draft" || c.status === "in-review").length,
      inReview: courses.filter((c) => c.status === "in-review").length,
      learners: courses.reduce((n, c) => n + c.learners, 0),
      institution: courses.filter((c) => c.collegeId).length,
    }),
    [courses],
  );

  const hasFilters = q !== "" || category !== "all" || status !== "all" || format !== "all";
  const resetFilters = () => {
    setQ("");
    setCategory("all");
    setStatus("all");
    setFormat("all");
  };

  function changeStatus(course: AdminCourse, next: Course["status"], message: string) {
    if (course.custom) updateCustomCourse(course.id, { status: next, lastUpdated: DEMO_TODAY });
    else setCourseStatus(course.id, next);
    toast.success(message, { description: `${course.title} is now ${COURSE_STATUS_META[next].label.toLowerCase()}.` });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Courses"
        description="Administer the programme catalog: curriculum, learning levels, pricing, mentors and publishing status."
        actions={
          <>
            <Button variant="outline" className="h-9" asChild>
              <Link href="/admin/content">
                <Clapperboard className="size-4" />
                Video library
              </Link>
            </Button>
            <Button className="h-9 bg-brand px-3.5 text-brand-foreground hover:bg-brand/90" asChild>
              <Link href="/admin/courses/new">
                <BookPlus className="size-4" />
                New course
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Courses in catalog" value={stats.total} icon={BookOpen} hint={`${stats.institution} institution-specific`} />
        <StatCard label="Published" value={stats.published} icon={CircleCheck} accent="success" hint="Live and open for enrolment" />
        <StatCard
          label="Drafts & in review"
          value={stats.pipeline}
          icon={FilePen}
          accent="warning"
          hint={stats.inReview ? `${stats.inReview} awaiting approval` : "Nothing awaiting approval"}
        />
        <StatCard label="Learners enrolled" value={formatCompact(stats.learners)} icon={Users} accent="brand" hint="Across all levels" />
      </div>

      <div className="space-y-3">
        <FilterBar right={<ResultsMeta shown={filtered.length} total={courses.length} noun="courses" onReset={resetFilters} />}>
          <SearchField value={q} onChange={setQ} placeholder="Search title, mentor or tag…" label="Search courses" />
          <FilterSelect label="Category" allLabel="All categories" value={category} onValueChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect label="Status" allLabel="All statuses" value={status} onValueChange={setStatus} options={STATUS_OPTIONS} className="sm:w-40" />
          <FilterSelect
            label="Learning level"
            allLabel="All levels"
            value={format}
            onValueChange={setFormat}
            options={FORMATS.map((f) => ({ value: f, label: FORMAT_META[f].label }))}
            className="sm:w-52"
          />
          <ClearFiltersButton visible={hasFilters} onClick={resetFilters} />
        </FilterBar>

        <TableCard>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Course</TableHead>
                <TableHead>Learning levels</TableHead>
                <TableHead>Mentor</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
                <TableHead className="text-right">Learners</TableHead>
                <TableHead>Price range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableEmptyRow
                  colSpan={8}
                  icon={BookOpen}
                  action={
                    <Button variant="outline" size="sm" onClick={resetFilters}>
                      Clear filters
                    </Button>
                  }
                />
              )}
              {filtered.map((c) => {
                const mentor = getMentor(c.instructorId);
                const college = c.collegeId ? getCollege(c.collegeId) : undefined;
                const lessons = courseLessons(c).length;
                const videos = courseVideoLessons(c).length;
                const pending = pendingByCourse.get(c.id) ?? 0;
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell>
                      <div className="flex min-w-[260px] items-center gap-3">
                        <CourseThumbnail course={c} size="sm" className="w-16 shrink-0" />
                        <div className="min-w-0">
                          <Link href={`/admin/courses/${c.id}`} className="block truncate font-medium text-foreground hover:text-primary hover:underline">
                            {c.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {c.custom ? (
                              <StatusPill tone="primary" dot={false} className="h-5 px-2 text-[11px]">
                                Created in admin
                              </StatusPill>
                            ) : (
                              <span>{c.category}</span>
                            )}
                            {college && (
                              <StatusPill tone="info" dot={false} className="h-5 px-2 text-[11px]">
                                Institution · {college.shortName}
                              </StatusPill>
                            )}
                            {pending > 0 && (
                              <Link href="/admin/content" className="font-medium text-warning hover:underline">
                                {pending} video{pending > 1 ? "s" : ""} in review
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-[118px] flex-col items-start gap-1">
                        {c.formats.map((f) => (
                          <FormatBadge key={f} format={f} short className="h-5 px-2 text-[11px] [&_svg]:size-3" />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mentor ? (
                        <div className="flex items-center gap-2">
                          <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
                          <span className="text-[13px] leading-tight">{mentor.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {lessons}
                      <div className="text-[11px] text-muted-foreground">{videos} video</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatNumber(c.learners)}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{priceRange(c)}</TableCell>
                    <TableCell>
                      <AutoStatus status={c.status} label={COURSE_STATUS_META[c.status].label} />
                      <div className="mt-1 text-[11px] whitespace-nowrap text-muted-foreground">Updated {formatDate(c.lastUpdated, "d MMM")}</div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.title}`}>
                            <Ellipsis className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{c.title}</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => router.push(`/admin/courses/${c.id}`)}>
                            <Pencil />
                            Edit course
                          </DropdownMenuItem>
                          {!c.custom && !c.collegeId && c.status === "published" && (
                            <DropdownMenuItem onSelect={() => router.push(`/courses/${c.id}`)}>
                              <Eye />
                              View in catalog
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {c.status === "in-review" && (
                            <DropdownMenuItem onSelect={() => changeStatus(c, "published", "Course approved")}>
                              <CircleCheck />
                              Approve & publish
                            </DropdownMenuItem>
                          )}
                          {c.status === "draft" && (
                            <DropdownMenuItem onSelect={() => changeStatus(c, "in-review", "Sent for review")}>
                              <Send />
                              Send for review
                            </DropdownMenuItem>
                          )}
                          {(c.status === "draft" || c.status === "unpublished") && (
                            <DropdownMenuItem onSelect={() => changeStatus(c, "published", "Course published")}>
                              <Eye />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {(c.status === "published" || c.status === "in-review") && (
                            <DropdownMenuItem onSelect={() => changeStatus(c, "unpublished", "Course unpublished")}>
                              <EyeOff />
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onSelect={() => setRemoveTarget(c)}>
                            <Trash2 />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
        <p className="text-xs text-muted-foreground">
          Status changes apply across the demo (catalog, dashboards). Courses created in the admin console stay out of the public catalog in this prototype.
        </p>
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title={`Remove “${removeTarget?.title ?? ""}”?`}
        description="The course is hidden from this admin list for the rest of the demo session. Enrolled learners and their progress are not affected."
        confirmLabel="Remove course"
        destructive
        onConfirm={() => {
          if (!removeTarget) return;
          removeCourse(removeTarget.id);
          toast.success("Course removed", { description: `${removeTarget.title} was removed from the admin list.` });
          setRemoveTarget(null);
        }}
      />
    </div>
  );
}
