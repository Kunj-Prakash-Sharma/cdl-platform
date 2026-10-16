"use client";

import { useRef, useState } from "react";
import { FileVideo, Upload, X } from "lucide-react";
import { toast } from "sonner";
import type { ContentItem, Course } from "@/lib/types";
import { useDemoStore } from "@/store/demo-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const RESOLUTIONS: ContentItem["resolution"][] = ["720p", "1080p", "1440p", "4K"];

export function UploadContentDialog({ open, onOpenChange, course, collegeShort }: { open: boolean; onOpenChange: (o: boolean) => void; course: Course; collegeShort: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">{open && <UploadForm course={course} collegeShort={collegeShort} onClose={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function UploadForm({ course, collegeShort, onClose }: { course: Course; collegeShort: string; onClose: () => void }) {
  const addContentItem = useDemoStore((s) => s.addContentItem);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; sizeMb: number } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [chapterId, setChapterId] = useState(course.chapters[0]?.id ?? "");
  const [minutes, setMinutes] = useState("");
  const [resolution, setResolution] = useState<ContentItem["resolution"]>("1080p");
  const [touched, setTouched] = useState(false);

  const mins = Number(minutes);
  const errors = {
    file: !file ? "Choose a video file." : "",
    title: title.trim().length < 5 ? "Add a title of at least 5 characters." : "",
    description: description.trim().length < 10 ? "Describe the content in a sentence or two." : "",
    minutes: !minutes || !Number.isFinite(mins) || mins <= 0 || mins > 180 ? "Enter a duration between 1 and 180 minutes." : "",
  };
  const valid = Object.values(errors).every((e) => !e);

  const save = (status: ContentItem["status"]) => {
    setTouched(true);
    if (!valid || !file) return;
    addContentItem({
      courseId: course.id,
      chapterId,
      title: title.trim(),
      description: description.trim(),
      durationSec: Math.round(mins * 60),
      resolution,
      sizeMb: file.sizeMb,
      mentorId: "m-sameer",
      status,
    });
    if (status === "in-review") {
      toast.success("Submitted to CDL for review", {
        description: `“${title.trim()}” will be checked by the CDL content team and published to ${collegeShort} students only (simulated).`,
      });
    } else {
      toast.success("Saved as draft", { description: "Submit it for review when you're ready." });
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add college content</DialogTitle>
        <DialogDescription>
          Upload a recorded talk, case study or briefing for {course.title}. It is reviewed by CDL before {collegeShort} students can see it.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="sr-only"
          aria-label="Choose video file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile({ name: f.name, sizeMb: Math.max(1, Math.round(f.size / (1024 * 1024))) });
              if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
            }
            e.target.value = "";
          }}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-info-soft text-info">
              <FileVideo className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.sizeMb} MB · stays on this device (simulated upload)</p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={() => setFile(null)}>
              <X />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/30 px-4 py-7 text-center transition hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <Upload className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">Choose a video file</span>
            <span className="text-xs text-muted-foreground">MP4 or MOV · recorded at original quality</span>
          </button>
        )}
        {touched && errors.file && <p className="-mt-2 text-xs text-destructive">{errors.file}</p>}

        <div className="space-y-1.5">
          <Label htmlFor="up-title">Title</Label>
          <Input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Alumni talk: cracking core engineering interviews" aria-invalid={touched && Boolean(errors.title)} />
          {touched && errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="up-desc">Description</Label>
          <Textarea id="up-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What will students learn from this video?" aria-invalid={touched && Boolean(errors.description)} />
          {touched && errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="up-chapter">Chapter</Label>
            <Select value={chapterId} onValueChange={setChapterId}>
              <SelectTrigger id="up-chapter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {course.chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-min">Duration (min)</Label>
            <Input id="up-min" inputMode="decimal" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="15" aria-invalid={touched && Boolean(errors.minutes)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="up-res">Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as ContentItem["resolution"])}>
              <SelectTrigger id="up-res" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {touched && errors.minutes && <p className="-mt-2 text-xs text-destructive">{errors.minutes}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => save("draft")}>
          Save draft
        </Button>
        <Button onClick={() => save("in-review")}>
          <Upload /> Submit for review
        </Button>
      </DialogFooter>
    </>
  );
}
