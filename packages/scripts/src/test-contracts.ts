#!/usr/bin/env bun
/**
 * Quick test script to verify contract deployments and reads work
 */

import { RpcProvider, Contract } from "starknet";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = "http://127.0.0.1:5050";
const MANIFEST_PATH = path.join(__dirname, "../../contracts/deployments/local.json");
const ARTIFACTS_PATH = path.join(__dirname, "../../contracts/target/dev");

async function main() {
  console.log("\n🧪 Testing Contract Deployments...\n");

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
  console.log("📋 Loaded manifest from:", MANIFEST_PATH);
  console.log("   Environment:", manifest.environment);
  console.log("   Timestamp:", manifest.timestamp);

  // Create provider
  const provider = new RpcProvider({ nodeUrl: RPC_URL });

  // Test 1: Check chain ID
  const chainId = await provider.getChainId();
  console.log("\n✅ Connected to chain:", chainId);

  // Test 2: Load Vault ABI and create contract instance
  const vaultSierra = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_PATH, "hash_yield_Vault.contract_class.json"), "utf-8")
  );
  // starknet.js v9 uses options object for Contract constructor
  const vaultContract = new Contract({
    abi: vaultSierra.abi,
    address: manifest.contracts.vault,
    provider: provider,
  });

  console.log("\n📦 Vault Contract");
  console.log("   Address:", manifest.contracts.vault);

  // Test 3: Read vault data
  try {
    const totalAssets = await vaultContract.call("total_assets");
    console.log("   total_assets():", totalAssets.toString());

    const totalSupply = await vaultContract.call("total_supply");
    console.log("   total_supply():", totalSupply.toString());

    const name = await vaultContract.call("name");
    console.log("   name():", name);

    const symbol = await vaultContract.call("symbol");
    console.log("   symbol():", symbol);

    const decimals = await vaultContract.call("decimals");
    console.log("   decimals():", decimals.toString());
  } catch (error: any) {
    console.error("   ❌ Error reading vault:", error.message);
  }

  // Test 4: Load MockWBTC and test
  const wbtcSierra = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_PATH, "hash_yield_MockWBTC.contract_class.json"), "utf-8")
  );
  const wbtcContract = new Contract({
    abi: wbtcSierra.abi,
    address: manifest.contracts.wbtc,
    provider: provider,
  });

  console.log("\n📦 MockWBTC Contract");
  console.log("   Address:", manifest.contracts.wbtc);

  try {
    const name = await wbtcContract.call("name");
    console.log("   name():", name);

    const symbol = await wbtcContract.call("symbol");
    console.log("   symbol():", symbol);

    const totalSupply = await wbtcContract.call("total_supply");
    console.log("   total_supply():", totalSupply.toString());
  } catch (error: any) {
    console.error("   ❌ Error reading WBTC:", error.message);
  }

  // Test 5: Strategy contract
  const strategySierra = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_PATH, "hash_yield_LendingStrategyV0.contract_class.json"), "utf-8")
  );
  const strategyContract = new Contract({
    abi: strategySierra.abi,
    address: manifest.contracts.strategy,
    provider: provider,
  });

  console.log("\n📦 LendingStrategyV0 Contract");
  console.log("   Address:", manifest.contracts.strategy);

  try {
    const vault = await strategyContract.call("vault");
    console.log("   vault():", vault);

    const asset = await strategyContract.call("asset");
    console.log("   asset():", asset);

    const totalAssets = await strategyContract.call("total_assets");
    console.log("   total_assets():", totalAssets.toString());
  } catch (error: any) {
    console.error("   ❌ Error reading strategy:", error.message);
  }

  console.log("\n✅ All contract reads completed!\n");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
