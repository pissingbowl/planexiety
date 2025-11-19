import FlightStatus from '../components/FlightStatus';
import ChatInterface from "../components/ChatInterface";
import LiveFlightMap from "../components/LiveFlightMap";

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-blue-950 text-white py-8 px-4 relative overflow-hidden">
      {/* OTIE Bubble Effect - creates visibility outline */}
      <div 
        className="fixed bottom-16 right-6 w-80 h-80 opacity-[0.15] pointer-events-none float-animation"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(147, 197, 253, 0.2) 50%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      
      {/* OTIE Background Character - Slightly more present with lifelike animation */}
      <div 
        className="fixed bottom-20 right-10 w-72 h-72 opacity-[0.12] pointer-events-none float-animation"
        style={{
          backgroundImage: 'url("/otie-character.png")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'blur(0.3px)',
          transformOrigin: 'center center',
        }}
      />
      
      {/* Soft outer glow behind OTIE */}
      <div 
        className="fixed bottom-20 right-10 w-96 h-96 opacity-[0.04] pointer-events-none float-animation"
        style={{
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      
      <div className="w-full max-w-7xl space-y-6 relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">OTIE</h1>
          <p className="text-sm text-gray-400">
            Your flight companion
          </p>
        </div>

        {/* Hero Map Section - Main Feature */}
        <div className="w-full mb-8">
          <div className="rounded-2xl border border-sky-900/40 bg-slate-950/50 backdrop-blur-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-gradient-to-r from-sky-950/30 to-slate-950/30 border-b border-sky-900/30">
              <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-sky-400">
                Live Flight Radar
              </h2>
              <p className="mt-1 text-xs text-slate-300/70">
                Real-time aircraft across the United States • Click any aircraft for details
              </p>
            </div>
            <div className="p-3 bg-slate-950/30">
              <div className="h-[550px] rounded-lg overflow-hidden">
                <LiveFlightMap />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flight Status */}
          <div className="order-1">
            <FlightStatus />
          </div>

          {/* Chat Interface */}
          <div className="order-2">
            <ChatInterface />
          </div>
        </div>
      </div>
    </main>
  );
}
