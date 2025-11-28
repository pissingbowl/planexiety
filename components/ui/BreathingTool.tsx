"use client";

import { useState, useEffect } from 'react';
import { OTIEAvatar } from './OTIEAvatar';

type BreathPhase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

interface BreathingToolProps {
  pattern?: [number, number, number, number];
  onClose: () => void;
}

export function BreathingTool({ 
  pattern = [4, 4, 4, 4], 
  onClose 
}: BreathingToolProps) {
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [seconds, setSeconds] = useState(pattern[0]);
  const [cycleCount, setCycleCount] = useState(0);
  
  const phases: BreathPhase[] = ['inhale', 'hold-in', 'exhale', 'hold-out'];
  const phaseLabels: Record<BreathPhase, string> = {
    'inhale': 'Breathe in...',
    'hold-in': 'Hold...',
    'exhale': 'Breathe out...',
    'hold-out': 'Hold...'
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          const currentIndex = phases.indexOf(phase);
          const nextIndex = (currentIndex + 1) % 4;
          const nextPhase = phases[nextIndex];
          
          setPhase(nextPhase);
          
          if (nextIndex === 0) {
            setCycleCount(c => c + 1);
          }
          
          return pattern[nextIndex];
        }
        return s - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [phase, pattern]);
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="breathing-overlay" 
      data-phase={phase}
      onClick={handleBackdropClick}
    >
      <button 
        className="btn-ghost breathing-close" 
        onClick={onClose}
        aria-label="Close breathing exercise"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      
      <div className="breathing-content" onClick={e => e.stopPropagation()}>
        <OTIEAvatar size="small" anxietyState="acute" />
        
        <div className="breathing-visual">
          <div className="breathing-circle" data-phase={phase} />
          <span className="breathing-phase-text">
            {phaseLabels[phase]}
          </span>
        </div>
        
        <div className="breathing-counter">
          <span className="breathing-seconds">{seconds}</span>
        </div>
        
        <p className="text-body-sm" style={{ color: 'var(--color-white-60)' }}>
          Cycle {cycleCount + 1}
        </p>
      </div>
      
      <p className="breathing-instruction">
        Tap anywhere to exit
      </p>
    </div>
  );
}
