// =============================================================================
// IVault Interface
// =============================================================================
// The vault interface extends ERC-4626 with strategy management capabilities.
// This defines the custom admin/management functions beyond standard ERC-4626.
// =============================================================================

use starknet::ContractAddress;

/// Custom vault management interface (non-ERC-4626 functions)
#[starknet::interface]
pub trait IVault<TContractState> {
    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /// Returns the current active strategy address
    /// Returns zero address if no strategy is set
    fn current_strategy(self: @TContractState) -> ContractAddress;

    // -------------------------------------------------------------------------
    // Admin Functions
    // -------------------------------------------------------------------------

    /// Switches the vault's strategy
    /// Requirements:
    /// - Caller is admin
    /// - new_strategy.asset() == vault.asset() (or new_strategy is zero)
    /// Process:
    /// 1. Withdraw all from old strategy (if exists)
    /// 2. Deposit all to new strategy (if not zero address)
    /// Emits: StrategySwitched(old_strategy, new_strategy)
    fn set_strategy(ref self: TContractState, new_strategy: ContractAddress);

    /// Triggers harvest on the current strategy
    /// Reports profit/loss and updates accounting
    /// Returns: (profit, loss)
    /// Emits: Harvest(profit, loss, total_assets)
    fn harvest(ref self: TContractState) -> (u256, u256);

    /// Emergency withdrawal from strategy
    /// Pulls all assets from strategy back to vault
    /// Returns: Amount recovered
    /// Emits: EmergencyWithdraw(amount_recovered)
    fn emergency_withdraw(ref self: TContractState) -> u256;

    /// Pauses the vault (blocks deposits/withdrawals)
    /// Only admin can call
    /// Emits: Paused(account)
    fn pause(ref self: TContractState);

    /// Unpauses the vault (allows deposits/withdrawals)
    /// Only admin can call
    /// Emits: Unpaused(account)
    fn unpause(ref self: TContractState);
}
