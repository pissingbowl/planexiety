"use client";

import { QueryClient } from "@tanstack/react-query";

// Create a query client instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    },
  },
});

// Helper function for API requests with error handling
export async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("401: Unauthorized");
    }
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}