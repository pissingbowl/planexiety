import FlightStatus from '../components/FlightStatus';
import ChatInterface from "../components/ChatInterface";

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
      
      <div className="w-full max-w-4xl space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">OTIE</h1>
          <p className="text-center max-w-xl mx-auto text-lg text-gray-300">
            Your flight companion
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
