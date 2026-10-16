"use client";

import { useState } from "react";
import Link from "next/link";
import { Award, Eye, Info, Printer, Sparkles } from "lucide-react";
import { getUser } from "@/data";
import { formatDate } from "@/lib/format";
import { useCurrentUser, useMyEnrollments } from "@/store/hooks";
import { CourseThumbnail } from "@/components/shared/course-thumbnail";
import { EmptyState, PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CertificateDialog, CertificateDocument, type CertificateData } from "@/components/learner/certificate";
import { useMyCertificates, type MyCertificate } from "@/components/learner/hooks";
import { CHILD_USER_ID, courseHoursLabel } from "@/components/learner/utils";
import { OwnerTag } from "@/components/learner/widgets";

export default function CertificatesPage() {
  const { user, isParent } = useCurrentUser();
  const mine = useMyCertificates();
  const childCerts = useMyCertificates(CHILD_USER_ID);
  const enrollments = useMyEnrollments();
  const childEnrollments = useMyEnrollments(CHILD_USER_ID);
  const child = getUser(CHILD_USER_ID)!;
  const [open, setOpen] = useState<CertificateData | null>(null);
  const [printing, setPrinting] = useState<CertificateData | null>(null);

  const toData = (c: MyCertificate, learnerName: string, child?: boolean): CertificateData => ({
    id: c.id,
    learnerName,
    course: c.course,
    issuedOn: c.issuedOn,
    format: (child ? childEnrollments : enrollments).find((e) => e.courseId === c.courseId)?.format,
  });
  const items = [
    ...mine.map((c) => ({ cert: c, data: toData(c, user.name), owner: isParent ? "Yours" : undefined })),
    ...(isParent ? childCerts.map((c) => ({ cert: c, data: toData(c, child.name, true), owner: `${child.name.split(" ")[0]}'s` })) : []),
  ];

  const print = (data: CertificateData) => {
    setPrinting(data);
    setOpen(null);
    window.setTimeout(() => window.print(), 350);
  };

  return (
    <>
      <div className="no-print mx-auto max-w-7xl space-y-6">
        <PageHeader eyebrow="Learn" title="Certificates" description="Certificates for every programme you complete. Preview, download or print them any time." />
        <p className="flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning-soft/60 px-3 py-2 text-xs text-warning">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Illustrative certificates — not verifiable credentials. They are generated locally for this prototype.
        </p>

        {items.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" description="Complete every lesson in a programme to earn its certificate." action={<Button asChild size="sm"><Link href="/dashboard/learning">Go to My Learning</Link></Button>} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map(({ cert, data, owner }) => (
              <article key={cert.id} className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-xs transition hover:shadow-md">
                <button type="button" onClick={() => setOpen(data)} className="group relative block bg-muted/60 p-4" aria-label={`Preview certificate for ${cert.course.title}`}>
                  <div className="pointer-events-none transition group-hover:scale-[1.02]">
                    <CertificateDocument data={data} />
                  </div>
                  <span className="absolute inset-0 flex items-center justify-center bg-navy/0 opacity-0 transition group-hover:bg-navy/25 group-hover:opacity-100">
                    <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-navy shadow">
                      <Eye className="size-4" /> Preview
                    </span>
                  </span>
                </button>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-16 shrink-0">
                      <CourseThumbnail course={cert.course} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {owner && <OwnerTag tone={owner === "Yours" ? "primary" : "brand"}>{owner}</OwnerTag>}
                        {cert.generated && (
                          <span className="inline-flex h-5 items-center gap-1 rounded-md bg-brand-soft px-1.5 text-[11px] font-semibold text-brand">
                            <Sparkles className="size-3" /> New
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 leading-snug font-semibold">{cert.course.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued {formatDate(cert.issuedOn)} · {courseHoursLabel(cert.course)}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">ID {cert.id}</p>
                  <div className="mt-auto flex gap-2 border-t pt-3">
                    <Button variant="outline" className="flex-1" onClick={() => setOpen(data)}>
                      <Eye /> Preview
                    </Button>
                    <Button className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90" onClick={() => print(data)}>
                      <Printer /> Download / Print
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="print-only">
        {printing && (
          <>
            <style>{"@page { size: A4 landscape; margin: 10mm; }"}</style>
            <CertificateDocument data={printing} />
          </>
        )}
      </div>

      <CertificateDialog data={open} open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)} onPrint={print} />
    </>
  );
}
