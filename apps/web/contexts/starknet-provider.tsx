"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  ready,
  braavos,
  voyager,
  jsonRpcProvider,
} from "@starknet-react/core";

import { ControllerConnector } from "@cartridge/connector";
import { constants } from "starknet";
import { APP_CONFIG } from "../constants/index";

// Create QueryClient with environment-specific configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.queryConfig.staleTime,
      gcTime: APP_CONFIG.queryConfig.gcTime,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

// Configure RPC provider based on environment
const provider = jsonRpcProvider({
  rpc: (chain) => {
    switch (chain.id) {
      case mainnet.id:
        return { nodeUrl: APP_CONFIG.environment === "mainnet" 
          ? APP_CONFIG.chain.rpcUrl 
          : "https://api.cartridge.gg/x/starknet/mainnet" };
      case sepolia.id:
        return { nodeUrl: APP_CONFIG.environment === "sepolia" || APP_CONFIG.environment === "local"
          ? APP_CONFIG.chain.rpcUrl 
          : "https://api.cartridge.gg/x/starknet/sepolia" };
      default:
        return { nodeUrl: APP_CONFIG.chain.rpcUrl };
    }
  },
});

// Configure Cartridge connector with environment-aware chain ID
const getDefaultChainId = () => {
  if (APP_CONFIG.environment === "mainnet") {
    return constants.StarknetChainId.SN_MAIN;
  }
  return constants.StarknetChainId.SN_SEPOLIA;
};

const cartridgeConnector = new ControllerConnector({
  chains: [
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/sepolia",
    },
    {
      rpcUrl: "https://api.cartridge.gg/x/starknet/mainnet",
    },
  ],
  defaultChainId: getDefaultChainId(),
});

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[mainnet, sepolia]}
        provider={provider}
        connectors={[cartridgeConnector, ready(), braavos()]}
        explorer={voyager}
      >
        {children}
      </StarknetConfig>
      {APP_CONFIG.features.devTools && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
