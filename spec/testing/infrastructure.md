# Testing Infrastructure & Helpers

This document describes the testing infrastructure, mock contracts, helpers, and fixtures needed for the test suite.

## Test Framework

**Primary Framework**: Starknet Foundry
- Native Rust-based, fast execution
- Supports property-based tests and fuzzing natively
- Provides cheatcodes similar to EVM Foundry
- Supports Cairo test functions with `#[test]` attribute

**Alternative**: Python + Starknet Devnet + Pytest
- For complex scenarios or event verification
- Slower but may be easier for some integration tests
- Use sparingly, primarily for complex flows

## Project Setup for Tests

- Use Scarb to manage dependencies
- Include OpenZeppelin Cairo contracts (version 3.x) in `Scarb.toml`
- Under `tests/`, Starknet Foundry expects test modules
- Tests can be written in Cairo as `#[test]` functions or in High-Level Python

## Mock Contracts

### MockWBTC

**Purpose**: Simulate WBTC token for testing

**Required Functions**:
```cairo
fn mint(account: ContractAddress, amount: u256)
fn transfer(recipient: ContractAddress, amount: u256) -> bool
fn transfer_from(sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool
fn approve(spender: ContractAddress, amount: u256) -> bool
fn balance_of(account: ContractAddress) -> u256
fn decimals() -> u8
```

**Usage**: 
- `mock_wbtc.mint(user, amount)` to allocate test tokens
- Standard ERC20 interface

### MockVesuPool

**Purpose**: Simulate Vesu's ERC-4626 VToken vault for WBTC

**Required Functions**:
```cairo
fn deposit(amount: u256, receiver: ContractAddress) -> u256  // returns shares
fn withdraw(amount: u256, to: ContractAddress, from: ContractAddress) -> u256
fn redeem(shares: u256, to: ContractAddress, from: ContractAddress) -> u256
fn balance_of(account: ContractAddress) -> u256  // returns shares
fn convert_to_assets(shares: u256) -> u256
fn convert_to_shares(assets: u256) -> u256
fn total_assets() -> u256
fn total_supply() -> u256

// Test helpers:
fn set_exchange_rate(multiplier: u256)  // simulate interest
fn add_interest(amount: u256)  // increment totalAssets without changing shares
```

**Storage**:
- `totalAssets: u256`
- `totalShares: u256`
- `balances: Map<ContractAddress, u256>` (share balances)

**Behavior**:
- `deposit`: If totalShares == 0, mint shares = amount (1:1). Else, shares = amount * totalShares / totalAssets. Increment totalAssets += amount, totalShares += shares.
- `withdraw`: sharesNeeded = ceil(amount * totalShares / totalAssets). Burn shares, totalAssets -= amountOut, transfer to receiver.
- `redeem`: amountOut = shares * totalAssets / totalShares. Burn shares, transfer.
- `set_exchange_rate`: Multiply totalAssets by multiplier (simulates interest)
- `add_interest`: Increment totalAssets by amount (simulates profit)

### MockStrategy

**Purpose**: Simple strategy that just holds assets internally (for unit tests)

**Required Functions**:
```cairo
fn deposit(amount: u256) -> u256
fn withdraw(amount: u256) -> u256
fn withdraw_all() -> u256
fn total_assets() -> u256
fn asset() -> ContractAddress
fn harvest() -> (u256, u256)
fn emergency_withdraw() -> u256
```

**Storage**:
- `internal_balance: u256`
- `asset: ContractAddress`
- `vault: ContractAddress`

**Behavior**:
- `deposit`: Increase internal_balance
- `withdraw`: Decrease internal_balance, return amount
- `total_assets`: Return internal_balance
- No external protocol calls (simpler for unit tests)

### MockStrategyDirect

**Purpose**: Even simpler strategy for fuzz tests (no token transfers, just accounting)

**Behavior**: Same as MockStrategy but doesn't require actual token transfers (trusts vault)

## Helper Utilities

### Token Minting

```cairo
// Helper function to mint tokens to users
fn mint_to_user(mock_wbtc: IERC20Dispatcher, user: ContractAddress, amount: u256) {
    mock_wbtc.mint(user, amount);
}
```

### Account Setup

- Deploy Account contracts for each user (or use Foundry's provided test accounts)
- Each account has its own key
- Foundry automatically provides account 0, 1, 2, etc.

### Event Assertions

- Capture events by reading transaction receipt
- Foundry's test framework may allow asserting events
- Alternatively, check state changes to confirm event effects
- For clarity, we might not parse events beyond ensuring they happened

### Time/Block Advancement

- Starknet doesn't allow directly changing block timestamp easily
- For interest accrual, we don't rely on time
- Simulate interest by directly manipulating mock pool's state
- If needed, use Foundry cheatcode to set block timestamp (if available)

### Impersonation

- In Starknet, deploy Account contracts and use their keys
- Foundry may provide test accounts automatically
- Use account contracts to send transactions as different users

## Fixtures

### Multi-User Fixtures

```cairo
struct TestUsers {
    admin: ContractAddress,
    user_a: ContractAddress,
    user_b: ContractAddress,
    user_c: ContractAddress,
}

fn setup_users() -> TestUsers {
    // Deploy or get test accounts
    // Return struct with addresses
}
```

### Vault Setup Fixture

```cairo
fn setup_vault(
    asset: ContractAddress,
    name: felt252,
    symbol: felt252
) -> (IVaultDispatcher, ContractAddress) {
    // Deploy vault
    // Return dispatcher and address
}
```

### Strategy Setup Fixture

```cairo
fn setup_strategy(
    asset: ContractAddress,
    v_token: ContractAddress,
    vault: ContractAddress
) -> (IStrategyDispatcher, ContractAddress) {
    // Deploy strategy
    // Return dispatcher and address
}
```

## Test Data Models

For fuzz tests, maintain an off-chain model of expected state:

```cairo
struct UserModel {
    deposits: u256,
    withdrawals: u256,
    shares: u256,
}

struct VaultModel {
    total_assets: u256,
    total_supply: u256,
    user_models: Map<ContractAddress, UserModel>,
}
```

Use this to validate contract state matches expected model.

## Starknet Foundry Tools

### Cheatcodes

- `expectRevert` or similar for testing reverts
- Block timestamp manipulation (if available)
- Account impersonation (via test accounts)

### Fuzzing

- Use `#[fuzz]` attribute or similar for property tests
- Generate random inputs within constraints
- Run multiple iterations with different seeds

## Potential Gotchas

1. **Cairo's 2-phase execution**: Reverts might behave differently. Rely on standard library for proper revert handling.

2. **Partial withdrawals**: Test scenario where strategy returns less than asked. Currently we require full amount, so should revert (which is correct).

3. **Mock pool illiquidity**: Modify MockVesuPool to have withdraw cap (if assets > liquidity, withdraw only available). Test vault's handling.

4. **Event parsing**: May be simpler to check state changes rather than parse events in detail.

5. **Gas/Performance**: For fuzz tests, use MockStrategyDirect (simpler) to avoid external call overhead.

## Test Organization

```
tests/
├── unit/
│   ├── test_vault_basic.cairo
│   └── test_vault_edgecases.cairo
├── integration/
│   ├── test_strategy_integration.cairo
│   └── test_emergency.cairo
├── properties/
│   └── prop_invariants.cairo
└── mocks/
    ├── MockWBTC.cairo
    ├── MockVesuPool.cairo
    ├── MockStrategy.cairo
    └── MockStrategyDirect.cairo
```

## Summary

- **Framework**: Starknet Foundry (primary), Python + Devnet (secondary)
- **Mocks**: MockWBTC, MockVesuPool, MockStrategy, MockStrategyDirect
- **Helpers**: Token minting, account setup, fixtures
- **Fixtures**: Multi-user setup, vault setup, strategy setup
- **Models**: Off-chain state models for fuzz test validation
- **Tools**: Foundry cheatcodes, fuzzing support
