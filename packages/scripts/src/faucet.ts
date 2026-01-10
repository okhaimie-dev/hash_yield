#!/usr/bin/env bun
/**
 * Faucet Script - Mint Test Tokens
 *
 * Mints MockWBTC tokens to a specified address for testing.
 * Only works in local mode with mock contracts.
 *
 * Usage:
 *   bun run faucet                              # Mint to deployer (default 10 WBTC)
 *   bun run faucet --to <address>               # Mint to specific address
 *   bun run faucet --amount 100000000000        # Mint 1000 WBTC (8 decimals)
 *   bun run faucet --to <address> --amount 500  # Combined
 *
 * The amount is in the smallest unit (satoshis for WBTC with 8 decimals).
 * Examples:
 *   1 WBTC     = 100000000      (10^8)
 *   10 WBTC    = 1000000000     (10^9)
 *   100 WBTC   = 10000000000    (10^10)
 *   1000 WBTC  = 100000000000   (10^11)
 */

import { Contract, uint256 } from "starknet";
import {
  createProvider,
  createDeployerAccount,
  loadManifest,
  loadContractArtifact,
  parseArgs,
  waitForDevnet,
} from "./utils.js";
import { CONTRACT_ARTIFACTS, getCurrentConfig, KATANA_ACCOUNTS } from "./config.js";

const main = async () => {
  const config = getCurrentConfig();
  const args = parseArgs();

  // Default amount: 10 WBTC (8 decimals)
  const amount = args.amount ? BigInt(args.amount as string) : BigInt(1000000000);

  // Default recipient: deployer address
  const recipient = (args.to as string) || KATANA_ACCOUNTS.deployer.address;

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                     Token Faucet                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Recipient: ${recipient.slice(0, 42).padEnd(42)}... ║
║  Amount:    ${amount.toString().padEnd(44)} ║
║  Token:     MockWBTC (8 decimals)${" ".repeat(25)} ║
╚═══════════════════════════════════════════════════════════════╝
`);

  if (config.isFork) {
    console.error("❌ Faucet is only available in local mode with mock contracts.");
    console.error("   In fork mode, use a mainnet WBTC holder or bridge tokens.");
    process.exit(1);
  }

  // Verify devnet is running
  const ready = await waitForDevnet(config.rpcUrl, 5, 500);
  if (!ready) {
    console.error("❌ Devnet is not running. Start it first with: bun run devnet");
    process.exit(1);
  }

  // Load manifest to get MockWBTC address
  const manifest = loadManifest();
  if (!manifest?.contracts.mockWbtc) {
    console.error("❌ MockWBTC not deployed. Deploy mocks first:");
    console.error("   bun run deploy:mocks");
    process.exit(1);
  }

  const provider = createProvider();
  const deployer = createDeployerAccount(provider);

  console.log(`Minting ${amount} units to ${recipient}...\n`);

  try {
    // Load MockWBTC artifact for ABI
    const mockWbtcArtifact = loadContractArtifact(CONTRACT_ARTIFACTS.mockWbtc);
    const mockWbtc = new Contract(
      mockWbtcArtifact.abi,
      manifest.contracts.mockWbtc,
      deployer
    );

    // Check current balance before mint
    let balanceBefore: bigint;
    try {
      const balance = await mockWbtc.balance_of(recipient);
      balanceBefore = BigInt(balance.toString());
      console.log(`Balance before: ${balanceBefore} units`);
    } catch {
      balanceBefore = BigInt(0);
      console.log(`Balance before: 0 units (new account)`);
    }

    // Mint tokens
    // MockWBTC should have a mint function for testing
    const mintCall = mockWbtc.populate("mint", [
      recipient,
      uint256.bnToUint256(amount),
    ]);

    const { transaction_hash } = await deployer.execute([mintCall]);
    await deployer.waitForTransaction(transaction_hash);

    // Check balance after mint
    const balanceAfterResult = await mockWbtc.balance_of(recipient);
    const balanceAfter = BigInt(balanceAfterResult.toString());

    const wbtcAmount = Number(amount) / 10 ** 8;
    const balanceWbtc = Number(balanceAfter) / 10 ** 8;

    console.log(`
✅ Tokens minted successfully!

   Transaction: ${transaction_hash}
   Amount:      ${amount} units (${wbtcAmount.toFixed(8)} WBTC)
   New Balance: ${balanceAfter} units (${balanceWbtc.toFixed(8)} WBTC)
`);
  } catch (error: any) {
    // If mint function doesn't exist, try alternative approaches
    if (error.message?.includes("Entry point") || error.message?.includes("not found")) {
      console.error("❌ MockWBTC does not have a mint function.");
      console.error("   The mock contract may need to be updated to include:");
      console.error("   fn mint(ref self: ContractState, to: ContractAddress, amount: u256)");
      process.exit(1);
    }
    throw error;
  }
};

main().catch((error) => {
  console.error("Faucet failed:", error);
  process.exit(1);
});
