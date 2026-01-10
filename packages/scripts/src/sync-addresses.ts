#!/usr/bin/env bun
/**
 * Sync Addresses Script
 *
 * Reads the deployment manifest and updates the web app's
 * constants/addresses.ts file with the deployed contract addresses.
 *
 * This enables the web app to automatically use the correct addresses
 * after a local deployment without manual configuration.
 *
 * Usage:
 *   bun run sync-addresses
 *
 * The script reads from: packages/contracts/deployments/local.json
 * And updates:           apps/web/constants/addresses.ts
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadManifest } from "./utils.js";
import { getCurrentConfig } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_ADDRESSES_PATH = path.resolve(
  __dirname,
  "../../../apps/web/constants/addresses.ts"
);

const main = async () => {
  const config = getCurrentConfig();

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               Sync Deployed Addresses                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Environment: ${config.environment.padEnd(44)} ║
║  Target:      apps/web/constants/addresses.ts${" ".repeat(14)} ║
╚═══════════════════════════════════════════════════════════════╝
`);

  // Load the deployment manifest
  const manifest = loadManifest();
  if (!manifest) {
    console.error(`❌ No deployment manifest found for environment: ${config.environment}`);
    console.error("   Deploy contracts first: bun run deploy:all");
    process.exit(1);
  }

  console.log("Loaded deployment manifest:");
  console.log(`  Vault:     ${manifest.contracts.vault || "not deployed"}`);
  console.log(`  Strategy:  ${manifest.contracts.strategy || "not deployed"}`);
  console.log(`  WBTC:      ${manifest.contracts.wbtc || "not deployed"}`);
  console.log(`  Vesu Pool: ${manifest.contracts.vesuPool || "not deployed"}`);
  console.log("");

  // Read current addresses.ts
  if (!fs.existsSync(WEB_ADDRESSES_PATH)) {
    console.error(`❌ Web addresses file not found: ${WEB_ADDRESSES_PATH}`);
    process.exit(1);
  }

  let addressesContent = fs.readFileSync(WEB_ADDRESSES_PATH, "utf-8");

  // Determine which environment to update
  const envKey = config.environment === "fork" ? "local" : config.environment;

  // Update the addresses for the current environment
  const updates: Record<string, string> = {};

  if (manifest.contracts.vault) {
    updates.vault = manifest.contracts.vault;
  }
  if (manifest.contracts.wbtc) {
    updates.wbtc = manifest.contracts.wbtc;
  }
  if (manifest.contracts.vesuPool) {
    updates.vesu = manifest.contracts.vesuPool;
  }

  // Use regex to update each address in the specific environment block
  for (const [key, value] of Object.entries(updates)) {
    // Match pattern: key: "0x..." within the environment block
    // This is a simplified approach - for complex cases, consider AST parsing
    const regex = new RegExp(
      `(${envKey}:\\s*\\{[^}]*${key}:\\s*)"0x[a-fA-F0-9]+"`,
      "s"
    );

    if (regex.test(addressesContent)) {
      addressesContent = addressesContent.replace(regex, `$1"${value}"`);
      console.log(`Updated ${envKey}.${key} = ${value.slice(0, 20)}...`);
    } else {
      console.log(`⚠️ Could not find ${envKey}.${key} in addresses.ts`);
    }
  }

  // Write updated content
  fs.writeFileSync(WEB_ADDRESSES_PATH, addressesContent);

  console.log(`
✅ Addresses synced successfully!

   The web app will now use the deployed contract addresses.
   Restart the dev server if it's running: bun run dev:local
`);
};

main().catch((error) => {
  console.error("Sync failed:", error);
  process.exit(1);
});
