// components/ChatInterface.tsx
"use client";

import { useState, useEffect } from "react";

type ChatMessage = {
  role: "user" | "otie";
  content: string;
};

type AnxietyDataPoint = {
  value: number;
  timestamp: Date;
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
  
  // Anxiety tracking state
  const [currentAnxiety, setCurrentAnxiety] = useState(5);
  const [anxietyHistory, setAnxietyHistory] = useState<AnxietyDataPoint[]>([]);
  
  // Update anxiety history when slider changes
  const handleAnxietyChange = (value: number) => {
    setCurrentAnxiety(value);
    const newDataPoint: AnxietyDataPoint = {
      value,
      timestamp: new Date()
    };
    
    // Keep only last 10 values
    setAnxietyHistory(prev => [...prev.slice(-9), newDataPoint]);
  };
  
  // Calculate anxiety trend for display
  const getTrendDisplay = () => {
    if (anxietyHistory.length < 2) return null;
    
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    
    // Get relevant data points from last 15 minutes
    const recentPoints = anxietyHistory.filter(
      point => point.timestamp >= fifteenMinutesAgo
    );
    
    if (recentPoints.length < 2) return null;
    
    // Get first, middle, and last values for trend
    const values = recentPoints.map(p => p.value);
    const first = values[0];
    const last = values[values.length - 1];
    const middle = values[Math.floor(values.length / 2)];
    
    // Calculate time span
    const timeSpanMs = recentPoints[recentPoints.length - 1].timestamp.getTime() - 
                       recentPoints[0].timestamp.getTime();
    const timeSpanMinutes = Math.round(timeSpanMs / 60000);
    
    if (values.length === 2) {
      return {
        text: `Last ${timeSpanMinutes} minutes: ${first} → ${last}`,
        values: [first, last],
        timeSpan: timeSpanMinutes
      };
    } else {
      return {
        text: `Last ${timeSpanMinutes} minutes: ${first} → ${middle} → ${last}`,
        values: [first, middle, last],
        timeSpan: timeSpanMinutes
      };
    }
  };
  
  // Generate encouraging progress description
  const getProgressDescription = () => {
    const trend = getTrendDisplay();
    if (!trend) return null;
    
    const { values, timeSpan } = trend;
    const first = values[0];
    const last = values[values.length - 1];
    const difference = last - first;
    
    // Decreasing anxiety
    if (difference < -1) {
      return `Your anxiety has drifted down from ${first} to ${last} in the last ${timeSpan} minutes. That's your nervous system learning this is survivable.`;
    }
    // Slightly decreasing
    if (difference <= -1) {
      return `Gently easing from ${first} to ${last}. Your body is finding its way through this.`;
    }
    // Steady (within 1 point)
    if (Math.abs(difference) <= 1) {
      return `Holding steady at ${last} - you're managing this well.`;
    }
    // Slightly increasing
    if (difference < 3) {
      return `A small shift from ${first} to ${last} is normal when turbulence hits.`;
    }
    // Increasing
    return `Moving from ${first} to ${last} - this spike is temporary. Your fear response is doing its job.`;
  };

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
          anxietyLevel: currentAnxiety, // Use current anxiety level from slider
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
          "I'm here with you. Even if my words are lagging, you're not alone.";

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
            "I lost the connection for a moment. Your fear is real; this glitch isn't. Try once more when you're ready.",
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

  const trendDisplay = getTrendDisplay();
  const progressDescription = getProgressDescription();

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Talk to OTIE</h2>
            <p className="text-xs text-gray-400">
              Say what's actually happening in your body and brain. OTIE responds in real time.
            </p>
            
            {/* Anxiety trend display */}
            {trendDisplay && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-300">
                  {trendDisplay.text}
                </p>
                {progressDescription && (
                  <p className="text-xs text-gray-400">
                    {progressDescription}
                  </p>
                )}
              </div>
            )}
          </div>

          {lastPhase && (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="inline-flex items-center rounded-full bg-gray-900/60 border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-gray-300">
                Phase: {lastPhase}
              </span>
            </div>
          )}
        </div>
        
        {/* Anxiety level slider */}
        <div className="mb-4 p-3 bg-white/[0.03] border border-slate-800/50 rounded-xl">
          <label htmlFor="anxiety-slider" className="block text-xs text-gray-300 mb-2">
            Current anxiety level: {currentAnxiety}
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">0</span>
            <input
              id="anxiety-slider"
              type="range"
              min="0"
              max="10"
              value={currentAnxiety}
              onChange={(e) => handleAnxietyChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-700/50 rounded-lg appearance-none cursor-pointer 
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:hover:bg-blue-400
                       [&::-webkit-slider-thumb]:transition-colors
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 
                       [&::-moz-range-thumb]:hover:bg-blue-400 [&::-moz-range-thumb]:border-none
                       [&::-moz-range-thumb]:transition-colors"
            />
            <span className="text-xs text-gray-500">10</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Slide to report how anxious you feel right now
          </p>
        </div>

        {/* Messages */}
        <div className="mb-4 max-h-64 overflow-y-auto space-y-2 text-sm">
          {messages.length === 0 && (
            <p className="text-xs text-gray-500">
              Example: "We just hit a bump and my stomach dropped. My chest feels tight and my brain is screaming that something's wrong."
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
            placeholder="Tell OTIE what's actually going on in your head and body right now..."
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