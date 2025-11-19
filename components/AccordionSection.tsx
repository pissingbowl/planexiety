"use client";

import { ReactNode } from "react";

interface AccordionSectionProps {
  title: string;
  subtitle?: string;
  icon?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function AccordionSection({
  title,
  subtitle,
  icon,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <section 
      className={`
        rounded-3xl border overflow-hidden transition-all duration-300 backdrop-blur-sm
        ${isOpen 
          ? 'bg-white/[0.05] border-slate-700/50 shadow-[0_20px_60px_rgba(0,0,0,0.3)]' 
          : 'bg-white/[0.03] border-slate-800/50 hover:bg-white/[0.04] hover:border-slate-700/50'
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-6 py-5 md:px-8 md:py-6 
          transition-all duration-200 touch-manipulation
          ${isOpen ? 'bg-white/[0.02]' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] border border-slate-700/50">
              <span className="text-sm">{icon}</span>
            </div>
          )}
          <div className="text-left">
            <div className="text-xs sm:text-sm font-semibold tracking-[0.15em] uppercase text-sky-400">
              {title}
            </div>
            {subtitle && (
              <div className="mt-1.5 text-xs sm:text-sm text-gray-400 leading-relaxed">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div className={`
          ml-4 flex h-8 w-8 items-center justify-center rounded-full 
          transition-all duration-300
          ${isOpen 
            ? 'border border-sky-500/50 bg-sky-500/20 text-sky-300' 
            : 'border border-slate-700/50 bg-white/[0.05] text-gray-400'
          }
        `}>
          <span 
            className={`
              inline-block transition-transform duration-200 ease-out
              ${isOpen ? 'rotate-90' : ''}
            `}
          >
            +
          </span>
        </div>
      </button>

      <div 
        className={`
          border-t border-slate-800/30 overflow-hidden
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'max-h-[2000px] opacity-100' 
            : 'max-h-0 opacity-0'
          }
        `}
      >
        <div 
          className="px-6 py-6 md:px-8 md:py-8 text-sm sm:text-base text-gray-200 leading-relaxed space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </section>
  );
}