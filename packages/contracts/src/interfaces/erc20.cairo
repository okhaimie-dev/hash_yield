// =============================================================================
// IERC20 Interface
// =============================================================================
// Standard ERC-20 interface for interacting with tokens.
// Used for WBTC and other ERC-20 token interactions.
// =============================================================================

use starknet::ContractAddress;

#[starknet::interface]
pub trait IERC20<TContractState> {
    /// Returns the name of the token
    fn name(self: @TContractState) -> felt252;

    /// Returns the symbol of the token
    fn symbol(self: @TContractState) -> felt252;

    /// Returns the number of decimals
    fn decimals(self: @TContractState) -> u8;

    /// Returns the total supply of tokens
    fn total_supply(self: @TContractState) -> u256;

    /// Returns the balance of an account
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;

    /// Returns the allowance granted to a spender by an owner
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;

    /// Transfers tokens to a recipient
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;

    /// Transfers tokens from sender to recipient using allowance
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;

    /// Approves a spender to spend tokens
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

// -----------------------------------------------------------------------------
// CamelCase aliases for compatibility
// -----------------------------------------------------------------------------

#[starknet::interface]
pub trait IERC20Camel<TContractState> {
    fn totalSupply(self: @TContractState) -> u256;
    fn balanceOf(self: @TContractState, account: ContractAddress) -> u256;
    fn transferFrom(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256,
    ) -> bool;
}
