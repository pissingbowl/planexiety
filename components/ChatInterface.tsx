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
    <section className="w-full max-w-2xl mx-auto px-4 sm:px-0">
      <div className="bg-white/[0.03] border border-slate-800/50 rounded-3xl p-5 sm:p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Talk to OTIE</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
              Tell OTIE what's happening in your body. Get real-time support.
            </p>
            
            {/* Anxiety trend display - More compact on mobile */}
            {trendDisplay && (
              <div className="mt-3 p-2 bg-white/[0.02] rounded-xl border border-slate-800/30">
                <p className="text-xs text-gray-300">
                  {trendDisplay.text}
                </p>
                {progressDescription && (
                  <p className="text-[11px] text-gray-400 mt-1">
                    {progressDescription}
                  </p>
                )}
              </div>
            )}
          </div>

          {lastPhase && (
            <div className="flex sm:flex-col items-start sm:items-end gap-1">
              <span className="inline-flex items-center rounded-full bg-white/[0.03] border border-slate-700/50 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-gray-300 transition-all duration-200">
                Phase: {lastPhase}
              </span>
            </div>
          )}
        </div>
        
        {/* Anxiety level slider - Enhanced for mobile */}
        <div className="mb-5 p-4 bg-white/[0.04] border border-slate-800/50 rounded-2xl transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="anxiety-slider" className="text-xs sm:text-sm text-gray-300 font-medium">
              Anxiety level
            </label>
            <span className="text-sm sm:text-base font-semibold text-sky-400 px-2 py-1 bg-white/[0.03] rounded-lg">
              {currentAnxiety}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-mono">0</span>
            <input
              id="anxiety-slider"
              type="range"
              min="0"
              max="10"
              value={currentAnxiety}
              onChange={(e) => handleAnxietyChange(Number(e.target.value))}
              className="flex-1 h-3 bg-slate-700/50 rounded-lg appearance-none cursor-pointer touch-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 
                       [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full 
                       [&::-webkit-slider-thumb]:bg-sky-500 [&::-webkit-slider-thumb]:hover:bg-sky-400
                       [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200
                       [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(56,189,248,0.5)]
                       [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-sky-500 
                       [&::-moz-range-thumb]:hover:bg-sky-400 [&::-moz-range-thumb]:border-none
                       [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200
                       [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(56,189,248,0.5)]"
            />
            <span className="text-xs text-gray-500 font-mono">10</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-2 italic">
            Move the slider to match how you're feeling
          </p>
        </div>

        {/* Messages - Enhanced scrolling and mobile-friendly */}
        <div className="mb-5 max-h-64 sm:max-h-80 overflow-y-auto space-y-3 px-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-slate-800/30">
              <p className="text-xs sm:text-sm text-gray-400 italic leading-relaxed">
                Example: "We just hit a bump and my stomach dropped. My chest feels tight."
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-2.5 text-sm transition-all duration-200 ${
                  m.role === "user"
                    ? "bg-sky-600/80 text-white backdrop-blur-sm"
                    : "bg-white/[0.05] text-gray-100 border border-slate-800/50"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input area - Better mobile touch targets */}
        <div className="flex flex-col gap-3">
          <textarea
            className="w-full rounded-2xl bg-white/[0.03] border border-slate-700/50 px-4 py-3 text-sm sm:text-base text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all duration-200 min-h-[80px] resize-none"
            rows={3}
            placeholder="Tell OTIE what you're feeling right now..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="inline-flex justify-center items-center rounded-2xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-semibold py-3 px-6 transition-all duration-200 min-h-[48px] touch-manipulation shadow-lg shadow-sky-900/20"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                OTIE is thinking...
              </span>
            ) : (
              "Send to OTIE"
            )}
          </button>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="text-xs sm:text-sm text-red-400">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}