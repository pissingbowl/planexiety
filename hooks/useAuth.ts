"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "../shared/schema";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}