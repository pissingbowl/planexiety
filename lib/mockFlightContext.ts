export function getMockFlightContext() {
  return {
    phase: "cruise" as const,
    altitude: 36000,
    turbulence: "light" as const,
    weatherAhead: "clear",
  };
}

