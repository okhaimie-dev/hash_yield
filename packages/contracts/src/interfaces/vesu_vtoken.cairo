// =============================================================================
// IVesuVToken Interface
// =============================================================================
// Interface for Vesu V2's VToken (ERC-4626 compliant lending vault).
// Used by LendingStrategyV0 to interact with Vesu lending pools.
// =============================================================================

use starknet::ContractAddress;

#[starknet::interface]
pub trait IVesuVToken<TContractState> {
    // -------------------------------------------------------------------------
    // ERC-4626 View Functions
    // -------------------------------------------------------------------------

    /// Returns the underlying asset address
    fn asset(self: @TContractState) -> ContractAddress;

    /// Returns total assets in the vault
    fn total_assets(self: @TContractState) -> u256;

    /// Returns total supply of VToken shares
    fn total_supply(self: @TContractState) -> u256;

    /// Returns the VToken share balance of an account
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;

    /// Converts asset amount to share amount
    fn convert_to_shares(self: @TContractState, assets: u256) -> u256;

    /// Converts share amount to asset amount
    fn convert_to_assets(self: @TContractState, shares: u256) -> u256;

    // -------------------------------------------------------------------------
    // ERC-4626 State-Changing Functions
    // -------------------------------------------------------------------------

    /// Deposits assets and mints VToken shares to receiver
    /// Returns: shares minted
    fn deposit(ref self: TContractState, assets: u256, receiver: ContractAddress) -> u256;

    /// Mints exact shares by depositing assets
    /// Returns: assets deposited
    fn mint(ref self: TContractState, shares: u256, receiver: ContractAddress) -> u256;

    /// Withdraws exact assets by burning shares
    /// Returns: shares burned
    fn withdraw(
        ref self: TContractState, assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;

    /// Redeems exact shares for assets
    /// Returns: assets received
    fn redeem(
        ref self: TContractState, shares: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
}
