# Pre- and Post-conditions for Functions

This document outlines expected pre-conditions (requirements before calling) and post-conditions (state after execution) for each main external function.

## deposit(assets, receiver)

### Preconditions
- `assets > 0`
- Caller approved vault for at least `assets` WBTC
- Vault not paused
- `receiver` can be any address (including caller or someone else)

### Postconditions
- `vault.balanceOf(receiver)` increases by `shares` returned
- `vault.totalSupply` increases by `shares`
- `vault.totalAssets` increases by `assets` (immediately if no strategy, or remains same but now held by strategy)
- `asset.balanceOf(vault)` might stay the same or become 0 if immediately forwarded to strategy
- The sum of `asset.balanceOf(vault) + asset.balanceOf(strategy)` increases by `assets`
- Events: `Deposit(caller, receiver, assets, shares)` and an ERC20 Transfer event for share mint (from 0x0 to receiver for shares)
- No other addresses' balances affected
- Invariants INV-1, INV-2 hold after

## mint(shares, receiver)

### Preconditions
- `shares > 0`
- Caller approved enough assets (the vault will calculate required assets)
- Vault not paused

### Postconditions
- Similar to deposit, except:
  - `vault.balanceOf(receiver)` += `shares` exactly
  - Underlying taken = `assets` returned
- All else same as deposit

## withdraw(assets, receiver, owner)

### Preconditions
- `assets > 0`
- `owner` has at least `previewWithdraw(assets)` shares
- If `caller != owner`, caller has allowance for owner's shares ≥ that amount
- Vault not paused (unless we allow withdraw when paused, which we likely don't)

### Postconditions
- `owner`'s share balance decreases by `sharesBurned` (the return value)
- `vault.totalSupply` decreases accordingly
- Underlying assets are transferred to `receiver`
- `vault.totalAssets` decreases by `assets`
- Strategy's assets decrease by the portion withdrawn from strategy
- Events: `Withdraw(caller, receiver, owner, assets, sharesBurned)` and ERC20 Transfer event of shares (owner to 0x0 burn)
- If owner now has 0 shares (withdrew all), they are effectively exited
- If assets was equal to all in vault, vault may now be empty (maybe with a dust of underlying due to rounding)
- Invariants: INV-1 holds (we removed equal amounts from both sides), INV-2 holds (burn matched assets)
- Rounding might cause `vault.convertToAssets(totalSupply)` to be off by at most 1 wei from actual `totalAssets`

## redeem(shares, receiver, owner)

### Preconditions
- `shares > 0`
- `owner` has ≥ `shares`
- If `caller != owner`, allowance on shares for caller

### Postconditions
- Similar to withdraw, except:
  - Input is `shares`, output is `assetsOut`
  - `owner` loses exactly `shares`, `totalSupply` down, underlying out to `receiver`
  - `assetsOut = previewRedeem(shares)` (round down)
- Possibly a tiny leftover stays in vault as dust if rounding
- Events same pattern
- After: vault might have a tiny extra underlying due to floor rounding – we'll assert that's ≤ one unit of asset (like ≤1 satoshi of WBTC if decimals=8)

## setStrategy(new)

### Preconditions
- Caller is admin
- `new` is address of a contract implementing IStrategy with matching asset

### Postconditions
- If vault had an existing strategy with assets, all assets now moved to either vault or new strategy
- Precisely, after call:
  - `vault.strategy == new`
  - `vault.totalAssets` should be same as before (less any small slippage or dust) – essentially no change in user holdings
  - The old strategy has 0 assets belonging to vault
  - The new strategy now has all assets (or vault has them if new is null in emergency scenario)
- Event `StrategySwitched(old, new)` emitted
- We also want to ensure no shares changed from this

## pause() / unpause()

### Preconditions (pause)
- Admin only

### Postconditions (pause)
- `vault.paused = true`
- No state change to assets/shares
- Possibly emit `Paused` event

### Preconditions (unpause)
- Admin only

### Postconditions (unpause)
- `vault.paused = false`
- We test that when paused, deposit/mint (and probably withdraw/redeem) revert with proper message

## emergencyWithdraw()

### Preconditions
- Admin only
- We assume vault paused

### Postconditions
- `vault.strategy` set to 0 (or marked inactive)
- All assets from strategy attempted to be in vault
- If some assets couldn't be recovered, strategy might still have some inaccessible (which means a loss occurred, but those assets are effectively gone)
- After this, vault's `totalAssets` reflects what's in vault now (which is all that's left)
- Users can redeem their shares against this pool now
- Perhaps no event standard, but we emit `EmergencyWithdraw`
- Vault remains paused (shutdown state)

## harvest()

### Preconditions
- Called by admin or keeper (or open)

### Postconditions
- Strategy's harvest called
- If `profit > 0` and no fees, nothing moved but internal `lastReported` updated
- If fees configured, maybe some profit moved to a fee receiver (which would mint some shares to fee address or transfer assets)
- We ensure total assets stays same minus any fee taken (profit - fee remains in strategy or vault)
- Emit `Harvest(profit, loss)`
- After harvest, share price might increase if fee minted shares (diluting share value slightly, which is how fees are taken) – not in v0 though

## Testing Preconditions

We will enforce preconditions by writing tests that attempt to violate them:
- `deposit(0)` -> expect revert "Zero assets"
- `withdraw` without approval -> expect revert
- Non-admin calling `setStrategy` -> expect revert "Unauthorized"
- etc.

## Testing Postconditions

Post-conditions will be asserted in tests after each action:
- Check balances match expected
- Check events emitted correctly
- Check invariants hold
- Check state changes are correct
