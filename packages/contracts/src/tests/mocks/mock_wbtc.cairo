// =============================================================================
// MockWBTC - Mock ERC-20 Token for Testing
// =============================================================================
// A simple ERC-20 mock representing WBTC with mint/burn capabilities
// for test setup. Uses 8 decimals to match Ethereum WBTC.
// =============================================================================

use starknet::ContractAddress;

#[starknet::interface]
pub trait IMockWBTC<TContractState> {
    // Mint tokens to an address (test-only)
    fn mint(ref self: TContractState, to: ContractAddress, amount: u256);
    // Burn tokens from an address (test-only)
    fn burn(ref self: TContractState, from: ContractAddress, amount: u256);
}

#[starknet::contract]
pub mod MockWBTC {
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};
    use crate::interfaces::erc20::IERC20;
    use super::IMockWBTC;

    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        total_supply: u256,
        name: felt252,
        symbol: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState) {
        self.name.write('Wrapped BTC');
        self.symbol.write('WBTC');
        self.total_supply.write(0);
    }

    #[abi(embed_v0)]
    impl IERC20Impl of IERC20<ContractState> {
        fn name(self: @ContractState) -> felt252 {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> felt252 {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            8 // WBTC uses 8 decimals like on Ethereum
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_supply.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }

        fn allowance(
            self: @ContractState, owner: ContractAddress, spender: ContractAddress,
        ) -> u256 {
            self.allowances.read((owner, spender))
        }

        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            let sender = get_caller_address();
            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'INSUFFICIENT_BALANCE');
            self.balances.write(sender, sender_balance - amount);
            self.balances.write(recipient, self.balances.read(recipient) + amount);
            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            let allowance = self.allowances.read((sender, caller));
            assert(allowance >= amount, 'INSUFFICIENT_ALLOWANCE');
            self.allowances.write((sender, caller), allowance - amount);

            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, 'INSUFFICIENT_BALANCE');
            self.balances.write(sender, sender_balance - amount);
            self.balances.write(recipient, self.balances.read(recipient) + amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let owner = get_caller_address();
            self.allowances.write((owner, spender), amount);
            true
        }
    }

    #[abi(embed_v0)]
    impl IMockWBTCImpl of IMockWBTC<ContractState> {
        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            self.balances.write(to, self.balances.read(to) + amount);
            self.total_supply.write(self.total_supply.read() + amount);
        }

        fn burn(ref self: ContractState, from: ContractAddress, amount: u256) {
            let balance = self.balances.read(from);
            assert(balance >= amount, 'INSUFFICIENT_BALANCE');
            self.balances.write(from, balance - amount);
            self.total_supply.write(self.total_supply.read() - amount);
        }
    }
}
