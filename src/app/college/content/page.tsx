"use client";

import { useMemo, useState } from "react";
import { BookOpenText, CircleCheck, Eye, FileClock, Lock, PlayCircle, Plus, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { courseDurationSec, courseVideoLessons, getCourse, getMentor } from "@/data";
import { formatClock, formatDate, formatDuration } from "@/lib/format";
import type { ContentItem } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { AutoStatus } from "@/components/shared/badges";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Portrait } from "@/components/shared/portrait";
import { VideoPlayer } from "@/components/shared/video-player";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CollegeOnlyChip, ProviderBadge, tint, useAitCollege } from "@/components/college/brand";
import { AIT_COURSE_ID, programStats } from "@/components/college/college-data";
import { UploadContentDialog } from "@/components/college/upload-content-dialog";

interface Preview {
  id: string;
  title: string;
  durationSec: number;
  kind: "video" | "reading" | "quiz";
  context: string;
  quality?: string;
}

const READING_LINES = [
  "Phase 1 · 27 Oct – 7 Nov: Pre-placement talks (Infosys, L&T, Tata Motors, Persistent)",
  "Phase 2 · 10 Nov – 28 Nov: Aptitude tests and group discussions on campus",
  "Phase 3 · 1 Dec onwards: Technical and HR interviews, offer roll-out",
  "Eligibility: 6.5 CGPA, no active backlogs, resume approved by the T&P cell",
  "One-offer policy: students accepting a dream-company offer exit the drive",
];

export default function CollegeContentPage() {
  const college = useAitCollege();
  const course = getCourse(AIT_COURSE_ID)!;
  const allItems = useDemoStore((s) => s.contentItems);
  const updateContentItem = useDemoStore((s) => s.updateContentItem);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const items = useMemo(() => allItems.filter((c) => c.courseId === AIT_COURSE_ID), [allItems]);
  const counts = {
    published: items.filter((i) => i.status === "published").length,
    review: items.filter((i) => i.status === "in-review").length,
    draft: items.filter((i) => i.status === "draft" || i.status === "changes-requested").length,
  };
  const stats = programStats(AIT_COURSE_ID);
  const mentor = getMentor(course.instructorId);
  const chapterTitle = (id: string) => course.chapters.find((c) => c.id === id)?.title ?? "—";

  const openItem = (item: ContentItem) =>
    setPreview({ id: item.id, title: item.title, durationSec: item.durationSec, kind: "video", context: `${chapterTitle(item.chapterId)} · ${item.status === "published" ? "Published" : "Review copy"}`, quality: item.resolution });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow={college.name}
        title="College content"
        description={`Institution-specific programs and recordings provided by ${college.shortName}, delivered alongside CDL programs.`}
        actions={
          <Button className="h-10 px-4" onClick={() => setUploadOpen(true)}>
            <Plus /> Add college content
          </Button>
        }
      />

      {/* Visibility explanation */}
      <section className="grid grid-cols-1 gap-4 rounded-2xl border p-5 md:grid-cols-[1fr_auto] md:items-center" style={{ backgroundColor: tint(college.brandColor, 5), borderColor: tint(college.brandColor, 22) }}>
        <div className="flex gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: college.brandColor }}>
            <Lock className="size-5" />
          </span>
          <div>
            <h2 className="font-heading font-semibold">Visible only to {college.name} students</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              College-provided content never appears in the CDL public catalog. It is shown only in the {college.shortName}-branded student portal, to students on your licence. Every upload
              is reviewed by the CDL content team for quality and playback before it goes live.
            </p>
          </div>
        </div>
        <ol className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <li className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 ring-1 ring-border">
            <Upload className="size-3.5" /> Upload
          </li>
          <li className="text-muted-foreground">→</li>
          <li className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 ring-1 ring-border">
            <ShieldCheck className="size-3.5" /> CDL review
          </li>
          <li className="text-muted-foreground">→</li>
          <li className="flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 ring-1 ring-border">
            <CircleCheck className="size-3.5 text-success" /> {college.shortName} students
          </li>
        </ol>
      </section>

      {/* Institution program */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div className="space-y-4 rounded-2xl border bg-card p-4 shadow-xs">
          <CourseThumbnail course={course} size="lg" />
          <div className="flex flex-wrap gap-1.5">
            <ProviderBadge course={course} college={college} />
            <CollegeOnlyChip college={college} />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold">{course.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{course.description}</p>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/60 p-2">
              <dt className="text-[11px] text-muted-foreground">Students</dt>
              <dd className="font-heading font-semibold">{stats.assigned}</dd>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <dt className="text-[11px] text-muted-foreground">Avg progress</dt>
              <dd className="font-heading font-semibold">{stats.avgProgress}%</dd>
            </div>
            <div className="rounded-lg bg-muted/60 p-2">
              <dt className="text-[11px] text-muted-foreground">Runtime</dt>
              <dd className="font-heading font-semibold">{formatDuration(courseDurationSec(course))}</dd>
            </div>
          </dl>
          {mentor && (
            <div className="flex items-center gap-2 border-t pt-3 text-sm">
              <Portrait avatar={mentor.avatar} name={mentor.name} className="size-7" />
              <span className="text-muted-foreground">
                Co-delivered with <span className="font-medium text-foreground">{mentor.name}</span> (CDL)
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <SectionHeader title="Curriculum" description={`${course.chapters.length} chapters · ${courseVideoLessons(course).length} video lessons. Preview any lesson as a student would see it.`} />
          <Accordion type="multiple" defaultValue={course.chapters.map((c) => c.id)} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
            {course.chapters.map((chapter, ci) => (
              <AccordionItem key={chapter.id} value={chapter.id} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-left">
                    <span className="block text-xs font-medium text-muted-foreground">Chapter {ci + 1}</span>
                    <span className="font-heading font-semibold">{chapter.title}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <ul className="divide-y border-t">
                    {chapter.lessons.map((lesson, li) => (
                      <li key={lesson.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          {lesson.kind === "video" ? <PlayCircle className="size-4" /> : <BookOpenText className="size-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {ci + 1}.{li + 1} {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.kind === "video" ? "Video" : "Reading"} · {formatDuration(lesson.durationSec)}
                            {lesson.preview && " · Free preview"}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPreview({
                              id: lesson.id,
                              title: lesson.title,
                              durationSec: lesson.durationSec,
                              kind: lesson.kind,
                              context: `Chapter ${ci + 1} · Lesson ${li + 1}`,
                            })
                          }
                        >
                          <Eye /> Preview
                        </Button>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Content library */}
      <section className="space-y-4">
        <SectionHeader
          title={`${college.shortName} content library`}
          description={`${counts.published} published · ${counts.review} in CDL review · ${counts.draft} draft`}
          action={
            <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
              <Upload /> Upload
            </Button>
          }
        />
        {items.length === 0 ? (
          <EmptyState icon={FileClock} title="No college content yet" description="Upload alumni talks, case studies or placement briefings for your students." />
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4">Content</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-72 pl-4">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.reviewNote ?? item.description}</p>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{chapterTitle(item.chapterId)}</TableCell>
                    <TableCell className="tabular-nums">{formatClock(item.durationSec)}</TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {item.resolution} · {item.sizeMb} MB
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatDate(item.uploadedOn)}</TableCell>
                    <TableCell>
                      <AutoStatus status={item.status} label={item.status === "in-review" ? "In CDL review" : undefined} />
                    </TableCell>
                    <TableCell className="tabular-nums">{item.views || "—"}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => openItem(item)}>
                          <PlayCircle /> Play
                        </Button>
                        {(item.status === "draft" || item.status === "changes-requested") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              updateContentItem(item.id, { status: "in-review", reviewNote: undefined });
                              toast.success("Submitted to CDL for review", { description: item.title });
                            }}
                          >
                            Submit
                          </Button>
                        )}
                        {item.status === "in-review" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateContentItem(item.id, { status: "draft" });
                              toast("Moved back to draft", { description: item.title });
                            }}
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <UploadContentDialog open={uploadOpen} onOpenChange={setUploadOpen} course={course} collegeShort={college.shortName} />

      <Dialog open={Boolean(preview)} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-3xl">
          {preview && (
            <>
              <DialogHeader>
                <DialogTitle>{preview.title}</DialogTitle>
                <DialogDescription>
                  {course.title} · {preview.context}
                </DialogDescription>
              </DialogHeader>
              {preview.kind === "video" ? (
                <VideoPlayer course={course} lesson={preview} contextLabel={preview.context} originalQuality={preview.quality} />
              ) : (
                <div className="rounded-xl border bg-muted/30 p-5">
                  <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: college.brandColor }}>
                    {college.shortName} Training &amp; Placement Cell
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-semibold">{preview.title}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {READING_LINES.map((l) => (
                      <li key={l} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: college.brandColor }} />
                        {l}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground">Reading · {formatDuration(preview.durationSec)} · dates are illustrative</p>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
