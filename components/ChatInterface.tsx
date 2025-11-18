// components/ChatInterface.tsx
"use client";

import { useState } from "react";

type ChatMessage = {
  role: "user" | "otie";
  content: string;
};

interface OtieResponsePayload {
  ok: boolean;
  response?: string;
  mode?: string;
  flight?: {
    phase?: string;
    [key: string]: any;
  };
  state?: any;
  error?: string;
}

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastMode, setLastMode] = useState<string | null>(null);
  const [lastPhase, setLastPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);

    // append user message locally
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          anxietyLevel: 5, // simple default for now
        }),
      });

      const data: OtieResponsePayload = await res.json();

      if (!data.ok) {
        setError(data.error ?? "OTIE ran into an issue.");
        setMessages(prev => [
          ...prev,
          {
            role: "otie",
            content:
              "Something glitched on my side. Mind trying that again in a second?",
          },
        ]);
      } else {
        const text =
          data.response?.trim() ||
          "I’m here with you. Even if my words are lagging, you’re not alone.";

        setMessages(prev => [
          ...prev,
          {
            role: "otie",
            content: text,
          },
        ]);

        if (data.mode) setLastMode(data.mode);
        if (data.flight?.phase) setLastPhase(data.flight.phase);
      }
    } catch (err) {
      console.error("Error calling /api/chat-v2", err);
      setError("Network or server error talking to OTIE.");
      setMessages(prev => [
        ...prev,
        {
          role: "otie",
          content:
            "I lost the connection for a moment. Your fear is real; this glitch isn’t. Try once more when you’re ready.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Talk to OTIE</h2>
            <p className="text-xs text-gray-400">
              Say what’s actually happening in your body and brain. OTIE responds in real time.
            </p>
          </div>

          {(lastMode || lastPhase) && (
            <div className="flex flex-col items-end gap-1 text-right">
              {lastMode && (
                <span className="inline-flex items-center rounded-full bg-blue-900/40 border border-blue-500/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-blue-100">
                  Mode: {lastMode}
                </span>
              )}
              {lastPhase && (
                <span className="inline-flex items-center rounded-full bg-gray-900/60 border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-300">
                  Phase: {lastPhase}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="mb-4 max-h-64 overflow-y-auto space-y-2 text-sm">
          {messages.length === 0 && (
            <p className="text-xs text-gray-500">
              Example: “We just hit a bump and my stomach dropped. My chest feels tight and my brain is screaming that something’s wrong.”
            </p>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={
                "flex " +
                (m.role === "user" ? "justify-end" : "justify-start")
              }
            >
              <div
                className={
                  "max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                  (m.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100")
                }
              >
                <p className="whitespace-pre-line">{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input only */}
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full rounded-xl bg-gray-950/70 border border-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="Tell OTIE what’s actually going on in your head and body right now..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="inline-flex justify-center items-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold py-2 px-4 transition-colors"
          >
            {loading ? "OTIE is responding..." : "Send to OTIE"}
          </button>

          {error && (
            <p className="text-xs text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
