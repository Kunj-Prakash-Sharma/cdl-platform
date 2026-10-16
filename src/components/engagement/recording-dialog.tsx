"use client";

import { Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { getCourse, getMentor } from "@/data";
import { formatDate, formatDuration } from "@/lib/format";
import { VideoPlayer } from "@/components/shared/video-player";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SessionTypeBadge } from "./session-bits";
import type { SessionEntry } from "./use-sessions";

/** Plays a past live session's recording in the shared (simulated) VideoPlayer. */
export function RecordingDialog({ entry, open, onOpenChange }: { entry?: SessionEntry; open: boolean; onOpenChange: (open: boolean) => void }) {
  const s = entry?.session;
  const course = s ? getCourse(s.courseId) : undefined;
  const mentor = s ? getMentor(s.mentorId) : undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto p-3 sm:max-w-4xl sm:p-4">
        {s && course && s.recording ? (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="text-base leading-snug sm:text-lg">{s.title}</DialogTitle>
              <DialogDescription>
                {course.title} · recorded {formatDate(s.date, "EEE, d MMM yyyy")} · {mentor?.name}
              </DialogDescription>
            </DialogHeader>
            <VideoPlayer
              course={{ title: course.title, thumbnail: course.thumbnail, instructorId: s.mentorId }}
              lesson={{ id: s.id, title: s.title, durationSec: s.recording.durationSec }}
              contextLabel={`Live session recording · ${formatDate(s.date, "d MMM yyyy")}`}
              originalQuality="1080p"
            />
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <SessionTypeBadge type={s.type} />
              <span>{formatDuration(s.recording.durationSec)}</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" /> {s.recording.views} views
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => toast.success("Session notes prepared", { description: "Slides and chat highlights would download as a PDF (simulated)." })}
              >
                <Download /> Session notes
              </Button>
            </div>
          </>
        ) : (
          <DialogHeader>
            <DialogTitle>Recording unavailable</DialogTitle>
            <DialogDescription>Recordings are added within 24 hours of a session.</DialogDescription>
          </DialogHeader>
        )}
      </DialogContent>
    </Dialog>
  );
}
