import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Example: useYieldData - Fetch yield data for a specific pool
 * Replace with your actual API calls
 */
export function useYieldData(poolId: string, enabled = true) {
  return useQuery({
    queryKey: ["yield", poolId],
    queryFn: async () => {
      const response = await fetch(`/api/yield/${poolId}`);
      if (!response.ok) throw new Error("Failed to fetch yield data");
      return response.json();
    },
    enabled,
  });
}

/**
 * Example: useStrategyData - Fetch strategy information
 */
export function useStrategyData(enabled = true) {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: async () => {
      const response = await fetch("/api/strategies");
      if (!response.ok) throw new Error("Failed to fetch strategies");
      return response.json();
    },
    enabled,
  });
}

/**
 * Example: useDepositMutation - Submit a deposit transaction
 */
export function useDepositMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { poolId: string; amount: string }) => {
      const response = await fetch("/api/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Deposit failed");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["yield"] });
    },
  });
}
