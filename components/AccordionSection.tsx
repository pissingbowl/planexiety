"use client";

import { ReactNode } from "react";

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function AccordionSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <section 
      className={`
        rounded-2xl border overflow-hidden transition-all duration-200
        ${isOpen 
          ? 'border-white/10 bg-white/[0.03] shadow-[0_0_20px_rgba(255,255,255,0.03)]' 
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/[0.07]'
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-5 py-4 md:px-6 md:py-5 
          transition-all duration-200
          ${isOpen ? 'bg-white/[0.02]' : ''}
        `}
      >
        <div className="text-left">
          <div className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-400">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              {subtitle}
            </div>
          )}
        </div>
        <div className={`
          ml-4 flex h-7 w-7 items-center justify-center rounded-full 
          transition-all duration-200
          ${isOpen 
            ? 'border border-sky-500/50 bg-sky-500/10 text-sky-300' 
            : 'border border-white/10 bg-white/5 text-slate-400'
          }
        `}>
          {isOpen ? "−" : "+"}
        </div>
      </button>

      {isOpen && (
        <div 
          className="border-t border-white/5 px-5 py-5 md:px-6 md:py-6 text-sm text-slate-200 leading-relaxed space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </section>
  );
}