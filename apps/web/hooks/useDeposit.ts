import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { APP_CONFIG, getContractAddress } from "../constants/index";
import { vaultAbi, erc20Abi } from "../constants/abis";
import { Call } from "starknet";

/**
 * Deposit parameters
 */
export interface DepositParams {
  /** Amount in BTC to deposit (human-readable, e.g., "0.5") */
  amount: string;
}

/**
 * Hook to handle vault deposit transactions
 *
 * Handles the deposit flow including:
 * - ERC20 approval for vault to spend WBTC
 * - Vault deposit transaction
 * - Optimistic UI updates
 * - Cache invalidation on success
 * - Error handling
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```typescript
 * const deposit = useDeposit();
 *
 * const handleDeposit = () => {
 *   deposit.mutate({ amount: "0.5" }, {
 *     onSuccess: () => console.log("Deposit successful!"),
 *     onError: (error) => console.error("Deposit failed:", error),
 *   });
 * };
 *
 * return (
 *   <button
 *     onClick={handleDeposit}
 *     disabled={deposit.isPending}
 *   >
 *     {deposit.isPending ? "Depositing..." : "Deposit"}
 *   </button>
 * );
 * ```
 */
export function useDeposit() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const vaultAddress = getContractAddress("vault");
  const wbtcAddress = getContractAddress("wbtc");

  // Starknet transaction hook
  const { sendAsync } = useSendTransaction({});

  return useMutation({
    mutationFn: async ({ amount }: DepositParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Mock implementation for development
      if (APP_CONFIG.features.mockData) {
        console.log(`[MOCK] Depositing ${amount} BTC to vault ${vaultAddress}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return {
          transaction_hash: "0xmock_transaction_hash",
          amount,
        };
      }

      // Convert human-readable amount to wei (8 decimals for WBTC)
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e8));

      // Build multicall: approve + deposit
      const calls: Call[] = [
        // 1. Approve vault to spend WBTC
        {
          contractAddress: wbtcAddress,
          entrypoint: "approve",
          calldata: [
            vaultAddress, // spender
            amountWei.toString(), // amount low
            "0", // amount high (u256)
          ],
        },
        // 2. Deposit to vault
        {
          contractAddress: vaultAddress,
          entrypoint: "deposit",
          calldata: [
            amountWei.toString(), // assets low
            "0", // assets high (u256)
            address, // receiver
          ],
        },
      ];

      // Execute multicall transaction
      const result = await sendAsync(calls);

      console.log("Deposit transaction submitted:", result.transaction_hash);

      return {
        transaction_hash: result.transaction_hash,
        amount,
      };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["vaultStats"] });
      queryClient.invalidateQueries({ queryKey: ["walletBalance", address] });
      queryClient.invalidateQueries({ queryKey: ["vaultShares", address] });

      console.log("Deposit successful:", data);
    },
    onError: (error) => {
      console.error("Deposit failed:", error);
    },
  });
}
