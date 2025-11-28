"use client";

import { useState } from 'react';
import FlightStatus from '../components/FlightStatus';
import ChatInterface from "../components/ChatInterface";
import { useAuth } from "../hooks/useAuth";
import { OTIEAvatar, Header, TabBar, ToolCard, BreathingTool } from '../components/ui';

type TabId = 'chat' | 'tools' | 'flight' | 'profile';

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [showBreathing, setShowBreathing] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="flex-1 flex flex-col">
            <div className="text-center py-6">
              <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-wider bg-gradient-to-r from-[var(--color-lavender)] via-[var(--color-violet-primary)] to-[var(--color-cyan)] bg-clip-text text-transparent">
                OTIE
              </h1>
              <p className="text-center max-w-xl mx-auto text-[var(--color-white-80)]">
                Your in-flight companion for turbulence, timing, and truth.
              </p>
            </div>
            <ChatInterface />
          </div>
        );
      
      case 'tools':
        return (
          <div className="tools-container">
            <section className="tools-section">
              <h2 className="text-label">Breathing Exercises</h2>
              <div className="tools-grid">
                <ToolCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                    </svg>
                  }
                  title="Box Breathing"
                  description="4-4-4-4 pattern to calm your nervous system"
                  onClick={() => setShowBreathing(true)}
                />
                <ToolCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12c0-4 3-8 10-8s10 4 10 8-3 8-10 8-10-4-10-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  }
                  title="4-7-8 Breathing"
                  description="Extended exhale for deep relaxation"
                  onClick={() => setShowBreathing(true)}
                />
              </div>
            </section>
            
            <section className="tools-section">
              <h2 className="text-label">Grounding</h2>
              <div className="tools-grid">
                <ToolCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="21.17" y1="8" x2="12" y2="8" />
                      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                    </svg>
                  }
                  title="5-4-3-2-1"
                  description="Sensory grounding technique"
                />
              </div>
            </section>
            
            <section className="tools-section">
              <h2 className="text-label">Learn</h2>
              <div className="tools-grid">
                <ToolCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  }
                  title="Flight Sounds"
                  description="Learn what every noise means"
                />
                <ToolCard
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    </svg>
                  }
                  title="Turbulence 101"
                  description="Why it happens and why it&apos;s safe"
                />
              </div>
            </section>
          </div>
        );
      
      case 'flight':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <FlightStatus />
          </div>
        );
      
      case 'profile':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-6">
              <div className="text-center">
                <OTIEAvatar size="large" anxietyState="grounded" className="mx-auto mb-6" />
                <h2 className="text-headline-2 mb-2">Your Profile</h2>
              </div>
              
              {isLoading ? (
                <div className="info-card">
                  <p className="text-body-sm text-center">Loading...</p>
                </div>
              ) : isAuthenticated && user ? (
                <div className="info-card">
                  <div className="flex items-center gap-4 mb-4">
                    {user.profileImageUrl && (
                      <img 
                        src={user.profileImageUrl} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="text-headline-3">
                        {user.firstName || 'Welcome back'}
                      </h3>
                      <p className="text-body-sm">{user.email}</p>
                    </div>
                  </div>
                  <a
                    href="/api/logout"
                    className="btn-secondary w-full text-center"
                  >
                    Log out
                  </a>
                </div>
              ) : (
                <div className="info-card">
                  <h3 className="info-card-title">Get Started</h3>
                  <p className="info-card-text mb-4">
                    Log in to save your progress and personalize your experience.
                  </p>
                  <a
                    href="/api/login"
                    className="btn-primary w-full text-center"
                  >
                    Log in with Replit
                  </a>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container app-background" data-anxiety="grounded">
      <div 
        className="fixed w-80 h-80 opacity-20 pointer-events-none levitate-animation"
        style={{
          background: 'var(--gradient-otie-glow)',
          filter: 'blur(40px)',
        }}
      />
      
      <div 
        className="fixed w-64 h-64 opacity-30 pointer-events-none levitate-animation"
        style={{
          backgroundImage: 'url("/otie-character.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'contrast(1.1)',
        }}
      />

      <Header 
        showLogo={activeTab === 'chat'}
        title={activeTab === 'tools' ? 'Tools' : activeTab === 'flight' ? 'Flight' : activeTab === 'profile' ? 'Profile' : undefined}
        showSettings={activeTab === 'chat'}
        rightContent={
          activeTab === 'chat' && !isLoading && (
            isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {user.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <span className="text-sm text-[var(--color-white-80)]">
                  {user.firstName || 'User'}
                </span>
              </div>
            ) : (
              <a href="/api/login" className="btn-ghost">
                Log in
              </a>
            )
          )
        }
      />
      
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {renderContent()}
      </main>
      
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {showBreathing && (
        <BreathingTool onClose={() => setShowBreathing(false)} />
      )}
    </div>
  );
}
