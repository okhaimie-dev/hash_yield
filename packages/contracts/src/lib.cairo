// =============================================================================
// Hash Yield - Starknet ERC-4626 BTC Vault
// =============================================================================
// A yield-generating vault for WBTC on Starknet with pluggable strategies.
//
// Architecture:
// - Vault: ERC-4626 compliant vault accepting WBTC deposits
// - Strategy: Pluggable yield strategies (IStrategy interface)
// - LendingStrategyV0: Initial strategy using Vesu V2 lending
// =============================================================================

// -----------------------------------------------------------------------------
// Core Contract Modules
// -----------------------------------------------------------------------------
pub mod vault;
pub mod strategies {
    pub mod lending_strategy_v0;
}

// -----------------------------------------------------------------------------
// Interface/Trait Definitions
// -----------------------------------------------------------------------------
pub mod interfaces {
    pub mod erc20;
    pub mod erc4626;
    pub mod strategy;
    pub mod vault;
    pub mod vesu_vtoken;
}

// -----------------------------------------------------------------------------
// Error Definitions
// -----------------------------------------------------------------------------
pub mod errors;

// -----------------------------------------------------------------------------
// Event Definitions
// -----------------------------------------------------------------------------
pub mod events;

// -----------------------------------------------------------------------------
// Mock Contracts (for local development/devnet deployment)
// -----------------------------------------------------------------------------
pub mod mocks;

// -----------------------------------------------------------------------------
// Co-located Tests (compile only in test mode)
// -----------------------------------------------------------------------------
#[cfg(test)]
pub(crate) mod tests;

// -----------------------------------------------------------------------------
// Custom Types and Domain Aliases
// -----------------------------------------------------------------------------
pub mod types;
