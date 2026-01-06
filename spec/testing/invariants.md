# System Invariants

This document defines the 10 critical system invariants that must always hold true (unless an emergency situation intentionally breaks them, e.g., after a loss).

## Invariant Definitions

| Invariant ID | Description & Enforcement | Functions Affected |
| :--- | :--- | :--- |
| **INV-1** | **Conservation of Assets**: `vault.totalAssets() == asset.balanceOf(vault) + strategy.totalAssets()` (if strategy set). We expect this to hold after every operation (save minor timing differences during an operation). Rounding may cause off-by-1 in extreme cases, but not accumulation. | All state-changing functions (deposit, withdraw, mint, redeem, harvest, strategy calls) should maintain this. |
| **INV-2** | **Share Accounting**: `vault.totalSupply()` of shares accurately reflects deposits minus withdrawals. Specifically, for each user, their share balance times current conversion equals their share of assets. Also, at all times: `convertToAssets(totalSupply) <= totalAssets` (equality if no rounding loss) – i.e., you can't redeem more assets than exist. No share inflation or deflation occurs except via defined functions. | deposit/mint (increase supply), withdraw/redeem (decrease supply) |
| **INV-3** | **Rounding Direction**: The rounding rules are correctly implemented: deposit/mint rounds in favor of existing shareholders (user slightly loses), withdraw/redeem rounds in favor of vault (user might leave a dust). This means any tiny rounding dust is retained in vault (benefiting remaining holders). We test scenarios like small deposits to ensure the vault doesn't accidentally give out free shares or assets. | preview_deposit, preview_withdraw, etc., and the actual deposit/mint/withdraw/redeem calculations. |
| **INV-4** | **ERC20 consistency**: Vault's share token behavior (balance, transfer, approval) obeys ERC20 standard. E.g., sum of balances == totalSupply, no overflow on transfers, allowances update properly. | transfer, approve (inherited from OZ ERC20) |
| **INV-5** | **Strategy asset alignment**: `strategy.asset() == vault.asset()` always. And the strategy never holds assets of other types. This is enforced by design, but we'll test setStrategy rejects wrong asset. | setStrategy logic |
| **INV-6** | **No Reentrancy**: Reentrant calls should be prevented. Specifically, a user shouldn't re-enter vault functions in the middle of deposit/withdraw. We simulate potential reentrancy via a malicious ERC20 (with callback) or malicious strategy (though Starknet may not easily allow that, we still test guards). | deposit/withdraw (should not allow reentrant observable effects) |
| **INV-7** | **Paused state**: When paused, no deposits/mints (and possibly no withdraws if that's our decision) can go through. When unpaused, everything works. Pause state should not affect share/accounting otherwise. | pause, unpause, all external functions respect pause flag. |
| **INV-8** | **Emergency withdrawal outcome**: After emergencyWithdraw, either all assets are in vault or as much as possible. The vault's strategy pointer is cleared or inactive. Invariant INV-1 still holds but now strategy = 0, so just assets in vault. No further deposits should be allowed. | emergencyWithdraw, pause |
| **INV-9** | **Loss socialization**: If external loss occurs (simulate by reducing what strategy returns), no individual user can withdraw more than their share of remaining assets. If one user withdraws after loss, they get at most proportional share, leaving enough for others. This ties into INV-2 (since share price drops). We test that scenario. | withdraw/redeem in loss scenario |
| **INV-10** | **Fees correctness** (if fees enabled): If we had a fee, the vault's accounting of fee collected matches the difference between gross and net assets. In v0, no fees, so trivial (no differences). | (future, not in v0) |

## Enforcement

We will assert these invariants within tests, especially using property tests where after sequences of operations we check invariants hold.

### Testing Strategy

- **Unit Tests**: Check invariants after each function call
- **Integration Tests**: Verify invariants hold across vault+strategy interactions
- **Property Tests**: Random sequences of operations, check all invariants after each
- **Edge Cases**: Test invariants at boundaries (empty vault, single user, max values)

### Invariant Violation Scenarios

- **INV-1 violation**: Would indicate accounting error or strategy reporting incorrectly
- **INV-2 violation**: Would indicate share minting/burning error
- **INV-3 violation**: Would indicate rounding implementation bug
- **INV-4 violation**: Would indicate ERC20 implementation bug
- **INV-5 violation**: Would indicate strategy mismatch (caught by setStrategy)
- **INV-6 violation**: Would indicate reentrancy guard failure
- **INV-7 violation**: Would indicate pause logic bug
- **INV-8 violation**: Would indicate emergency withdraw logic bug
- **INV-9 violation**: Would indicate loss handling bug
- **INV-10 violation**: Would indicate fee calculation bug (not applicable in v0)

## Notes

- Rounding may cause off-by-1 differences in INV-1, but should not accumulate
- INV-2 allows `convertToAssets(totalSupply) < totalAssets` due to rounding, but should be very small
- INV-8 intentionally breaks normal operation (emergency scenario)
- INV-9 tests loss scenarios where invariants still hold but values are lower
