"use client";

import FlightStatus from '../components/FlightStatus';
import ChatInterface from "../components/ChatInterface";
import { useAuth } from "../hooks/useAuth";
import Image from "next/image";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-blue-950 text-white py-8 px-4 relative overflow-hidden">
      {/* OTIE Bubble Effect - creates visibility outline */}
      <div 
        className="fixed w-80 h-80 opacity-[0.45] pointer-events-none levitate-animation"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(147, 197, 253, 0.4) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      
      {/* OTIE Background Character - Much more visible with continuous levitation */}
      <div 
        className="fixed w-72 h-72 opacity-[0.55] pointer-events-none levitate-animation"
        style={{
          backgroundImage: 'url("/otie-character.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'contrast(1.2)',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Soft outer glow behind OTIE */}
      <div 
        className="fixed w-96 h-96 opacity-[0.15] pointer-events-none levitate-animation"
        style={{
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.6) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* User Profile Section */}
      <div className="absolute top-4 right-4 z-20">
        {isLoading ? (
          <div className="flex items-center space-x-2 bg-gray-800/70 backdrop-blur px-4 py-2 rounded-lg">
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center space-x-4 bg-gray-800/70 backdrop-blur px-4 py-2 rounded-lg">
            {user.profileImageUrl && (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {user.firstName || user.email || 'User'}
              </span>
              <a 
                href="/api/logout"
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Log out
              </a>
            </div>
          </div>
        ) : (
          <a
            href="/api/login"
            className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <span>Log in</span>
          </a>
        )}
      </div>

      <div className="w-full max-w-4xl space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-8xl md:text-9xl font-bold mb-6 tracking-wider bg-gradient-to-r from-sky-400 via-blue-400 to-sky-500 bg-clip-text text-transparent">OTIE</h1>
          <p className="text-center max-w-xl mx-auto text-lg text-gray-300">
            Your in-flight companion for turbulence, timing, and truth.
            {!isAuthenticated && !isLoading && (
              <span className="block mt-2 text-sm text-gray-400">
                Log in to access all features
              </span>
            )}
          </p>
        </div>

        {/* Flight Status */}
        <FlightStatus />

        {/* Chat Interface */}
        <ChatInterface />
      </div>
    </main>
  );
}
