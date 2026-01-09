// =============================================================================
// MockStrategy - Simple Strategy Mock for Local Development
// =============================================================================
// A minimal IStrategy implementation for testing vault-strategy interactions
// without external protocol dependencies.
// =============================================================================

#[starknet::interface]
pub trait IMockStrategy<TContractState> {
    // Set reported total assets (for simulating profit/loss)
    fn set_total_assets(ref self: TContractState, amount: u256);
    // Get the internal balance tracking
    fn get_internal_balance(self: @TContractState) -> u256;
}

#[starknet::contract]
pub mod MockStrategy {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address};
    use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::strategy::IStrategy;
    use super::IMockStrategy;

    #[storage]
    struct Storage {
        asset: ContractAddress,
        vault: ContractAddress,
        internal_balance: u256,
        last_reported_assets: u256,
        // Allow overriding total_assets for testing
        override_total_assets: u256,
        use_override: bool,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, asset_address: ContractAddress, vault_address: ContractAddress,
    ) {
        self.asset.write(asset_address);
        self.vault.write(vault_address);
        self.internal_balance.write(0);
        self.last_reported_assets.write(0);
        self.use_override.write(false);
    }

    #[abi(embed_v0)]
    impl IStrategyImpl of IStrategy<ContractState> {
        fn asset(self: @ContractState) -> ContractAddress {
            self.asset.read()
        }

        fn total_assets(self: @ContractState) -> u256 {
            if self.use_override.read() {
                self.override_total_assets.read()
            } else {
                self.internal_balance.read()
            }
        }

        fn deposit(ref self: ContractState, amount: u256) -> u256 {
            // Verify caller is vault
            assert(get_caller_address() == self.vault.read(), 'CALLER_NOT_VAULT');

            // Transfer assets from vault to strategy
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer_from(self.vault.read(), starknet::get_contract_address(), amount);

            // Track internally
            self.internal_balance.write(self.internal_balance.read() + amount);
            self.last_reported_assets.write(self.last_reported_assets.read() + amount);

            amount
        }

        fn withdraw(ref self: ContractState, amount: u256) -> u256 {
            // Verify caller is vault
            assert(get_caller_address() == self.vault.read(), 'CALLER_NOT_VAULT');

            let balance = self.internal_balance.read();
            assert(balance >= amount, 'INSUFFICIENT_ASSETS');

            // Transfer assets back to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(self.vault.read(), amount);

            // Update tracking
            self.internal_balance.write(balance - amount);

            amount
        }

        fn withdraw_all(ref self: ContractState) -> u256 {
            // Verify caller is vault
            assert(get_caller_address() == self.vault.read(), 'CALLER_NOT_VAULT');

            let balance = self.internal_balance.read();
            if balance == 0 {
                return 0;
            }

            // Transfer all assets back to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(self.vault.read(), balance);

            // Reset tracking
            self.internal_balance.write(0);
            self.last_reported_assets.write(0);

            balance
        }

        fn harvest(ref self: ContractState) -> (u256, u256) {
            let current = self.total_assets();
            let last = self.last_reported_assets.read();

            let (profit, loss) = if current >= last {
                (current - last, 0)
            } else {
                (0, last - current)
            };

            // Update last reported
            self.last_reported_assets.write(current);

            (profit, loss)
        }

        fn emergency_withdraw(ref self: ContractState) -> u256 {
            // Same as withdraw_all but doesn't require vault caller
            // (allows owner to call in emergency)
            let balance = self.internal_balance.read();
            if balance == 0 {
                return 0;
            }

            // Transfer all assets back to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(self.vault.read(), balance);

            // Reset tracking
            self.internal_balance.write(0);
            self.last_reported_assets.write(0);

            balance
        }
    }

    #[abi(embed_v0)]
    impl IMockStrategyImpl of IMockStrategy<ContractState> {
        fn set_total_assets(ref self: ContractState, amount: u256) {
            self.override_total_assets.write(amount);
            self.use_override.write(true);
        }

        fn get_internal_balance(self: @ContractState) -> u256 {
            self.internal_balance.read()
        }
    }
}
