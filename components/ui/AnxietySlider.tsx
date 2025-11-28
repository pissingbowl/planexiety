"use client";

import { useState, useEffect } from 'react';

interface AnxietySliderProps {
  value: number;
  onChange: (value: number) => void;
  onStateChange?: (state: string) => void;
  showLabels?: boolean;
  compact?: boolean;
}

const getAnxietyState = (level: number): string => {
  if (level <= 2) return 'grounded';
  if (level <= 4) return 'alert';
  if (level <= 6) return 'elevated';
  if (level <= 8) return 'acute';
  return 'crisis';
};

export function AnxietySlider({ 
  value, 
  onChange, 
  onStateChange,
  showLabels = true,
  compact = false
}: AnxietySliderProps) {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  useEffect(() => {
    const state = getAnxietyState(localValue);
    onStateChange?.(state);
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-anxiety-state', state);
      document.documentElement.setAttribute('data-anxiety-level', String(localValue));
    }
  }, [localValue, onStateChange]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--color-white-60)]">Anxiety:</span>
        <input
          type="range"
          className="anxiety-slider flex-1"
          min={0}
          max={10}
          value={localValue}
          onChange={handleChange}
          aria-label={`Anxiety level: ${localValue} out of 10`}
        />
        <span className="text-lg font-semibold text-[var(--color-white)] min-w-[24px] text-right">
          {localValue}
        </span>
      </div>
    );
  }
  
  return (
    <div className="anxiety-slider-container">
      <div className="anxiety-slider-header">
        <span className="anxiety-slider-label">How anxious are you?</span>
        <span className="anxiety-slider-value">{localValue}</span>
      </div>
      <input
        type="range"
        className="anxiety-slider"
        min={0}
        max={10}
        value={localValue}
        onChange={handleChange}
        aria-label={`Anxiety level: ${localValue} out of 10`}
      />
      {showLabels && (
        <div className="anxiety-slider-labels">
          <span>Calm</span>
          <span>Panicked</span>
        </div>
      )}
    </div>
  );
}
