"use client";

import { useState } from "react";

// Turbulence explanations - WHY each type causes bumps
const TURBULENCE_EXPLANATIONS: Record<string, {
  title: string;
  explanation: string;
}> = {
  "Clear Air Turbulence": {
    title: "Clear Air Turbulence (CAT)",
    explanation: "When fast-moving jet stream air (150+ mph) meets slower air, it creates invisible 'speed bumps' in the sky. Like water flowing over rocks creates rapids, these wind speed differences create sudden jolts even in clear skies."
  },
  "CAT": {
    title: "Clear Air Turbulence",
    explanation: "When fast-moving jet stream air (150+ mph) meets slower air, it creates invisible 'speed bumps' in the sky. Like water flowing over rocks creates rapids, these wind speed differences create sudden jolts even in clear skies."
  },
  "Convective": {
    title: "Convective Turbulence",
    explanation: "Rising hot air creates invisible 'bubbles' that push the plane up, then drop it when you fly past. It's like driving over hills - the warmer the day, the bigger the bumps."
  },
  "Convective Turbulence": {
    title: "Convective Turbulence",
    explanation: "Rising hot air creates invisible 'bubbles' that push the plane up, then drop it when you fly past. It's like driving over hills - the warmer the day, the bigger the bumps."
  },
  "Mountain Wave": {
    title: "Mountain Wave Turbulence",
    explanation: "Wind flowing over mountains creates invisible waves in the air that extend miles high. Your plane rides these waves like a boat on ocean swells - smooth but rolling."
  },
  "Mountain Wave Turbulence": {
    title: "Mountain Wave Turbulence",
    explanation: "Wind flowing over mountains creates invisible waves in the air that extend miles high. Your plane rides these waves like a boat on ocean swells - smooth but rolling."
  },
  "Wind Shear": {
    title: "Wind Shear",
    explanation: "When winds suddenly change speed or direction, it's like hitting an invisible wall of air. The plane gets pushed sideways or up/down as it crosses between different wind zones."
  },
  "Low Level Wind Shear": {
    title: "Wind Shear",
    explanation: "When winds suddenly change speed or direction, it's like hitting an invisible wall of air. The plane gets pushed sideways or up/down as it crosses between different wind zones."
  },
  "LLWS": {
    title: "Wind Shear",
    explanation: "When winds suddenly change speed or direction, it's like hitting an invisible wall of air. The plane gets pushed sideways or up/down as it crosses between different wind zones."
  },
  "Wake": {
    title: "Wake Turbulence",
    explanation: "Big planes create spinning air vortexes behind them (like mini tornadoes). If you fly through one, it rocks your plane like a boat hitting another boat's wake."
  },
  "Wake Turbulence": {
    title: "Wake Turbulence",
    explanation: "Big planes create spinning air vortexes behind them (like mini tornadoes). If you fly through one, it rocks your plane like a boat hitting another boat's wake."
  },
  "Frontal": {
    title: "Frontal Turbulence",
    explanation: "Where cold and warm air masses collide, they don't mix smoothly - they tumble over each other creating choppy air, like oil and water shaking in a bottle."
  },
  "Frontal Turbulence": {
    title: "Frontal Turbulence",
    explanation: "Where cold and warm air masses collide, they don't mix smoothly - they tumble over each other creating choppy air, like oil and water shaking in a bottle."
  },
  "Chop": {
    title: "Chop",
    explanation: "Rhythmic, light bumps caused by disturbed air patterns. Like driving on a washboard road - annoying but harmless. The plane handles this with ease."
  },
  "CHOP": {
    title: "Chop",
    explanation: "Rhythmic, light bumps caused by disturbed air patterns. Like driving on a washboard road - annoying but harmless. The plane handles this with ease."
  },
  "Jet Stream": {
    title: "Jet Stream Turbulence",
    explanation: "Rivers of fast air at high altitude create turbulence at their edges. Like kayaking where a fast river meets slow water - bumpy but predictable."
  },
  "General": {
    title: "General Turbulence",
    explanation: "Mixed air movements from various sources. Like stirring cream into coffee - the air doesn't mix instantly, creating swirls and bumps that planes navigate through."
  }
};

interface TurbulenceTooltipProps {
  type: string;
  className?: string;
  showIcon?: boolean;
}

export function TurbulenceTooltip({ 
  type, 
  className = "", 
  showIcon = false 
}: TurbulenceTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  // Get explanation or use a default if type not found
  const info = TURBULENCE_EXPLANATIONS[type] || TURBULENCE_EXPLANATIONS["General"];
  
  return (
    <div 
      className="relative inline-flex items-center group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className={`cursor-help border-b border-dotted border-slate-600 ${className}`}>
        {type}
      </span>
      {showIcon && (
        <span className="ml-1 text-[10px] text-slate-500">ℹ</span>
      )}
      
      {/* Tooltip */}
      <div className={`
        absolute z-50 pointer-events-none
        bottom-full mb-2 left-1/2 -translate-x-1/2
        transition-all duration-200
        ${isVisible ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 translate-y-1'}
      `}>
        <div className="
          relative w-64 p-3 
          bg-slate-900/95 backdrop-blur-sm
          border border-slate-700/50 
          rounded-lg shadow-xl
          text-xs
        ">
          <div className="font-semibold text-sky-400 mb-1.5">
            Why this causes turbulence:
          </div>
          <div className="text-gray-300 leading-relaxed">
            {info.explanation}
          </div>
          
          {/* Arrow pointing down */}
          <div className="
            absolute top-full left-1/2 -translate-x-1/2 -mt-px
            w-0 h-0 
            border-l-[6px] border-r-[6px] border-t-[6px] 
            border-l-transparent border-r-transparent border-t-slate-700/50
          "></div>
          {/* Inner arrow for better visibility */}
          <div className="
            absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]
            w-0 h-0 
            border-l-[5px] border-r-[5px] border-t-[5px] 
            border-l-transparent border-r-transparent border-t-slate-900/95
          "></div>
        </div>
      </div>
    </div>
  );
}

// Export a function to get turbulence explanation text without the UI
export function getTurbulenceExplanation(type: string): string {
  const info = TURBULENCE_EXPLANATIONS[type] || TURBULENCE_EXPLANATIONS["General"];
  return info.explanation;
}