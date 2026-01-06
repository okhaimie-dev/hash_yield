"use client";
import React from "react";

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

const MAINNET_RPC_URL = "https://api.cartridge.gg/x/starknet/mainnet";
const SEPOLIA_RPC_URL = "https://api.cartridge.gg/x/starknet/sepolia";

const provider = jsonRpcProvider({
  rpc: (chain) => {
    switch (chain.id) {
      case mainnet.id:
        return { nodeUrl: MAINNET_RPC_URL };
      case sepolia.id:
        return { nodeUrl: SEPOLIA_RPC_URL };
      default:
        return { nodeUrl: SEPOLIA_RPC_URL };
    }
  },
});

const cartridgeConnector = new ControllerConnector({
  chains: [
    {
      rpcUrl: SEPOLIA_RPC_URL,
    },
    {
      rpcUrl: MAINNET_RPC_URL,
    },
  ],
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
});

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig
      chains={[mainnet, sepolia]}
      provider={provider}
      connectors={[cartridgeConnector, ready(), braavos()]}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
}
