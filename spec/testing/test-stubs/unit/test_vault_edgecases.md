# Unit Tests - Vault Edge Cases

Cover edge conditions like multiple users, rounding, allowances, pause.

## Test: multiple_depositors_and_rounding

**Purpose:** Verify share distribution and rounding with multiple users.

**Setup:**
- User A and B each have 1000 WBTC, approved to vault.
- Vault empty, no strategy.

**Action:**
1. A deposits 101 WBTC.
2. B deposits 203 WBTC.
3. A deposits 50 WBTC.

**Assert:**
- After 1: A gets 101 shares (vault empty initial, likely 1:1).
- After 2: B's shares =? previewDeposit(203) with vault having 101 assets prior. Check B's shares calculation correct (likely 203 * totalSupply(101) / totalAssets(101) = 203).
- After 3: A's new shares for 50 = floor(50 * (101+203+?) / (101+203) etc.). Compute expected and compare actual.
- Total supply = sum A and B shares. totalAssets = 354.
- Check minor rounding: perhaps no rounding occurred in these integer cases. Try amounts that cause fraction: e.g., deposit 1 when vault has 3 shares for 2 assets scenario.
- Invariant: Each user's asset equivalent = vault.convertToAssets(balance) <= assets they put in (due rounding losses).
- No more than 1 wei lost per deposit (maybe check if vault.asset.balanceOf(vault) had any leftover dust).

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-1, INV-2, INV-3

## Test: share_transfer_and_approval

**Purpose:** Ensure shares (vault token) behave like ERC20.

**Setup:** 
- Some user A has 100 shares (e.g., after deposits above).
- User B has 50 shares.

**Action:**
1. A calls vault.transfer(B, 20 shares).
2. A approves B to spend 30 shares.
3. B (as caller) calls vault.transferFrom(A, C, 10 shares) using allowance.

**Assert:**
- After (1): A's vault balance = 80, B's = 70.
- ERC20 Transfer event seen.
- After (3): A's balance = 70, C's balance = 10, B's balance still 70. Allowance A->B reduced from 30 to 20.
- vault.totalSupply unchanged.
- No effect on totalAssets (just internal share move).
- Confirm vault.convertToAssets for A+B+C combined equals vault.totalAssets, shares sum consistent.

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-2, INV-4

## Test: pause_functionality

**Purpose:** Ensure pausing stops operations as intended.

**Setup:** 
- Vault with some deposits; admin is test account.

**Action:**
1. Admin calls vault.pause().
2. Try vault.deposit by user -> expect revert "paused".
3. Try vault.withdraw by user -> expect revert (if we decided to block withdraw too).
4. Admin calls vault.unpause().
5. Now deposit and withdraw should succeed again.

**Assert:**
- Check paused state variable flips correctly.
- Revert messages caught for operations during pause.
- After unpause, state unchanged (no funds movement during pause).

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-7
