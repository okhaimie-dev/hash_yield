/**
 * Configuration for deployment scripts
 *
 * This module provides environment-aware configuration for:
 * - RPC endpoints (Katana, Devnet-RS, Sepolia, Mainnet)
 * - Contract class hashes and paths
 * - Account configuration for deployments
 */

import { constants } from "starknet";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment detection
export type DeployEnvironment = "local" | "fork" | "sepolia" | "mainnet";

export const getEnvironment = (): DeployEnvironment => {
  const env = process.env.DEPLOY_ENV as DeployEnvironment | undefined;
  if (env && ["local", "fork", "sepolia", "mainnet"].includes(env)) {
    return env;
  }
  return "local";
};

// RPC Configuration
export const RPC_URLS: Record<DeployEnvironment, string> = {
  local: process.env.LOCAL_RPC_URL || "http://127.0.0.1:5050",
  fork: process.env.FORK_RPC_URL || "http://127.0.0.1:5050",
  sepolia: process.env.SEPOLIA_RPC_URL || "https://api.cartridge.gg/x/starknet/sepolia",
  mainnet: process.env.MAINNET_RPC_URL || "https://api.cartridge.gg/x/starknet/mainnet",
};

// Chain IDs
export const CHAIN_IDS: Record<DeployEnvironment, string> = {
  local: constants.StarknetChainId.SN_SEPOLIA, // Katana uses Sepolia chain ID
  fork: constants.StarknetChainId.SN_MAIN,     // Fork uses mainnet chain ID
  sepolia: constants.StarknetChainId.SN_SEPOLIA,
  mainnet: constants.StarknetChainId.SN_MAIN,
};

// Contract artifacts paths
export const CONTRACTS_PATH = path.resolve(__dirname, "../../contracts");
export const ARTIFACTS_PATH = path.join(CONTRACTS_PATH, "target/dev");

// Contract artifact file names (Sierra)
export const CONTRACT_ARTIFACTS = {
  vault: "hash_yield_Vault.contract_class.json",
  lendingStrategy: "hash_yield_LendingStrategyV0.contract_class.json",
  // Deployable mock artifacts
  mockWbtc: "hash_yield_MockWBTC.contract_class.json",
  mockVesuPool: "hash_yield_MockVesuPool.contract_class.json",
  mockStrategy: "hash_yield_MockStrategy.contract_class.json",
} as const;

// CASM artifact file names (compiled contract class)
export const CASM_ARTIFACTS = {
  vault: "hash_yield_Vault.compiled_contract_class.json",
  lendingStrategy: "hash_yield_LendingStrategyV0.compiled_contract_class.json",
  mockWbtc: "hash_yield_MockWBTC.compiled_contract_class.json",
  mockVesuPool: "hash_yield_MockVesuPool.compiled_contract_class.json",
  mockStrategy: "hash_yield_MockStrategy.compiled_contract_class.json",
} as const;

// Starknet Devnet pre-funded accounts (deterministic with --seed 0)
export const DEVNET_ACCOUNTS = {
  deployer: {
    address: "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
    privateKey: "0x71d7bb07b9a64f6f78ac4c816aff4da9",
  },
  user1: {
    address: "0x078662e7352d062084b0010068b99288486c2d8b914f6e2a55ce945f8792c8b1",
    privateKey: "0x0e1406455b7d66b1690803be066cbe5e",
  },
  user2: {
    address: "0x049dfb8ce986e21d354ac93ea65e6a11f639c1934ea253e5ff14ca62eca0f38e",
    privateKey: "0xa20a02f0ac53692d144b20cb371a60d7",
  },
};

// Alias for backwards compatibility
export const KATANA_ACCOUNTS = DEVNET_ACCOUNTS;

// Mainnet addresses (for fork mode)
export const MAINNET_ADDRESSES = {
  wbtc: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
  vesuWbtcVToken: "0x0", // TODO: Add actual Vesu WBTC VToken address when available
  ekuboRouter: "0x0",    // TODO: Add actual Ekubo router address
};

// Address manifest file location
export const ADDRESS_MANIFEST_PATH = path.join(CONTRACTS_PATH, "deployments");

// Devnet configuration
export const DEVNET_CONFIG = {
  katana: {
    port: 5050,
    seed: 0,
    accounts: 3,
    blockTime: undefined, // Instant mining
  },
  devnetRs: {
    port: 5050,
    seed: 0,
    forkNetwork: "mainnet",
    forkBlockTag: "latest",
  },
};

// Export current config based on environment
export const getCurrentConfig = () => {
  const env = getEnvironment();
  return {
    environment: env,
    rpcUrl: RPC_URLS[env],
    chainId: CHAIN_IDS[env],
    isFork: env === "fork",
    isLocal: env === "local" || env === "fork",
  };
};
