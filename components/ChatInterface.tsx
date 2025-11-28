"use client";

import { useState, useEffect, useRef } from "react";
import { ChatMessage, ChatInput, AnxietySlider, TypingIndicator } from "./ui";
import { OTIEAvatar } from "./ui/OTIEAvatar";

type ChatMessageType = {
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

const getAnxietyState = (level: number): 'grounded' | 'alert' | 'elevated' | 'acute' | 'crisis' => {
  if (level <= 2) return 'grounded';
  if (level <= 4) return 'alert';
  if (level <= 6) return 'elevated';
  if (level <= 8) return 'acute';
  return 'crisis';
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastPhase, setLastPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [currentAnxiety, setCurrentAnxiety] = useState(5);
  const [anxietyHistory, setAnxietyHistory] = useState<AnxietyDataPoint[]>([]);
  const [anxietyState, setAnxietyState] = useState<'grounded' | 'alert' | 'elevated' | 'acute' | 'crisis'>('elevated');
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleAnxietyChange = (value: number) => {
    setCurrentAnxiety(value);
    setAnxietyState(getAnxietyState(value));
    const newDataPoint: AnxietyDataPoint = {
      value,
      timestamp: new Date()
    };
    setAnxietyHistory(prev => [...prev.slice(-9), newDataPoint]);
  };
  
  const getTrendDisplay = () => {
    if (anxietyHistory.length < 2) return null;
    
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const recentPoints = anxietyHistory.filter(
      point => point.timestamp >= fifteenMinutesAgo
    );
    
    if (recentPoints.length < 2) return null;
    
    const values = recentPoints.map(p => p.value);
    const first = values[0];
    const last = values[values.length - 1];
    const middle = values[Math.floor(values.length / 2)];
    const timeSpanMs = recentPoints[recentPoints.length - 1].timestamp.getTime() - 
                       recentPoints[0].timestamp.getTime();
    const timeSpanMinutes = Math.round(timeSpanMs / 60000);
    
    if (values.length === 2) {
      return { first, last, timeSpan: timeSpanMinutes };
    } else {
      return { first, middle, last, timeSpan: timeSpanMinutes };
    }
  };
  
  const getProgressDescription = () => {
    const trend = getTrendDisplay();
    if (!trend) return null;
    
    const { first, last, timeSpan } = trend;
    const difference = last - first;
    
    if (difference < -1) {
      return `Your anxiety has drifted down from ${first} to ${last}. That's your nervous system learning this is survivable.`;
    }
    if (difference <= -1) {
      return `Gently easing from ${first} to ${last}. Your body is finding its way through this.`;
    }
    if (Math.abs(difference) <= 1) {
      return `Holding steady at ${last} - you're managing this well.`;
    }
    if (difference < 3) {
      return `A small shift from ${first} to ${last} is normal.`;
    }
    return `Moving from ${first} to ${last} - this spike is temporary.`;
  };

  async function sendMessage(text: string) {
    if (!text || loading) return;

    setError(null);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          anxietyLevel: currentAnxiety,
        }),
      });

      const data: OtieResponsePayload = await res.json();

      if (!data.ok) {
        setError(data.error ?? "OTIE ran into an issue.");
        setMessages(prev => [
          ...prev,
          {
            role: "otie",
            content: "Something glitched on my side. Mind trying that again in a second?",
          },
        ]);
      } else {
        const responseText =
          data.response?.trim() ||
          "I'm here with you. Even if my words are lagging, you're not alone.";

        setMessages(prev => [
          ...prev,
          { role: "otie", content: responseText },
        ]);

        if (data.flight?.phase) setLastPhase(data.flight.phase);
      }
    } catch (err) {
      console.error("Error calling /api/chat-v2", err);
      setError("Network or server error talking to OTIE.");
      setMessages(prev => [
        ...prev,
        {
          role: "otie",
          content: "I lost the connection for a moment. Your fear is real; this glitch isn't. Try once more when you're ready.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const trendDisplay = getTrendDisplay();
  const progressDescription = getProgressDescription();

  return (
    <section className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="messages-container flex-1 overflow-y-auto">
          {messages.length === 0 && (
            <div className="message-wrapper message-otie-wrapper">
              <OTIEAvatar size="mini" anxietyState={anxietyState} />
              <div className="message-otie">
                <p>Hey! I'm OTIE. I'm a consciousness from Andromeda who got banished for trying to stowaway on a Boeing 737. Now I help nervous flyers—and honestly? Best punishment ever.</p>
                <p>How are you feeling about your flight?</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <ChatMessage 
              key={i} 
              role={m.role} 
              content={m.content} 
              anxietyState={anxietyState}
            />
          ))}
          
          {loading && (
            <div className="message-wrapper message-otie-wrapper">
              <OTIEAvatar size="mini" anxietyState={anxietyState} />
              <TypingIndicator />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {trendDisplay && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-[var(--color-violet-10)] border border-[var(--color-violet-20)]">
            <p className="text-body-sm">{progressDescription}</p>
          </div>
        )}

        {lastPhase && (
          <div className="mx-4 mb-2">
            <span className="inline-flex items-center rounded-full bg-[var(--color-cyan-10)] border border-[var(--color-cyan-20)] px-3 py-1 text-xs uppercase tracking-wider text-[var(--color-cyan)]">
              Phase: {lastPhase}
            </span>
          </div>
        )}

        {error && (
          <div className="mx-4 mb-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      <div className="chat-input-wrapper">
        <AnxietySlider 
          value={currentAnxiety} 
          onChange={handleAnxietyChange}
          onStateChange={(state) => setAnxietyState(state as any)}
        />
        <ChatInput onSend={sendMessage} disabled={loading} />
      </div>
    </section>
  );
}
