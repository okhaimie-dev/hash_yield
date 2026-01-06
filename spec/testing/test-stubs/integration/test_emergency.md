# Integration Tests - Emergency

Focusing on emergency withdraw and pause scenarios.

## Test: emergency_withdraw_sequence

**Purpose:** Simulate an emergency where strategy loses some assets.

**Setup:**
- Vault + Strategy as before, with e.g. 280 assets in strategy (post-yield).
- Simulate a loss: directly reduce MockVesuPool's internal record of total assets to 200 (simulate 80 WBTC loss due default).

**Action:**
1. Admin calls vault.pause().
2. Admin calls vault.emergencyWithdraw().

**Assert:**
- Strategy.emergencyWithdraw called -> tries withdraw all. Because pool only has 200 left out of 280 owed, it returns 200.
- Vault now has 200 WBTC (recovered).
- vault.totalAssets == 200, vault.totalSupply unchanged.
- vault.currentStrategy maybe set to 0 (or remains but with 0 assets, depending on impl).
- Event EmergencyWithdraw(200) emitted.
- Now, while still paused (or maybe we allow withdraws in paused), user A tries to redeem shares:
   * User A has e.g. ~something like originally 300 shares (if not changed).
   * If totalAssets now 200, exchange rate went down (loss).
   * User A redeem all shares -> should get 200 WBTC.
- Assert user gets 200 which is less than original 280 asset value -> loss realized.
- All shares burned after redeem, vault totalSupply 0, vault.totalAssets 0 (all funds out).
- No one could withdraw more than their fraction: if multiple users, ensure distribution (maybe add user B before loss and check withdraw amounts).
- Ensure once emergencyWithdraw called, further deposits revert (vault likely still paused).
- Possibly unpause after to allow remaining withdraws if we chose to allow that.

**Required Mocks/Helpers:** MockWBTC, MockVesuPool

**Invariants Checked:** INV-1, INV-2, INV-8, INV-9

## Test: unauthorized_emergency

**Purpose:** Ensure only admin can trigger emergency actions.

**Setup:** Vault with strategy and funds, user tries to be malicious.

**Action & Assert:**
- User (not admin) calls vault.setStrategy(X) -> expect revert "Unauthorized".
- User calls vault.pause() -> revert.
- User calls vault.emergencyWithdraw() -> revert.
- Ensure admin still can.
- Also test admin cannot emergencyWithdraw twice or when no strategy (should either revert or do nothing gracefully).

**Required Mocks/Helpers:** MockWBTC, MockVesuPool

**Invariants Checked:** None (negative test)
