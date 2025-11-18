// app/page.tsx
import ChatInterface from "@/components/ChatInterface";
import FlightStatus from "@/components/FlightStatus";

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-gradient-to-b from-gray-950 via-black to-blue-950 text-white py-8 px-4 relative overflow-hidden">
      {/* OTIE Background Character - Subtle floating presence */}
      <div 
        className="fixed bottom-20 right-10 w-72 h-72 opacity-[0.08] pointer-events-none float-animation"
        style={{
          backgroundImage: 'url("/otie-character.jpg")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          filter: 'blur(0.5px) brightness(1.2)',
        }}
      />
      
      {/* Soft glow behind OTIE */}
      <div 
        className="fixed bottom-20 right-10 w-96 h-96 opacity-[0.03] pointer-events-none float-animation"
        style={{
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      
      <div className="w-full max-w-4xl space-y-8 relative z-10">
        {/* Hero / intro */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">OTIE</h1>
          <p className="text-center max-w-xl mx-auto text-lg text-gray-300">
            Your in-flight companion. Real-time updates. Emotional support.
            You&apos;re not flying alone anymore.
          </p>
        </div>

        {/* Talk to OTIE */}
        <ChatInterface />

        {/* Current flight + weird-but-normal tools */}
        <FlightStatus />
      </div>
    </main>
  );
}
