"use client";

import { useState, ReactNode } from "react";

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function AccordionSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-sky-900/60 bg-slate-950/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 md:px-5 md:py-4"
      >
        <div className="text-left">
          <div className="text-xs font-semibold tracking-[0.18em] uppercase text-sky-400">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 text-xs text-slate-300/80">
              {subtitle}
            </div>
          )}
        </div>
        <div className="ml-4 flex h-7 w-7 items-center justify-center rounded-full border border-sky-700/70 bg-sky-900/20 text-sky-200 text-xs">
          {open ? "−" : "+"}
        </div>
      </button>

      {open && (
        <div className="border-t border-sky-900/60 px-4 py-4 md:px-5 md:py-5 text-sm text-slate-100 space-y-3">
          {children}
        </div>
      )}
    </section>
  );
}