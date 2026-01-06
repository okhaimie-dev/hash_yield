# LendingStrategyV0 Implementation Specification

## Overview

`LendingStrategyV0` is the initial concrete strategy implementation, focused on supplying WBTC to Vesu V2's lending pool for yield. It implements the `IStrategy` interface.

## Storage Layout

```cairo
#[storage]
struct Storage {
    asset: ContractAddress,           // WBTC token address
    v_token: ContractAddress,         // Vesu VToken (ERC4626 vault for WBTC)
    vault: ContractAddress,            // Backpointer to Vault
    last_reported_assets: u256,       // For profit calculation
}
```

### Storage Details

- **asset**: The underlying asset token address (WBTC). Must match vault's asset.
- **v_token**: Address of Vesu's VToken contract (ERC-4626 compliant vault for WBTC pool)
- **vault**: Address of the Vault contract. Used for authorization checks.
- **last_reported_assets**: Last reported total assets, used to calculate profit/loss in `harvest()`

## External Protocol Integration

### Vesu V2 Integration

Vesu V2 uses an ERC-4626 compliant "VToken" vault for each asset pool. Our strategy interacts with Vesu's WBTC VToken:

- **Deposit**: Call `vToken.deposit(amount, receiver)` to supply WBTC and receive VTokens
- **Withdraw**: Call `vToken.withdraw(amount, to, from)` or `vToken.redeem(shares, to, from)` to retrieve WBTC
- **Balance**: Query `vToken.balanceOf(strategy)` to get VToken shares held
- **Conversion**: Call `vToken.convertToAssets(shares)` to get underlying WBTC value (includes accrued interest)

### Token Approvals

Before depositing WBTC into Vesu, the strategy must:
1. Approve the VToken contract to spend WBTC: `WBTC.approve(vToken, amount)`
2. This approval can be done once with a large amount or per-deposit

## Function Implementations

### `deposit(amount: u256) -> u256`

**Process**:
1. Assert `msg.sender == vault` (only vault can call)
2. Ensure strategy has the assets (vault should have transferred them, or strategy pulls from vault)
3. Approve VToken to spend WBTC: `asset.approve(v_token, amount)`
4. Call `vToken.deposit(amount, strategy_address)` to deposit into Vesu
5. Vesu mints VTokens to strategy's address
6. Update `last_reported_assets += amount` (assuming no profit realized yet)
7. Return `amount` (assuming all assets successfully supplied)

**Note**: We don't need to store VToken balance - we can query it on the fly via `vToken.balanceOf(strategy)`. For gas optimization, we could cache it, but querying is acceptable for v0.

### `withdraw(amount: u256) -> u256`

**Process**:
1. Assert `msg.sender == vault`
2. Check `currentAssets = total_assets()` and require `amount <= currentAssets`
3. Call `vToken.withdraw(amount, to=strategy, from=strategy)` to withdraw from Vesu
   - This burns appropriate VToken shares and sends `amount` WBTC to strategy
4. Transfer WBTC to Vault: `asset.transfer(vault, amount)`
5. Update `last_reported_assets -= amount` (reducing baseline)
6. Return `amount` (should equal requested unless pool illiquidity, in which case may revert)

**Alternative**: Could use `vToken.redeem(shares, strategy, strategy)` if we prefer exact shares, but `withdraw` is simpler since it takes asset amount directly.

### `withdraw_all() -> u256`

**Process**:
1. Assert `msg.sender == vault || msg.sender == owner`
2. Query `share_balance = vToken.balanceOf(strategy)`
3. If `share_balance > 0`:
   - Call `vToken.redeem(share_balance, strategy, strategy)` to pull all underlying
   - This converts all VTokens to WBTC
4. Transfer all WBTC to Vault
5. Set `last_reported_assets = 0` (nothing remains)
6. Return amount received

**Note**: Amount received can be determined by querying WBTC balance difference or from the redeem call return value.

### `total_assets() -> u256`

**Process**:
1. Query `share_balance = vToken.balanceOf(strategy)`
2. If `share_balance == 0`, return `0`
3. Call `vToken.convertToAssets(share_balance)` to get underlying WBTC amount
4. Return the result

**Note**: This accounts for accrued interest automatically, as Vesu's VToken exchange rate increases over time. Alternatively, Vesu might have an `exchangeRate` or `index`, but using ERC-4626's `convertToAssets` keeps it standard.

### `harvest() -> (u256, u256)`

**Process**:
1. Assert `msg.sender == vault || msg.sender == admin_or_keeper` (or public)
2. Calculate `current = total_assets()`
3. Calculate profit/loss:
   - If `current >= last_reported_assets`: `profit = current - last_reported_assets`, `loss = 0`
   - If `current < last_reported_assets`: `profit = 0`, `loss = last_reported_assets - current`
4. Update `last_reported_assets = current`
5. Return `(profit, loss)`

**Note**: In v0, we don't transfer profit out (Option 1: don't move assets). Profit remains invested for compounding. If fees were enabled, we might withdraw profit portion to Vault for fee processing (Option 2: realize profit), but we choose Option 1 for simplicity.

### `emergency_withdraw() -> u256`

**Process**:
1. Assert `msg.sender == vault || msg.sender == owner`
2. Try to call `withdraw_all()` and return result
3. If that fails (catches revert):
   - Attempt partial withdrawal: query `share_balance = vToken.balanceOf(strategy)`
   - If `share_balance > 0`, try `vToken.withdraw(vToken.convertToAssets(share_balance), strategy, strategy)`
   - Transfer whatever is recovered to Vault
   - Return amount recovered (may be 0 if nothing could be done)

**Note**: In Cairo, error handling might use Option/Result types. The strategy should do its best to recover assets even in failure scenarios. For Vesu, emergency withdraw likely does the same as `withdraw_all`, but we separate the logic in case some strategies need different emergency handling.

## Constructor

```cairo
fn constructor(
    ref self: ContractState,
    asset: ContractAddress,
    v_token: ContractAddress,
    vault: ContractAddress
)
```

Initializes the strategy with:
- `asset`: WBTC token address
- `v_token`: Vesu VToken address for WBTC
- `vault`: Vault contract address

Sets `last_reported_assets = 0`.

## Authorization

- All state-changing functions check `msg.sender == vault` (except `emergency_withdraw` which also allows owner)
- Strategy should not allow direct user interactions
- Only Vault can deposit/withdraw assets

## Gas Optimization Notes

- VToken balance is queried on-the-fly rather than cached (acceptable for v0)
- Could optimize by caching balance and updating on deposit/withdraw events
- Approval can be done once with large amount rather than per-deposit

## Future Extensions

- Reward token handling (e.g., STRK tokens from Vesu's BTCFi program) - out of scope for v0
- Multiple protocol support - would require new strategy contract
- Fee extraction - would modify harvest to withdraw profit portion
