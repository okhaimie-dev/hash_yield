// =============================================================================
// Strategy Contract Tests
// =============================================================================
// Unit tests for the LendingStrategyV0 contract covering:
// - Initialization
// - Deposit/withdraw operations
// - Harvest and profit/loss reporting
// - Emergency withdrawal
//
// BTT Reference: tests/btt/Strategy.tree
// =============================================================================

use snforge_std::{
    ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address,
    stop_cheat_caller_address,
};
use starknet::ContractAddress;
use crate::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
use crate::interfaces::strategy::{IStrategyDispatcher, IStrategyDispatcherTrait};
use crate::strategies::lending_strategy_v0::{
    ILendingStrategyV0ViewDispatcher, ILendingStrategyV0ViewDispatcherTrait,
};
use crate::tests::helper::{ONE_WBTC, POINT_ONE_WBTC, admin, attacker};
use crate::tests::mocks::mock_vesu_pool::{IMockVesuPoolDispatcher, IMockVesuPoolDispatcherTrait};
use crate::tests::mocks::mock_wbtc::{IMockWBTCDispatcher, IMockWBTCDispatcherTrait};

// =============================================================================
// Test Setup
// =============================================================================

fn setup_strategy() -> (ContractAddress, ContractAddress, ContractAddress, ContractAddress) {
    // Deploy mock WBTC
    let wbtc_contract = declare("MockWBTC").unwrap().contract_class();
    let (wbtc, _) = wbtc_contract.deploy(@array![]).unwrap();

    // Deploy mock Vesu pool
    let pool_contract = declare("MockVesuPool").unwrap().contract_class();
    let mut pool_calldata = array![];
    wbtc.serialize(ref pool_calldata);
    let (vesu_pool, _) = pool_contract.deploy(@pool_calldata).unwrap();

    // Use admin() as both vault and owner for testing
    let vault = admin();
    let owner = admin();

    // Deploy strategy
    let strategy_contract = declare("LendingStrategyV0").unwrap().contract_class();
    let mut calldata = array![];
    wbtc.serialize(ref calldata);
    vesu_pool.serialize(ref calldata);
    vault.serialize(ref calldata);
    owner.serialize(ref calldata);
    let (strategy, _) = strategy_contract.deploy(@calldata).unwrap();

    (strategy, wbtc, vesu_pool, vault)
}

fn mint_wbtc_to_vault(wbtc: ContractAddress, vault: ContractAddress, amount: u256) {
    let mock = IMockWBTCDispatcher { contract_address: wbtc };
    mock.mint(vault, amount);
}

fn approve_strategy(
    wbtc: ContractAddress, vault: ContractAddress, strategy: ContractAddress, amount: u256,
) {
    start_cheat_caller_address(wbtc, vault);
    IERC20Dispatcher { contract_address: wbtc }.approve(strategy, amount);
    stop_cheat_caller_address(wbtc);
}

// =============================================================================
// Initialization Tests [TEST-STRATEGY-INIT]
// =============================================================================

#[test]
fn test_strategy_init_correct_asset() {
    // TEST-ID: TEST-STRATEGY-INIT-001
    // It should set asset correctly
    let (strategy, wbtc, _, _) = setup_strategy();
    let s = IStrategyDispatcher { contract_address: strategy };
    assert(s.asset() == wbtc, 'asset should be WBTC');
}

#[test]
fn test_strategy_init_correct_vault() {
    // TEST-ID: TEST-STRATEGY-INIT-002
    // It should set vault correctly
    let (strategy, _, _, vault) = setup_strategy();
    let view = ILendingStrategyV0ViewDispatcher { contract_address: strategy };
    assert(view.vault() == vault, 'vault should be set');
}

#[test]
fn test_strategy_init_correct_vtoken() {
    // TEST-ID: TEST-STRATEGY-INIT-003
    // It should set v_token correctly
    let (strategy, _, vesu_pool, _) = setup_strategy();
    let view = ILendingStrategyV0ViewDispatcher { contract_address: strategy };
    assert(view.v_token() == vesu_pool, 'v_token should be set');
}

#[test]
fn test_strategy_init_zero_total_assets() {
    // TEST-ID: TEST-STRATEGY-INIT-004
    // It should have zero totalAssets
    let (strategy, _, _, _) = setup_strategy();
    let s = IStrategyDispatcher { contract_address: strategy };
    assert(s.total_assets() == 0, 'total_assets should be 0');
}

// =============================================================================
// Deposit Tests [TEST-STRATEGY-DEPOSIT]
// =============================================================================

#[test]
fn test_strategy_deposit_from_vault() {
    // TEST-ID: TEST-STRATEGY-DEPOSIT-VAULT-001, 002, 003
    // It should deposit into VToken when called by vault
    let (strategy, wbtc, vesu_pool, vault) = setup_strategy();

    // Setup: mint WBTC to vault and approve strategy
    mint_wbtc_to_vault(wbtc, vault, ONE_WBTC);
    approve_strategy(wbtc, vault, strategy, ONE_WBTC);

    // Deposit as vault
    start_cheat_caller_address(strategy, vault);
    let deposited = IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);
    stop_cheat_caller_address(strategy);

    assert(deposited == ONE_WBTC, 'should return deposited amount');

    // Verify lastReportedAssets updated
    let view = ILendingStrategyV0ViewDispatcher { contract_address: strategy };
    assert(view.last_reported_assets() == ONE_WBTC, 'lastReported should update');
}

#[test]
fn test_strategy_deposit_zero_returns_zero() {
    // TEST-ID: TEST-STRATEGY-DEPOSIT-ZERO-001
    // It should return 0 for zero amount
    let (strategy, _, _, vault) = setup_strategy();

    start_cheat_caller_address(strategy, vault);
    let deposited = IStrategyDispatcher { contract_address: strategy }.deposit(0);
    stop_cheat_caller_address(strategy);

    assert(deposited == 0, 'should return 0');
}

#[test]
#[should_panic(expected: ('CALLER_NOT_VAULT',))]
fn test_strategy_deposit_unauthorized() {
    // TEST-ID: TEST-STRATEGY-DEPOSIT-UNAUTHORIZED-001
    // It should revert when non-vault calls
    let (strategy, _, _, _) = setup_strategy();

    start_cheat_caller_address(strategy, attacker());
    IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);
    stop_cheat_caller_address(strategy);
}

// =============================================================================
// Withdraw Tests [TEST-STRATEGY-WITHDRAW]
// =============================================================================

#[test]
fn test_strategy_withdraw_from_vault() {
    // TEST-ID: TEST-STRATEGY-WITHDRAW-VAULT-001, 002, 003
    // It should withdraw from VToken when called by vault
    let (strategy, wbtc, vesu_pool, vault) = setup_strategy();

    // Setup: deposit first
    mint_wbtc_to_vault(wbtc, vault, ONE_WBTC);
    approve_strategy(wbtc, vault, strategy, ONE_WBTC);

    start_cheat_caller_address(strategy, vault);
    IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);

    // Now withdraw
    let withdrawn = IStrategyDispatcher { contract_address: strategy }.withdraw(POINT_ONE_WBTC);
    stop_cheat_caller_address(strategy);

    assert(withdrawn == POINT_ONE_WBTC, 'should return withdrawn amount');
}

#[test]
#[should_panic(expected: ('CALLER_NOT_VAULT',))]
fn test_strategy_withdraw_unauthorized() {
    // TEST-ID: TEST-STRATEGY-WITHDRAW-UNAUTHORIZED-001
    // It should revert when non-vault calls
    let (strategy, _, _, _) = setup_strategy();

    start_cheat_caller_address(strategy, attacker());
    IStrategyDispatcher { contract_address: strategy }.withdraw(ONE_WBTC);
    stop_cheat_caller_address(strategy);
}

// =============================================================================
// WithdrawAll Tests [TEST-STRATEGY-WITHDRAW-ALL]
// =============================================================================

#[test]
fn test_strategy_withdraw_all_from_vault() {
    // TEST-ID: TEST-STRATEGY-WITHDRAW-ALL-VAULT-001, 002, 003, 004
    // It should withdraw all assets
    let (strategy, wbtc, vesu_pool, vault) = setup_strategy();

    // Setup: deposit first
    mint_wbtc_to_vault(wbtc, vault, ONE_WBTC);
    approve_strategy(wbtc, vault, strategy, ONE_WBTC);

    start_cheat_caller_address(strategy, vault);
    IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);

    // Withdraw all
    let withdrawn = IStrategyDispatcher { contract_address: strategy }.withdraw_all();
    stop_cheat_caller_address(strategy);

    assert(withdrawn > 0, 'should return withdrawn amount');

    // Verify totalAssets is 0
    let s = IStrategyDispatcher { contract_address: strategy };
    assert(s.total_assets() == 0, 'total_assets should be 0');
}

#[test]
#[should_panic(expected: ('CALLER_NOT_VAULT_OR_OWNER',))]
fn test_strategy_withdraw_all_unauthorized() {
    // TEST-ID: TEST-STRATEGY-WITHDRAW-ALL-UNAUTHORIZED-001
    // It should revert when unauthorized caller
    let (strategy, _, _, _) = setup_strategy();

    start_cheat_caller_address(strategy, attacker());
    IStrategyDispatcher { contract_address: strategy }.withdraw_all();
    stop_cheat_caller_address(strategy);
}

// =============================================================================
// TotalAssets Tests [TEST-STRATEGY-TOTAL-ASSETS]
// =============================================================================

#[test]
fn test_strategy_total_assets_zero_when_empty() {
    // TEST-ID: TEST-STRATEGY-TOTAL-ASSETS-ZERO-001
    // It should return 0 when no VToken shares
    let (strategy, _, _, _) = setup_strategy();
    let s = IStrategyDispatcher { contract_address: strategy };
    assert(s.total_assets() == 0, 'should be 0');
}

// =============================================================================
// Harvest Tests [TEST-STRATEGY-HARVEST]
// =============================================================================

#[test]
fn test_strategy_harvest_profit() {
    // TEST-ID: TEST-STRATEGY-HARVEST-PROFIT-001, 002, 003
    // It should report profit after yield accrual
    let (strategy, wbtc, vesu_pool, vault) = setup_strategy();

    // Setup: deposit
    mint_wbtc_to_vault(wbtc, vault, ONE_WBTC);
    approve_strategy(wbtc, vault, strategy, ONE_WBTC);

    start_cheat_caller_address(strategy, vault);
    IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);
    stop_cheat_caller_address(strategy);

    // Simulate yield by increasing exchange rate
    let mock_pool = IMockVesuPoolDispatcher { contract_address: vesu_pool };
    mock_pool.set_exchange_rate(11000); // 10% profit (10000 bps = 1:1, 11000 = 1.1:1)

    // Harvest
    start_cheat_caller_address(strategy, vault);
    let (profit, loss) = IStrategyDispatcher { contract_address: strategy }.harvest();
    stop_cheat_caller_address(strategy);

    assert(profit > 0, 'should report profit');
    assert(loss == 0, 'loss should be 0');
}

#[test]
fn test_strategy_harvest_loss() {
    // TEST-ID: TEST-STRATEGY-HARVEST-LOSS-001, 002
    // It should report loss after loss event
    let (strategy, wbtc, vesu_pool, vault) = setup_strategy();

    // Setup: deposit
    mint_wbtc_to_vault(wbtc, vault, ONE_WBTC);
    approve_strategy(wbtc, vault, strategy, ONE_WBTC);

    start_cheat_caller_address(strategy, vault);
    IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);
    stop_cheat_caller_address(strategy);

    // Simulate loss by decreasing exchange rate
    let mock_pool = IMockVesuPoolDispatcher { contract_address: vesu_pool };
    mock_pool.set_exchange_rate(9000); // 10% loss (9000 = 0.9:1)

    // Harvest
    start_cheat_caller_address(strategy, vault);
    let (profit, loss) = IStrategyDispatcher { contract_address: strategy }.harvest();
    stop_cheat_caller_address(strategy);

    assert(profit == 0, 'profit should be 0');
    assert(loss > 0, 'should report loss');
}

#[test]
#[should_panic(expected: ('CALLER_NOT_VAULT_OR_OWNER',))]
fn test_strategy_harvest_unauthorized() {
    // TEST-ID: TEST-STRATEGY-HARVEST-UNAUTHORIZED-001
    // It should revert when unauthorized
    let (strategy, _, _, _) = setup_strategy();

    start_cheat_caller_address(strategy, attacker());
    IStrategyDispatcher { contract_address: strategy }.harvest();
    stop_cheat_caller_address(strategy);
}

// =============================================================================
// Emergency Withdraw Tests [TEST-STRATEGY-EMERGENCY]
// =============================================================================

#[test]
fn test_strategy_emergency_withdraw_success() {
    // TEST-ID: TEST-STRATEGY-EMERGENCY-SUCCESS-001, 002, 003, 004
    // It should recover all assets in emergency
    let (strategy, wbtc, vesu_pool, vault) = setup_strategy();

    // Setup: deposit
    mint_wbtc_to_vault(wbtc, vault, ONE_WBTC);
    approve_strategy(wbtc, vault, strategy, ONE_WBTC);

    start_cheat_caller_address(strategy, vault);
    IStrategyDispatcher { contract_address: strategy }.deposit(ONE_WBTC);

    // Emergency withdraw
    let recovered = IStrategyDispatcher { contract_address: strategy }.emergency_withdraw();
    stop_cheat_caller_address(strategy);

    assert(recovered > 0, 'should recover assets');

    // Verify strategy is empty
    let s = IStrategyDispatcher { contract_address: strategy };
    assert(s.total_assets() == 0, 'should be empty');
}

#[test]
fn test_strategy_emergency_withdraw_empty() {
    // TEST-ID: TEST-STRATEGY-EMERGENCY-EMPTY-001
    // It should return 0 when no assets
    let (strategy, _, _, vault) = setup_strategy();

    start_cheat_caller_address(strategy, vault);
    let recovered = IStrategyDispatcher { contract_address: strategy }.emergency_withdraw();
    stop_cheat_caller_address(strategy);

    assert(recovered == 0, 'should return 0');
}

#[test]
#[should_panic(expected: ('CALLER_NOT_VAULT_OR_OWNER',))]
fn test_strategy_emergency_withdraw_unauthorized() {
    // TEST-ID: TEST-STRATEGY-EMERGENCY-UNAUTHORIZED-001
    // It should revert when unauthorized
    let (strategy, _, _, _) = setup_strategy();

    start_cheat_caller_address(strategy, attacker());
    IStrategyDispatcher { contract_address: strategy }.emergency_withdraw();
    stop_cheat_caller_address(strategy);
}
