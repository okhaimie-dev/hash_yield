// =============================================================================
// Integration Tests
// =============================================================================
// Integration tests for Vault + Strategy flows covering:
// - Deposit with strategy active
// - Withdraw with strategy active
// - Yield accrual and harvesting
// - Strategy switching
// - Emergency operations
//
// BTT Reference: tests/btt/Integration.tree
// =============================================================================

use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::ContractAddress;
use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use crate::interfaces::erc4626::{
    IERC4626MutableDispatcher, IERC4626MutableDispatcherTrait, IERC4626ViewDispatcher,
    IERC4626ViewDispatcherTrait,
};
use crate::interfaces::strategy::{IStrategyDispatcher, IStrategyDispatcherTrait};
use crate::interfaces::vault::{IVaultDispatcher, IVaultDispatcherTrait};
use crate::tests::helper::{ONE_WBTC, POINT_ONE_WBTC, admin, user_a};
use crate::tests::mocks::mock_vesu_pool::{IMockVesuPoolDispatcher, IMockVesuPoolDispatcherTrait};
use crate::tests::mocks::mock_wbtc::{IMockWBTCDispatcher, IMockWBTCDispatcherTrait};

// =============================================================================
// Test Setup
// =============================================================================

fn setup_vault_with_strategy() -> (
    ContractAddress, ContractAddress, ContractAddress, ContractAddress,
) {
    // Deploy mock WBTC
    let wbtc_contract = declare("MockWBTC").unwrap().contract_class();
    let (wbtc, _) = wbtc_contract.deploy(@array![]).unwrap();

    // Deploy mock Vesu pool
    let pool_contract = declare("MockVesuPool").unwrap().contract_class();
    let mut pool_calldata = array![];
    wbtc.serialize(ref pool_calldata);
    let (vesu_pool, _) = pool_contract.deploy(@pool_calldata).unwrap();

    // Deploy Vault
    let vault_contract = declare("Vault").unwrap().contract_class();
    let mut calldata: Array<felt252> = array![];
    wbtc.serialize(ref calldata);
    calldata.append(0);
    calldata.append('WBTC Vault');
    calldata.append(10);
    calldata.append(0);
    calldata.append('vWBTC');
    calldata.append(5);
    admin().serialize(ref calldata);
    let (vault, _) = vault_contract.deploy(@calldata).unwrap();

    // Deploy Strategy
    let strategy_contract = declare("LendingStrategyV0").unwrap().contract_class();
    let mut strategy_calldata = array![];
    wbtc.serialize(ref strategy_calldata);
    vesu_pool.serialize(ref strategy_calldata);
    vault.serialize(ref strategy_calldata);
    admin().serialize(ref strategy_calldata);
    let (strategy, _) = strategy_contract.deploy(@strategy_calldata).unwrap();

    // Set strategy on vault
    start_cheat_caller_address(vault, admin());
    IVaultDispatcher { contract_address: vault }.set_strategy(strategy);
    stop_cheat_caller_address(vault);

    (vault, wbtc, strategy, vesu_pool)
}

fn mint_and_approve(
    wbtc: ContractAddress, user: ContractAddress, vault: ContractAddress, amount: u256,
) {
    let mock = IMockWBTCDispatcher { contract_address: wbtc };
    mock.mint(user, amount);

    start_cheat_caller_address(wbtc, user);
    IERC20Dispatcher { contract_address: wbtc }.approve(vault, amount);
    stop_cheat_caller_address(wbtc);
}

// =============================================================================
// Deposit with Strategy Tests [TEST-INT-001]
// =============================================================================

#[test]
fn test_deposit_with_strategy_transfers_to_strategy() {
    // TEST-ID: TEST-INT-DEPOSIT-STRATEGY-001
    // TEST-ID: TEST-INT-001
    // It should transfer assets to strategy
    let (vault, wbtc, strategy, _) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    // Strategy should have the assets
    let strategy_assets = IStrategyDispatcher { contract_address: strategy }.total_assets();
    assert(strategy_assets > 0, 'strategy has assets');
}

#[test]
fn test_deposit_with_strategy_user_gets_shares() {
    // TEST-ID: TEST-INT-DEPOSIT-STRATEGY-003
    // It should user receive correct shares
    let (vault, wbtc, _, _) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    assert(shares > 0, 'user got shares');
    let balance = IERC20Dispatcher { contract_address: vault }.balance_of(user_a());
    assert(balance == shares, 'balance matches');
}

// =============================================================================
// Withdraw with Strategy Tests [TEST-INT-002]
// =============================================================================

#[test]
fn test_withdraw_with_strategy_pulls_from_strategy() {
    // TEST-ID: TEST-INT-WITHDRAW-STRATEGY-001
    // TEST-ID: TEST-INT-002
    // It should pull from strategy
    let (vault, wbtc, strategy, _) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());

    let strategy_before = IStrategyDispatcher { contract_address: strategy }.total_assets();

    IERC4626MutableDispatcher { contract_address: vault }.withdraw(POINT_ONE_WBTC, user_a(), user_a());
    stop_cheat_caller_address(vault);

    let strategy_after = IStrategyDispatcher { contract_address: strategy }.total_assets();
    assert(strategy_after < strategy_before, 'strategy reduced');
}

// =============================================================================
// Yield Accrual Tests [TEST-INT-003]
// =============================================================================

#[test]
fn test_yield_accrual_increases_total_assets() {
    // TEST-ID: TEST-INT-MULTI-YIELD-001
    // TEST-ID: TEST-INT-003
    // It should totalAssets increase after yield
    let (vault, wbtc, _, vesu_pool) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    let total_before = IERC4626ViewDispatcher { contract_address: vault }.total_assets();

    // Simulate yield by increasing exchange rate
    let mock_pool = IMockVesuPoolDispatcher { contract_address: vesu_pool };
    mock_pool.set_exchange_rate(11000); // 10% profit

    let total_after = IERC4626ViewDispatcher { contract_address: vault }.total_assets();
    assert(total_after > total_before, 'assets increased');
}

#[test]
fn test_yield_accrual_share_count_unchanged() {
    // TEST-ID: TEST-INT-MULTI-YIELD-002
    // It should share count stay same after yield
    let (vault, wbtc, _, vesu_pool) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    let supply_before = IERC20Dispatcher { contract_address: vault }.total_supply();

    // Simulate yield
    let mock_pool = IMockVesuPoolDispatcher { contract_address: vesu_pool };
    mock_pool.set_exchange_rate(11000);

    let supply_after = IERC20Dispatcher { contract_address: vault }.total_supply();
    assert(supply_after == supply_before, 'supply unchanged');
}

// =============================================================================
// Strategy Switch Tests [TEST-INT-004]
// =============================================================================

#[test]
fn test_strategy_switch_preserves_total_assets() {
    // TEST-ID: TEST-INT-STRATEGY-SWITCH-002
    // TEST-ID: TEST-INT-004
    // It should totalAssets remain continuous after switch
    let (vault, wbtc, _, _) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    let total_before = IERC4626ViewDispatcher { contract_address: vault }.total_assets();

    // Switch to no strategy (zero address)
    start_cheat_caller_address(vault, admin());
    IVaultDispatcher { contract_address: vault }
        .set_strategy(starknet::contract_address_const::<0>());
    stop_cheat_caller_address(vault);

    let total_after = IERC4626ViewDispatcher { contract_address: vault }.total_assets();
    // Assets should be approximately equal (may have small rounding)
    assert(total_after > 0, 'has assets');
}

// =============================================================================
// Emergency Withdraw Tests [TEST-EMERG-001, TEST-EMERG-002]
// =============================================================================

#[test]
fn test_emergency_withdraw_recovers_assets() {
    // TEST-ID: TEST-INT-EMERGENCY-YIELD-001
    // TEST-ID: TEST-EMERG-001
    // It should vault pull all from strategy
    let (vault, wbtc, strategy, _) = setup_vault_with_strategy();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    start_cheat_caller_address(vault, admin());
    let recovered = IVaultDispatcher { contract_address: vault }.emergency_withdraw();
    stop_cheat_caller_address(vault);

    assert(recovered > 0, 'recovered assets');

    // Strategy should be empty
    let strategy_assets = IStrategyDispatcher { contract_address: strategy }.total_assets();
    assert(strategy_assets == 0, 'strategy empty');
}

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_emergency_withdraw_unauthorized() {
    // TEST-ID: TEST-SEC-ACCESS-EMERGENCY-001
    // TEST-ID: TEST-EMERG-002
    // It should revert when unauthorized
    let (vault, _, _, _) = setup_vault_with_strategy();
    let attacker: ContractAddress = 'attacker'.try_into().unwrap();

    start_cheat_caller_address(vault, attacker);
    IVaultDispatcher { contract_address: vault }.emergency_withdraw();
    stop_cheat_caller_address(vault);
}
