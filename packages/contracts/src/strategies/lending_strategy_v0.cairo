// =============================================================================
// LendingStrategyV0 - Vesu V2 Lending Strategy
// =============================================================================
// Initial concrete strategy implementation that supplies WBTC to Vesu V2's
// lending pool for yield generation. Implements the IStrategy interface.
//
// Integration:
// - Deposits WBTC into Vesu's VToken (ERC-4626 compliant vault)
// - Earns yield through Vesu's lending protocol
// - Tracks profit/loss for harvest reporting
// =============================================================================

use starknet::ContractAddress;

#[starknet::contract]
pub mod LendingStrategyV0 {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use crate::errors::StrategyError;
    use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::strategy::IStrategy;
    use crate::interfaces::vesu_vtoken::{IVesuVTokenDispatcher, IVesuVTokenDispatcherTrait};

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------
    #[storage]
    struct Storage {
        /// Underlying asset token address (WBTC)
        asset: ContractAddress,
        /// Vesu VToken address (ERC-4626 vault for WBTC)
        v_token: ContractAddress,
        /// Backpointer to Vault contract
        vault: ContractAddress,
        /// Owner/admin address for emergency operations
        owner: ContractAddress,
        /// Last reported total assets (for profit/loss calculation)
        last_reported_assets: u256,
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        Deposited: Deposited,
        Withdrawn: Withdrawn,
        Harvested: Harvested,
        EmergencyWithdrawn: EmergencyWithdrawn,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Deposited {
        pub amount: u256,
        pub v_token_shares: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Withdrawn {
        pub amount: u256,
        pub v_token_shares: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Harvested {
        pub profit: u256,
        pub loss: u256,
        pub total_assets: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct EmergencyWithdrawn {
        pub amount_recovered: u256,
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    #[constructor]
    fn constructor(
        ref self: ContractState,
        asset_address: ContractAddress,
        v_token_address: ContractAddress,
        vault_address: ContractAddress,
        owner_address: ContractAddress,
    ) {
        self.asset.write(asset_address);
        self.v_token.write(v_token_address);
        self.vault.write(vault_address);
        self.owner.write(owner_address);
        self.last_reported_assets.write(0);
    }

    // -------------------------------------------------------------------------
    // IStrategy Implementation
    // -------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl StrategyImpl of IStrategy<ContractState> {
        fn asset(self: @ContractState) -> ContractAddress {
            self.asset.read()
        }

        fn total_assets(self: @ContractState) -> u256 {
            // Query VToken shares held by this strategy
            let v_token = IVesuVTokenDispatcher { contract_address: self.v_token.read() };
            let share_balance = v_token.balance_of(get_contract_address());

            if share_balance == 0 {
                return 0;
            }

            // Convert shares to underlying assets (includes accrued interest)
            v_token.convert_to_assets(share_balance)
        }

        fn deposit(ref self: ContractState, amount: u256) -> u256 {
            // Authorization: only vault can deposit
            self._assert_vault_caller();

            if amount == 0 {
                return 0;
            }

            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            let v_token_addr = self.v_token.read();
            let v_token = IVesuVTokenDispatcher { contract_address: v_token_addr };

            // Transfer assets from vault to strategy (vault should have approved)
            asset_token.transfer_from(self.vault.read(), get_contract_address(), amount);

            // Approve VToken to spend assets
            asset_token.approve(v_token_addr, amount);

            // Deposit into Vesu and receive VToken shares
            let shares_received = v_token.deposit(amount, get_contract_address());

            // Update last reported assets
            let new_total = self.last_reported_assets.read() + amount;
            self.last_reported_assets.write(new_total);

            // Emit event
            self.emit(Deposited { amount, v_token_shares: shares_received });

            amount
        }

        fn withdraw(ref self: ContractState, amount: u256) -> u256 {
            // Authorization: only vault can withdraw
            self._assert_vault_caller();

            if amount == 0 {
                return 0;
            }

            // Ensure we have enough assets
            let current_assets = self.total_assets();
            assert(current_assets >= amount, StrategyError::InsufficientAssets);

            let v_token = IVesuVTokenDispatcher { contract_address: self.v_token.read() };
            let strategy_addr = get_contract_address();

            // Withdraw from Vesu (burns VToken shares, receives underlying)
            let shares_burned = v_token.withdraw(amount, strategy_addr, strategy_addr);

            // Transfer assets to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(self.vault.read(), amount);

            // Update last reported assets
            let current_reported = self.last_reported_assets.read();
            if current_reported >= amount {
                self.last_reported_assets.write(current_reported - amount);
            } else {
                self.last_reported_assets.write(0);
            }

            // Emit event
            self.emit(Withdrawn { amount, v_token_shares: shares_burned });

            amount
        }

        fn withdraw_all(ref self: ContractState) -> u256 {
            // Authorization: vault or owner can call
            self._assert_vault_or_owner_caller();

            let v_token_addr = self.v_token.read();
            let v_token = IVesuVTokenDispatcher { contract_address: v_token_addr };
            let strategy_addr = get_contract_address();

            // Get all VToken shares held
            let share_balance = v_token.balance_of(strategy_addr);
            if share_balance == 0 {
                return 0;
            }

            // Redeem all shares for underlying assets
            let assets_received = v_token.redeem(share_balance, strategy_addr, strategy_addr);

            // Transfer all assets to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(self.vault.read(), assets_received);

            // Reset last reported assets
            self.last_reported_assets.write(0);

            // Emit event
            self.emit(Withdrawn { amount: assets_received, v_token_shares: share_balance });

            assets_received
        }

        fn harvest(ref self: ContractState) -> (u256, u256) {
            // Can be called by vault or owner (or made public)
            // For v0, allow vault or owner
            self._assert_vault_or_owner_caller();

            // Calculate current total assets
            let current = self.total_assets();
            let last = self.last_reported_assets.read();

            // Calculate profit or loss
            let (profit, loss) = if current >= last {
                (current - last, 0_u256)
            } else {
                (0_u256, last - current)
            };

            // Update last reported to current
            self.last_reported_assets.write(current);

            // Emit event
            self.emit(Harvested { profit, loss, total_assets: current });

            (profit, loss)
        }

        fn emergency_withdraw(ref self: ContractState) -> u256 {
            // Authorization: vault or owner can call
            self._assert_vault_or_owner_caller();

            let v_token_addr = self.v_token.read();
            let v_token = IVesuVTokenDispatcher { contract_address: v_token_addr };
            let strategy_addr = get_contract_address();

            // Get all VToken shares
            let share_balance = v_token.balance_of(strategy_addr);
            if share_balance == 0 {
                self.emit(EmergencyWithdrawn { amount_recovered: 0 });
                return 0;
            }

            // Attempt to redeem all shares
            // Note: In emergency, this might fail if protocol is paused
            // For v0, we assume it succeeds
            let assets_recovered = v_token.redeem(share_balance, strategy_addr, strategy_addr);

            // Transfer recovered assets to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(self.vault.read(), assets_recovered);

            // Reset last reported
            self.last_reported_assets.write(0);

            // Emit event
            self.emit(EmergencyWithdrawn { amount_recovered: assets_recovered });

            assets_recovered
        }
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl StrategyViewImpl of super::ILendingStrategyV0View<ContractState> {
        fn vault(self: @ContractState) -> ContractAddress {
            self.vault.read()
        }

        fn v_token(self: @ContractState) -> ContractAddress {
            self.v_token.read()
        }

        fn owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }

        fn last_reported_assets(self: @ContractState) -> u256 {
            self.last_reported_assets.read()
        }

        fn v_token_balance(self: @ContractState) -> u256 {
            let v_token = IVesuVTokenDispatcher { contract_address: self.v_token.read() };
            v_token.balance_of(get_contract_address())
        }
    }

    // -------------------------------------------------------------------------
    // Internal Functions
    // -------------------------------------------------------------------------
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        /// Assert caller is the vault
        fn _assert_vault_caller(self: @ContractState) {
            assert(get_caller_address() == self.vault.read(), StrategyError::CallerNotVault);
        }

        /// Assert caller is vault or owner
        fn _assert_vault_or_owner_caller(self: @ContractState) {
            let caller = get_caller_address();
            let is_vault = caller == self.vault.read();
            let is_owner = caller == self.owner.read();
            assert(is_vault || is_owner, StrategyError::CallerNotVaultOrOwner);
        }
    }
}

/// View functions specific to LendingStrategyV0
#[starknet::interface]
pub trait ILendingStrategyV0View<TContractState> {
    /// Returns the vault address this strategy serves
    fn vault(self: @TContractState) -> ContractAddress;

    /// Returns the Vesu VToken address
    fn v_token(self: @TContractState) -> ContractAddress;

    /// Returns the owner/admin address
    fn owner(self: @TContractState) -> ContractAddress;

    /// Returns the last reported assets value
    fn last_reported_assets(self: @TContractState) -> u256;

    /// Returns the current VToken balance held by strategy
    fn v_token_balance(self: @TContractState) -> u256;
}
