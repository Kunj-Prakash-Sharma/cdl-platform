"use client";

import { useEffect, useRef, useState } from "react";
import {
  Captions,
  Check,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { getMentor } from "@/data";
import { formatClock } from "@/lib/format";
import type { Course, Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseIcon } from "./course-thumbnail";
import { Portrait } from "./portrait";

export interface VideoPlayerProps {
  course: Pick<Course, "title" | "thumbnail" | "instructorId">;
  lesson: Pick<Lesson, "id" | "title" | "durationSec">;
  /** e.g. "Chapter 2 · Lesson 3" */
  contextLabel?: string;
  /** Recorded resolution of the original upload; shown as the only playable quality in Phase 1 */
  originalQuality?: string;
  onEnded?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

/**
 * Simulated video player: no media is streamed. Playback advances a local clock so the
 * timeline, controls and completion behave like the real thing for the demo.
 */
export function VideoPlayer(props: VideoPlayerProps) {
  // Re-mount per lesson so playback state resets cleanly.
  return <PlayerInner key={props.lesson.id} {...props} />;
}

function PlayerInner({ course, lesson, contextLabel, originalQuality = "1080p", onEnded, onPrev, onNext, className }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(false);
  const [ended, setEnded] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef(0);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  });

  const duration = lesson.durationSec;
  const mentor = getMentor(course.instructorId);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = Math.min(duration, currentRef.current + speed);
      currentRef.current = next;
      setCurrent(next);
      if (next >= duration) {
        window.clearInterval(id);
        setPlaying(false);
        setEnded(true);
        endedRef.current?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, speed, duration]);

  const seek = (sec: number) => {
    const next = Math.max(0, Math.min(duration - 1, sec));
    currentRef.current = next;
    setEnded(false);
    setCurrent(next);
  };

  const toggle = () => {
    if (ended) {
      seek(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const fullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div
      ref={frameRef}
      className={cn("group/player relative isolate aspect-video w-full overflow-hidden rounded-2xl bg-navy text-white select-none", className)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "k") {
          e.preventDefault();
          toggle();
        } else if (e.key === "ArrowRight") seek(current + 10);
        else if (e.key === "ArrowLeft") seek(current - 10);
      }}
      aria-label={`Video player: ${lesson.title}`}
    >
      {/* Designed "recording" frame */}
      <div
        className="absolute inset-0 -z-10 opacity-90"
        style={{ backgroundImage: `radial-gradient(120% 90% at 85% 10%, ${course.thumbnail.to} 0%, transparent 55%), linear-gradient(135deg, ${course.thumbnail.from}, oklch(0.2 0.06 268))` }}
      />
      <div className="absolute inset-0 -z-10 bg-grid opacity-30" />

      <button type="button" onClick={toggle} className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center" aria-label={playing ? "Pause" : "Play"}>
        <div className="flex items-center gap-2 text-[11px] font-medium tracking-wider text-white/70 uppercase">
          <CourseIcon theme={course.thumbnail} className="size-4" />
          {course.title}
        </div>
        <p className="max-w-xl font-heading text-xl leading-tight font-semibold text-balance sm:text-3xl">{lesson.title}</p>
        {contextLabel && <p className="text-sm text-white/65">{contextLabel}</p>}
        {!playing && (
          <span className="mt-2 flex size-16 items-center justify-center rounded-full bg-white/95 text-navy shadow-lg transition group-hover/player:scale-105">
            {ended ? <RotateCcw className="size-7" /> : <Play className="ml-1 size-7 fill-current" />}
          </span>
        )}
        {playing && (
          <span className="mt-2 flex h-10 items-end gap-1" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className="w-1.5 animate-pulse rounded-full bg-white/70"
                style={{ height: `${12 + ((i * 37) % 28)}px`, animationDelay: `${(i % 5) * 120}ms` }}
              />
            ))}
          </span>
        )}
      </button>

      {/* Presenter picture-in-picture, like a recorded talking-head lesson */}
      {mentor && (
        <div className="pointer-events-none absolute top-3 right-3 hidden items-center gap-2 rounded-xl bg-black/30 p-1.5 pr-3 backdrop-blur-sm sm:flex">
          <Portrait avatar={mentor.avatar} name={mentor.name} className="size-9" rounded="xl" />
          <div className="text-left leading-tight">
            <p className="text-xs font-semibold">{mentor.name}</p>
            <p className="text-[10px] text-white/70">{mentor.title}</p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-black/30 px-2 py-1 text-[10px] font-medium tracking-wide text-white/80 uppercase backdrop-blur-sm">
        Sample recording · simulated playback
      </div>

      {captions && playing && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-6">
          <span className="rounded-md bg-black/70 px-3 py-1.5 text-sm">
            “…so the key idea in this lesson is to make your point clearly, then support it with an example.”
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-3 pt-10 pb-2.5 sm:px-4">
        <div
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.round(current)}
          className="group/seek relative h-4 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25 transition-all group-hover/seek:h-1.5" />
          <div className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-brand transition-all group-hover/seek:h-1.5" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: `${progress}%` }} />
        </div>
        <div className="mt-1 flex items-center gap-1 sm:gap-2">
          {onPrev && <CtrlButton label="Previous lesson" onClick={onPrev}><SkipBack className="size-4" /></CtrlButton>}
          <CtrlButton label={playing ? "Pause" : "Play"} onClick={toggle}>
            {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
          </CtrlButton>
          {onNext && <CtrlButton label="Next lesson" onClick={onNext}><SkipForward className="size-4" /></CtrlButton>}
          <CtrlButton label={muted ? "Unmute" : "Mute"} onClick={() => setMuted((m) => !m)}>
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </CtrlButton>
          <span className="ml-1 font-mono text-xs text-white/85 tabular-nums">
            {formatClock(current)} / {formatClock(duration)}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <CtrlButton label="Captions" onClick={() => setCaptions((c) => !c)} active={captions}>
              <Captions className="size-4" />
            </CtrlButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-white/90 hover:bg-white/15" aria-label="Playback settings">
                  <Settings2 className="size-4" />
                  <span className="hidden sm:inline">{speed}x · {originalQuality}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Playback speed</DropdownMenuLabel>
                {SPEEDS.map((s) => (
                  <DropdownMenuItem key={s} onSelect={() => setSpeed(s)}>
                    {s === 1 ? "Normal" : `${s}x`}
                    {s === speed && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Quality</DropdownMenuLabel>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Original ({originalQuality})
                  <Check className="ml-auto size-4" />
                </DropdownMenuItem>
                {["720p", "480p"].filter((q) => q !== originalQuality).map((q) => (
                  <DropdownMenuItem key={q} disabled>
                    {q}
                    <span className="ml-auto text-[10px]">Phase 2</span>
                  </DropdownMenuItem>
                ))}
                <p className="px-2 pt-1 pb-1.5 text-[11px] leading-snug text-muted-foreground">
                  Recordings play at their original quality. Adaptive streaming is planned for a later phase.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
            <CtrlButton label="Fullscreen" onClick={fullscreen}>
              <Maximize className="size-4" />
            </CtrlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function CtrlButton({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn("flex size-8 items-center justify-center rounded-md text-white/90 transition hover:bg-white/15 hover:text-white", active && "bg-white/20 text-white")}
    >
      {children}
    </button>
  );
}
