#!/usr/bin/env bun
/**
 * Deploy Mock Contracts
 *
 * Deploys MockWBTC, MockVesuPool for local development.
 * These mocks simulate the behavior of mainnet contracts.
 *
 * Usage:
 *   bun run deploy:mocks
 *
 * Prerequisites:
 *   - Devnet running (bun run devnet)
 *   - Contracts built with test artifacts (scarb build)
 */

import {
  createProvider,
  createDeployerAccount,
  declareAndDeploy,
  createOrUpdateManifest,
  waitForDevnet,
} from "./utils.js";
import { CONTRACT_ARTIFACTS, CASM_ARTIFACTS, getCurrentConfig } from "./config.js";

const main = async () => {
  const config = getCurrentConfig();

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               Deploy Mock Contracts                            ║
╠═══════════════════════════════════════════════════════════════╣
║  Environment: ${config.environment.padEnd(44)} ║
║  RPC URL: ${config.rpcUrl.padEnd(48)} ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Verify devnet is running
  const ready = await waitForDevnet(config.rpcUrl, 5, 500);
  if (!ready) {
    console.error("❌ Devnet is not running. Start it first with: bun run devnet");
    process.exit(1);
  }

  const provider = createProvider();
  const deployer = createDeployerAccount(provider);

  console.log(`Deployer address: ${deployer.address}\n`);

  const deployedContracts: Record<string, string> = {};
  const deployedClassHashes: Record<string, string> = {};

  // =========================================================================
  // 1. Deploy MockWBTC (ERC20 with mint function)
  // =========================================================================
  console.log("1. Deploying MockWBTC...");

  try {
    // MockWBTC has no constructor arguments (name/symbol hardcoded)
    const { classHash, address } = await declareAndDeploy(
      deployer,
      CONTRACT_ARTIFACTS.mockWbtc,
      CASM_ARTIFACTS.mockWbtc,
      [] // Empty constructor
    );
    deployedContracts.mockWbtc = address;
    deployedClassHashes.mockWbtc = classHash;
    console.log(`   ✅ MockWBTC deployed at ${address}\n`);
  } catch (error) {
    console.error("   ❌ Failed to deploy MockWBTC:", error);
    throw error;
  }

  // =========================================================================
  // 2. Deploy MockVesuPool (ERC4626-like vault)
  // =========================================================================
  console.log("2. Deploying MockVesuPool...");

  try {
    // MockVesuPool constructor: (asset_address: ContractAddress)
    const { classHash, address } = await declareAndDeploy(
      deployer,
      CONTRACT_ARTIFACTS.mockVesuPool,
      CASM_ARTIFACTS.mockVesuPool,
      [deployedContracts.mockWbtc] // underlying asset (WBTC)
    );
    deployedContracts.mockVesuPool = address;
    deployedClassHashes.mockVesuPool = classHash;
    console.log(`   ✅ MockVesuPool deployed at ${address}\n`);
  } catch (error) {
    console.error("   ❌ Failed to deploy MockVesuPool:", error);
    throw error;
  }

  // =========================================================================
  // 3. Save deployment manifest
  // =========================================================================
  console.log("3. Saving deployment manifest...");

  const manifest = createOrUpdateManifest(
    {
      mockWbtc: deployedContracts.mockWbtc,
      mockVesuPool: deployedContracts.mockVesuPool,
      wbtc: deployedContracts.mockWbtc, // Alias for web app compatibility
      vesuPool: deployedContracts.mockVesuPool,
    },
    {
      mockWbtc: deployedClassHashes.mockWbtc,
      mockVesuPool: deployedClassHashes.mockVesuPool,
    }
  );

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               Mock Contracts Deployed                          ║
╠═══════════════════════════════════════════════════════════════╣
║  MockWBTC:     ${deployedContracts.mockWbtc?.slice(0, 42).padEnd(42)} ║
║  MockVesuPool: ${deployedContracts.mockVesuPool?.slice(0, 42).padEnd(42)} ║
╚═══════════════════════════════════════════════════════════════╝

Next steps:
  1. Deploy Vault and Strategy: bun run deploy:vault
  2. Mint test tokens: bun run faucet --to <address> --amount <amount>
`);
};

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
