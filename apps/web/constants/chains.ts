import { sepolia, mainnet } from "@starknet-react/chains";

/**
 * Chain configuration for each environment
 * Provides RPC URLs, explorer URLs, and chain objects for Starknet React
 */
export const CHAIN_CONFIG = {
  local: {
    chain: sepolia, // Katana typically mimics Sepolia chain ID
    rpcUrl: "http://localhost:5050",
    explorer: "http://localhost:5050",
    name: "Local Katana",
  },
  sepolia: {
    chain: sepolia,
    rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    explorer: "https://sepolia.voyager.online",
    name: "Sepolia Testnet",
  },
  mainnet: {
    chain: mainnet,
    rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet",
    explorer: "https://voyager.online",
    name: "Starknet Mainnet",
  },
} as const;

export type Environment = keyof typeof CHAIN_CONFIG;
