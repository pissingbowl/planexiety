'use client';

import { useEffect, useState } from 'react';

interface DerivativeGaugeProps {
  anxietyLevel: number;
  previousLevel?: number;
}

export default function DerivativeGauge({ anxietyLevel, previousLevel = 50 }: DerivativeGaugeProps) {
  const [derivativeRate, setDerivativeRate] = useState(0);
  const [derivativeAngle, setDerivativeAngle] = useState(0);
  
  useEffect(() => {
    // Calculate derivative (rate of change)
    const rate = anxietyLevel - previousLevel;
    setDerivativeRate(rate);
    
    // Convert to angle (-90 to +90 degrees, where 0 is neutral)
    // -90 = rapidly decreasing, 0 = stable, +90 = rapidly increasing
    const angle = Math.max(-90, Math.min(90, rate * 3));
    setDerivativeAngle(angle);
  }, [anxietyLevel, previousLevel]);

  // Determine color based on derivative
  const getNeedleColor = () => {
    if (Math.abs(derivativeRate) < 5) return 'var(--otie-derivative-neutral)';
    if (derivativeRate > 10) return 'var(--otie-beacon)';
    if (derivativeRate > 0) return 'var(--otie-derivative-rising)';
    return 'var(--otie-derivative-falling)';
  };

  const getStatusText = () => {
    if (Math.abs(derivativeRate) < 5) return 'STABLE';
    if (derivativeRate > 10) return 'CLIMBING FAST';
    if (derivativeRate > 0) return 'CLIMBING';
    if (derivativeRate < -10) return 'DESCENDING FAST';
    return 'DESCENDING';
  };

  return (
    <div className="derivative-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      {/* VSI Label */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--otie-text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Anxiety Trend Indicator
      </div>

      {/* Main Gauge */}
      <div 
        className="derivative-gauge" 
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, var(--otie-horizon), var(--otie-cosmic))',
          border: '2px solid var(--otie-altitude)',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Scale markings */}
        {[-60, -30, 0, 30, 60].map(angle => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              width: '2px',
              height: '10px',
              background: 'var(--otie-altitude)',
              opacity: 0.5,
              top: '10px',
              left: '50%',
              transformOrigin: '0 90px',
              transform: `translateX(-50%) rotate(${angle}deg)`
            }}
          />
        ))}

        {/* Center dot */}
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: 'var(--otie-cosmic)',
          border: '2px solid var(--otie-altitude)',
          position: 'absolute',
          zIndex: 10
        }} />

        {/* Needle */}
        <div 
          className="needle" 
          style={{
            position: 'absolute',
            width: '3px',
            height: '80px',
            background: `linear-gradient(to top, transparent, ${getNeedleColor()})`,
            bottom: '50%',
            left: '50%',
            transformOrigin: 'center bottom',
            transform: `translateX(-50%) rotate(${derivativeAngle}deg)`,
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: `0 0 10px ${getNeedleColor()}`
          }}
        />

        {/* Digital readout in center */}
        <div style={{
          position: 'absolute',
          bottom: '60px',
          fontFamily: 'var(--font-mono)',
          fontSize: '18px',
          fontWeight: 'bold',
          color: getNeedleColor(),
          textShadow: `0 0 10px ${getNeedleColor()}`
        }}>
          {derivativeRate > 0 ? '+' : ''}{derivativeRate.toFixed(0)}
        </div>
      </div>

      {/* Status Text */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '14px',
        color: getNeedleColor(),
        textTransform: 'uppercase',
        letterSpacing: '2px',
        fontWeight: '600',
        textShadow: `0 0 20px ${getNeedleColor()}`
      }}>
        {getStatusText()}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '20px',
        fontSize: '10px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--otie-text-tertiary)'
      }}>
        <span style={{ color: 'var(--otie-derivative-falling)' }}>↓ IMPROVING</span>
        <span style={{ color: 'var(--otie-derivative-neutral)' }}>— STABLE</span>
        <span style={{ color: 'var(--otie-derivative-rising)' }}>↑ RISING</span>
      </div>
    </div>
  );
}