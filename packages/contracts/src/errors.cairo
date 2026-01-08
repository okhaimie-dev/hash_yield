// =============================================================================
// Error Definitions
// =============================================================================
// Structured error enums for the Hash Yield vault system.
// =============================================================================

// -----------------------------------------------------------------------------
// Vault Errors
// -----------------------------------------------------------------------------

#[derive(Drop, Copy, PartialEq)]
pub enum VaultError {
    /// Deposit amount is zero
    ZeroDeposit,
    /// Withdraw amount is zero
    ZeroWithdraw,
    /// Mint amount is zero
    ZeroMint,
    /// Redeem amount is zero
    ZeroRedeem,
    /// Insufficient shares for withdrawal
    InsufficientShares,
    /// Insufficient allowance for third-party operations
    InsufficientAllowance,
    /// Vault is paused
    Paused,
    /// Caller is not authorized
    Unauthorized,
    /// Strategy asset mismatch
    StrategyAssetMismatch,
    /// Invalid receiver address
    InvalidReceiver,
    /// Exceeds maximum deposit
    ExceedsMaxDeposit,
    /// Exceeds maximum mint
    ExceedsMaxMint,
    /// Exceeds maximum withdraw
    ExceedsMaxWithdraw,
    /// Exceeds maximum redeem
    ExceedsMaxRedeem,
}

// -----------------------------------------------------------------------------
// Strategy Errors
// -----------------------------------------------------------------------------

#[derive(Drop, Copy, PartialEq)]
pub enum StrategyError {
    /// Caller is not the vault
    CallerNotVault,
    /// Caller is not the owner
    CallerNotOwner,
    /// Insufficient assets in strategy
    InsufficientAssets,
    /// External protocol error
    ExternalProtocolError,
    /// Zero amount operation
    ZeroAmount,
}

// -----------------------------------------------------------------------------
// Error Message Constants
// -----------------------------------------------------------------------------

pub mod messages {
    pub const ZERO_DEPOSIT: felt252 = 'ZERO_DEPOSIT';
    pub const ZERO_WITHDRAW: felt252 = 'ZERO_WITHDRAW';
    pub const ZERO_MINT: felt252 = 'ZERO_MINT';
    pub const ZERO_REDEEM: felt252 = 'ZERO_REDEEM';
    pub const INSUFFICIENT_SHARES: felt252 = 'INSUFFICIENT_SHARES';
    pub const INSUFFICIENT_ALLOWANCE: felt252 = 'INSUFFICIENT_ALLOWANCE';
    pub const PAUSED: felt252 = 'PAUSED';
    pub const UNAUTHORIZED: felt252 = 'UNAUTHORIZED';
    pub const STRATEGY_ASSET_MISMATCH: felt252 = 'STRATEGY_ASSET_MISMATCH';
    pub const INVALID_RECEIVER: felt252 = 'INVALID_RECEIVER';
    pub const CALLER_NOT_VAULT: felt252 = 'CALLER_NOT_VAULT';
    pub const CALLER_NOT_OWNER: felt252 = 'CALLER_NOT_OWNER';
    pub const INSUFFICIENT_ASSETS: felt252 = 'INSUFFICIENT_ASSETS';
    pub const EXTERNAL_PROTOCOL_ERROR: felt252 = 'EXTERNAL_PROTOCOL_ERROR';
    pub const ZERO_AMOUNT: felt252 = 'ZERO_AMOUNT';
}
