'use client';

interface FlightProgressBarProps {
  currentPhase: string;
  progress: number;
}

const phases = ['Gate', 'Taxi', 'Takeoff', 'Climb', 'Cruise', 'Descent', 'Approach', 'Landing'];

export default function FlightProgressBar({ currentPhase, progress }: FlightProgressBarProps) {
  const currentPhaseIndex = phases.indexOf(currentPhase);
  
  return (
    <div className="flight-progress-container">
      <div 
        className="flight-progress"
        style={{
          background: 'rgba(30, 39, 73, 0.5)',
          border: '1px solid var(--otie-altitude)',
          borderRadius: '4px',
          padding: '2px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.1)'
        }}
      >
        <div className="progress-segments" style={{ display: 'flex', height: '40px' }}>
          {phases.map((phase, index) => {
            const isActive = index <= currentPhaseIndex;
            const isCurrent = index === currentPhaseIndex;
            
            return (
              <div 
                key={phase}
                className="segment" 
                style={{
                  flex: 1,
                  height: '40px',
                  borderRight: index < phases.length - 1 ? '1px solid rgba(0, 212, 255, 0.2)' : 'none',
                  background: isActive ? 
                    `linear-gradient(90deg, rgba(0, 212, 255, ${isCurrent ? 0.4 : 0.2}), rgba(0, 212, 255, ${isCurrent ? 0.6 : 0.3}))` : 
                    'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.5s ease'
                }}
              >
                <span 
                  style={{ 
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: isActive ? 'var(--otie-text-primary)' : 'var(--otie-text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: isCurrent ? '600' : '400',
                    textShadow: isCurrent ? '0 0 10px rgba(0, 212, 255, 0.8)' : 'none'
                  }}
                >
                  {phase}
                </span>
                {isCurrent && (
                  <div 
                    className="current-indicator"
                    style={{
                      position: 'absolute',
                      bottom: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--otie-altitude)',
                      boxShadow: '0 0 10px var(--otie-altitude)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Overall progress indicator */}
      <div style={{
        marginTop: '10px',
        fontFamily: 'var(--font-mono)',
        fontSize: '12px',
        color: 'var(--otie-text-secondary)',
        textAlign: 'center'
      }}>
        FLIGHT PROGRESS: {Math.round(progress)}%
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            boxShadow: 0 0 10px var(--otie-altitude);
            transform: translateX(-50%) scale(1);
          }
          50% { 
            boxShadow: 0 0 20px var(--otie-altitude);
            transform: translateX(-50%) scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}