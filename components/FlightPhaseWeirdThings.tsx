// components/FlightPhaseWeirdThings.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FLIGHT_PHASE_EVENTS,
  type FlightPhase,
  type FlightPhaseEvent,
} from "@/lib/flightPhaseEvents";

interface Props {
  phase: FlightPhase;
  // how many clickable items to show at once
  visibleCount?: number;
}

interface VisibleItem {
  slotId: number;
  event: FlightPhaseEvent | null;
}

export function FlightPhaseWeirdThings({ phase, visibleCount = 3 }: Props) {
  const allEventsForPhase = useMemo(
    () => FLIGHT_PHASE_EVENTS[phase] ?? [],
    [phase]
  );

  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [visibleItems, setVisibleItems] = useState<VisibleItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FlightPhaseEvent | null>(
    null
  );

  // Helper: pick a random unseen event; if exhausted, allow repeats from full list
  const pickRandomEvent = (
    excludeIds: Set<string>
  ): FlightPhaseEvent | null => {
    if (!allEventsForPhase.length) return null;

    const unseen = allEventsForPhase.filter(e => !excludeIds.has(e.id));
    const pool = unseen.length > 0 ? unseen : allEventsForPhase;

    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx] ?? null;
  };

  // Initialize / reset when phase changes
  useEffect(() => {
    const newSeen = new Set<string>();
    const initialVisible: VisibleItem[] = [];

    for (let i = 0; i < visibleCount; i++) {
      const event = pickRandomEvent(newSeen);
      if (event) {
        newSeen.add(event.id);
        initialVisible.push({ slotId: i, event });
      } else {
        initialVisible.push({ slotId: i, event: null });
      }
    }

    setSeenIds(newSeen);
    setVisibleItems(initialVisible);
    setSelectedEvent(null);
  }, [phase, visibleCount]);

  const handleClick = (slotId: number, event: FlightPhaseEvent | null) => {
    if (!event) return;

    setSelectedEvent(event);

    setVisibleItems(prev => {
      const newSeen = new Set(seenIds);
      newSeen.add(event.id); // mark clicked as seen

      const replacement = pickRandomEvent(newSeen);
      if (replacement) {
        newSeen.add(replacement.id);
      }

      setSeenIds(newSeen);

      return prev.map(item =>
        item.slotId === slotId
          ? { ...item, event: replacement ?? item.event }
          : item
      );
    });
  };

  if (!allEventsForPhase.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Clickable list */}
      <div className="flex flex-wrap gap-2">
        {visibleItems.map(item =>
          item.event ? (
            <button
              key={item.slotId}
              type="button"
              onClick={() => handleClick(item.slotId, item.event)}
              className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] text-sky-100 hover:bg-sky-500/20 transition"
            >
              {item.event.trigger}
            </button>
          ) : (
            <span
              key={item.slotId}
              className="rounded-full border border-dashed border-slate-600 px-3 py-1 text-[11px] text-slate-500"
            >
              No more items for this phase
            </span>
          )
        )}
      </div>

      {/* Explanation panel */}
      {selectedEvent && (
        <div className="rounded-xl border border-sky-500/30 bg-slate-900/70 p-3 text-xs leading-relaxed space-y-2">
          <div className="text-[10px] uppercase tracking-wide text-sky-300">
            What you’re noticing
          </div>
          <div>
            <div className="font-medium mb-1">
              {selectedEvent.trigger}
            </div>
            <p className="mb-2">{selectedEvent.explanation}</p>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-300">
              Why this exists
            </div>
            <p>{selectedEvent.whyItExists}</p>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-sky-300 mt-2">
              If this part misbehaved
            </div>
            <p>{selectedEvent.ifItFailed}</p>
          </div>
        </div>
      )}
    </div>
  );
}
