// =============================================================================
// Vault Contract Tests
// =============================================================================
// Unit tests for the Vault contract covering:
// - Initialization
// - ERC-4626 deposit/mint/withdraw/redeem
// - Preview and max functions
// - Admin functions (strategy, pause, harvest, emergency)
//
// BTT Reference: tests/btt/Vault.tree
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
use crate::tests::helper::{ONE_WBTC, POINT_ONE_WBTC, admin, attacker, user_a};
use crate::tests::mocks::mock_wbtc::{IMockWBTCDispatcher, IMockWBTCDispatcherTrait};

// =============================================================================
// Test Setup
// =============================================================================

fn setup_vault() -> (ContractAddress, ContractAddress, ContractAddress) {
    // Deploy mock WBTC
    let wbtc_contract = declare("MockWBTC").unwrap().contract_class();
    let (wbtc, _) = wbtc_contract.deploy(@array![]).unwrap();

    // Deploy Vault - use calldata array for constructor
    let vault_contract = declare("Vault").unwrap().contract_class();
    let mut calldata: Array<felt252> = array![];

    // asset_address
    wbtc.serialize(ref calldata);
    // name (ByteArray) - serialize as: len, pending_word, pending_word_len
    calldata.append(0); // empty data array len
    calldata.append('WBTC Vault'); // pending_word
    calldata.append(10); // pending_word_len
    // symbol (ByteArray)
    calldata.append(0);
    calldata.append('vWBTC');
    calldata.append(5);
    // owner
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
// Initialization Tests [TEST-VAULT-INIT]
// =============================================================================

#[test]
fn test_vault_init_zero_total_supply() {
    // TEST-ID: TEST-VAULT-INIT-001
    // It should have zero totalSupply
    let (vault, _, _) = setup_vault();
    let erc20 = IERC20Dispatcher { contract_address: vault };
    assert(erc20.total_supply() == 0, 'total_supply should be 0');
}

#[test]
fn test_vault_init_zero_total_assets() {
    // TEST-ID: TEST-VAULT-INIT-002
    // It should have zero totalAssets
    let (vault, _, _) = setup_vault();
    let erc4626 = IERC4626ViewDispatcher { contract_address: vault };
    assert(erc4626.total_assets() == 0, 'total_assets should be 0');
}

#[test]
fn test_vault_init_correct_asset() {
    // TEST-ID: TEST-VAULT-INIT-003
    // It should set asset to configured WBTC
    let (vault, wbtc, _) = setup_vault();
    let erc4626 = IERC4626ViewDispatcher { contract_address: vault };
    assert(erc4626.asset() == wbtc, 'asset should be WBTC');
}

#[test]
fn test_vault_init_correct_owner() {
    // TEST-ID: TEST-VAULT-INIT-004
    // It should set owner correctly - test via admin function
    let (vault, _, owner) = setup_vault();
    start_cheat_caller_address(vault, owner);
    IVaultDispatcher { contract_address: vault }.pause();
    stop_cheat_caller_address(vault);
    // If no revert, owner is correct
}

// =============================================================================
// Deposit Tests [TEST-VAULT-DEPOSIT]
// =============================================================================

#[test]
fn test_vault_deposit_empty_mints_shares() {
    // TEST-ID: TEST-VAULT-DEPOSIT-EMPTY-001
    // It should mint shares on empty vault
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    assert(shares > 0, 'should mint shares');
}

#[test]
fn test_vault_deposit_updates_total_assets() {
    // TEST-ID: TEST-VAULT-DEPOSIT-EMPTY-002
    // It should update totalAssets
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);

    let total = IERC4626ViewDispatcher { contract_address: vault }.total_assets();
    assert(total == ONE_WBTC, 'total should equal deposit');
}

#[test]
#[should_panic(expected: ('ZERO_ASSETS',))]
fn test_vault_deposit_zero_reverts() {
    // TEST-ID: TEST-VAULT-DEPOSIT-ZERO-001
    // It should revert with ZeroAssets
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(0, user_a());
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('PAUSED',))]
fn test_vault_deposit_paused_reverts() {
    // TEST-ID: TEST-VAULT-DEPOSIT-PAUSED-001
    // It should revert with Paused
    let (vault, wbtc, owner) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    // Pause vault
    start_cheat_caller_address(vault, owner);
    IVaultDispatcher { contract_address: vault }.pause();
    stop_cheat_caller_address(vault);

    // Try deposit
    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    stop_cheat_caller_address(vault);
}

// =============================================================================
// Mint Tests [TEST-VAULT-MINT]
// =============================================================================

#[test]
fn test_vault_mint_pulls_assets() {
    // TEST-ID: TEST-VAULT-MINT-EMPTY-001
    // It should pull assets on empty vault
    let (vault, wbtc, _) = setup_vault();
    let shares_to_mint = ONE_WBTC;
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC * 2);

    start_cheat_caller_address(vault, user_a());
    let assets = IERC4626MutableDispatcher { contract_address: vault }
        .mint(shares_to_mint, user_a());
    stop_cheat_caller_address(vault);

    assert(assets > 0, 'should pull assets');
}

#[test]
#[should_panic(expected: ('ZERO_SHARES',))]
fn test_vault_mint_zero_reverts() {
    // TEST-ID: TEST-VAULT-MINT-ZERO-001
    // It should revert with ZeroShares
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.mint(0, user_a());
    stop_cheat_caller_address(vault);
}

// =============================================================================
// Withdraw Tests [TEST-VAULT-WITHDRAW]
// =============================================================================

#[test]
fn test_vault_withdraw_success() {
    // TEST-ID: TEST-VAULT-WITHDRAW-SUCCESS-001
    // It should burn shares and transfer assets
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());

    let shares_burned = IERC4626MutableDispatcher { contract_address: vault }
        .withdraw(POINT_ONE_WBTC, user_a(), user_a());
    stop_cheat_caller_address(vault);

    assert(shares_burned > 0, 'should burn shares');

    let user_balance = IERC20Dispatcher { contract_address: wbtc }.balance_of(user_a());
    assert(user_balance == POINT_ONE_WBTC, 'should receive assets');
}

#[test]
#[should_panic(expected: ('ZERO_ASSETS',))]
fn test_vault_withdraw_zero_reverts() {
    // TEST-ID: TEST-VAULT-WITHDRAW-ZERO-001
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.withdraw(0, user_a(), user_a());
    stop_cheat_caller_address(vault);
}

// =============================================================================
// Redeem Tests [TEST-VAULT-REDEEM]
// =============================================================================

#[test]
fn test_vault_redeem_success() {
    // TEST-ID: TEST-VAULT-REDEEM-SUCCESS-001
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    let shares = IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());

    let half_shares = shares / 2;
    let assets = IERC4626MutableDispatcher { contract_address: vault }
        .redeem(half_shares, user_a(), user_a());
    stop_cheat_caller_address(vault);

    assert(assets > 0, 'should receive assets');
}

#[test]
#[should_panic(expected: ('ZERO_SHARES',))]
fn test_vault_redeem_zero_reverts() {
    // TEST-ID: TEST-VAULT-REDEEM-ZERO-001
    let (vault, wbtc, _) = setup_vault();
    mint_and_approve(wbtc, user_a(), vault, ONE_WBTC);

    start_cheat_caller_address(vault, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.deposit(ONE_WBTC, user_a());
    IERC4626MutableDispatcher { contract_address: vault }.redeem(0, user_a(), user_a());
    stop_cheat_caller_address(vault);
}

// =============================================================================
// Preview/Max Tests [TEST-VAULT-PREVIEW, TEST-VAULT-MAX]
// =============================================================================

#[test]
fn test_vault_preview_deposit() {
    // TEST-ID: TEST-VAULT-PREVIEW-001
    let (vault, _, _) = setup_vault();
    let view = IERC4626ViewDispatcher { contract_address: vault };

    let preview = view.preview_deposit(ONE_WBTC);
    let convert = view.convert_to_shares(ONE_WBTC);
    assert(preview == convert, 'preview == convert');
}

#[test]
fn test_vault_max_deposit_unlimited() {
    // TEST-ID: TEST-VAULT-MAX-001
    let (vault, _, _) = setup_vault();
    let view = IERC4626ViewDispatcher { contract_address: vault };

    let max = view.max_deposit(user_a());
    assert(max > 0, 'max should be > 0');
}

#[test]
fn test_vault_max_zero_when_paused() {
    // TEST-ID: TEST-VAULT-MAX-005
    let (vault, _, owner) = setup_vault();

    start_cheat_caller_address(vault, owner);
    IVaultDispatcher { contract_address: vault }.pause();
    stop_cheat_caller_address(vault);

    let view = IERC4626ViewDispatcher { contract_address: vault };
    assert(view.max_deposit(user_a()) == 0, 'max_deposit 0');
    assert(view.max_mint(user_a()) == 0, 'max_mint 0');
}

// =============================================================================
// Admin Function Tests
// =============================================================================

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_vault_set_strategy_unauthorized() {
    // TEST-ID: TEST-VAULT-SET-STRATEGY-UNAUTHORIZED-001
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.set_strategy(user_a());
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('NO_STRATEGY',))]
fn test_vault_harvest_no_strategy() {
    // TEST-ID: TEST-VAULT-HARVEST-NO-STRATEGY-001
    let (vault, _, owner) = setup_vault();

    start_cheat_caller_address(vault, owner);
    IVaultDispatcher { contract_address: vault }.harvest();
    stop_cheat_caller_address(vault);
}

#[test]
fn test_vault_emergency_no_strategy_returns_zero() {
    // TEST-ID: TEST-VAULT-EMERGENCY-NO-STRATEGY-001
    let (vault, _, owner) = setup_vault();

    start_cheat_caller_address(vault, owner);
    let recovered = IVaultDispatcher { contract_address: vault }.emergency_withdraw();
    stop_cheat_caller_address(vault);

    assert(recovered == 0, 'should return 0');
}

#[test]
fn test_vault_pause_unpause() {
    // TEST-ID: TEST-VAULT-PAUSE-SUCCESS-001, TEST-VAULT-UNPAUSE-SUCCESS-001
    let (vault, _, owner) = setup_vault();
    let view = IERC4626ViewDispatcher { contract_address: vault };

    start_cheat_caller_address(vault, owner);
    IVaultDispatcher { contract_address: vault }.pause();
    assert(view.max_deposit(user_a()) == 0, 'paused');

    IVaultDispatcher { contract_address: vault }.unpause();
    assert(view.max_deposit(user_a()) > 0, 'unpaused');
    stop_cheat_caller_address(vault);
}

#[test]
#[should_panic(expected: ('UNAUTHORIZED',))]
fn test_vault_pause_unauthorized() {
    // TEST-ID: TEST-VAULT-PAUSE-UNAUTHORIZED-001
    let (vault, _, _) = setup_vault();

    start_cheat_caller_address(vault, attacker());
    IVaultDispatcher { contract_address: vault }.pause();
    stop_cheat_caller_address(vault);
}
