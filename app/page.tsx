'use client';

import { useState, useEffect } from 'react';
import FlightStatus from '../components/FlightStatus';
import ChatInterface from "../components/ChatInterface";
import ParticleField from '../components/ParticleField';
import FlightProgressBar from '../components/FlightProgressBar';
import DerivativeGauge from '../components/DerivativeGauge';

export default function Home() {
  const [anxietyLevel, setAnxietyLevel] = useState(50);
  const [previousAnxietyLevel, setPreviousAnxietyLevel] = useState(50);
  const [currentPhase, setCurrentPhase] = useState('Taxi');

  // Simulate anxiety changes for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setPreviousAnxietyLevel(anxietyLevel);
      setAnxietyLevel(prev => {
        const change = (Math.random() - 0.5) * 20;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [anxietyLevel]);

  return (
    <main 
      style={{
        background: 'linear-gradient(135deg, var(--otie-space) 0%, var(--otie-cosmic) 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated star field */}
      <ParticleField opacity={0.3} />
      
      {/* OTIE Background Character with new styling */}
      <div 
        className="fixed bottom-20 right-10 w-72 h-72 opacity-[0.15] pointer-events-none float-animation"
        style={{
          backgroundImage: 'url("/otie-character.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'blur(0.3px) drop-shadow(0 0 30px rgba(0, 212, 255, 0.4))',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Main content container */}
      <div 
        className="relative z-10 flex flex-col items-center px-4 py-8"
        style={{ minHeight: '100vh' }}
      >
        <div className="w-full max-w-6xl space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 
              style={{
                fontSize: '48px',
                fontWeight: '700',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, var(--otie-text-primary), var(--otie-altitude))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '16px',
                textShadow: '0 0 40px rgba(0, 212, 255, 0.5)'
              }}
            >
              OTIE
            </h1>
            <p style={{
              color: 'var(--otie-text-secondary)',
              fontSize: '14px',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              Optimal Timing Intelligence Engine • Flight Anxiety Support System
            </p>
          </div>

          {/* Top instrumentation row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flight Progress */}
            <div className="lg:col-span-2">
              <FlightProgressBar 
                currentPhase={currentPhase} 
                progress={12}
              />
            </div>
            
            {/* Derivative Gauge */}
            <div 
              style={{
                background: 'rgba(30, 39, 73, 0.3)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <DerivativeGauge 
                anxietyLevel={anxietyLevel}
                previousLevel={previousAnxietyLevel}
              />
            </div>
          </div>

          {/* Chat Interface with new card styling */}
          <div 
            style={{
              background: 'rgba(30, 39, 73, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--otie-altitude)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
            }}
          >
            <ChatInterface />
          </div>

          {/* Flight Status with new card styling */}
          <div 
            style={{
              background: 'rgba(30, 39, 73, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--otie-altitude)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
            }}
          >
            <FlightStatus />
          </div>
        </div>
      </div>
    </main>
  );
}
