#!/usr/bin/env bun
/**
 * Devnet Launcher Script
 *
 * Starts Starknet Devnet-RS for local development.
 * Supports both mock mode (fresh chain) and fork mode (forking mainnet).
 *
 * Usage:
 *   bun run devnet           # Start fresh devnet for local mock development
 *   bun run devnet --fork    # Start devnet forking mainnet
 *
 * Environment Variables:
 *   FORK_RPC_URL    - RPC URL to fork from (default: Cartridge mainnet)
 *   FORK_BLOCK      - Block number to fork from (default: latest)
 *   DEVNET_PORT     - Port to run devnet on (default: 5050)
 */

import { spawn, type Subprocess } from "bun";
import { parseArgs, waitForDevnet } from "./utils.js";
import { DEVNET_CONFIG, RPC_URLS } from "./config.js";
import path from "path";
import os from "os";

const args = parseArgs();
const isFork = args.fork === true;
const port = Number(args.port) || DEVNET_CONFIG.katana.port;

// Path to starknet-devnet binary
const DEVNET_BIN = path.join(os.homedir(), ".dojo", "bin", "starknet-devnet");

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   HashYield Local Devnet                       ║
╠═══════════════════════════════════════════════════════════════╣
║  Mode: ${isFork ? "Fork (mainnet state)".padEnd(48) : "Fresh (mock contracts)".padEnd(48)} ║
║  Port: ${String(port).padEnd(48)} ║
${isFork ? `║  Fork: Starknet Mainnet (latest)${" ".repeat(24)} ║` : ""}
╚═══════════════════════════════════════════════════════════════╝
`);

let devnetProcess: Subprocess;

const startDevnet = (): Subprocess => {
  console.log("Starting Starknet Devnet...\n");

  // Base devnet args
  const devnetArgs = [
    "--host", "0.0.0.0",
    "--port", String(port),
    "--seed", String(DEVNET_CONFIG.devnetRs.seed),
    "--accounts", String(DEVNET_CONFIG.katana.accounts),
    "--initial-balance", "1000000000000000000000", // 1000 ETH
  ];

  return spawn({
    cmd: [DEVNET_BIN, ...devnetArgs],
    stdout: "inherit",
    stderr: "inherit",
  });
};

const startDevnetFork = (): Subprocess => {
  console.log("Starting Starknet Devnet with mainnet fork...\n");

  const forkRpcUrl = process.env.FORK_RPC_URL || RPC_URLS.mainnet;
  const forkBlock = process.env.FORK_BLOCK || "latest";

  // Devnet args with fork configuration
  const devnetArgs = [
    "--host", "0.0.0.0",
    "--port", String(port),
    "--seed", String(DEVNET_CONFIG.devnetRs.seed),
    "--fork-network", forkRpcUrl,
  ];

  // Add block specification if not latest
  if (forkBlock !== "latest") {
    devnetArgs.push("--fork-block", forkBlock);
  }

  return spawn({
    cmd: [DEVNET_BIN, ...devnetArgs],
    stdout: "inherit",
    stderr: "inherit",
  });
};

// Handle graceful shutdown
const cleanup = () => {
  console.log("\n\nShutting down devnet...");
  if (devnetProcess) {
    devnetProcess.kill();
  }
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Start the appropriate devnet
try {
  devnetProcess = isFork ? startDevnetFork() : startDevnet();

  // Wait for devnet to be ready
  const rpcUrl = `http://127.0.0.1:${port}`;
  console.log(`Waiting for devnet at ${rpcUrl}...`);

  const ready = await waitForDevnet(rpcUrl, 60, 500);

  if (ready) {
    console.log(`\n✅ Devnet is ready at ${rpcUrl}\n`);

    if (!isFork) {
      console.log("Pre-funded accounts (--seed 0):");
      console.log("─".repeat(60));
      console.log("Use 'curl localhost:5050/predeployed_accounts' to see accounts");
      console.log("─".repeat(60));
    } else {
      console.log("Fork mode: Using mainnet state");
      console.log("─".repeat(60));
      console.log("WBTC and other mainnet contracts are available.");
      console.log("Deploy your Vault and Strategy to interact with them.");
      console.log("─".repeat(60));
    }

    console.log("\nPress Ctrl+C to stop the devnet.\n");

    // Keep running until killed
    await devnetProcess.exited;
  } else {
    console.error("\n❌ Devnet failed to start within timeout");
    cleanup();
  }
} catch (error) {
  console.error("Failed to start devnet:", error);
  process.exit(1);
}
