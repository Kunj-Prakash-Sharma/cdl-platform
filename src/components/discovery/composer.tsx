"use client";

import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, Check, GraduationCap, HeartHandshake, Plus, RefreshCw, School, Search, SendHorizontal, UserRound } from "lucide-react";
import type { CardOption, OptionIcon } from "@/lib/discovery";
import { isValidMobile } from "@/lib/discovery";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

const CARD_ICONS: Record<OptionIcon, React.ComponentType<{ className?: string }>> = {
  self: UserRound,
  parent: HeartHandshake,
  school: School,
  college: GraduationCap,
  graduate: Search,
  professional: BriefcaseBusiness,
};

const chipBase =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-left text-sm font-medium transition focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none";
const chipIdle = "border-primary/20 bg-background text-primary hover:border-primary/40 hover:bg-secondary";
const chipOn = "border-primary bg-primary text-primary-foreground hover:bg-primary/90";

export function ComposerLabel({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}

/** A text field with a send button — shared by every free-text composer. */
function SendField({
  value,
  onChange,
  onSubmit,
  placeholder,
  maxLength,
  invalid,
  label,
  autoFocus,
  prefix,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  maxLength?: number;
  invalid?: boolean;
  label: string;
  autoFocus?: boolean;
  prefix?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <InputGroup className="h-11 rounded-xl bg-background shadow-xs">
        {prefix && (
          <InputGroupAddon>
            <span className="rounded-md bg-muted px-2 py-1 text-sm font-semibold text-foreground">{prefix}</span>
          </InputGroupAddon>
        )}
        <InputGroupInput
          aria-label={label}
          aria-invalid={invalid || undefined}
          placeholder={placeholder}
          value={value}
          maxLength={maxLength}
          inputMode={inputMode}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          className="text-[15px]"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton type="submit" size="icon-sm" variant="default" className="size-8 rounded-lg" aria-label="Send">
            <SendHorizontal />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-destructive" role="alert">
      {children}
    </p>
  );
}

export function PhoneComposer({ onSubmit }: { onSubmit: (digits: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const submit = (v = value) => {
    const digits = v.replace(/\D/g, "");
    if (!isValidMobile(digits)) {
      setError(digits.length !== 10 ? "Please enter a 10-digit mobile number." : "Indian mobile numbers start with 6, 7, 8 or 9.");
      return;
    }
    onSubmit(digits);
  };
  return (
    <div>
      <ComposerLabel
        action={
          <button type="button" className="text-xs font-medium text-brand hover:underline" onClick={() => submit("9876543210")}>
            Use a demo number
          </button>
        }
      >
        Your mobile number
      </ComposerLabel>
      <SendField
        label="Mobile number"
        prefix="+91"
        inputMode="numeric"
        placeholder="10-digit mobile number"
        value={value}
        maxLength={11}
        invalid={!!error}
        onChange={(v) => {
          setValue(v.replace(/[^\d ]/g, ""));
          setError(undefined);
        }}
        onSubmit={() => submit()}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function TextComposer({
  label,
  placeholder,
  suggestions,
  aside,
  minLength,
  maxLength,
  initial,
  onSubmit,
  onAside,
}: {
  label: string;
  placeholder: string;
  suggestions?: string[];
  aside?: string;
  minLength: number;
  maxLength: number;
  initial?: string;
  onSubmit: (text: string) => void;
  onAside?: () => void;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [error, setError] = useState<string>();
  const submit = () => {
    const text = value.trim().replace(/\s+/g, " ");
    if (text.length < minLength) {
      setError(minLength <= 2 ? "Please type at least 2 letters." : "Please add a little more detail — or tap a suggestion.");
      return;
    }
    onSubmit(text);
  };
  return (
    <div>
      {(suggestions?.length || aside) && (
        <div className="mb-2.5 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto sm:max-h-none">
          {suggestions?.map((s) => (
            <button key={s} type="button" className={cn(chipBase, chipIdle, "min-h-8 px-3 py-1 text-[13px]")} onClick={() => onSubmit(s)}>
              {s}
            </button>
          ))}
          {aside && (
            <button
              type="button"
              className={cn(chipBase, "min-h-8 border-dashed border-info/40 bg-info-soft px-3 py-1 text-[13px] text-info hover:bg-info-soft/70")}
              onClick={onAside}
            >
              <RefreshCw className="size-3.5" />
              {aside}
            </button>
          )}
        </div>
      )}
      <SendField
        label={label}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        invalid={!!error}
        autoFocus={!suggestions?.length}
        onChange={(v) => {
          setValue(v);
          setError(undefined);
        }}
        onSubmit={submit}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function CardsComposer({ options, value, onSelect }: { options: CardOption[]; value?: string; onSelect: (value: string) => void }) {
  return (
    <div className={cn("grid gap-2", options.length > 2 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
      {options.map((o) => {
        const Icon = CARD_ICONS[o.icon];
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onSelect(o.value)}
            aria-pressed={selected}
            className={cn(
              "group flex items-start gap-3 rounded-xl border bg-background p-3 text-left shadow-xs transition hover:-translate-y-px hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              selected && "border-primary ring-2 ring-primary/15",
              options.length > 2 && "max-sm:flex-col max-sm:gap-2",
            )}
          >
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground",
                selected && "bg-primary text-primary-foreground",
              )}
            >
              <Icon className="size-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{o.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function MultiComposer({
  options,
  max,
  initial,
  customPlaceholder,
  onSubmit,
}: {
  options: string[];
  max: number;
  initial?: string[];
  customPlaceholder: string;
  onSubmit: (values: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial ?? []);
  const [extra, setExtra] = useState<string[]>(() => (initial ?? []).filter((i) => !options.includes(i)));
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState("");
  const all = [...options, ...extra];
  const full = selected.length >= max;

  const toggle = (o: string) =>
    setSelected((s) => (s.includes(o) ? s.filter((x) => x !== o) : s.length >= max ? s : [...s, o]));

  const addCustom = () => {
    const text = custom.trim().replace(/\s+/g, " ");
    if (text.length < 2) return;
    if (!all.includes(text)) setExtra((e) => [...e, text]);
    setSelected((s) => (s.includes(text) || s.length >= max ? s : [...s, text]));
    setCustom("");
    setAdding(false);
  };

  return (
    <div>
      <ComposerLabel>
        Pick up to {max} · <span className={cn(full && "font-semibold text-foreground")}>{selected.length} selected</span>
      </ComposerLabel>
      <div className="flex max-h-[34vh] flex-wrap gap-1.5 overflow-y-auto pb-0.5 sm:max-h-none" role="group" aria-label="Options">
        {all.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              disabled={!on && full}
              onClick={() => toggle(o)}
              className={cn(chipBase, on ? chipOn : chipIdle, "disabled:cursor-not-allowed disabled:opacity-45")}
            >
              {on && <Check className="size-3.5" />}
              {o}
            </button>
          );
        })}
        {!adding && (
          <button type="button" className={cn(chipBase, "border-dashed text-muted-foreground hover:bg-muted")} onClick={() => setAdding(true)}>
            <Plus className="size-3.5" /> Other
          </button>
        )}
      </div>
      {adding && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addCustom();
          }}
        >
          <Input autoFocus value={custom} maxLength={50} onChange={(e) => setCustom(e.target.value)} placeholder={customPlaceholder} aria-label={customPlaceholder} className="h-9 bg-background" />
          <Button type="submit" variant="outline" className="h-9">
            Add
          </Button>
          <Button type="button" variant="ghost" className="h-9" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </form>
      )}
      <div className="mt-3 flex justify-end">
        <Button className="h-10 bg-brand px-4 text-brand-foreground hover:bg-brand/90" disabled={!selected.length} onClick={() => onSubmit(selected)}>
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

export function SingleComposer({
  label,
  options,
  value,
  customPlaceholder,
  onSelect,
  onCustom,
  extraChips,
}: {
  label?: string;
  options: string[];
  value?: string;
  customPlaceholder?: string;
  onSelect: (value: string) => void;
  onCustom?: (value: string) => void;
  extraChips?: React.ReactNode;
}) {
  const [text, setText] = useState("");
  return (
    <div>
      {label && <ComposerLabel>{label}</ComposerLabel>}
      <div className="flex max-h-[30vh] flex-wrap gap-1.5 overflow-y-auto sm:max-h-none">
        {options.map((o) => (
          <button key={o} type="button" className={cn(chipBase, value === o ? chipOn : chipIdle)} onClick={() => onSelect(o)} aria-pressed={value === o}>
            {o}
          </button>
        ))}
        {extraChips}
      </div>
      {customPlaceholder && (
        <div className="mt-2.5">
          <SendField
            label={customPlaceholder}
            placeholder={customPlaceholder}
            value={text}
            maxLength={120}
            onChange={setText}
            onSubmit={() => {
              const t = text.trim();
              if (t.length < 2) return;
              (onCustom ?? onSelect)(t);
              setText("");
            }}
          />
        </div>
      )}
    </div>
  );
}

export { chipBase, chipIdle };
