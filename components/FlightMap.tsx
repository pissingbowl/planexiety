// components/FlightMap.tsx
"use client";

interface FlightMapProps {
  from: string;
  to: string;
  progressPercent: number; // 0–100
}

export default function FlightMap({ from, to, progressPercent }: FlightMapProps) {
  const clamped = Math.min(100, Math.max(0, progressPercent));

  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span className="font-mono text-gray-200">{from}</span>
        <span className="font-mono text-gray-200">{to}</span>
      </div>

      <div className="relative h-10 rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        {/* route line */}
        <div className="absolute left-4 right-4 top-1/2 h-px bg-slate-600/70" />

        {/* plane icon */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{
            left: `calc(4% + ${clamped} * 0.92%)`, // a little padding on both ends
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-sky-300">✈︎</span>
            <span className="text-[9px] text-slate-400 font-mono">
              {clamped.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* origin + dest dots */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
      </div>
    </div>
  );
}
