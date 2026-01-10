import type { Environment } from "./chains";

/**
 * Feature flags configuration per environment
 */
export const FEATURE_FLAGS: Record<
  Environment,
  {
    devTools: boolean;
    mockData: boolean;
    analytics: boolean;
  }
> = {
  local: {
    devTools: true,
    mockData: false, // Set to false to test real contract reads
    analytics: false,
  },
  sepolia: {
    devTools: true,
    mockData: false,
    analytics: false,
  },
  mainnet: {
    devTools: false,
    mockData: false,
    analytics: true,
  },
};

/**
 * Query configuration per environment
 * Adjusts caching and refetch behavior based on environment
 */
export const QUERY_CONFIG: Record<
  Environment,
  {
    staleTime: number;
    refetchInterval: number;
    gcTime: number;
  }
> = {
  local: {
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  sepolia: {
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  mainnet: {
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // 1 minute
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
};
