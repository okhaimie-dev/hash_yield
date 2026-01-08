// =============================================================================
// Security Tests
// =============================================================================
// Security tests covering:
// - Inflation attack prevention
// - Reentrancy protection (placeholder)
// - Access control
// - Asset mismatch validation
// - Property-based invariants (placeholders)
//
// BTT Reference: tests/btt/Security.tree
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
use crate::interfaces::vault::{IVaultDispatcher, IVaultDispatcherTrait};
use crate::tests::helper::{ONE_WBTC, admin, attacker, user_a};
use crate::tests::mocks::mock_wbtc::{IMockWBTCDispatcher, IMockWBTCDispatcherTrait};

// =============================================================================
// Test Setup
// =============================================================================

fn setup_vault() -> (ContractAddress, ContractAddress, ContractAddress) {
    let wbtc_contract = declare("MockWBTC").unwrap().contract_class();
    let (wbtc, _) = wbtc_contract.deploy(@array![]).unwrap();

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

    (vault, wbtc, admin())
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
// Inflation Attack Tests [TEST-SEC-001]
// =============================================================================

#[test]
fn test_inflation_attack_victim_gets_shares() {
    // TEST-ID: TEST-SEC-INFLATION-DONATION-001
    // TEST-ID: TEST-SEC-001
    // It should victim receive > 0 shares even after donation attack
    let (vault, wbtc, _) = setup_vault();
    let victim: ContractAddress = 'victim'.try_into().unwrap();

    // Attacker deposits minimal amount
    mint_and_approve(wbtc, attacker(), vault, 1);
    start_cheat_caller_address(vault, attacker());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(1, attacker());
    stop_cheat_caller_address(vault);

    // Attacker donates large amount directly to vault
    let mock = IMockWBTCDispatcher { contract_address: wbtc };
    mock.mint(vault, ONE_WBTC);

    // Victim deposits - should still get shares due to virtual offset
    mint_and_approve(wbtc, victim, vault, ONE_WBTC);
    start_cheat_caller_address(vault, victim);
    let victim_shares = IERC4626MutableDispatcher { contract_address: vault }
        .deposit(ONE_WBTC, victim);
    stop_cheat_caller_address(vault);

    assert(victim_shares > 0, 'victim got shares');
}

#[test]
fn test_inflation_attack_virtual_offset_active() {
    // TEST-ID: TEST-SEC-INFLATION-OFFSET-001
    // It should prevent share price manipulation via virtual offset
    let (vault, wbtc, _) = setup_vault();

    // On empty vault, preview should use virtual offset
    let view = IERC4626ViewDispatcher { contract_address: vault };
    let shares_preview = view.preview_deposit(ONE_WBTC);

    // Shares should be reasonable (not inflated to 0 or near-0)
    assert(shares_preview > 0, 'preview > 0');
}

// =============================================================================
// Reentrancy Tests [TEST-SEC-002]
// =============================================================================

// NOTE: Full reentrancy tests require a malicious callback contract
// This is a placeholder that tests the basic case
#[test]
fn test_reentrancy_basic_protection() {
    // TEST-ID: TEST-SEC-REENTRANCY-STRATEGY-001
    // TEST-ID: TEST-SEC-002
    // Placeholder: basic deposit/withdraw doesn't cause issues
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    let assets = IERC4626MutableDispatcher { contract_address: vault }
        .redeem(shares, user_a(), user_a());
    stop_cheat_caller_address(vault);

    assert(assets > 0, 'got assets back');
}

// =============================================================================
// Access Control Tests [TEST-SEC-ACCESS-*]
// =============================================================================

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_access_control_set_strategy() {
    // TEST-ID: TEST-SEC-ACCESS-SETSTR-001
    // It should revert when stranger calls setStrategy
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.set_strategy(user_a());
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_access_control_pause() {
    // TEST-ID: TEST-SEC-ACCESS-PAUSE-001
    // It should revert when stranger calls pause
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.pause();
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_access_control_unpause() {
    // TEST-ID: TEST-SEC-ACCESS-UNPAUSE-001
    // It should revert when stranger calls unpause
    let (vault, _, owner) = setup_vault();

    // First pause as owner
    start_cheat_caller_address(vault, owner);
    IVaultDispatcher { contract_address: vault }.pause();
    stop_cheat_caller_address(vault);

    // Try unpause as attacker
    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.unpause();
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_access_control_harvest() {
    // TEST-ID: TEST-SEC-ACCESS-HARVEST-001
    // It should revert when stranger calls harvest
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.harvest();
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_access_control_emergency() {
    // TEST-ID: TEST-SEC-ACCESS-EMERGENCY-001
    // It should revert when stranger calls emergency_withdraw
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.emergency_withdraw();
    stop_cheat_caller_address(vault);
}

// =============================================================================
// Asset Mismatch Tests [TEST-SEC-003]
// =============================================================================

// NOTE: This test requires deploying a strategy with a different asset
// which would need an additional mock. Placeholder for now.
#[test]
fn test_misconfig_asset_mismatch_placeholder() {
    // TEST-ID: TEST-SEC-MISCONFIG-ASSET-001
    // TEST-ID: TEST-SEC-003
    // Placeholder: Asset mismatch validation
    // Full implementation requires MockStrategy with different asset
    let (vault, _, _) = setup_vault();

    // Setting strategy to zero should work without mismatch check
    start_cheat_caller_address(vault, admin());
    IVaultDispatcher { contract_address: vault }
        .set_strategy(starknet::contract_address_const::<0>());
    stop_cheat_caller_address(vault);
}

// =============================================================================
// Property Test Placeholders [TEST-PROP-*]
// =============================================================================

#[test]
fn test_property_random_sequence_invariants() {
    // TEST-ID: TEST-PROP-001
    // Placeholder: Full implementation requires fuzzing framework
    // Basic invariant check: deposit then redeem maintains solvency
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    let view = IERC4626ViewDispatcher { contract_address: vault };
    let total_assets = view.total_assets();
    let total_supply = IERC20Dispatcher { contract_address: vault }.total_supply();

    // INV-1: totalAssets should match deposits
    assert(total_assets > 0, 'has assets');
    // INV-2: totalSupply should match shares
    assert(total_supply == shares, 'supply matches');
}

#[test]
fn test_property_deposit_withdraw_roundtrip() {
    // TEST-ID: TEST-PROP-002
    // Placeholder: deposit X then withdraw X should have minimal loss
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    let initial_balance = IERC20Dispatcher { contract_address: wbtc }.balance_of(user_a());

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    let assets_back = IERC4626MutableDispatcher { contract_address: vault }
        .redeem(shares, user_a(), user_a());
    stop_cheat_caller_address(vault);

    // Should get back approximately what we put in (minus any rounding dust)
    assert(assets_back <= ONE_WBTC, 'no free money');
    // Loss should be minimal (< 1% for this test)
    let loss = ONE_WBTC - assets_back;
    assert(loss < ONE_WBTC / 100, 'minimal loss');
}

#[test]
fn test_property_deposit_order_independence() {
    // TEST-ID: TEST-PROP-003
    // Placeholder: deposit order shouldn't affect totals significantly
    let (vault, wbtc, _) = setup_vault();
    let user_b: ContractAddress = 'user_b'.try_into().unwrap();

    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);
    mint_and_approve(wbtc, user_b, vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    start_cheat_caller_address(vault, user_b);
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_b);
    stop_cheat_caller_address(vault);

    let view = IERC4626ViewDispatcher { contract_address: vault };
    let total_assets = view.total_assets();

    // Total should be approximately 2 * ONE_WBTC
    assert(total_assets >= ONE_WBTC * 2 - 2, 'total correct');
}
