import { useReadContract } from "@starknet-react/core";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "@starknet-react/core";
import { APP_CONFIG, getContractAddress } from "../constants/index";
import { erc20Abi, vaultAbi } from "../constants/abis";

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

/**
 * Hook to fetch user's WBTC wallet balance
 *
 * Only fetches when a wallet is connected
 * Uses starknet-react for contract reads with automatic caching
 *
 * @returns Query result with wallet balance in BTC
 *
 * @example
 * ```typescript
 * const { data: balance, isLoading } = useWalletBalance();
 *
 * return <div>Balance: {balance || 0} BTC</div>;
 * ```
 */
export function useWalletBalance() {
  const { address } = useAccount();
  const wbtcAddress = getContractAddress("wbtc");

  // Contract read for balance_of
  const {
    data: balanceData,
    isLoading,
    error,
  } = useReadContract({
    address: wbtcAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balance_of",
    args: [address as `0x${string}`],
    watch: true,
    enabled: !!address && !APP_CONFIG.features.mockData,
  });

  return useQuery<number>({
    queryKey: ["walletBalance", address, wbtcAddress, String(balanceData)],
    queryFn: async () => {
      if (!address) return 0;

      // Mock data for development
      if (APP_CONFIG.features.mockData) {
        return 0.452;
      }

      if (error) {
        throw error;
      }

      // Parse balance and convert from 8 decimals to human-readable
      const balance = parseU256(balanceData);
      return Number(balance) / 1e8;
    },
    enabled: !!address && (APP_CONFIG.features.mockData || !isLoading),
    refetchInterval: APP_CONFIG.queryConfig.refetchInterval,
    staleTime: APP_CONFIG.queryConfig.staleTime,
  });
}

/**
 * Hook to fetch user's vault share balance
 *
 * Only fetches when a wallet is connected
 * Uses starknet-react for contract reads with automatic caching
 *
 * @returns Query result with vault shares
 *
 * @example
 * ```typescript
 * const { data: shares, isLoading } = useVaultShares();
 *
 * return <div>Shares: {shares || 0} sBTC</div>;
 * ```
 */
export function useVaultShares() {
  const { address } = useAccount();
  const vaultAddress = getContractAddress("vault");

  // Contract read for balance_of on vault
  const {
    data: sharesData,
    isLoading,
    error,
  } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultAbi,
    functionName: "balance_of",
    args: [address as `0x${string}`],
    watch: true,
    enabled: !!address && !APP_CONFIG.features.mockData,
  });

  return useQuery<number>({
    queryKey: ["vaultShares", address, vaultAddress, String(sharesData)],
    queryFn: async () => {
      if (!address) return 0;

      // Mock data for development
      if (APP_CONFIG.features.mockData) {
        return 0.0;
      }

      if (error) {
        throw error;
      }

      // Parse shares and convert from 8 decimals to human-readable
      // Note: Vault shares use same decimals as underlying asset (WBTC = 8)
      const shares = parseU256(sharesData);
      return Number(shares) / 1e8;
    },
    enabled: !!address && (APP_CONFIG.features.mockData || !isLoading),
    refetchInterval: APP_CONFIG.queryConfig.refetchInterval,
    staleTime: APP_CONFIG.queryConfig.staleTime,
  });
}
