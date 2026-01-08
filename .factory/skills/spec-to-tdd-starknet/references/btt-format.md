# BTT (Branching Tree Technique)

BTT is a structured approach to test case design that organizes test scenarios in a tree-like structure. Originally from Solidity testing (bulloak), the technique applies to any smart contract testing including Cairo/Starknet.

**Note**: There is no actively maintained Cairo BTT generator. Apply BTT manually by writing `.tree` files for documentation and then implementing corresponding test functions.

## File Location
- `BTT_DIR/<Domain>.tree` (configured per repo)

## Format
Use ASCII tree characters (`├`, `└`, `│`) to denote branches:
- **Conditions**: branches starting with `when` or `given`
- **Actions**: branches starting with `it`
- **Action descriptions**: children of an action

## Example Tree
```
Core::swap
├── It should never revert unexpectedly.
├── When amount is zero
│   └── It should revert [TEST-CORE-SWAP-001]
├── When sqrt_ratio_limit is invalid
│   └── It should revert [TEST-CORE-SWAP-002]
├── When pool has no liquidity
│   └── It should return zero delta [TEST-CORE-SWAP-003]
└── When pool has liquidity
    ├── When swapping token0 for token1
    │   └── It should update price correctly [TEST-CORE-SWAP-004]
    └── When swapping token1 for token0
        └── It should update price correctly [TEST-CORE-SWAP-005]
```

## Mapping Tree to Cairo Tests
Each leaf node becomes a test function:

```cairo
// TEST-ID: TEST-CORE-SWAP-001
#[test]
#[should_panic(expected: ('ZERO_AMOUNT',))]
fn test_swap_reverts_when_amount_is_zero() {
    let setup = setup_pool();
    // When amount is zero -> It should revert
    swap(setup, amount: Zero::zero(), is_token1: true, ...);
}

// TEST-ID: TEST-CORE-SWAP-003
#[test]
fn test_swap_returns_zero_delta_when_pool_has_no_liquidity() {
    let setup = setup_pool_no_liquidity();
    // When pool has no liquidity -> It should return zero delta
    let delta = swap(setup, ...);
    assert(delta.amount0.is_zero() && delta.amount1.is_zero(), 'expected zero delta');
}
```

## Condition Helpers
Conditions (`when`/`given`) can become setup helpers:

```cairo
fn when_pool_has_liquidity(ref d: Deployer) -> SetupPoolResult {
    let setup = d.setup_pool(...);
    // Add liquidity
    update_position(setup, bounds, liquidity: 1000000.into(), ...);
    setup
}
```

## Rules
- Every TEST-ID in the manifest must appear in a `.tree` file
- Each leaf should map 1:1 with a manifest entry and a test function
- Keywords are case-insensitive (`when` == `When` == `WHEN`)
- Multiple trees can be defined in one file (separate by two newlines)
- Use `Module::function` format for root identifiers

## VSCode Tip
Use [Ascii Tree Generator](https://marketplace.visualstudio.com/items?itemName=aprilandjan.ascii-tree-generator) extension for convenient tree editing.
