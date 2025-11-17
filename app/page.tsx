import FlightStatus from '../components/FlightStatus';
import OtieDebugPanel from "../components/OtieDebugPanel";
import ChatInterface from "../components/ChatInterface";

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen bg-black text-white py-8 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">PlaneXiety</h1>
          <p className="text-center max-w-xl mx-auto text-lg text-gray-300">
            Your in-flight companion. Real-time updates. Emotional support.
            Guidance from OTIE. You're not flying alone anymore.
          </p>
        </div>

        {/* Chat Interface */}
        <ChatInterface />

        {/* Flight Status */}
        <FlightStatus />

        {/* Debug Panel */}
        <OtieDebugPanel />
      </div>
    </main>
  );
}
