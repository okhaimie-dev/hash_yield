# Unit Tests - Vault Basic

Basic ERC-4626 behavior of vault (deposits, withdraws).

## Test: deposit_mint_basic

**Purpose:** Verify depositing and minting in a fresh vault mints correct shares and updates state.

**Setup (Arrange):** 
- Deploy `Vault` with MockWBTC as asset, no strategy set (vault holds assets itself).
- Mint 1000 MockWBTC to user A.
- User A approves Vault for 1000.

**Action (Act):**
1. Call `vault.deposit(500, receiver=A)` from user A.
2. Call `vault.mint(100, receiver=A)` from user A (this will require ~100 assets, exact calculation in test).

**Assertions (Assert):**
- After deposit: `vault.balanceOf(A) == 500` (initial 1:1 shares since empty).
- `vault.totalSupply() == 500`, `vault.totalAssets() == 500` (assets now in vault).
- Deposit event emitted with caller=A, receiver=A, assets=500, shares≈500.
- After mint: shares increased by 100, so `vault.balanceOf(A) == 600` (500+100).
- `vault.totalAssets()` increased by assets pulled for mint (should be 600 now).
- Mint event (Deposit event) shows correct assets (likely 100) and shares=100.
- No other side effects: asset.balanceOf(vault) == 600 now.

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-1, INV-2

## Test: withdraw_redeem_basic

**Purpose:** Ensure withdraw and redeem remove shares and return assets correctly.

**Setup:** 
- Use vault from previous test state or fresh: Suppose A has 600 shares, vault has 600 assets.

**Action:**
1. Call `vault.withdraw(100, receiver=A, owner=A)` by user A.
2. Call `vault.redeem(50, receiver=A, owner=A)` by user A.

**Assertions:**
- After withdraw: `vault.balanceOf(A)` decreased by `sharesBurned`. Check `sharesBurned ≈ 100` (maybe 100 or 101 due to rounding).
- User A's WBTC balance increased by 100 (minus potential 1-wei rounding which stays in vault).
- After redeem: `vault.balanceOf(A)` decreased by 50, user A gets ~50 WBTC.
- Check events: Withdraw events have correct parameters (caller=A, receiver=A, owner=A, etc.).
- Final state: If A withdrew total 150 assets, vault left with 450 assets and totalSupply 450.
- Invariants: `vault.totalAssets()==vault.asset.balanceOf(vault)==450`, which equals `vault.convertToAssets(vault.totalSupply())` within rounding tolerance.

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-1, INV-2

## Test: zero_amount_reverts

**Purpose:** Ensure zero asset or share operations revert.

**Setup:** Vault with any state.

**Action & Assert:**
- Expect `vault.deposit(0, A)` to revert with message "Zero" or similar.
- Expect `vault.withdraw(0, A, A)` to revert.
- Expect `vault.mint(0, A)` to revert.
- Expect `vault.redeem(0, A, A)` to revert.

**Required Mocks/Helpers:** Just need revert message capturing (Starknet test framework should allow catching errors).

**Invariants Checked:** None (negative test)

## Test: preview_functions_consistency

**Purpose:** Test preview and convert functions.

**Setup:** 
- Suppose vault has some assets and shares (simulate with 2 users deposits).

**Action:**
- Compute shares1 = vault.previewDeposit(X); then do vault.deposit(X).
- Compute shares2 = actual shares minted from event.

**Assert:** shares1 == shares2 (within any documented off-by-1 if applicable, but ideally equal since preview rounds same as actual).
- Similar for previewMint: given shares target, previewMint yields assetsY, after vault.mint(shares target) check assets pulled equals assetsY.
- Check previewWithdraw vs actual shares burned, previewRedeem vs actual assets out.

**Postconditions:** Confirm no state change from preview calls (pure).

**Required Mocks/Helpers:** MockWBTC

**Invariants Checked:** INV-3 (rounding)
