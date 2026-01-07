# Admin Logic (Pseudocode)

This document contains implementation-ready pseudocode for admin and emergency functions.

## setStrategy(newStrategy)

```pseudocode
setStrategy(address newStrategy)
require(msg.sender == admin, "Unauthorized");
require(newStrategy != 0 && IStrategy(newStrategy).asset() == asset, "Invalid strategy");

pause(); // Recommended to pause operations during switch

uint256 withdrawn = 0;
if(strategy != 0) {
    withdrawn = strategy.withdraw_all(); 
    // Now vault holds `withdrawn` assets
    strategy = ContractAddress(0); // clear current
}

if(withdrawn > 0 && newStrategy != 0) {
    asset.approve(newStrategy, withdrawn);
    IStrategy(newStrategy).deposit(withdrawn);
}

strategy = newStrategy;
unpause(); // allow operations with new strategy

emit StrategySwitched(oldStrategy, newStrategy);
```

**Rationale**:
- Only admin can call
- Validate new strategy (not zero, asset matches)
- Pause to prevent user actions mid-switch
- Withdraw all from old strategy
- Deposit all into new strategy
- Update pointer
- Unpause
- Emit event

**Edge Case**: If newStrategy deposit reverts, vault could be stuck with assets. Consider not unpausing until verifying new strategy works, or handle revert gracefully.

## pause() / unpause()

```pseudocode
pause()
require(msg.sender == admin, "Unauthorized");
paused = true;
emit Paused(msg.sender);

unpause()
require(msg.sender == admin, "Unauthorized");
paused = false;
emit Unpaused(msg.sender);
```

**Rationale**: 
- Only admin can call
- Pausing stops deposits, mints, withdraws, redeems (all revert)
- Unpausing resumes all operations
- Emit events for transparency

**Design Decision**: In v0, pause blocks all operations. Could allow withdraws while paused in emergency scenarios, but for simplicity we block all.

## emergencyWithdraw()

```pseudocode
emergencyWithdraw()
require(msg.sender == admin, "Unauthorized");

pause();

uint256 recovered = 0;
if(strategy != 0) {
    recovered = strategy.emergency_withdraw();
    strategy = ContractAddress(0); // detach strategy
}

// Now vault holds whatever recovered
emit EmergencyWithdraw(recovered);

// Vault remains paused - admin must explicitly unpause after review
```

**Rationale**:
- Only admin can call
- Pause vault first
- Call strategy's emergency_withdraw (does best to recover)
- Detach strategy (set to 0)
- Emit event with amount recovered
- Vault remains paused (shutdown state)

**Post-Emergency**: Users can redeem shares against recovered assets. Admin can unpause withdraws only, or leave fully paused. Deposits should remain blocked until new strategy set.

## harvest()

```pseudocode
harvest()
// Can be public or restricted to admin/keeper

if(strategy == 0) {
    return (0, 0); // No strategy, no harvest
}

(uint256 profit, uint256 loss) = strategy.harvest();

emit Harvest(profit, loss, total_assets());

return (profit, loss);
```

**Rationale**:
- Calls strategy's harvest
- Gets profit/loss report
- Emits event for monitoring
- Returns values

**Note**: In v0, profit is not transferred (remains invested). If fees enabled, would process profit here (mint fee shares, etc.).
