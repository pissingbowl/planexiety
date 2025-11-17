"use client";

import { useState } from "react";

export default function ChatInterface() {
  const [message, setMessage] = useState("");
  const [anxiety, setAnxiety] = useState(6);
  const [response, setResponse] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setMode(null);

    try {
      const res = await fetch("/api/chat-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "demo-user-123",
          message,
          anxietyLevel: anxiety,
          flightId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unknown error");
      }

      setResponse(data.response);
      setMode(data.mode);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
      <h2 className="text-lg font-semibold">Talk to OTIE</h2>

      <form onSubmit={sendMessage} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm text-slate-300">
            What&apos;s going on in your head right now?
          </label>
          <textarea
            className="w-full rounded-md bg-black/50 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-sky-500"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Example: The door just closed and my chest feels tight..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-slate-300 flex justify-between">
            <span>How intense is the anxiety? (0–10)</span>
            <span className="font-mono">{anxiety}</span>
          </label>
          <input
            type="range"
            min={0}
            max={10}
            value={anxiety}
            onChange={(e) => setAnxiety(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Send to OTIE"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}

      {response && (
        <div className="space-y-1 border-t border-slate-800 pt-3">
          {mode && (
            <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
              Mode: <span className="font-semibold text-sky-400">{mode}</span>
            </div>
          )}
          <div className="text-sm leading-relaxed text-slate-100 whitespace-pre-wrap">
            {response}
          </div>
        </div>
      )}
    </div>
  );
}

