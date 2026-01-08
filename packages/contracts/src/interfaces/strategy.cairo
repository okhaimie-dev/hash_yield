// =============================================================================
// IStrategy Interface
// =============================================================================
// The strategy interface defines how yield-generating strategies interact
// with the vault. Any strategy must implement this interface.
// =============================================================================

use starknet::ContractAddress;

#[starknet::interface]
pub trait IStrategy<TContractState> {
    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /// Returns the underlying asset this strategy works with
    /// Used by Vault to validate strategy.asset() == vault.asset()
    fn asset(self: @TContractState) -> ContractAddress;

    /// Returns the total assets currently managed by the strategy
    /// For lending strategies: principal + accrued interest
    fn total_assets(self: @TContractState) -> u256;

    // -------------------------------------------------------------------------
    // State-Changing Functions (Vault-only)
    // -------------------------------------------------------------------------

    /// Deposits assets into the external protocol
    /// Called by Vault after receiving assets from user deposit
    /// Returns: Amount actually deployed (should equal input)
    fn deposit(ref self: TContractState, amount: u256) -> u256;

    /// Withdraws assets from the external protocol
    /// Called by Vault when user withdraws
    /// Returns: Actual amount withdrawn
    fn withdraw(ref self: TContractState, amount: u256) -> u256;

    /// Withdraws all assets from the external protocol
    /// Used for strategy migrations or emergencies
    /// Returns: Total amount withdrawn
    fn withdraw_all(ref self: TContractState) -> u256;

    /// Reports profit/loss since last harvest
    /// Returns: (profit, loss) - only one should be non-zero
    fn harvest(ref self: TContractState) -> (u256, u256);

    /// Emergency withdrawal - attempts to recover all assets
    /// Should not revert even on partial recovery
    /// Returns: Amount recovered (may be less than total_assets)
    fn emergency_withdraw(ref self: TContractState) -> u256;
}
