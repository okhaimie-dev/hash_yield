import { useReadContract } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import { APP_CONFIG, getContractAddress } from "../constants/index";
import { vaultAbi } from "../constants/abis";

/**
 * Vault statistics interface
 */
export interface VaultStats {
  apyBase: number;
  apyBonus: number;
  tvlBtc: number;
  tvlUsd: number;
  sharePrice: number;
  asset: string;
}

/**
 * Hook to fetch vault statistics
 *
 * Fetches comprehensive vault data including APY, TVL, and share price
 * Uses starknet-react for contract reads with automatic caching
 *
 * @returns Query result with vault statistics
 *
 * @example
 * ```typescript
 * const { data: vaultStats, isLoading, error } = useVaultStats();
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error loading vault</div>;
 *
 * return <div>TVL: {vaultStats.tvlBtc} BTC</div>;
 * ```
 */
export function useVaultStats() {
  const vaultAddress = getContractAddress("vault");

  // Contract reads for total_assets and total_supply
  const {
    data: totalAssetsData,
    isLoading: isLoadingAssets,
    error: assetsError,
  } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultAbi,
    functionName: "total_assets",
    watch: true,
    enabled: !APP_CONFIG.features.mockData,
  });

  const {
    data: totalSupplyData,
    isLoading: isLoadingSupply,
    error: supplyError,
  } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultAbi,
    functionName: "total_supply",
    watch: true,
    enabled: !APP_CONFIG.features.mockData,
  });

  // Combine contract data into VaultStats
  return useQuery<VaultStats>({
    queryKey: ["vaultStats", vaultAddress, String(totalAssetsData), String(totalSupplyData)],
    queryFn: async () => {
      // Mock data for development
      if (APP_CONFIG.features.mockData) {
        return {
          apyBase: 3.2,
          apyBonus: 1.65,
          tvlBtc: 84.52,
          tvlUsd: 5_410_290,
          sharePrice: 1.0421,
          asset: "WBTC",
        };
      }

      // Real contract data
      if (assetsError || supplyError) {
        throw assetsError || supplyError;
      }

      // Parse u256 from contract (comes as { low: bigint, high: bigint } or bigint)
      const totalAssets = parseU256(totalAssetsData);
      const totalSupply = parseU256(totalSupplyData);

      // Calculate share price (avoid division by zero)
      const sharePrice = totalSupply > 0n ? Number(totalAssets) / Number(totalSupply) : 1;

      // Convert from 8 decimals (WBTC) to human-readable
      const tvlBtc = Number(totalAssets) / 1e8;

      // TODO: Fetch BTC price from oracle or API
      const btcPrice = 64_000; // Placeholder

      return {
        apyBase: 3.2, // TODO: Calculate from strategy yield
        apyBonus: 1.65, // TODO: Fetch from rewards contract
        tvlBtc,
        tvlUsd: tvlBtc * btcPrice,
        sharePrice,
        asset: "WBTC",
      };
    },
    enabled: APP_CONFIG.features.mockData || (!isLoadingAssets && !isLoadingSupply),
    refetchInterval: APP_CONFIG.queryConfig.refetchInterval,
    staleTime: APP_CONFIG.queryConfig.staleTime,
  });
}

/**
 * Parse a u256 value from contract response
 * Handles both { low, high } object format and direct bigint
 */
function parseU256(value: unknown): bigint {
  if (value === undefined || value === null) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") return BigInt(value);

  // Handle { low, high } format from Starknet
  const obj = value as { low?: bigint | string; high?: bigint | string };
  if (obj.low !== undefined) {
    const low = BigInt(obj.low);
    const high = BigInt(obj.high || 0);
    return low + (high << 128n);
  }

  return 0n;
}
