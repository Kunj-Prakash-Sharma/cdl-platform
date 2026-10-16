"use client";

import { useMemo, useState } from "react";
import { Clock, LifeBuoy, Mail, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { SUPPORT_EMAIL } from "@/data/constants";
import { useDemoStore } from "@/store/demo-store";
import { useCurrentUser } from "@/store/hooks";
import { CallbackDialog, FaqSection, MyRequests, SupportForm } from "@/components/engagement/help-parts";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function HelpPage() {
  const { user, userId } = useCurrentUser();
  const callbacks = useDemoStore((s) => s.callbackRequests);
  const tickets = useDemoStore((s) => s.supportTickets);
  const [callback, setCallback] = useState({ open: false, key: 0 });
  const myCallbacks = useMemo(() => callbacks.filter((c) => c.name === user.name), [callbacks, user.name]);
  const openTickets = tickets.filter((t) => t.userId === userId && t.status !== "resolved").length;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      toast.success("Email address copied", { description: SUPPORT_EMAIL });
    } catch {
      toast(SUPPORT_EMAIL, { description: "Copy this address to email our support team." });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Support"
        title="FAQs & Helpdesk"
        description="Find quick answers, raise a support request, or ask a learning advisor to call you back."
        actions={
          <Button className="h-9" onClick={() => scrollTo("support-form")}>
            <LifeBuoy /> Raise a request
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <ContactCard icon={PhoneCall} tone="bg-brand-soft text-brand" title="Request a callback" text="A learning advisor calls you back within one working day.">
          {myCallbacks[0] ? (
            <p className="text-xs font-medium text-success">Requested · {myCallbacks[0].preferredTime}</p>
          ) : (
            <span className="text-xs text-muted-foreground">Mon–Sat, 10 AM – 8 PM IST</span>
          )}
          <Button variant="outline" size="sm" onClick={() => setCallback((c) => ({ open: true, key: c.key + 1 }))}>
            {myCallbacks.length ? "Request again" : "Request callback"}
          </Button>
        </ContactCard>
        <ContactCard icon={Mail} tone="bg-info-soft text-info" title="Email support" text={SUPPORT_EMAIL}>
          <span className="text-xs text-muted-foreground">Replies within 24 hours</span>
          <Button variant="outline" size="sm" onClick={copyEmail}>
            Copy address
          </Button>
        </ContactCard>
        <ContactCard icon={Clock} tone="bg-secondary text-primary" title="Support hours" text="Mon–Sat · 10:00 AM – 7:00 PM IST · average first reply in 4 hours">
          <span className="text-xs text-muted-foreground">{openTickets ? `${openTickets} open request${openTickets > 1 ? "s" : ""}` : "No open requests"}</span>
          <Button variant="outline" size="sm" onClick={() => scrollTo("my-requests")}>
            My requests
          </Button>
        </ContactCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <FaqSection onRaiseRequest={() => scrollTo("support-form")} />
        <section id="support-form" className="scroll-mt-20 rounded-2xl border bg-card p-5 shadow-xs lg:sticky lg:top-20">
          <h2 className="font-heading text-lg font-semibold">Raise a support request</h2>
          <p className="mb-4 text-sm text-muted-foreground">Tell us what&apos;s wrong and we&apos;ll get back to you.</p>
          <SupportForm onViewRequests={() => scrollTo("my-requests")} />
        </section>
      </div>

      <section id="my-requests" className="scroll-mt-20 space-y-3">
        <SectionHeader title="My requests" description="Track the status of everything you've raised with our team." />
        <MyRequests />
      </section>

      <CallbackDialog key={callback.key} open={callback.open} onOpenChange={(open) => setCallback((c) => ({ ...c, open }))} />
    </div>
  );
}

function ContactCard({
  icon: Icon,
  tone,
  title,
  text,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-heading font-semibold">{title}</p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">{text}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4">{children}</div>
    </div>
  );
}
