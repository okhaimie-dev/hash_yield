#!/usr/bin/env bun
/**
 * Deploy Vault and Strategy Contracts
 *
 * Deploys the HashYield Vault and LendingStrategyV0 contracts.
 * Uses either mock contracts (local) or real mainnet contracts (fork).
 *
 * Usage:
 *   bun run deploy:vault
 *
 * Prerequisites:
 *   - Devnet running
 *   - For local mode: Mock contracts deployed (bun run deploy:mocks)
 *   - Contracts built (scarb build)
 */

import { Contract, byteArray, CallData } from "starknet";
import {
  createProvider,
  createDeployerAccount,
  declareAndDeploy,
  loadManifest,
  createOrUpdateManifest,
  waitForDevnet,
  loadContractArtifact,
} from "./utils.js";
import { CONTRACT_ARTIFACTS, CASM_ARTIFACTS, getCurrentConfig, MAINNET_ADDRESSES } from "./config.js";

const main = async () => {
  const config = getCurrentConfig();

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               Deploy Vault & Strategy                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Environment: ${config.environment.padEnd(44)} ║
║  RPC URL: ${config.rpcUrl.padEnd(48)} ║
║  Mode: ${config.isFork ? "Fork (using mainnet contracts)".padEnd(50) : "Local (using mock contracts)".padEnd(50)} ║
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

  // Determine underlying asset addresses based on mode
  let wbtcAddress: string;
  let vesuPoolAddress: string;

  if (config.isFork) {
    // Fork mode: use mainnet addresses
    wbtcAddress = MAINNET_ADDRESSES.wbtc;
    vesuPoolAddress = MAINNET_ADDRESSES.vesuWbtcVToken;

    if (vesuPoolAddress === "0x0") {
      console.error("❌ Vesu WBTC VToken address not configured for fork mode");
      console.error("   Update MAINNET_ADDRESSES.vesuWbtcVToken in config.ts");
      process.exit(1);
    }

    console.log("Using mainnet addresses:");
    console.log(`  WBTC:      ${wbtcAddress}`);
    console.log(`  Vesu Pool: ${vesuPoolAddress}\n`);
  } else {
    // Local mode: use mock addresses from manifest
    const manifest = loadManifest();
    if (!manifest?.contracts.mockWbtc || !manifest?.contracts.mockVesuPool) {
      console.error("❌ Mock contracts not found. Deploy them first:");
      console.error("   bun run deploy:mocks");
      process.exit(1);
    }

    wbtcAddress = manifest.contracts.mockWbtc;
    vesuPoolAddress = manifest.contracts.mockVesuPool;

    console.log("Using mock addresses:");
    console.log(`  MockWBTC:     ${wbtcAddress}`);
    console.log(`  MockVesuPool: ${vesuPoolAddress}\n`);
  }

  const deployedContracts: Record<string, string> = {};
  const deployedClassHashes: Record<string, string> = {};

  // =========================================================================
  // 1. Deploy Vault (first, since Strategy needs vault address)
  // =========================================================================
  console.log("1. Deploying Vault...");

  try {
    // Vault constructor: (asset_address, name: ByteArray, symbol: ByteArray, owner)
    // ByteArray in Cairo requires special encoding using byteArray.byteArrayFromString()
    const nameByteArray = byteArray.byteArrayFromString("HashYield BTC");
    const symbolByteArray = byteArray.byteArrayFromString("hyBTC");

    const { classHash, address } = await declareAndDeploy(
      deployer,
      CONTRACT_ARTIFACTS.vault,
      CASM_ARTIFACTS.vault,
      [
        wbtcAddress,       // asset_address
        nameByteArray,     // name (ByteArray)
        symbolByteArray,   // symbol (ByteArray)
        deployer.address,  // owner
      ]
    );
    deployedContracts.vault = address;
    deployedClassHashes.vault = classHash;
    console.log(`   ✅ Vault deployed at ${address}\n`);
  } catch (error) {
    console.error("   ❌ Failed to deploy Vault:", error);
    throw error;
  }

  // =========================================================================
  // 2. Deploy LendingStrategyV0
  // =========================================================================
  console.log("2. Deploying LendingStrategyV0...");

  try {
    // LendingStrategyV0 constructor: (asset, v_token, vault, owner)
    const { classHash, address } = await declareAndDeploy(
      deployer,
      CONTRACT_ARTIFACTS.lendingStrategy,
      CASM_ARTIFACTS.lendingStrategy,
      [
        wbtcAddress,              // asset_address
        vesuPoolAddress,          // v_token_address (Vesu VToken)
        deployedContracts.vault,  // vault_address
        deployer.address,         // owner_address
      ]
    );
    deployedContracts.strategy = address;
    deployedClassHashes.strategy = classHash;
    console.log(`   ✅ LendingStrategyV0 deployed at ${address}\n`);
  } catch (error) {
    console.error("   ❌ Failed to deploy LendingStrategyV0:", error);
    throw error;
  }

  // =========================================================================
  // 3. Configure Vault with Strategy
  // =========================================================================
  console.log("3. Configuring Vault with Strategy...");

  try {
    // Load vault ABI for contract interaction
    // starknet.js v9 uses options object for Contract constructor
    const vaultArtifact = loadContractArtifact(CONTRACT_ARTIFACTS.vault);
    const vaultContract = new Contract({
      abi: vaultArtifact.abi,
      address: deployedContracts.vault,
      provider: deployer,
    });

    // Set the strategy on the vault
    const setStrategyCall = vaultContract.populate("set_strategy", [
      deployedContracts.strategy,
    ]);

    const { transaction_hash } = await deployer.execute([setStrategyCall]);
    await deployer.waitForTransaction(transaction_hash);

    console.log(`   ✅ Strategy configured on Vault\n`);
  } catch (error) {
    console.error("   ❌ Failed to configure strategy:", error);
    throw error; // Make this fatal - strategy config is required
  }

  // =========================================================================
  // 4. Save deployment manifest
  // =========================================================================
  console.log("4. Saving deployment manifest...");

  const manifest = createOrUpdateManifest(
    {
      vault: deployedContracts.vault,
      strategy: deployedContracts.strategy,
      wbtc: wbtcAddress,
      vesuPool: vesuPoolAddress,
    },
    {
      vault: deployedClassHashes.vault,
      strategy: deployedClassHashes.strategy,
    }
  );

  // =========================================================================
  // Summary
  // =========================================================================
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               Vault & Strategy Deployed                        ║
╠═══════════════════════════════════════════════════════════════╣
║  Vault:    ${deployedContracts.vault?.slice(0, 46).padEnd(46)} ║
║  Strategy: ${deployedContracts.strategy?.slice(0, 46).padEnd(46)} ║
║  WBTC:     ${wbtcAddress.slice(0, 46).padEnd(46)} ║
╚═══════════════════════════════════════════════════════════════╝

Next steps:
  1. Start the web app: cd apps/web && bun run dev:local
  2. Mint test WBTC: bun run faucet --amount 1000000000
  3. Connect wallet and deposit!
`);
};

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
