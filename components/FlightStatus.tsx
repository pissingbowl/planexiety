// components/FlightStatus.tsx
"use client";

import { useEffect, useState } from "react";
import { FlightPhaseWeirdThings } from "./FlightPhaseWeirdThings";
import type { FlightPhase } from "@/lib/flightPhaseEvents";

// --- Tiny inline flight map ---

interface FlightMapProps {
  from: string;
  to: string;
  progressPercent: number; // 0–100
}

function FlightMap({ from, to, progressPercent }: FlightMapProps) {
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
            left: `calc(4% + ${clamped} * 0.92%)`, // slight padding on each side
          }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-sky-300">✈︎</span>
            <span className="text-[9px] text-slate-400 font-mono">
              {clamped.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* origin + destination dots */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
      </div>
    </div>
  );
}

// --- Static aircraft info (for now) ---

const mockAircraft = {
  tailNumber: "N78421",
  type: "Boeing 737-800",
  yearBuilt: 2018,
  totalHours: 12437,
  cycles: 4621,
  funFact:
    "This airframe has flown ORD–LAX over 300 times without a serious incident.",
  designNote: "Twin-engine jet designed to fly safely on one engine if needed.",
};

// Nerd segments (unchanged)
const nerdSegments = [
  {
    id: 0,
    label: "Initial Climb",
    description: "Off the runway, cleaning up and climbing through 5,000 ft.",
    vorFixes: [
      { id: "OBK", name: "OBK VOR", radial: "182°", distanceNm: 8 },
      { id: "JOT", name: "JOLIET VOR", radial: "041°", distanceNm: 24 },
    ],
    distanceToFAFNm: 1543,
    groundspeedKts: 250,
  },
  {
    id: 1,
    label: "Mid-Cruise",
    description: "Settled in at FL350 over Nebraska, smooth ride.",
    vorFixes: [
      { id: "GRI", name: "GRAND ISLAND VOR", radial: "275°", distanceNm: 12 },
      { id: "LNK", name: "LINCOLN VORTAC", radial: "093°", distanceNm: 37 },
    ],
    distanceToFAFNm: 935,
    groundspeedKts: 470,
  },
  {
    id: 2,
    label: "Top of Descent",
    description: "Passing TOD, starting down toward the arrival.",
    vorFixes: [
      { id: "HVE", name: "HANKSVILLE VORTAC", radial: "247°", distanceNm: 19 },
      { id: "BLD", name: "BOULDER CITY VOR", radial: "071°", distanceNm: 42 },
    ],
    distanceToFAFNm: 187,
    groundspeedKts: 420,
  },
  {
    id: 3,
    label: "Approach Segment",
    description: "On the STAR, being vectored to the ILS final approach fix.",
    vorFixes: [
      { id: "LAX", name: "LAX VORTAC", radial: "322°", distanceNm: 6 },
      { id: "SADDE", name: "SADDE INT", radial: "145°", distanceNm: 12 },
    ],
    distanceToFAFNm: 9,
    groundspeedKts: 160,
  },
];

// --- Helpers: phase + pilot activity + time math ---

function phaseFromProgress(progress: number): string {
  if (progress < 5) return "Boarding";
  if (progress < 15) return "Taxi";
  if (progress < 25) return "Takeoff";
  if (progress < 40) return "Climb";
  if (progress < 80) return "Cruise";
  if (progress < 90) return "Descent";
  return "Landing";
}

function mapPhaseToFlightPhase(phase: string): FlightPhase {
  const p = phase.toLowerCase();
  if (p === "boarding") return "gate";
  if (p === "taxi") return "taxi";
  if (p === "takeoff") return "takeoff";
  if (p === "climb") return "climb";
  if (p === "cruise") return "cruise";
  if (p === "descent") return "descent";
  if (p === "landing") return "landing";
  return "cruise";
}

function formatTimeRemaining(totalMinutes: number, progress: number): string {
  const clamped = Math.min(100, Math.max(0, progress));
  const elapsed = (clamped / 100) * totalMinutes;
  const remaining = Math.max(0, totalMinutes - elapsed);
  const hours = Math.floor(remaining / 60);
  const minutes = Math.round(remaining % 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function minutesSinceTakeoff(progress: number, totalMinutes: number): number {
  // assume takeoff around 15% of progress
  if (progress <= 15) return 0;
  const postTakeoffProgress = progress - 15;
  const usableSpan = 100 - 15;
  const frac = postTakeoffProgress / usableSpan;
  return Math.max(0, Math.round(frac * totalMinutes));
}

function getPilotActivity(phase: string, minutes: number) {
  const minutesHandsOff = Math.max(minutes - 5, 10);

  if (phase === "Climb") {
    return {
      title: "Right now the pilots are letting the airplane do the work.",
      lines: [
        "Autopilot is already on, flying a programmed route and climb profile.",
        "They’re watching the flight path, talking to departure control every few minutes, and cleaning up checklists.",
        `They haven’t needed to “steer” with their hands for about ${minutesHandsOff} minutes.`,
      ],
    };
  }

  if (phase === "Cruise") {
    return {
      title: "In cruise, the job is mostly monitoring and talking.",
      lines: [
        "Autopilot is flying. The airplane is trimmed, stable, and following the magenta line.",
        "They check in with ATC every few minutes, review weather ahead, and plan the descent.",
        `Hands on the controls? Only for tiny adjustments when needed – it’s been roughly ${minutesHandsOff} minutes since they actively flew the jet.`,
      ],
    };
  }

  if (phase === "Descent") {
    return {
      title: "During descent, it’s still mostly systems and talking.",
      lines: [
        "Autopilot is flying down a planned path toward the arrival.",
        "They’re briefing the approach, setting up radios, and checking in with new ATC sectors.",
        "Actual “hand flying” is a small slice of the whole flight – most of this is supervising a very smart machine.",
      ],
    };
  }

  return {
    title: "The pilots aren’t “driving” like a car – they’re supervising a system.",
    lines: [
      "Modern airliners are flown by autopilot most of the time, on routes that were planned long before you boarded.",
      "The pilots talk to ATC, manage systems, and step in if something needs a human decision.",
      `On this leg, they’ve likely been hands-off for around ${minutesHandsOff} minutes.`,
    ],
  };
}

// --- Component ---

export default function FlightStatus() {
  // You can tweak these to simulate different legs
  const totalFlightMinutes = 180; // 3-hour-ish leg
  const from = "ORD";
  const to = "LAX";
  const airline = "United";
  const flightNumber = "UA1234";
  const mockArrivalLocal = "3:42 PM";

  const [progress, setProgress] = useState(12); // start somewhere early
  const [nerdOpen, setNerdOpen] = useState(false);
  const [segmentIndex, setSegmentIndex] = useState(1); // start at mid-cruise

  // Simulate the flight progressing over time
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1; // 1% per tick
      });
    }, 800); // ~0.8s per 1% → ~80s full flight; tweak as desired

    return () => clearInterval(interval);
  }, []);

  const phase = phaseFromProgress(progress);
  const normalizedPhase: FlightPhase = mapPhaseToFlightPhase(phase);
  const timeRemaining = formatTimeRemaining(totalFlightMinutes, progress);
  const minsSinceTO = minutesSinceTakeoff(progress, totalFlightMinutes);
  const pilotActivity = getPilotActivity(phase, minsSinceTO);
  const currentSegment = nerdSegments[segmentIndex];

  return (
    <section className="mt-10 w-full max-w-2xl mx-auto text-white">
      <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6 shadow-xl backdrop-blur">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
              Current Flight
            </p>
            <h2 className="text-xl font-semibold mt-1">
              {airline} <span className="font-mono">{flightNumber}</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {from} → {to}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-[0.15em]">
              Phase
            </p>
            <p className="text-sm font-medium">{phase}</p>
            <p className="text-xs text-gray-400 mt-1">
              Time remaining:{" "}
              <span className="font-mono text-gray-100">
                {timeRemaining}
              </span>
            </p>
          </div>
        </div>

        {/* Flight map */}
        <FlightMap from={from} to={to} progressPercent={progress} />

        {/* Numeric progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Flight progress</span>
            <span className="font-mono text-gray-200">
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phase timeline */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-[0.15em]">
            {["Boarding", "Taxi", "Takeoff", "Climb", "Cruise", "Descent", "Landing"].map(
              p => {
                const isCurrent = p === phase;
                return (
                  <span
                    key={p}
                    className={
                      "flex-1 text-center " +
                      (isCurrent ? "text-blue-400 font-semibold" : "")
                    }
                  >
                    {p}
                  </span>
                );
              }
            )}
          </div>
        </div>

        {/* Live status footer */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-gray-300">Live status (simulated)</span>
          </div>
          <div className="text-right text-gray-400 text-xs">
            <p>Est. arrival (local)</p>
            <p className="font-mono text-gray-100">
              {mockArrivalLocal}
            </p>
          </div>
        </div>

        {/* What the pilots are doing */}
        <div className="mt-6 bg-gray-950/70 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
            What the pilots are doing right now
          </p>
          <p className="text-sm font-medium mb-2">{pilotActivity.title}</p>

          <ul className="space-y-1.5 text-sm text-gray-300">
            {pilotActivity.lines.map((line, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="mt-1 h-1 w-1 rounded-full bg-gray-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          {/* Aircraft strip */}
          <div className="mt-4 border-t border-gray-800 pt-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-gray-300">
              <span className="px-2 py-1 rounded-full bg-gray-900/80 border border-gray-700 font-mono">
                Tail {mockAircraft.tailNumber}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-900/80 border border-gray-700">
                {mockAircraft.type}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-900/80 border border-gray-700">
                In service since {mockAircraft.yearBuilt}
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-900/80 border border-gray-700">
                ~{mockAircraft.totalHours.toLocaleString()} flight hours
              </span>
              <span className="px-2 py-1 rounded-full bg-gray-900/80 border border-gray-700">
                {mockAircraft.cycles.toLocaleString()} takeoffs & landings
              </span>
            </div>

            <p className="mt-2 text-[11px] text-gray-400">
              {mockAircraft.funFact}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Design note: {mockAircraft.designNote}
            </p>
          </div>
        </div>

        {/* Weird but normal sensations */}
        <div className="mt-8 space-y-2">
          <h3 className="text-xs font-semibold tracking-[0.18em] text-sky-300 uppercase">
            Things that feel weird but are totally normal
          </h3>
          <p className="text-[11px] text-slate-400">
            Tap anything that sounds familiar. You&apos;ll see what it really is,
            why it exists, and what covers you if that part misbehaves.
          </p>

          <FlightPhaseWeirdThings phase={normalizedPhase} />
        </div>

        {/* Nerd panel */}
        <button
          type="button"
          onClick={() => setNerdOpen(open => !open)}
          className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/60 bg-blue-900/20 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200 hover:bg-blue-900/40 transition-colors"
        >
          For the nerds
          <span className="text-[10px] text-blue-300 normal-case tracking-normal">
            {nerdOpen ? "Hide extra data" : "Show VORs, radials & FAF"}
          </span>
        </button>

        {nerdOpen && (
          <div className="mt-5 border-t border-gray-800 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
                  Route segment
                </p>
                <p className="text-sm font-medium">
                  {currentSegment.label}
                </p>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>Dist. to FAF</p>
                <p className="font-mono text-gray-100">
                  {currentSegment.distanceToFAFNm} nm
                </p>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={nerdSegments.length - 1}
              step={1}
              value={segmentIndex}
              onChange={e => setSegmentIndex(Number(e.target.value))}
              className="w-full accent-blue-500"
            />

            <p className="mt-2 text-xs text-gray-400">
              {currentSegment.description}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
              {currentSegment.vorFixes.map(fix => (
                <div
                  key={fix.id}
                  className="bg-gray-900/80 border border-gray-700/80 rounded-xl px-3 py-3 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm">{fix.id}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
                      VOR / FIX
                    </span>
                  </div>
                  <p className="text-gray-200">{fix.name}</p>
                  <div className="flex items-center justify-between text-xs text-gray-300 mt-1">
                    <span>Radial: {fix.radial}</span>
                    <span>{fix.distanceNm} nm</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
              <span>
                GS approx{" "}
                <span className="font-mono text-gray-100">
                  {currentSegment.groundspeedKts} kt
                </span>
              </span>
              <span className="italic text-gray-500">
                All values simulated for now. Real data later.
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
