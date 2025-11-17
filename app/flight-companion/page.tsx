"use client";

import { useState } from "react";
import { FlightPhaseWeirdThings } from "@/components/FlightPhaseWeirdThings";
import type { FlightPhase } from "@/lib/flightPhaseEvents";

interface ChatMessage {
  role: "user" | "otie";
  content: string;
}

export default function FlightCompanion() {
  const [input, setInput] = useState("");
  const [anxiety, setAnxiety] = useState(5);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [flightPhase, setFlightPhase] = useState<FlightPhase | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          anxietyLevel: anxiety,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // OTIE reply
        setMessages(prev => [
          ...prev,
          { role: "otie", content: data.response as string },
        ]);

        // Save mode + phase so we can show tools
        if (data.mode) {
          setMode(String(data.mode));
        }
        if (data.flight?.phase) {
          setFlightPhase(data.flight.phase as FlightPhase);
        }
      } else {
        setMessages(prev => [
          ...prev,
          { role: "otie", content: "OTIE ran into an issue." },
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "otie", content: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Simple label for the current phase
  const phaseLabel =
    flightPhase ??
    ("gate" as FlightPhase); // default if we don't have real context yet

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Talk to OTIE</h1>

      {/* Anxiety slider */}
      <div className="space-y-2">
        <label className="flex items-center justify-between text-sm font-medium">
          <span>How activated does your body feel right now?</span>
          <span className="text-xs text-gray-600">
            {anxiety}/10
          </span>
        </label>
        <input
          type="range"
          min={0}
          max={10}
          value={anxiety}
          onChange={e => setAnxiety(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500">
          This doesn&apos;t have to be perfect — just your best guess. OTIE uses it
          to pick how to respond.
        </p>
      </div>

      {/* Flight progress + mode */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
          <span>Flight phase</span>
          {mode && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border">
              Mode: {mode}
            </span>
          )}
        </div>

        {/* Simple progress bar stub driven by phase */}
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{
              width:
                phaseLabel === "gate"
                  ? "5%"
                  : phaseLabel === "pushback"
                  ? "10%"
                  : phaseLabel === "taxi"
                  ? "20%"
                  : phaseLabel === "takeoff"
                  ? "30%"
                  : phaseLabel === "climb"
                  ? "45%"
                  : phaseLabel === "cruise"
                  ? "65%"
                  : phaseLabel === "descent"
                  ? "80%"
                  : phaseLabel === "approach"
                  ? "90%"
                  : phaseLabel === "landing"
                  ? "95%"
                  : phaseLabel === "taxi-in"
                  ? "98%"
                  : "5%",
            }}
          />
        </div>

        <div className="text-xs text-gray-700">
          {phaseLabel === "gate" && "Still at the gate — nothing is moving yet."}
          {phaseLabel === "pushback" && "Being gently pushed back from the gate."}
          {phaseLabel === "taxi" && "Taxiing to the runway like a very heavy bus."}
          {phaseLabel === "takeoff" && "Lining up and accelerating for takeoff."}
          {phaseLabel === "climb" && "Climbing to cruise altitude."}
          {phaseLabel === "cruise" && "Cruising — the long, boring middle part."}
          {phaseLabel === "descent" && "Starting down toward the destination."}
          {phaseLabel === "approach" && "Configuring the airplane for landing."}
          {phaseLabel === "landing" && "Touchdown and rollout on the runway."}
          {phaseLabel === "taxi-in" && "Taxiing back to the gate after landing."}
        </div>
      </div>

      {/* Stuff that feels weird but is normal */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">
          Things that feel weird but are totally normal
        </h2>
        <p className="text-xs text-gray-500">
          Tap anything that sounds familiar. You&apos;ll see what it really is, why
          pilots expect it, and what backups exist if that part misbehaves.
        </p>

        <FlightPhaseWeirdThings phase={phaseLabel} visibleCount={3} />
      </section>

      {/* Conversation */}
      <section className="space-y-3">
        <div className="border rounded-lg p-3 max-h-72 overflow-y-auto bg-white/70">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">
              Tell OTIE what your body and brain are doing right now. You don&apos;t
              have to sound smart, just honest.
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`mb-2 p-3 rounded text-sm ${
                m.role === "user"
                  ? "bg-blue-50 border border-blue-100"
                  : "bg-gray-50 border border-gray-100"
              }`}
            >
              <strong className="block text-xs mb-1">
                {m.role === "user" ? "You" : "OTIE"}
              </strong>
              {m.content}
            </div>
          ))}
        </div>

        <textarea
          className="w-full p-3 border rounded mb-2 text-sm"
          rows={3}
          placeholder="Tell OTIE what's on your mind..."
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "OTIE is thinking..." : "Send to OTIE"}
        </button>
      </section>
    </main>
  );
}
