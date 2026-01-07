# Property Tests - Invariants

Property-based tests for invariants under random operations.

## Property: random_sequence_no_loss

**Goal:** For a sequence of random deposits and withdrawals by multiple users (no external loss introduced), ensure key invariants hold and no user balance inconsistency.

**Setup:**
- Initialize vault with strategy = MockStrategy (just holds assets).
- Generate N (e.g., 20) random operations:
  - Either "deposit X by user U" or "withdraw Y by user U".
  - Maintain a model of user balances off-chain to avoid invalid withdraws (withdraw at most what user U deposited minus withdrew so far).
- Execute each op on the vault.

**Assertions after each op:**
- INV-1: `vault.totalAssets() == asset.balanceOf(vault) + strategy.totalAssets()`.
- INV-2: `vault.totalSupply()` equals sum of all user `vault.balanceOf`.
- INV-3: Check share price non-decreasing. Compute price = totalAssets/totalSupply (floating). Track min price seen.
  - If any operation reduces price below previous (beyond tiny rounding tolerance), flag error. Should not happen unless withdraw rounding which actually *increases* price slightly or equal.
- No negative balances (should be inherently by contract, but check model vs actual).
- Also ensure no runtime errors (all ops valid given model constraints).

**Fuzz:** Run many random sequences (Foundry can run this multiple times).

**Required Mocks/Helpers:** MockWBTC, MockStrategy

**Invariants Checked:** INV-1, INV-2, INV-3

## Property: equivalent_deposit_withdraw

**Goal:** Depositing then withdrawing same amount yields <= original assets (due to rounding).

**Fuzz Input:** asset amount X (1 <= X <= some limit).

**Test Steps:**
- User A deposit X; then withdraw X immediately.

**Check:**
- User A's net change in asset balance ≤ 0 (they should get back X or X-ε).
- If any loss, ε <= 1 unit (the smallest unit of asset).
- Vault's totalAssets after these ops is back to initial (no net change if same block).
- Essentially a round-trip should not gain assets. (Could lose at most 1 wei to vault.)

**Repeat for mint then redeem same shares similarly.**

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-1, INV-2, INV-3

## Property: parallel_deposit_order

**Goal:** Depositing assets in one sum vs in parts yields nearly same share distribution.

**Fuzz Inputs:** X and Y for two deposits.

**Scenario:**
- Vault empty. User A deposits X, then user B deposits Y.
- Reset vault. User B deposits Y first, then user A deposits X.

**Compare:**
- Final totalAssets and totalSupply in both scenarios should be identical (because X+Y total deposited).
- User A's shares in scenario1 vs scenario2 might differ because order affects price at their deposit time.
- However, user A's actual underlying value (shares * exchange rate) should be the same in both scenarios (since both end states vault with X+Y assets split some way).
- Actually, due rounding, there could be a slight difference (order causing one scenario to have 1 wei more in vault).
- Assert that difference in A's asset-equivalent <= 1 unit (small rounding effect).
- Assert total vault assets differ <= 1.

**This tests that rounding effects are minor and no large unfairness due deposit order.**

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-1, INV-2, INV-3
