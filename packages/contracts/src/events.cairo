// =============================================================================
// Event Definitions
// =============================================================================
// All events emitted by the Hash Yield vault system.
// Note: ERC-4626 Deposit/Withdraw events are handled by OZ component.
// =============================================================================

use starknet::ContractAddress;

// -----------------------------------------------------------------------------
// Vault Events
// -----------------------------------------------------------------------------

/// Emitted when the active strategy is changed
#[derive(Drop, starknet::Event)]
pub struct StrategySwitched {
    #[key]
    pub old_strategy: ContractAddress,
    #[key]
    pub new_strategy: ContractAddress,
}

/// Emitted when harvest is called and profit/loss is reported
#[derive(Drop, starknet::Event)]
pub struct Harvest {
    pub profit: u256,
    pub loss: u256,
    pub total_assets: u256,
}

/// Emitted when emergency withdrawal is executed
#[derive(Drop, starknet::Event)]
pub struct EmergencyWithdraw {
    pub amount_recovered: u256,
}
// -----------------------------------------------------------------------------
// Note on ERC-4626 Standard Events
// -----------------------------------------------------------------------------
// The following events are handled by OpenZeppelin's ERC4626Component:
//
// - Deposit(caller, owner, assets, shares)
// - Withdraw(caller, receiver, owner, assets, shares)
//
// And from ERC20Component:
// - Transfer(from, to, value)
// - Approval(owner, spender, value)
//
// And from PausableComponent:
// - Paused(account)
// - Unpaused(account)
// =============================================================================


