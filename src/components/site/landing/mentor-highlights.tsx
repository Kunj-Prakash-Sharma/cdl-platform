"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { useMentors } from "@/store/hooks";
import { Rating } from "@/components/shared/cards";
import { Portrait } from "@/components/shared/portrait";

const PREFERRED = ["m-kavya", "m-arjun", "m-meera", "m-rohan"];

export function MentorHighlights() {
  const mentors = useMentors();
  const shown = useMemo(() => {
    const active = mentors.filter((m) => m.status === "active");
    const preferred = PREFERRED.map((id) => active.find((m) => m.id === id)).filter((m) => m !== undefined);
    const rest = active.filter((m) => !PREFERRED.includes(m.id));
    return [...preferred, ...rest].slice(0, 4);
  }, [mentors]);

  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {shown.map((m) => (
        <Link
          key={m.id}
          href={`/mentors/${m.id}`}
          className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <Portrait avatar={m.avatar} name={m.name} className="absolute inset-x-0 top-0 h-auto w-full rounded-none" rounded="xl" />
            <span className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/85 text-primary opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading font-semibold group-hover:text-primary">{m.name}</h3>
              <BadgeCheck className="size-4 text-brand" aria-label="Verified mentor" />
            </div>
            <p className="text-sm text-muted-foreground">{m.title}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {m.expertise.slice(0, 2).map((e) => (
                <span key={e} className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {e}
                </span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
              <Rating value={m.rating} count={m.reviewCount} />
              <span>{formatNumber(m.sessionsDelivered)} sessions</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
