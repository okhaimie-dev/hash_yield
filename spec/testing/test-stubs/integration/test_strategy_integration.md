# Integration Tests - Strategy Integration

Integration of vault with actual strategy behavior.

## Test: deposit_goes_to_strategy

**Purpose:** Ensure that when vault has a strategy, deposits are forwarded.

**Setup:**
- Deploy MockWBTC, give user A 500.
- Deploy MockVesuPool (ERC4626) with MockWBTC.
- Deploy StrategyV0 with asset=MockWBTC, vToken=MockVesuPool, and vault address.
- Deploy Vault, set strategy to StrategyV0 (admin call).
- User A approves vault 500 WBTC.

**Action:**
- User A calls vault.deposit(500, A).

**Assert:**
- Vault.share balance of A ~500.
- Vault.asset.balanceOf(vault) maybe 0 (if strategy took all).
- Strategy's recorded totalAssets == 500.
- MockVesuPool.balanceOf(strategy) > 0 indicating receipt of deposit (likely 500 shares if 1:1).
- MockVesuPool.totalAssets (if tracked) == 500.
- Event: Deposit emitted on vault.
- No WBTC left idle in vault (assuming strategy took all; if we left some threshold, adjust expectation).

**Required Mocks/Helpers:** MockWBTC, MockVesuPool

**Invariants Checked:** INV-1, INV-5

## Test: withdraw_takes_from_strategy

**Purpose:** Withdraws pull from strategy properly.

**Setup:** (Continue from previous with 500 in strategy.)

**Action:**
- User A calls vault.withdraw(200, receiver=A, owner=A).

**Assert:**
- Strategy.withdraw should have been invoked for ~200.
- MockVesuPool balanceOf(strategy) reduced correspondingly.
- User A received 200 WBTC.
- Vault.totalAssets ~ 300 remaining.
- Vault.shares burned = shares corresponding to 200 (should be ~200 if no profit).
- Vault.emitted Withdraw event.
- Vault still has no idle WBTC after (assuming it pulled exactly and transferred).
- Strategy.totalAssets == 300 now.

**Required Mocks/Helpers:** MockWBTC, MockVesuPool

**Invariants Checked:** INV-1, INV-2

## Test: yield_accrual_reflected

**Purpose:** Simulate yield in external pool and see vault values reflect it.

**Setup:** (Vault with strategy and some assets invested.)
- After above, 300 in strategy.

**Action:**
- Simulate interest: call MockVesuPool.setExchangeRate(1.1) to simulate 10% gain.
- Now call vault.totalAssets() and maybe vault.convertToAssets(shares).

**Assert:**
- vault.totalAssets should be ~330 (10% gain on 300).
- vault.convertToAssets(A's share balance) ~ 330 (because A still holds all shares after partial withdraw? Actually A had 500 shares then withdrew 200 assets, leaving ~300 shares).
- Now test a user withdrawing after yield:
   * User A withdraws 50 WBTC.
   * Because of yield, 50 WBTC corresponds to fewer shares than before (since share worth more).
   * Ensure shares burned < 50 this time (because share price >1).
   * Strategy.withdraw called for 50 (which now is available).
   * After withdraw, vault.totalAssets ~280.
   * A's remaining share can still redeem correct remaining portion.
- Also test vault.harvest:
   * Call vault.harvest() (if implemented).
   * Should get profit ~30, loss 0 reported.
   * Harvest event maybe logged.
   * No state change otherwise (for v0 no fee).
- Confirm invariants: share price only increased with yield.

**Required Mocks/Helpers:** MockWBTC, MockVesuPool

**Invariants Checked:** INV-1, INV-2

## Test: strategy_switch_migration

**Purpose:** Ensure switching strategy migrates funds safely.

**Setup:** 
- Continue scenario: Vault with ~280 in StrategyV0.
- Deploy a new MockStrategy (or reuse MockVesuPool with different instance).
- New strategy uses same asset but perhaps different logic (for test, another Mock pool with same state initially empty).

**Action:**
- Admin calls vault.setStrategy(newStrategy).

**Assert:**
- Vault should call oldStrategy.withdrawAll -> old MockVesuPool now 0 assets for strategy.
- Vault then deposits into newStrategy -> new Mock pool now has 280 assets.
- Vault.currentStrategy = newStrategy.
- vault.totalAssets still 280.
- User A's shares unaffected (just backing changed).
- Event StrategySwitched emitted.
- Perhaps test that subsequent deposit now goes to newStrategy's pool.
- Also check that if setStrategy called with an incompatible strategy (e.g., one using different token), it reverts (that in unit tests).

**Required Mocks/Helpers:** MockWBTC, MockVesuPool, MockStrategy

**Invariants Checked:** INV-1, INV-2, INV-5
