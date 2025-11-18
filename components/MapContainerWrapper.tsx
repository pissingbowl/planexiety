"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png", 
  shadowUrl: "/leaflet/marker-shadow.png",
});

interface Aircraft {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
  category: number;
}

interface Props {
  aircraft: Aircraft[];
  loading: boolean;
}

export function MapContainerWrapper({ aircraft, loading }: Props) {
  const getAircraftColor = (altitude: number | null, onGround: boolean) => {
    if (onGround) return "#FFD700"; // Gold for ground
    if (!altitude) return "#999999"; // Gray for unknown
    
    // Color gradient based on altitude
    if (altitude < 3000) return "#00FF00"; // Green - low
    if (altitude < 6000) return "#FFFF00"; // Yellow
    if (altitude < 9000) return "#FFA500"; // Orange
    if (altitude < 12000) return "#FF4500"; // Red-orange
    return "#FF0000"; // Red - high altitude
  };

  const formatAltitude = (meters: number | null) => {
    if (!meters) return "Unknown";
    const feet = Math.round(meters * 3.28084);
    return `${feet.toLocaleString()} ft`;
  };

  const formatSpeed = (metersPerSec: number | null) => {
    if (!metersPerSec) return "Unknown";
    const knots = Math.round(metersPerSec * 1.94384);
    return `${knots} kts`;
  };

  if (loading) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-slate-950/80 rounded-lg">
        <div className="text-center">
          <div className="animate-pulse text-sky-400 text-sm mb-2">Loading live flights...</div>
          <div className="text-xs text-gray-500">Connecting to radar network</div>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[39.0, -95.0]}
      zoom={5}
      className="h-[500px] w-full rounded-lg"
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &amp; <a href="https://carto.com/">CARTO</a>'
      />
      <ZoomControl position="bottomleft" />
      
      {aircraft.map((flight) => (
        <CircleMarker
          key={flight.icao24}
          center={[flight.latitude!, flight.longitude!]}
          radius={4}
          pathOptions={{
            fillColor: getAircraftColor(flight.baro_altitude, flight.on_ground),
            color: "#000",
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.9
          }}
        >
          <Popup>
            <div className="text-xs space-y-1">
              <div className="font-bold text-sm text-sky-600">
                {flight.callsign || flight.icao24}
              </div>
              <div><strong>ICAO:</strong> {flight.icao24}</div>
              <div><strong>Country:</strong> {flight.origin_country}</div>
              <div><strong>Altitude:</strong> {formatAltitude(flight.baro_altitude)}</div>
              <div><strong>Speed:</strong> {formatSpeed(flight.velocity)}</div>
              <div><strong>Heading:</strong> {flight.true_track ? `${Math.round(flight.true_track)}°` : "Unknown"}</div>
              <div><strong>Vertical:</strong> {flight.vertical_rate ? `${Math.round(flight.vertical_rate * 196.85)} ft/min` : "Level"}</div>
              <div><strong>Status:</strong> {flight.on_ground ? "On Ground" : "Airborne"}</div>
              {flight.squawk && <div><strong>Squawk:</strong> {flight.squawk}</div>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}