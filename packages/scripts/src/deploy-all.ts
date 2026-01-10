#!/usr/bin/env bun
/**
 * Deploy All Contracts
 *
 * Convenience script that deploys both mocks and vault/strategy.
 * For local development, this is the one-stop deployment command.
 *
 * Usage:
 *   bun run deploy:all
 *
 * Prerequisites:
 *   - Devnet running (bun run devnet)
 *   - Contracts built (scarb build)
 */

import { getCurrentConfig } from "./config.js";

const main = async () => {
  const config = getCurrentConfig();

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               Deploy All Contracts                             ║
╠═══════════════════════════════════════════════════════════════╣
║  Environment: ${config.environment.padEnd(44)} ║
║  Mode: ${config.isFork ? "Fork (skip mocks, use mainnet contracts)".padEnd(50) : "Local (deploy mocks + vault)".padEnd(50)} ║
╚═══════════════════════════════════════════════════════════════╝
`);

  if (!config.isFork) {
    // Local mode: deploy mocks first
    console.log("Step 1: Deploying mock contracts...\n");
    const deployMocks = await import("./deploy-mocks.js");
    // deploy-mocks.ts runs main() on import, but we want to control execution
  }

  // Deploy vault and strategy
  console.log("\nStep 2: Deploying Vault and Strategy...\n");
  // Import triggers the deployment
  await import("./deploy-vault.js");
};

// Run both deployments sequentially
const runSequentialDeployment = async () => {
  const config = getCurrentConfig();

  if (!config.isFork) {
    // For local mode, spawn deploy-mocks then deploy-vault
    const { spawn } = await import("bun");

    console.log("═".repeat(60));
    console.log(" STEP 1: Deploy Mock Contracts");
    console.log("═".repeat(60) + "\n");

    const mocksProc = spawn({
      cmd: ["bun", "run", "src/deploy-mocks.ts"],
      cwd: import.meta.dir.replace("/src", ""),
      stdout: "inherit",
      stderr: "inherit",
      env: { ...process.env },
    });

    const mocksExitCode = await mocksProc.exited;
    if (mocksExitCode !== 0) {
      console.error("❌ Mock deployment failed");
      process.exit(1);
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(" STEP 2: Deploy Vault & Strategy");
  console.log("═".repeat(60) + "\n");

  const { spawn } = await import("bun");
  const vaultProc = spawn({
    cmd: ["bun", "run", "src/deploy-vault.ts"],
    cwd: import.meta.dir.replace("/src", ""),
    stdout: "inherit",
    stderr: "inherit",
    env: { ...process.env },
  });

  const vaultExitCode = await vaultProc.exited;
  if (vaultExitCode !== 0) {
    console.error("❌ Vault deployment failed");
    process.exit(1);
  }

  console.log("\n" + "═".repeat(60));
  console.log(" ✅ ALL CONTRACTS DEPLOYED SUCCESSFULLY");
  console.log("═".repeat(60) + "\n");
};

runSequentialDeployment().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
