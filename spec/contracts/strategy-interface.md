# Strategy Interface Specification

## Overview

The `IStrategy` trait defines the interface for any yield-generating strategy that can be used by the Vault. This ensures the vault can work with different strategies interchangeably.

## Interface Definition

```cairo
#[starknet::interface]
trait IStrategy<TContractState> {
    fn asset(self: @TContractState) -> ContractAddress;
    fn total_assets(self: @TContractState) -> u256;
    fn deposit(ref self: TContractState, amount: u256) -> u256;
    fn withdraw(ref self: TContractState, amount: u256) -> u256;
    fn withdraw_all(ref self: TContractState) -> u256;
    fn harvest(ref self: TContractState) -> (u256, u256);
    fn emergency_withdraw(ref self: TContractState) -> u256;
}
```

## Function Specifications

### `asset() -> ContractAddress`

Returns the address of the underlying asset this strategy works with.

**Purpose**: The Vault uses this to validate that `strategy.asset() == vault.asset()` when setting a strategy, ensuring consistency.

**Returns**: ContractAddress of the underlying asset (WBTC)

### `total_assets() -> u256`

Returns how many underlying assets are currently managed by the strategy (deployed in the external protocol).

**Purpose**: Used by `Vault.total_assets()` to aggregate system total. For lending strategies, this equals assets lent + interest accrued (i.e., how much could be withdrawn right now).

**Returns**: u256 - Total underlying assets managed

### `deposit(amount: u256) -> u256`

Called by the Vault after receiving `amount` WBTC from a user deposit. The strategy should transfer those WBTC into the external protocol.

**Parameters**:
- `amount`: Amount of underlying assets to deposit

**Returns**: Amount actually deployed (should equal input if all invested)

**Requirements**:
- Only callable by the Vault (enforce with `assert(msg.sender == vault)`)
- Strategy should have received the assets (either pre-transferred by vault or strategy pulls them)

**Behavior**: 
- Transfer assets to external protocol
- Return amount invested

### `withdraw(amount: u256) -> u256`

Called by the Vault when it needs `amount` WBTC for a user withdrawal. Strategy should withdraw that much from the protocol and transfer to Vault.

**Parameters**:
- `amount`: Amount of underlying assets to withdraw

**Returns**: Actual amount withdrawn (should equal requested unless insufficient, in which case may return less)

**Requirements**:
- Only callable by the Vault
- Should transfer withdrawn assets back to Vault

**Behavior**:
- Withdraw from external protocol
- Transfer assets to Vault
- Return actual amount withdrawn

### `withdraw_all() -> u256`

Instructs strategy to pull everything out of the protocol back to the Vault.

**Returns**: Amount withdrawn

**Purpose**: Used for strategy migrations or emergencies

**Requirements**:
- Only callable by Vault or owner
- Should transfer all assets to Vault

**Behavior**:
- Withdraw all assets from protocol
- Transfer to Vault
- Return total amount recovered

### `harvest() -> (u256, u256)`

Realizes any yield or loss and reports it. Returns `(profit, loss)`.

**Returns**: 
- `(profit: u256, loss: u256)` - Profit and loss since last harvest

**Purpose**: 
- For lending strategies, profit = increase in underlying since last report
- Loss = 0 unless something bad happened (e.g., borrower default)
- In v0, profit is virtual (not transferred out, remains invested for compounding)

**Requirements**:
- Callable by Vault, admin, or keeper (or public)
- Should update internal accounting (e.g., `lastReportedAssets`)

**Behavior**:
- Calculate current assets vs last reported
- If `current > lastReported`: profit = current - lastReported, loss = 0
- If `current < lastReported`: profit = 0, loss = lastReported - current
- Update `lastReportedAssets = current`
- Return (profit, loss)

**Note**: In v0, profit is not transferred out (remains invested). If fees were enabled, profit portion could be withdrawn for fee processing.

### `emergency_withdraw() -> u256`

Attempts to withdraw everything in a possibly unsafe way. Should do its best to return all assets it can, even if it means taking a loss or skipping some checks.

**Returns**: Amount recovered

**Purpose**: Used in emergency scenarios where normal withdrawal might fail

**Requirements**:
- Only callable by Vault or owner
- Should not revert even if partial recovery (returns 0 if nothing recovered)

**Behavior**:
- Attempt to withdraw all assets
- If normal withdraw fails, try alternative methods or partial withdrawal
- Transfer whatever is recovered to Vault
- Return amount recovered (may be less than expected in case of loss)

## Implementation Requirements

Any contract implementing `IStrategy` must:

1. **Asset Consistency**: `asset()` must return the same address as the vault's asset
2. **Vault Authorization**: Only allow the vault (and optionally owner) to call state-changing functions
3. **Asset Management**: Properly track and report total assets managed
4. **Error Handling**: Handle external protocol failures gracefully
5. **Emergency Support**: Provide emergency withdrawal capability

## Security Considerations

- Strategy should validate `msg.sender == vault` for all state-changing functions
- Strategy should not allow direct user interactions (only vault can call)
- Strategy should handle external protocol failures (reverts, partial withdrawals)
- Strategy should report accurate `total_assets()` (includes accrued interest for lending)
