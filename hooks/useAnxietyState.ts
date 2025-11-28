"use client";

import { useState, useEffect, useCallback } from 'react';

interface AnxietyHistory {
  value: number;
  timestamp: number;
}

interface AnxietyState {
  current: number;
  state: 'grounded' | 'alert' | 'elevated' | 'acute' | 'crisis';
  velocity: number;
  acceleration: number;
  effective: number;
}

export function useAnxietyState(initialValue = 5) {
  const [history, setHistory] = useState<AnxietyHistory[]>([
    { value: initialValue, timestamp: Date.now() }
  ]);
  
  const calculateDerivatives = useCallback(() => {
    if (history.length < 2) {
      return { velocity: 0, acceleration: 0 };
    }
    
    const recent = history.slice(-5);
    
    const last = recent[recent.length - 1];
    const prev = recent[recent.length - 2];
    const timeDiffMin = (last.timestamp - prev.timestamp) / 60000;
    const velocity = timeDiffMin > 0 
      ? (last.value - prev.value) / timeDiffMin 
      : 0;
    
    let acceleration = 0;
    if (recent.length >= 3) {
      const prevPrev = recent[recent.length - 3];
      const prevTimeDiff = (prev.timestamp - prevPrev.timestamp) / 60000;
      const prevVelocity = prevTimeDiff > 0 
        ? (prev.value - prevPrev.value) / prevTimeDiff 
        : 0;
      acceleration = timeDiffMin > 0 
        ? (velocity - prevVelocity) / timeDiffMin 
        : 0;
    }
    
    return { velocity, acceleration };
  }, [history]);
  
  const getState = useCallback((level: number): 'grounded' | 'alert' | 'elevated' | 'acute' | 'crisis' => {
    if (level <= 2) return 'grounded';
    if (level <= 4) return 'alert';
    if (level <= 6) return 'elevated';
    if (level <= 8) return 'acute';
    return 'crisis';
  }, []);
  
  const getEffective = useCallback((
    current: number, 
    velocity: number, 
    acceleration: number
  ): number => {
    let effective = current;
    
    if (velocity > 1.5) effective += 1;
    if (velocity > 2.5) effective += 2;
    if (acceleration > 0.5) effective = Math.max(effective, 8);
    
    return Math.min(10, Math.max(0, effective));
  }, []);
  
  const setAnxiety = useCallback((value: number) => {
    setHistory(h => [...h.slice(-19), { value, timestamp: Date.now() }]);
  }, []);
  
  const current = history[history.length - 1].value;
  const { velocity, acceleration } = calculateDerivatives();
  const effective = getEffective(current, velocity, acceleration);
  
  const anxietyState: AnxietyState = {
    current,
    state: getState(effective),
    velocity,
    acceleration,
    effective
  };
  
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-anxiety-state', anxietyState.state);
      document.documentElement.setAttribute('data-anxiety-level', String(anxietyState.effective));
    }
  }, [anxietyState.state, anxietyState.effective]);
  
  return {
    ...anxietyState,
    setAnxiety
  };
}
