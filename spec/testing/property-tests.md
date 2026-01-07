# Property-Based Testing Plan

We plan to use property-based tests (fuzzing) for functions like deposit and withdraw to verify certain properties hold for arbitrary sequences of actions. Using Starknet Foundry, we can write test functions with nondeterministic inputs (random values within constraints).

## Properties to Test

### Deposit-Withdraw Identity

**Property:** For any user and any amount x, if they deposit x and immediately withdraw x, they should end up with <= original x (because of possible rounding loss, they could lose at most 1 unit) and zero shares, and the vault state should be as initial.

**Fuzz Input:** asset amount X (1 <= X <= some limit)

**Test Steps:**
- User A deposit X; then withdraw X immediately

**Check:**
- User A's net change in asset balance ≤ 0
- If any loss, ε <= 1 unit (the smallest unit of asset)
- Vault's totalAssets after these ops is back to initial
- Round-trip should not gain assets (could lose at most 1 wei to vault)

**Repeat for:** mint then redeem same shares similarly

### Multiple Users Fairness

**Property:** If two users deposit the same amount, their shares should be equal. If no yield in between, withdrawing for both returns their original amounts (again within rounding 1).

**Fuzz Input:** deposit amounts a and b

**Test Steps:**
- User A deposits a, user B deposits b
- Maybe withdraw in opposite order
- Ensure each gets correct pro-rata share

**Check:**
- Shares are equal for equal deposits (if no yield)
- Withdrawals return original amounts within rounding tolerance

### Order Independence

**Property:** Some operations should commute in effect. For example, two deposits of A and B yield the same final total no matter their order (just distribution of shares differs but exchange rate and total assets the same).

**Fuzz Inputs:** X and Y for two deposits

**Test Steps:**
- Scenario 1: User A deposits X, then user B deposits Y
- Scenario 2: User B deposits Y, then user A deposits X
- Compare final states

**Check:**
- Final totalAssets and totalSupply identical
- User A's asset-equivalent differs ≤ 1 unit (small rounding effect)
- Total vault assets differ ≤ 1

### Invariant Checks via Fuzz

**Property:** Create random sequences of deposit, withdraw, maybe partial withdraw, multi-user, with constraints (like not withdrawing more than deposited total). After each operation or at end, check all invariants.

**Fuzz Input:** Random sequence of operations (each op = {user, type (deposit/withdraw), amount})

**Test Steps:**
- Generate N (e.g., 20) random operations
- Maintain off-chain model of user balances to avoid invalid withdraws
- Execute each op on the vault
- After each op, check all invariants

**Check:**
- INV-1: totalAssets correctness
- INV-2: Share accounting
- INV-3: Rounding direction
- No negative balances
- No runtime errors

### Equivalent Conditions

**Property:** Test that previewDeposit(x) and actually calling deposit(x) yield consistent results (the shares minted equals preview, event logs confirm). Similarly previewWithdraw vs actual.

**Fuzz Input:** asset amount X

**Test Steps:**
- Compute previewDeposit(X)
- Call deposit(X)
- Compare preview result with actual shares minted

**Check:**
- previewDeposit(X) == actual shares minted (within rounding)
- Same for previewMint, previewWithdraw, previewRedeem

### Monotonic Share Price

**Property:** Assuming no loss, the share value (assets per share) should never decrease. We fuzz scenarios where yield accrues or not, and ensure at each event Deposit or Withdraw, the effective exchange rate didn't go down unless someone specifically removed assets or a loss event occurred.

**Fuzz Input:** Random operations with optional yield injection

**Test Steps:**
- Generate random sequence of operations
- Optionally inject yield events (increase strategy's reported assets)
- Track share price = totalAssets/totalSupply after each operation

**Check:**
- Share price never decreases (beyond tiny rounding tolerance)
- Withdraw rounding might actually increase price slightly (acceptable)

### No Share Dilution

**Property:** If no one is depositing or withdrawing, share price remains stable except through harvest profit. We might simulate a time step where interest is added to strategy (increase totalAssets without changing totalSupply to simulate profit) and ensure that convertToAssets for 1 share increased.

**Fuzz Input:** Initial state, yield amount

**Test Steps:**
- Set up vault with some deposits
- Simulate yield: increase strategy's reported assets
- Check share price increased

**Check:**
- convertToAssets(1 share) increased
- No share dilution (totalSupply unchanged)
- Deposit/withdraw of small amounts doesn't let someone steal value

### Inflation Attack Fuzz

**Property:** Test the inflation attack scenario with an adversary deposit and donation and then victim deposit – check that attacker doesn't profit beyond their donation (which should hold due to offset making them lose portion).

**Fuzz Input:** Attacker deposit amount, donation amount, victim deposit amount

**Test Steps:**
- Vault empty
- Attacker deposits minimal amount
- Attacker donates large amount to vault (direct transfer)
- Victim deposits
- Check attacker's profit/loss

**Check:**
- Attacker doesn't profit (offset active)
- Victim receives >0 shares
- Attack is unprofitable

## Generators

- Generate random deposit amounts (bounded by some max, maybe smaller than 1e6 to keep math safe)
- Generate random sequences: array of operations (each op = {user, type (deposit/withdraw), amount}) making sure not to withdraw more than that user has available
- Incorporate random yield injection events: after some ops, increase strategy's reported assets by a random profit to simulate interest
- Utilize Foundry's fuzzing to run these with different seeds

## Fuzz Targets & Edge Cases

- **Extreme values**: deposit a very large amount near 2^256 limit
- **Minimal values**: deposit or withdraw of 1 wei unit (smallest unit)
- **Empty vault**: deposit vs mint differences, especially first deposit (with offset in place)
- **Single user**: test withdraw all leaves vault with zero share, zero assets
- **Many small deposits**: 100 deposits of 1 unit causing lots of rounding dust
- **Different receiver**: withdraw to a different receiver than owner
- **Approvals**: test share allowance logic by having one user approve another
