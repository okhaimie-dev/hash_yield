// =============================================================================
// Vault Contract - ERC-4626 BTC Vault with Pluggable Strategies
// =============================================================================
// Core vault implementing:
// - ERC-4626 standard for tokenized vaults
// - ERC-20 for vault share tokens
// - Strategy management for yield generation
// - Access control for admin operations
// - Pausable for emergency stops
//
// NOTE: This is a TDD skeleton. Business logic placeholders are marked with
// `// TODO: Implement` and will be filled during implementation phase.
// The focus is on correct interface signatures and storage layout.
// =============================================================================

#[starknet::contract]
pub mod Vault {
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use crate::errors::VaultError;
    use crate::events::{EmergencyWithdraw, Harvest, StrategySwitched};
    use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use crate::interfaces::strategy::{IStrategyDispatcher, IStrategyDispatcherTrait};
    use crate::interfaces::vault::IVault;

    // -------------------------------------------------------------------------
    // Constants
    // -------------------------------------------------------------------------

    /// Virtual offset for inflation attack protection (ERC-4626)
    const VIRTUAL_OFFSET: u256 = 1;

    // -------------------------------------------------------------------------
    // Storage
    // -------------------------------------------------------------------------
    #[storage]
    struct Storage {
        // ERC-20 state (shares)
        name: ByteArray,
        symbol: ByteArray,
        total_supply: u256,
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        // ERC-4626 / Vault state
        asset: ContractAddress,
        current_strategy: ContractAddress,
        // Access control
        owner: ContractAddress,
        // Pausable
        paused: bool,
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        // ERC-20 events
        Transfer: Transfer,
        Approval: Approval,
        // ERC-4626 events
        Deposit: Deposit,
        Withdraw: Withdraw,
        // Vault management events
        StrategySwitched: StrategySwitched,
        Harvest: Harvest,
        EmergencyWithdraw: EmergencyWithdraw,
        // Pausable events
        Paused: Paused,
        Unpaused: Unpaused,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Transfer {
        #[key]
        pub from: ContractAddress,
        #[key]
        pub to: ContractAddress,
        pub value: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Approval {
        #[key]
        pub owner: ContractAddress,
        #[key]
        pub spender: ContractAddress,
        pub value: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Deposit {
        #[key]
        pub caller: ContractAddress,
        #[key]
        pub receiver: ContractAddress,
        pub assets: u256,
        pub shares: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Withdraw {
        #[key]
        pub caller: ContractAddress,
        #[key]
        pub receiver: ContractAddress,
        #[key]
        pub owner: ContractAddress,
        pub assets: u256,
        pub shares: u256,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Paused {
        pub account: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Unpaused {
        pub account: ContractAddress,
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    #[constructor]
    fn constructor(
        ref self: ContractState,
        asset_address: ContractAddress,
        name: ByteArray,
        symbol: ByteArray,
        owner: ContractAddress,
    ) {
        self.name.write(name);
        self.symbol.write(symbol);
        self.asset.write(asset_address);
        self.owner.write(owner);
        self.current_strategy.write(Zero::zero());
        self.paused.write(false);
        self.total_supply.write(0);
    }

    // -------------------------------------------------------------------------
    // ERC-20 Implementation
    // -------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl ERC20Impl of crate::interfaces::erc20::IERC20<ContractState> {
        fn name(self: @ContractState) -> ByteArray {
            self.name.read()
        }

        fn symbol(self: @ContractState) -> ByteArray {
            self.symbol.read()
        }

        fn decimals(self: @ContractState) -> u8 {
            // Match underlying asset decimals (WBTC = 8)
            8
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
            self._transfer(sender, recipient, amount);
            true
        }

        fn transfer_from(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) -> bool {
            let caller = get_caller_address();
            self._spend_allowance(sender, caller, amount);
            self._transfer(sender, recipient, amount);
            true
        }

        fn approve(ref self: ContractState, spender: ContractAddress, amount: u256) -> bool {
            let owner = get_caller_address();
            self._approve(owner, spender, amount);
            true
        }
    }

    // -------------------------------------------------------------------------
    // ERC-4626 View Functions
    // -------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl ERC4626ViewImpl of crate::interfaces::erc4626::IERC4626View<ContractState> {
        fn asset(self: @ContractState) -> ContractAddress {
            self.asset.read()
        }

        fn total_assets(self: @ContractState) -> u256 {
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            let vault_balance = asset_token.balance_of(get_contract_address());

            let strategy_addr = self.current_strategy.read();
            if strategy_addr.is_zero() {
                vault_balance
            } else {
                let strategy = IStrategyDispatcher { contract_address: strategy_addr };
                vault_balance + strategy.total_assets()
            }
        }

        fn convert_to_shares(self: @ContractState, assets: u256) -> u256 {
            let total_supply = self.total_supply.read();
            let total_assets = Self::total_assets(self);
            InternalImpl::_convert_to_shares(assets, total_supply, total_assets)
        }

        fn convert_to_assets(self: @ContractState, shares: u256) -> u256 {
            let total_supply = self.total_supply.read();
            let total_assets = Self::total_assets(self);
            InternalImpl::_convert_to_assets(shares, total_supply, total_assets)
        }

        fn max_deposit(self: @ContractState, receiver: ContractAddress) -> u256 {
            if self.paused.read() {
                0
            } else {
                core::num::traits::Bounded::<u256>::MAX
            }
        }

        fn max_mint(self: @ContractState, receiver: ContractAddress) -> u256 {
            if self.paused.read() {
                0
            } else {
                core::num::traits::Bounded::<u256>::MAX
            }
        }

        fn max_withdraw(self: @ContractState, owner: ContractAddress) -> u256 {
            if self.paused.read() {
                0
            } else {
                let shares = self.balances.read(owner);
                Self::convert_to_assets(self, shares)
            }
        }

        fn max_redeem(self: @ContractState, owner: ContractAddress) -> u256 {
            if self.paused.read() {
                0
            } else {
                self.balances.read(owner)
            }
        }

        fn preview_deposit(self: @ContractState, assets: u256) -> u256 {
            Self::convert_to_shares(self, assets)
        }

        fn preview_mint(self: @ContractState, shares: u256) -> u256 {
            let total_supply = self.total_supply.read();
            let total_assets = Self::total_assets(self);
            InternalImpl::_convert_to_assets_round_up(shares, total_supply, total_assets)
        }

        fn preview_withdraw(self: @ContractState, assets: u256) -> u256 {
            let total_supply = self.total_supply.read();
            let total_assets = Self::total_assets(self);
            InternalImpl::_convert_to_shares_round_up(assets, total_supply, total_assets)
        }

        fn preview_redeem(self: @ContractState, shares: u256) -> u256 {
            Self::convert_to_assets(self, shares)
        }
    }

    // -------------------------------------------------------------------------
    // ERC-4626 Mutable Functions
    // -------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl ERC4626MutableImpl of crate::interfaces::erc4626::IERC4626Mutable<ContractState> {
        fn deposit(ref self: ContractState, assets: u256, receiver: ContractAddress) -> u256 {
            self._assert_not_paused();
            assert(assets > 0, VaultError::ZeroAssets);

            let shares = ERC4626ViewImpl::convert_to_shares(@self, assets);
            assert(shares > 0, VaultError::ZeroShares);

            let caller = get_caller_address();
            let vault = get_contract_address();

            // Transfer assets from caller to vault
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer_from(caller, vault, assets);

            // Mint shares to receiver
            self._mint(receiver, shares);

            // Forward to strategy if set
            self._forward_to_strategy(assets);

            self.emit(Deposit { caller, receiver, assets, shares });

            shares
        }

        fn mint(ref self: ContractState, shares: u256, receiver: ContractAddress) -> u256 {
            self._assert_not_paused();
            assert(shares > 0, VaultError::ZeroShares);

            let assets = ERC4626ViewImpl::preview_mint(@self, shares);
            assert(assets > 0, VaultError::ZeroAssets);

            let caller = get_caller_address();
            let vault = get_contract_address();

            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer_from(caller, vault, assets);

            self._mint(receiver, shares);
            self._forward_to_strategy(assets);

            self.emit(Deposit { caller, receiver, assets, shares });

            assets
        }

        fn withdraw(
            ref self: ContractState,
            assets: u256,
            receiver: ContractAddress,
            owner: ContractAddress,
        ) -> u256 {
            self._assert_not_paused();
            assert(assets > 0, VaultError::ZeroAssets);

            let caller = get_caller_address();
            let shares = ERC4626ViewImpl::preview_withdraw(@self, assets);
            assert(shares > 0, VaultError::ZeroShares);

            if caller != owner {
                self._spend_allowance(owner, caller, shares);
            }

            let owner_shares = self.balances.read(owner);
            assert(owner_shares >= shares, VaultError::InsufficientShares);

            self._pull_from_strategy(assets);
            self._burn(owner, shares);

            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(receiver, assets);

            self.emit(Withdraw { caller, receiver, owner, assets, shares });

            shares
        }

        fn redeem(
            ref self: ContractState,
            shares: u256,
            receiver: ContractAddress,
            owner: ContractAddress,
        ) -> u256 {
            self._assert_not_paused();
            assert(shares > 0, VaultError::ZeroShares);

            let caller = get_caller_address();
            let assets = ERC4626ViewImpl::convert_to_assets(@self, shares);
            assert(assets > 0, VaultError::ZeroAssets);

            if caller != owner {
                self._spend_allowance(owner, caller, shares);
            }

            let owner_shares = self.balances.read(owner);
            assert(owner_shares >= shares, VaultError::InsufficientShares);

            self._pull_from_strategy(assets);
            self._burn(owner, shares);

            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            asset_token.transfer(receiver, assets);

            self.emit(Withdraw { caller, receiver, owner, assets, shares });

            assets
        }
    }

    // -------------------------------------------------------------------------
    // Vault Management Functions
    // -------------------------------------------------------------------------
    #[abi(embed_v0)]
    impl VaultImpl of IVault<ContractState> {
        fn current_strategy(self: @ContractState) -> ContractAddress {
            self.current_strategy.read()
        }

        fn set_strategy(ref self: ContractState, new_strategy: ContractAddress) {
            self._assert_owner();

            let old_strategy = self.current_strategy.read();

            if !old_strategy.is_zero() {
                let old = IStrategyDispatcher { contract_address: old_strategy };
                old.withdraw_all();
            }

            if !new_strategy.is_zero() {
                let new = IStrategyDispatcher { contract_address: new_strategy };
                assert(new.asset() == self.asset.read(), VaultError::AssetMismatch);

                let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
                let vault_balance = asset_token.balance_of(get_contract_address());
                if vault_balance > 0 {
                    asset_token.approve(new_strategy, vault_balance);
                    new.deposit(vault_balance);
                }
            }

            self.current_strategy.write(new_strategy);
            self.emit(StrategySwitched { old_strategy, new_strategy });
        }

        fn harvest(ref self: ContractState) -> (u256, u256) {
            self._assert_owner();

            let strategy_addr = self.current_strategy.read();
            assert(!strategy_addr.is_zero(), VaultError::NoStrategy);

            let strategy = IStrategyDispatcher { contract_address: strategy_addr };
            let (profit, loss) = strategy.harvest();

            let total = ERC4626ViewImpl::total_assets(@self);
            self.emit(Harvest { profit, loss, total_assets: total });

            (profit, loss)
        }

        fn emergency_withdraw(ref self: ContractState) -> u256 {
            self._assert_owner();

            let strategy_addr = self.current_strategy.read();
            if strategy_addr.is_zero() {
                return 0;
            }

            self.paused.write(true);
            self.emit(Paused { account: get_caller_address() });

            let strategy = IStrategyDispatcher { contract_address: strategy_addr };
            let recovered = strategy.emergency_withdraw();

            self.current_strategy.write(Zero::zero());
            self.emit(EmergencyWithdraw { amount_recovered: recovered });

            recovered
        }

        fn pause(ref self: ContractState) {
            self._assert_owner();
            self.paused.write(true);
            self.emit(Paused { account: get_caller_address() });
        }

        fn unpause(ref self: ContractState) {
            self._assert_owner();
            self.paused.write(false);
            self.emit(Unpaused { account: get_caller_address() });
        }
    }

    // -------------------------------------------------------------------------
    // Internal Functions
    // -------------------------------------------------------------------------
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _assert_owner(self: @ContractState) {
            assert(get_caller_address() == self.owner.read(), VaultError::Unauthorized);
        }

        fn _assert_not_paused(self: @ContractState) {
            assert(!self.paused.read(), VaultError::Paused);
        }

        fn _transfer(
            ref self: ContractState,
            sender: ContractAddress,
            recipient: ContractAddress,
            amount: u256,
        ) {
            let sender_balance = self.balances.read(sender);
            assert(sender_balance >= amount, VaultError::InsufficientShares);
            self.balances.write(sender, sender_balance - amount);
            self.balances.write(recipient, self.balances.read(recipient) + amount);
            self.emit(Transfer { from: sender, to: recipient, value: amount });
        }

        fn _approve(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256,
        ) {
            self.allowances.write((owner, spender), amount);
            self.emit(Approval { owner, spender, value: amount });
        }

        fn _spend_allowance(
            ref self: ContractState, owner: ContractAddress, spender: ContractAddress, amount: u256,
        ) {
            let current_allowance = self.allowances.read((owner, spender));
            assert(current_allowance >= amount, VaultError::InsufficientAllowance);
            self.allowances.write((owner, spender), current_allowance - amount);
        }

        fn _mint(ref self: ContractState, account: ContractAddress, amount: u256) {
            self.total_supply.write(self.total_supply.read() + amount);
            self.balances.write(account, self.balances.read(account) + amount);
            self.emit(Transfer { from: Zero::zero(), to: account, value: amount });
        }

        fn _burn(ref self: ContractState, account: ContractAddress, amount: u256) {
            let balance = self.balances.read(account);
            assert(balance >= amount, VaultError::InsufficientShares);
            self.balances.write(account, balance - amount);
            self.total_supply.write(self.total_supply.read() - amount);
            self.emit(Transfer { from: account, to: Zero::zero(), value: amount });
        }

        fn _forward_to_strategy(ref self: ContractState, amount: u256) {
            let strategy_addr = self.current_strategy.read();
            if !strategy_addr.is_zero() {
                let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
                let strategy = IStrategyDispatcher { contract_address: strategy_addr };
                asset_token.approve(strategy_addr, amount);
                strategy.deposit(amount);
            }
        }

        fn _pull_from_strategy(ref self: ContractState, amount: u256) {
            let vault = get_contract_address();
            let asset_token = IERC20Dispatcher { contract_address: self.asset.read() };
            let vault_balance = asset_token.balance_of(vault);

            if vault_balance < amount {
                let strategy_addr = self.current_strategy.read();
                if !strategy_addr.is_zero() {
                    let strategy = IStrategyDispatcher { contract_address: strategy_addr };
                    let needed = amount - vault_balance;
                    strategy.withdraw(needed);
                }
            }
        }

        fn _convert_to_shares(assets: u256, total_supply: u256, total_assets: u256) -> u256 {
            let supply_with_offset = total_supply + VIRTUAL_OFFSET;
            let assets_with_offset = total_assets + VIRTUAL_OFFSET;
            (assets * supply_with_offset) / assets_with_offset
        }

        fn _convert_to_assets(shares: u256, total_supply: u256, total_assets: u256) -> u256 {
            let supply_with_offset = total_supply + VIRTUAL_OFFSET;
            let assets_with_offset = total_assets + VIRTUAL_OFFSET;
            (shares * assets_with_offset) / supply_with_offset
        }

        fn _convert_to_shares_round_up(
            assets: u256, total_supply: u256, total_assets: u256,
        ) -> u256 {
            let supply_with_offset = total_supply + VIRTUAL_OFFSET;
            let assets_with_offset = total_assets + VIRTUAL_OFFSET;
            let numerator = assets * supply_with_offset;
            (numerator + assets_with_offset - 1) / assets_with_offset
        }

        fn _convert_to_assets_round_up(
            shares: u256, total_supply: u256, total_assets: u256,
        ) -> u256 {
            let supply_with_offset = total_supply + VIRTUAL_OFFSET;
            let assets_with_offset = total_assets + VIRTUAL_OFFSET;
            let numerator = shares * assets_with_offset;
            (numerator + supply_with_offset - 1) / supply_with_offset
        }
    }
}
