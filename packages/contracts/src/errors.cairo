// =============================================================================
// Error Definitions
// =============================================================================
// Felt252 error constants for the Hash Yield vault system.
// Used with assert statements: assert(condition, VaultError::ZeroAssets)
// =============================================================================

// -----------------------------------------------------------------------------
// Vault Errors
// -----------------------------------------------------------------------------

pub mod VaultError {
    pub const ZeroAssets: felt252 = 'ZERO_ASSETS';
    pub const ZeroShares: felt252 = 'ZERO_SHARES';
    pub const InsufficientShares: felt252 = 'INSUFFICIENT_SHARES';
    pub const InsufficientAllowance: felt252 = 'INSUFFICIENT_ALLOWANCE';
    pub const Paused: felt252 = 'PAUSED';
    pub const Unauthorized: felt252 = 'UNAUTHORIZED';
    pub const AssetMismatch: felt252 = 'ASSET_MISMATCH';
    pub const InvalidReceiver: felt252 = 'INVALID_RECEIVER';
    pub const NoStrategy: felt252 = 'NO_STRATEGY';
    pub const ExceedsMaxDeposit: felt252 = 'EXCEEDS_MAX_DEPOSIT';
    pub const ExceedsMaxMint: felt252 = 'EXCEEDS_MAX_MINT';
    pub const ExceedsMaxWithdraw: felt252 = 'EXCEEDS_MAX_WITHDRAW';
    pub const ExceedsMaxRedeem: felt252 = 'EXCEEDS_MAX_REDEEM';
}

// -----------------------------------------------------------------------------
// Strategy Errors
// -----------------------------------------------------------------------------

pub mod StrategyError {
    pub const CallerNotVault: felt252 = 'CALLER_NOT_VAULT';
    pub const CallerNotOwner: felt252 = 'CALLER_NOT_OWNER';
    pub const CallerNotVaultOrOwner: felt252 = 'CALLER_NOT_VAULT_OR_OWNER';
    pub const InsufficientAssets: felt252 = 'INSUFFICIENT_ASSETS';
    pub const ExternalProtocolError: felt252 = 'EXTERNAL_PROTOCOL_ERROR';
    pub const ZeroAmount: felt252 = 'ZERO_AMOUNT';
}
