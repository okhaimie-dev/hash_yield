/**
 * Custom hooks for StackBTC vault interactions
 * 
 * This module exports all custom hooks for:
 * - Fetching vault statistics and data
 * - Managing user balances
 * - Handling deposit and withdrawal transactions
 * 
 * All hooks use Tanstack Query for data fetching, caching, and state management.
 */

export { useVaultStats } from "./useVaultStats";
export type { VaultStats } from "./useVaultStats";

export { useWalletBalance, useVaultShares } from "./useUserBalance";

export { useDeposit } from "./useDeposit";
export type { DepositParams } from "./useDeposit";

export { useWithdraw } from "./useWithdraw";
export type { WithdrawParams } from "./useWithdraw";
