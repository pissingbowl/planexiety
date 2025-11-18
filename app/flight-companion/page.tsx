// app/page.tsx
import ChatInterface from "@/components/ChatInterface";
import FlightStatus from "@/components/FlightStatus";
import OtieDebugPanel from "@/components/OtieDebugPanel";

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-black text-white py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Hero / intro */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">PlaneXiety</h1>
          <p className="text-center max-w-xl mx-auto text-lg text-gray-300">
            Your in-flight companion. Real-time updates. Emotional support.
            Guidance from OTIE. You&apos;re not flying alone anymore.
          </p>
        </div>

        {/* Talk to OTIE */}
        <ChatInterface />

        {/* Current flight + weird-but-normal tools */}
        <FlightStatus />

        {/* OTIE debug / dev view */}
        <OtieDebugPanel />
      </div>
    </main>
  );
}
