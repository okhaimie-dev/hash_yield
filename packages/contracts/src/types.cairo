// =============================================================================
// Domain Types and Aliases
// =============================================================================
// Type aliases for domain concepts to improve code readability and type safety.
// Following Starknet-Staking style conventions.
// =============================================================================

use starknet::ContractAddress;

// -----------------------------------------------------------------------------
// Amount Types
// -----------------------------------------------------------------------------

/// Amount of underlying assets (WBTC)
pub type Assets = u256;

/// Amount of vault shares
pub type Shares = u256;

// -----------------------------------------------------------------------------
// Address Types
// -----------------------------------------------------------------------------

/// Strategy contract address (can be zero if no strategy set)
pub type StrategyAddress = ContractAddress;

/// Vault contract address
pub type VaultAddress = ContractAddress;

// -----------------------------------------------------------------------------
// Profit/Loss Types
// -----------------------------------------------------------------------------

/// Profit amount from harvest
pub type Profit = u256;

/// Loss amount from harvest
pub type Loss = u256;
