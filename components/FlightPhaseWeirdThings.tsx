// components/FlightPhaseWeirdThings.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  FLIGHT_PHASE_EVENTS,
  type FlightPhase,
  type FlightPhaseEvent,
} from "@/lib/flightPhaseEvents";

interface Props {
  phase: FlightPhase;
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pickRandomEvent = (
    excludeIds: Set<string>
  ): FlightPhaseEvent | null => {
    if (!allEventsForPhase.length) return null;

    const unseen = allEventsForPhase.filter(e => !excludeIds.has(e.id));
    if (unseen.length === 0) return null;

    const idx = Math.floor(Math.random() * unseen.length);
    return unseen[idx] ?? null;
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
    setSelectedEvent(allEventsForPhase[0] || null);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [phase, visibleCount, allEventsForPhase]);

  // Autoplay effect
  useEffect(() => {
    if (isPlaying && allEventsForPhase.length > 0) {
      playTimerRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % allEventsForPhase.length);
      }, 5000);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, allEventsForPhase.length]);

  // Update selected event when index changes
  useEffect(() => {
    if (allEventsForPhase.length > 0) {
      setSelectedEvent(allEventsForPhase[currentIndex]);
    }
  }, [currentIndex, allEventsForPhase]);

  const handlePrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? allEventsForPhase.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % allEventsForPhase.length);
  };

  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleClick = (slotId: number, event: FlightPhaseEvent | null) => {
    if (!event) return;

    const clickedIndex = allEventsForPhase.findIndex(e => e.id === event.id);
    if (clickedIndex !== -1) {
      setCurrentIndex(clickedIndex);
      setIsPlaying(false);
    }

    setVisibleItems(prev => {
      const newSeen = new Set(seenIds);
      newSeen.add(event.id);

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
    <div className="mt-4 space-y-4 bg-gray-900/80 border border-gray-800 rounded-xl p-4">
      <h3 className="font-bold text-lg mb-2 text-white">
        Things that feel weird but are totally normal
      </h3>
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
          {/* Navigation controls */}
          <div className="flex items-center justify-end border-b border-sky-500/20 pb-2 mb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                className="p-1.5 rounded hover:bg-sky-500/20 transition text-sky-300"
                title="Previous"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handlePlayPause}
                className="p-1.5 rounded hover:bg-sky-500/20 transition text-sky-300"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 rounded hover:bg-sky-500/20 transition text-sky-300"
                title="Next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-wide text-sky-300">
            What you're noticing
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
