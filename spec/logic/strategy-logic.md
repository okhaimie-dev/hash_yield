# Strategy Logic (Pseudocode)

This document contains implementation-ready pseudocode for strategy functions.

## deposit(amount) -> u256

```pseudocode
deposit(uint256 assets) -> u256
assert(msg.sender == vault, "Only vault");

// Strategy expects Vault to have already transferred assets or approved them
if(asset.balance_of(this) < assets) {
    // If Vault didn't pre-transfer, pull from Vault:
    asset.transfer_from(vault, this, assets);
}

asset.approve(vToken, assets);
uint256 sharesReceived = vToken.deposit(assets, this);

lastReportedAssets += assets; 
// At deposit time, profit not realized yet, so increase baseline

return sharesReceived; // or return amount
```

**Rationale**: 
- Only vault can call
- Ensure we have the assets (vault may have pre-transferred or we pull)
- Approve VToken to spend WBTC
- Deposit into Vesu, receive VTokens
- Update lastReportedAssets (principal increase, not profit)

## withdraw(amount) -> u256

```pseudocode
withdraw(uint256 assets) -> u256
assert(msg.sender == vault, "Only vault");

uint256 currentAssets = total_assets();
require(assets <= currentAssets, "Not enough assets");

// Call Vesu's withdraw (takes asset amount)
uint256 got = vToken.withdraw(assets, this, this);
// OR use redeem if we prefer exact shares:
// uint256 sharesToRedeem = vToken.preview_withdraw(assets);
// uint256 got = vToken.redeem(sharesToRedeem, this, this);

asset.transfer(vault, got);

lastReportedAssets -= assets; 
// Reducing baseline (assuming no profit taken here)

return got;
```

**Rationale**:
- Only vault can call
- Check we have enough assets
- Call Vesu's withdraw (preferred) or redeem
- Transfer WBTC to vault
- Update lastReportedAssets

**Note**: If interest accrued, lastReported might be < currentAssets. We subtract full assets, treating difference as profit to be accounted in harvest.

## total_assets() -> u256

```pseudocode
total_assets() -> u256
uint256 shareBalance = vToken.balance_of(this);
if(shareBalance == 0) {
    return 0;
}
return vToken.convert_to_assets(shareBalance);
```

**Rationale**: Query VToken balance (shares), convert to underlying assets. This accounts for accrued interest automatically as VToken exchange rate increases.

## harvest() -> (u256, u256)

```pseudocode
harvest() -> (u256 profit, u256 loss)
assert(msg.sender == vault || msg.sender == admin_or_keeper, "...");

uint256 current = total_assets();
uint256 profit = 0;
uint256 loss = 0;

if(current >= lastReportedAssets) {
    profit = current - lastReportedAssets;
    loss = 0;
} else {
    loss = lastReportedAssets - current;
    profit = 0;
}

lastReportedAssets = current;
return (profit, loss);
```

**Rationale**:
- Calculate current assets
- Compare to last reported
- If increased: profit, else: loss
- Update lastReportedAssets
- Don't move funds (profit remains invested for compounding)

**Note**: In v0, profit is virtual (not transferred). If fees enabled, could withdraw profit portion for fee processing.

## withdraw_all() -> u256

```pseudocode
withdraw_all() -> u256
assert(msg.sender == vault || msg.sender == owner, "...");

uint256 shareBalance = vToken.balance_of(this);
uint256 received = 0;

if(shareBalance > 0) {
    received = vToken.redeem(shareBalance, this, this);
    asset.transfer(vault, received);
}

lastReportedAssets = 0; // Nothing remains
return received;
```

**Rationale**:
- Only vault or owner can call
- Redeem all VToken shares
- Transfer all WBTC to vault
- Reset lastReportedAssets
- Used for migrations or emergencies

## emergency_withdraw() -> u256

```pseudocode
emergency_withdraw() -> u256
assert(msg.sender == vault || msg.sender == owner, "...");

try {
    uint256 received = withdraw_all();
    return received;
} catch (revert) {
    // In case of failure, try smaller chunks or alternative methods
    uint256 received = 0;
    uint256 shareBalance = vToken.balance_of(this);
    
    if(shareBalance > 0) {
        // Attempt partial withdraw (perhaps pool illiquidity)
        uint256 assetsToWithdraw = vToken.convert_to_assets(shareBalance);
        received = vToken.withdraw(assetsToWithdraw, this, this);
        asset.transfer(vault, received);
    }
    
    return received; // May be 0 if nothing could be done
}
```

**Rationale**:
- Only vault or owner can call
- Try normal withdraw_all first
- If fails, attempt partial withdrawal
- Do best to recover whatever possible
- Don't revert even if partial (returns 0 if nothing recovered)

**Note**: In Cairo, error handling uses Option/Result types. This pseudocode shows the intent - actual implementation will use Cairo's error handling mechanisms.
