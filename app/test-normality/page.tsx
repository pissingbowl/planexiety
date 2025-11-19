"use client";

import { useState } from 'react';
import FlightStatus from "@/components/FlightStatus";

export default function TestNormality() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-blue-950 text-white py-4 px-4">
      <div className="w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Normality Score Test</h1>
        <p className="text-center mb-6 text-gray-400">
          The TURBULENCE ANALYSIS accordion below should show the normality chip
          between the summary text and the bump meter
        </p>
        
        {/* Render FlightStatus component which has TURBULENCE accordion open by default */}
        <FlightStatus />
      </div>
    </main>
  );
}