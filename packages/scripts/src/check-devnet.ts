#!/usr/bin/env bun
/**
 * Check if devnet is running and ready
 *
 * Usage:
 *   bun run check-devnet
 *
 * Returns exit code 0 if devnet is ready, 1 if not
 */

import { waitForDevnet } from "./utils.js";
import { getCurrentConfig } from "./config.js";

const config = getCurrentConfig();
console.log(`Checking devnet at ${config.rpcUrl}...`);

const ready = await waitForDevnet(config.rpcUrl, 5, 500);

if (ready) {
  console.log("✅ Devnet is ready");
  process.exit(0);
} else {
  console.error("❌ Devnet is not running");
  console.error(`\nStart it with: bun run devnet${config.isFork ? " --fork" : ""}`);
  process.exit(1);
}
