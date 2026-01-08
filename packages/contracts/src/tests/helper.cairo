// =============================================================================
// Test Helpers
// =============================================================================
// Utility functions, deploy helpers, and test constants for the test suite.
// =============================================================================

use core::traits::TryInto;
use snforge_std::{ContractClassTrait, DeclareResultTrait, declare};
use starknet::ContractAddress;

// -----------------------------------------------------------------------------
// Test Addresses (Constants)
// -----------------------------------------------------------------------------
// Using felt252 strings converted to ContractAddress for readable test addresses

pub fn admin() -> ContractAddress {
    'ADMIN'.try_into().unwrap()
}

pub fn user_a() -> ContractAddress {
    'USER_A'.try_into().unwrap()
}

pub fn user_b() -> ContractAddress {
    'USER_B'.try_into().unwrap()
}

pub fn user_c() -> ContractAddress {
    'USER_C'.try_into().unwrap()
}

pub fn attacker() -> ContractAddress {
    'ATTACKER'.try_into().unwrap()
}

pub fn zero_address() -> ContractAddress {
    0.try_into().unwrap()
}

// -----------------------------------------------------------------------------
// Test Amounts (Constants)
// -----------------------------------------------------------------------------

/// 1 WBTC (assuming 8 decimals like Ethereum WBTC)
pub const ONE_WBTC: u256 = 100_000_000;

/// 0.1 WBTC
pub const POINT_ONE_WBTC: u256 = 10_000_000;

/// 1000 WBTC (large test amount)
pub const THOUSAND_WBTC: u256 = 100_000_000_000;

/// 1 wei (smallest unit)
pub const ONE_WEI: u256 = 1;

/// Max u256 value for testing overflow scenarios
pub const MAX_U256: u256 = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

// -----------------------------------------------------------------------------
// Deploy Helpers
// -----------------------------------------------------------------------------

/// Deploy a contract by name with no constructor arguments
pub fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

/// Deploy a contract by name with constructor arguments
pub fn deploy_contract_with_calldata(
    name: ByteArray, calldata: @Array<felt252>,
) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(calldata).unwrap();
    contract_address
}

// -----------------------------------------------------------------------------
// Math Helpers
// -----------------------------------------------------------------------------

/// Calculate absolute difference between two values
/// Returns (difference, is_negative) where is_negative is true if y > x
pub fn diff(x: u256, y: u256) -> (u256, bool) {
    if x < y {
        (y - x, true)
    } else {
        (x - y, false)
    }
}

/// Check if two values are equal within a tolerance (for rounding tests)
pub fn approx_eq(a: u256, b: u256, tolerance: u256) -> bool {
    let (difference, _) = diff(a, b);
    difference <= tolerance
}

// -----------------------------------------------------------------------------
// Assertion Helpers
// -----------------------------------------------------------------------------

/// Assert two u256 values are approximately equal within tolerance
pub fn assert_approx_eq(actual: u256, expected: u256, tolerance: u256, message: felt252) {
    assert(approx_eq(actual, expected, tolerance), message);
}
