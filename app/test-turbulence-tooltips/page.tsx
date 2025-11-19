"use client";

import { TurbulenceTooltip } from "@/components/TurbulenceTooltip";

export default function TestTurbulenceTooltips() {
  const turbulenceTypes = [
    "Clear Air Turbulence",
    "Convective Turbulence",
    "Mountain Wave",
    "Wind Shear",
    "Wake Turbulence",
    "Frontal Turbulence",
    "Chop",
    "Jet Stream",
    "General"
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-8">
          Turbulence Tooltip Test Page
        </h1>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-sky-400 mb-6">
            Hover over each turbulence type to see educational explanations:
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            {turbulenceTypes.map((type) => (
              <div 
                key={type} 
                className="bg-white/5 rounded-lg p-4 border border-slate-700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">
                    MODERATE
                  </span>
                  <TurbulenceTooltip 
                    type={type}
                    className="text-sm text-slate-300 font-medium"
                    showIcon={true}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Simulated turbulence hotspot
                </p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-slate-800/50 rounded-lg">
            <h3 className="text-sm font-semibold text-green-400 mb-2">
              ✓ Implementation Working
            </h3>
            <p className="text-xs text-slate-400">
              Each turbulence type above has an educational tooltip that explains WHY 
              that air condition causes turbulence using simple, relatable analogies.
              The tooltips use the glassy aesthetic with smooth fade-in animations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}