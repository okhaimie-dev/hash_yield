/**
 * HashYield Deployment Scripts
 *
 * This package provides deployment and development utilities for the HashYield protocol.
 *
 * Scripts:
 *   - devnet:        Start local Katana or Devnet-RS (with fork)
 *   - deploy:mocks:  Deploy MockWBTC and MockVesuPool
 *   - deploy:vault:  Deploy Vault and LendingStrategyV0
 *   - deploy:all:    Deploy everything (mocks + vault)
 *   - faucet:        Mint test tokens
 *   - sync-addresses: Sync deployed addresses to web app
 *   - check-devnet:  Check if devnet is running
 *
 * Configuration:
 *   Set DEPLOY_ENV to control target environment:
 *   - local: Katana with mock contracts
 *   - fork:  Devnet-RS forking mainnet
 *   - sepolia: Starknet Sepolia testnet
 *   - mainnet: Starknet mainnet (use with caution!)
 *
 * @module @hash_yield/scripts
 */

export * from "./config.js";
export * from "./utils.js";
