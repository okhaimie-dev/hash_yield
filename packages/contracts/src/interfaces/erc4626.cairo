// =============================================================================
// IERC4626 Interface
// =============================================================================
// The ERC-4626 tokenized vault standard interface.
// Split into view and mutable traits for clarity.
// =============================================================================

use starknet::ContractAddress;

/// ERC-4626 View Functions
#[starknet::interface]
pub trait IERC4626View<TContractState> {
    /// Returns the address of the underlying asset token
    fn asset(self: @TContractState) -> ContractAddress;

    /// Returns the total amount of underlying assets held by the vault
    fn total_assets(self: @TContractState) -> u256;

    /// Converts assets to shares (round down)
    fn convert_to_shares(self: @TContractState, assets: u256) -> u256;

    /// Converts shares to assets (round down)
    fn convert_to_assets(self: @TContractState, shares: u256) -> u256;

    /// Maximum assets that can be deposited for receiver
    fn max_deposit(self: @TContractState, receiver: ContractAddress) -> u256;

    /// Maximum shares that can be minted for receiver
    fn max_mint(self: @TContractState, receiver: ContractAddress) -> u256;

    /// Maximum assets that can be withdrawn by owner
    fn max_withdraw(self: @TContractState, owner: ContractAddress) -> u256;

    /// Maximum shares that can be redeemed by owner
    fn max_redeem(self: @TContractState, owner: ContractAddress) -> u256;

    /// Preview shares that would be minted for assets
    fn preview_deposit(self: @TContractState, assets: u256) -> u256;

    /// Preview assets required to mint shares
    fn preview_mint(self: @TContractState, shares: u256) -> u256;

    /// Preview shares that would be burned for assets
    fn preview_withdraw(self: @TContractState, assets: u256) -> u256;

    /// Preview assets that would be received for shares
    fn preview_redeem(self: @TContractState, shares: u256) -> u256;
}

/// ERC-4626 Mutable Functions
#[starknet::interface]
pub trait IERC4626Mutable<TContractState> {
    /// Deposits assets and mints shares to receiver
    /// Returns: shares minted
    fn deposit(ref self: TContractState, assets: u256, receiver: ContractAddress) -> u256;

    /// Mints exact shares to receiver, pulling required assets
    /// Returns: assets pulled
    fn mint(ref self: TContractState, shares: u256, receiver: ContractAddress) -> u256;

    /// Burns shares from owner to withdraw exact assets to receiver
    /// Returns: shares burned
    fn withdraw(
        ref self: TContractState, assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;

    /// Burns exact shares from owner and sends assets to receiver
    /// Returns: assets sent
    fn redeem(
        ref self: TContractState, shares: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
}
