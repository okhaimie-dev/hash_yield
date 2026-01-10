import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSendTransaction } from "@starknet-react/core";
import { APP_CONFIG, getContractAddress } from "../constants/index";
import { vaultAbi } from "../constants/abis";
import { Call } from "starknet";

/**
 * Withdrawal parameters
 */
export interface WithdrawParams {
  /** Amount in BTC to withdraw (human-readable, e.g., "0.5") */
  amount: string;
}

/**
 * Hook to handle vault withdrawal transactions
 *
 * Handles the withdrawal flow including:
 * - Vault withdraw transaction
 * - Optimistic UI updates
 * - Cache invalidation on success
 * - Error handling
 *
 * @returns Mutation object with mutate function and state
 *
 * @example
 * ```typescript
 * const withdraw = useWithdraw();
 *
 * const handleWithdraw = () => {
 *   withdraw.mutate({ amount: "0.5" }, {
 *     onSuccess: () => console.log("Withdrawal successful!"),
 *     onError: (error) => console.error("Withdrawal failed:", error),
 *   });
 * };
 *
 * return (
 *   <button
 *     onClick={handleWithdraw}
 *     disabled={withdraw.isPending}
 *   >
 *     {withdraw.isPending ? "Withdrawing..." : "Withdraw"}
 *   </button>
 * );
 * ```
 */
export function useWithdraw() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const vaultAddress = getContractAddress("vault");

  // Starknet transaction hook
  const { sendAsync } = useSendTransaction({});

  return useMutation({
    mutationFn: async ({ amount }: WithdrawParams) => {
      if (!address) {
        throw new Error("Wallet not connected");
      }

      // Mock implementation for development
      if (APP_CONFIG.features.mockData) {
        console.log(`[MOCK] Withdrawing ${amount} BTC from vault ${vaultAddress}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return {
          transaction_hash: "0xmock_transaction_hash",
          amount,
        };
      }

      // Convert human-readable amount to wei (8 decimals for WBTC)
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e8));

      // Build withdraw call
      const calls: Call[] = [
        {
          contractAddress: vaultAddress,
          entrypoint: "withdraw",
          calldata: [
            amountWei.toString(), // assets low
            "0", // assets high (u256)
            address, // receiver
            address, // owner
          ],
        },
      ];

      // Execute transaction
      const result = await sendAsync(calls);

      console.log("Withdraw transaction submitted:", result.transaction_hash);

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

      console.log("Withdrawal successful:", data);
    },
    onError: (error) => {
      console.error("Withdrawal failed:", error);
    },
  });
}
