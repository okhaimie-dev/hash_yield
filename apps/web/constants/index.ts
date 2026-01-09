import { CHAIN_CONFIG, type Environment } from "./chains";
import { CONTRACT_ADDRESSES, type ContractName } from "./addresses";
import { FEATURE_FLAGS, QUERY_CONFIG } from "./features";

/**
 * Get the current environment from environment variables
 * Falls back to 'sepolia' in development, 'mainnet' in production
 * 
 * @returns Current environment: 'local' | 'sepolia' | 'mainnet'
 */
const getEnvironment = (): Environment => {
  const envVar = process.env.NEXT_PUBLIC_STARKNET_ENV as
    | Environment
    | undefined;

  if (envVar && (envVar === "local" || envVar === "sepolia" || envVar === "mainnet")) {
    return envVar;
  }

  // Fallback logic
  if (process.env.NODE_ENV === "production") {
    return "mainnet";
  }

  return "sepolia";
};

/**
 * Current environment based on NEXT_PUBLIC_STARKNET_ENV
 * 
 * @see /apps/web/docs/ENVIRONMENT_SETUP.md for configuration details
 */
export const CURRENT_ENV: Environment = getEnvironment();

/**
 * Main application configuration object
 * 
 * Provides type-safe access to environment-specific settings:
 * - Chain configuration (RPC, explorer, chain object)
 * - Contract addresses (vault, WBTC, Vesu, Ekubo)
 * - Feature flags (devTools, mockData, analytics)
 * - API endpoints
 * - Query configuration (staleTime, refetchInterval)
 * 
 * @example
 * ```typescript
 * import { APP_CONFIG } from '@/constants';
 * 
 * // Access chain config
 * const rpcUrl = APP_CONFIG.chain.rpcUrl;
 * 
 * // Get contract address
 * const vault = APP_CONFIG.contracts.vault;
 * 
 * // Check feature flags
 * if (APP_CONFIG.features.devTools) {
 *   // Show development tools
 * }
 * ```
 */
export const APP_CONFIG = {
  /** Current environment: 'local' | 'sepolia' | 'mainnet' */
  environment: CURRENT_ENV,

  /** Chain configuration (RPC URL, explorer, chain object) */
  chain: CHAIN_CONFIG[CURRENT_ENV],

  /** Contract addresses for current environment */
  contracts: CONTRACT_ADDRESSES[CURRENT_ENV],

  /** Feature flags for current environment */
  features: FEATURE_FLAGS[CURRENT_ENV],

  /** API base URL */
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
  },

  /** Tanstack Query configuration */
  queryConfig: QUERY_CONFIG[CURRENT_ENV],

  /** Environment checks */
  isDev: CURRENT_ENV === "local",
  isStaging: CURRENT_ENV === "sepolia",
  isProd: CURRENT_ENV === "mainnet",
} as const;

/**
 * Check if running in development mode (local or sepolia)
 * @returns true if environment is not mainnet
 */
export const isDevelopment = (): boolean => CURRENT_ENV !== "mainnet";

/**
 * Check if running in local environment
 * @returns true if environment is local
 */
export const isLocal = (): boolean => CURRENT_ENV === "local";

/**
 * Get contract address for the current environment
 * 
 * @param contract - Contract name ('vault' | 'wbtc' | 'vesu' | 'ekubo')
 * @returns Contract address as hex string
 * 
 * @example
 * ```typescript
 * const vaultAddress = getContractAddress('vault');
 * const wbtcAddress = getContractAddress('wbtc');
 * ```
 */
export const getContractAddress = (contract: ContractName): string => {
  return APP_CONFIG.contracts[contract];
};

// Re-export types
export type { Environment, ContractName };
