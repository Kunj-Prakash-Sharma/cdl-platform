"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Download, Eye, FileText, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor } from "@/data";
import { formatDate } from "@/lib/format";
import type { Resource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { Portrait } from "@/components/shared/portrait";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { FILE_META, formatSize, hashString } from "./utils";

const fileName = (r: Resource) => `${r.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}.${r.fileType.toLowerCase()}`;

/** Simulated download: a short progress animation, then a "Downloaded" state and a toast. */
export function useSimulatedDownload(resource: Resource) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done">("idle");
  const [percent, setPercent] = useState(0);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
    },
    [],
  );
  const start = () => {
    if (status === "downloading") return;
    setStatus("downloading");
    setPercent(0);
    let p = 0;
    timer.current = window.setInterval(() => {
      p += 18 + Math.random() * 14;
      if (p >= 100) {
        if (timer.current) window.clearInterval(timer.current);
        setPercent(100);
        setStatus("done");
        toast.success("Downloaded", { description: `${fileName(resource)} · ${formatSize(resource.sizeKb)} (simulated — no file is saved)` });
      } else setPercent(Math.round(p));
    }, 160);
  };
  return { status, percent, start };
}

export function FileTypeIcon({ type, className }: { type: Resource["fileType"]; className?: string }) {
  const meta = FILE_META[type];
  return (
    <span className={cn("flex size-11 shrink-0 flex-col items-center justify-center rounded-xl ring-1 ring-inset", meta.className, className)}>
      <meta.icon className="size-4.5" />
      <span className="mt-0.5 text-[9px] font-bold tracking-wide">{type}</span>
    </span>
  );
}

export function DownloadButton({ resource, className, size = "sm" }: { resource: Resource; className?: string; size?: "sm" | "default" }) {
  const { status, percent, start } = useSimulatedDownload(resource);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {status === "downloading" && <Progress value={percent} className="h-1 w-16 [&>[data-slot=progress-indicator]]:bg-brand" aria-label="Download progress" />}
      <Button
        variant={status === "done" ? "secondary" : "outline"}
        size={size}
        onClick={start}
        disabled={status === "downloading"}
        aria-label={`Download ${resource.title}`}
        className={cn(status === "done" && "text-success")}
      >
        {status === "downloading" ? <Loader2 className="animate-spin" /> : status === "done" ? <Check /> : <Download />}
        {status === "downloading" ? `${percent}%` : status === "done" ? "Downloaded" : "Download"}
      </Button>
    </div>
  );
}

/** Resource card used on the Learning Resources page and inside the course player. */
export function ResourceCard({ resource, locked, onPreview, className }: { resource: Resource; locked?: boolean; onPreview: (r: Resource) => void; className?: string }) {
  const course = getCourse(resource.courseId);
  const chapter = course?.chapters.find((c) => c.id === resource.chapterId);
  const mentor = getMentor(resource.mentorId);
  return (
    <article className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs transition hover:shadow-sm", locked && "bg-muted/30", className)}>
      <div className="flex items-start gap-3">
        <FileTypeIcon type={resource.fileType} className={cn(locked && "opacity-60 grayscale")} />
        <div className="min-w-0 flex-1">
          <h3 className="leading-snug font-semibold">{resource.title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {course?.title}
            {chapter ? ` · ${chapter.title}` : ""}
          </p>
        </div>
        {locked && (
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" title="Locked">
            <Lock className="size-3.5" />
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm text-muted-foreground">{resource.description}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {mentor && (
          <span className="inline-flex items-center gap-1.5">
            <Portrait avatar={mentor.avatar} name={mentor.name} className="size-4" />
            {mentor.name}
          </span>
        )}
        <span>{formatSize(resource.sizeKb)}</span>
        <span>Updated {formatDate(resource.updatedOn, "d MMM yyyy")}</span>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t pt-3">
        {locked ? (
          <>
            <span className="mr-auto text-xs text-muted-foreground">Included with this programme</span>
            <Button asChild variant="outline" size="sm">
              <Link href={`/courses/${resource.courseId}`}>
                <Lock /> View programme
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => onPreview(resource)}>
              <Eye /> Preview
            </Button>
            <DownloadButton resource={resource} />
          </>
        )}
      </div>
    </article>
  );
}

/** A document-like preview of a resource built from its preview lines. */
export function ResourcePreviewDialog({ resource, onOpenChange }: { resource: Resource | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!resource} onOpenChange={onOpenChange}>
      <DialogContent className="gap-4 p-5 sm:max-w-2xl">
        {resource && <PreviewBody resource={resource} />}
      </DialogContent>
    </Dialog>
  );
}

function PreviewBody({ resource }: { resource: Resource }) {
  const course = getCourse(resource.courseId);
  const mentor = getMentor(resource.mentorId);
  const meta = FILE_META[resource.fileType];
  const h = hashString(resource.id);
  const pages = 1 + (h % 6) + Math.round(resource.sizeKb / 400);
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 pr-8 font-heading text-lg">
          <FileTypeIcon type={resource.fileType} className="size-9" />
          <span className="min-w-0 truncate">{resource.title}</span>
        </DialogTitle>
        <DialogDescription>
          {meta.label} · {formatSize(resource.sizeKb)} · {resource.fileType === "ZIP" ? `${resource.previewLines.length} files` : `${pages} pages`} · preview
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[56vh] overflow-y-auto rounded-xl bg-muted/70 p-3 sm:p-5">
        <div className="mx-auto max-w-xl rounded-md bg-white px-6 py-7 text-slate-800 shadow-sm ring-1 ring-black/5 sm:px-9 sm:py-9">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <LogoMark className="size-6" />
              <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Career Design Lab · {course?.title}</span>
            </div>
            <span className="text-[10px] text-slate-400">p. 1 of {resource.fileType === "ZIP" ? 1 : pages}</span>
          </div>
          <h3 className="mt-5 font-heading text-xl font-semibold text-slate-900">{resource.title}</h3>
          <p className="mt-1.5 text-sm text-slate-500">{resource.description}</p>

          {resource.fileType === "XLSX" ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <tbody>
                  {resource.previewLines.map((line, i) => {
                    const cells = line.includes("|") ? line.split("|").map((c) => c.trim()) : line.split(":").map((c) => c.trim());
                    return (
                      <tr key={i} className={i === 0 ? "bg-emerald-50 font-semibold" : ""}>
                        {cells.map((c, j) => (
                          <td key={j} className="border border-slate-200 px-2 py-1.5">
                            {c}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {[0, 1, 2].map((r) => (
                    <tr key={`blank-${r}`}>
                      {Array.from({ length: Math.max(2, resource.previewLines[0]?.split(/[|:]/).length ?? 2) }, (_, j) => (
                        <td key={j} className="h-6 border border-slate-200" />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : resource.fileType === "ZIP" ? (
            <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {resource.previewLines.map((line) => (
                <li key={line} className="flex items-center gap-2.5 px-3 py-2 text-sm">
                  <FileText className="size-4 text-blue-600" />
                  <span className="font-mono text-[13px]">{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ol className="mt-5 space-y-3.5">
              {resource.previewLines.map((line, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[10px] font-semibold text-teal-700">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{line.replace(/^\d+\.\s*/, "")}</p>
                    <div className="mt-1.5 space-y-1" aria-hidden="true">
                      <div className="h-1.5 rounded bg-slate-100" style={{ width: `${70 + ((h + i * 13) % 28)}%` }} />
                      <div className="h-1.5 rounded bg-slate-100" style={{ width: `${45 + ((h + i * 7) % 35)}%` }} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-3 text-[10px] text-slate-400">
            <span>Prepared by {mentor?.name}</span>
            <span>Updated {formatDate(resource.updatedOn)}</span>
          </div>
        </div>
      </div>

      <DialogFooter className="-mx-5 -mb-5 items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Preview shows the first page only. Sample content for the prototype.</p>
        <DownloadButton resource={resource} size="default" />
      </DialogFooter>
    </>
  );
}
