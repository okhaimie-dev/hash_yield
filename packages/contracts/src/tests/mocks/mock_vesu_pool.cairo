// =============================================================================
// MockVesuPool - Mock Vesu V2 VToken for Testing
// =============================================================================
// A mock ERC-4626 compliant vault simulating Vesu's lending pool.
// Allows setting exchange rate for testing yield accrual scenarios.
// =============================================================================

#[starknet::interface]
pub trait IMockVesuPool<TContractState> {
    // Set the exchange rate (for simulating yield accrual)
    // rate_bps: basis points where 10000 = 1:1, 11000 = 1.1:1 (10% profit)
    fn set_exchange_rate(ref self: TContractState, rate_bps: u256);

    // Simulate a loss by reducing total assets
    fn simulate_loss(ref self: TContractState, loss_amount: u256);

    // Get current exchange rate in basis points
    fn get_exchange_rate(self: @TContractState) -> u256;
}

#[starknet::contract]
pub mod MockVesuPool {
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};
    use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::vesu_vtoken::IVesuVToken;
    use super::IMockVesuPool;

    const BPS_DENOMINATOR: u256 = 10000;

    #[storage]
    struct Storage {
        asset: ContractAddress,
        shares: Map<ContractAddress, u256>,
        total_shares: u256,
        total_underlying: u256,
        // Exchange rate in basis points (10000 = 1:1)
        exchange_rate_bps: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, asset_address: ContractAddress) {
        self.asset.write(asset_address);
        self.exchange_rate_bps.write(BPS_DENOMINATOR); // Start at 1:1
        self.total_shares.write(0);
        self.total_underlying.write(0);
    }

    #[abi(embed_v0)]
    impl IVesuVTokenImpl of IVesuVToken<ContractState> {
        fn asset(self: @ContractState) -> ContractAddress {
            self.asset.read()
        }

        fn total_assets(self: @ContractState) -> u256 {
            // Apply exchange rate to underlying
            let underlying = self.total_underlying.read();
            let rate = self.exchange_rate_bps.read();
            (underlying * rate) / BPS_DENOMINATOR
        }

        fn total_supply(self: @ContractState) -> u256 {
            self.total_shares.read()
        }

        fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
            self.shares.read(account)
        }

        fn convert_to_shares(self: @ContractState, assets: u256) -> u256 {
            let total_supply = self.total_shares.read();
            if total_supply == 0 {
                assets
            } else {
                let total_assets = self.total_assets();
                (assets * total_supply) / total_assets
            }
        }

        fn convert_to_assets(self: @ContractState, shares: u256) -> u256 {
            let total_supply = self.total_shares.read();
            if total_supply == 0 {
                shares
            } else {
                let total_assets = self.total_assets();
                (shares * total_assets) / total_supply
            }
        }

        fn deposit(ref self: ContractState, assets: u256, receiver: ContractAddress) -> u256 {
            let shares = self.convert_to_shares(assets);

            // Transfer assets from caller to this contract
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token
                .transfer_from(get_caller_address(), starknet::get_contract_address(), assets);

            // Mint shares
            self.shares.write(receiver, self.shares.read(receiver) + shares);
            self.total_shares.write(self.total_shares.read() + shares);
            self.total_underlying.write(self.total_underlying.read() + assets);

            shares
        }

        fn mint(ref self: ContractState, shares: u256, receiver: ContractAddress) -> u256 {
            let assets = self.convert_to_assets(shares);

            // Transfer assets from caller
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token
                .transfer_from(get_caller_address(), starknet::get_contract_address(), assets);

            // Mint shares
            self.shares.write(receiver, self.shares.read(receiver) + shares);
            self.total_shares.write(self.total_shares.read() + shares);
            self.total_underlying.write(self.total_underlying.read() + assets);

            assets
        }

        fn withdraw(
            ref self: ContractState,
            assets: u256,
            receiver: ContractAddress,
            owner: ContractAddress,
        ) -> u256 {
            let shares = self.convert_to_shares(assets);

            // Burn shares from owner
            let owner_shares = self.shares.read(owner);
            assert(owner_shares >= shares, 'INSUFFICIENT_SHARES');
            self.shares.write(owner, owner_shares - shares);
            self.total_shares.write(self.total_shares.read() - shares);

            // Calculate actual assets based on exchange rate
            let actual_assets = (self.total_underlying.read() * shares)
                / (self.total_shares.read() + shares);
            self.total_underlying.write(self.total_underlying.read() - actual_assets);

            // Transfer assets to receiver
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(receiver, assets);

            shares
        }

        fn redeem(
            ref self: ContractState,
            shares: u256,
            receiver: ContractAddress,
            owner: ContractAddress,
        ) -> u256 {
            let assets = self.convert_to_assets(shares);

            // Burn shares from owner
            let owner_shares = self.shares.read(owner);
            assert(owner_shares >= shares, 'INSUFFICIENT_SHARES');
            self.shares.write(owner, owner_shares - shares);
            self.total_shares.write(self.total_shares.read() - shares);

            // Update underlying tracking
            let underlying_to_remove = (self.total_underlying.read() * shares)
                / (self.total_shares.read() + shares);
            self.total_underlying.write(self.total_underlying.read() - underlying_to_remove);

            // Transfer assets to receiver
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(receiver, assets);

            assets
        }
    }

    #[abi(embed_v0)]
    impl IMockVesuPoolImpl of IMockVesuPool<ContractState> {
        fn set_exchange_rate(ref self: ContractState, rate_bps: u256) {
            self.exchange_rate_bps.write(rate_bps);
        }

        fn simulate_loss(ref self: ContractState, loss_amount: u256) {
            let current = self.total_underlying.read();
            if loss_amount >= current {
                self.total_underlying.write(0);
            } else {
                self.total_underlying.write(current - loss_amount);
            }
        }

        fn get_exchange_rate(self: @ContractState) -> u256 {
            self.exchange_rate_bps.read()
        }
    }
}
