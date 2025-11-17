"use client";

import { useEffect, useState } from "react";
import type { EngineOutput } from "@/lib/EmotionalStateEngine";

interface EseTestResponse {
  ok: boolean;
  userMessage: string;
  engineOutput: EngineOutput;
}

export default function OtieDebugPanel() {
  const [data, setData] = useState<EseTestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function runTest() {
      try {
        const res = await fetch("/api/ese-test");
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as EseTestResponse;
        setData(json);
      } catch (err: any) {
        console.error("ESE test fetch error:", err);
        setError(err.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    runTest();
  }, []);

  return (
    <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-100">
      <h2 className="mb-2 text-base font-semibold tracking-tight">
        OTIE Emotional State Engine – Debug
      </h2>

      {loading && <p className="text-slate-400">Running engine on mock user…</p>}

      {error && (
        <p className="text-red-400">
          Error talking to ESE test endpoint: {error}
        </p>
      )}

      {data && (
        <div className="space-y-2">
          <div>
            <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
              Input message
            </div>
            <p className="text-slate-100">{data.userMessage}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-800/70 p-3">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
                Mode
              </div>
              <div className="text-sm font-medium">
                {data.engineOutput.mode}
              </div>
            </div>

            <div className="rounded-lg bg-slate-800/70 p-3">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
                Tool offered
              </div>
              <div className="text-sm font-medium">
                {data.engineOutput.tool_offered ?? "none"}
              </div>
            </div>

            <div className="rounded-lg bg-slate-800/70 p-3">
              <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
                Derivatives
              </div>
              <div className="text-xs text-slate-300">
                anxiety_rate: {data.engineOutput.derivatives?.anxiety_rate ?? 0}
                <br />
                hr_rate: {data.engineOutput.derivatives?.hr_rate ?? 0}
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-slate-800/60 p-3">
            <div className="text-xs uppercase tracking-[0.15em] text-slate-500">
              Response pattern
            </div>
            <pre className="mt-1 overflow-x-auto text-xs text-slate-200">
{JSON.stringify(data.engineOutput.pattern, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

