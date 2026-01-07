# Vault Core Logic (Pseudocode)

This document contains implementation-ready pseudocode for the core ERC-4626 vault functions.

## deposit(assets, receiver) -> shares

```pseudocode
deposit(uint256 assets, address receiver) -> uint256 shares
// Preconditions:
require(!paused, "Vault is paused");
require(assets > 0, "Zero assets"); 

// Effects:
uint256 shares = preview_deposit(assets); 
require(shares > 0, "Deposit too small yields 0 shares"); 
// preview_deposit uses current exchange rate and rounds down
// internal offset ensures non-zero if assets > 0 except maybe dust smaller than offset

mint_shares(receiver, shares);  // internal: increase share balance and totalSupply

// Interactions:
bool success = asset.transfer_from(caller, this, assets);
require(success, "Transfer failed"); 

// after_deposit hook: 
if(strategy is set) {
    asset.approve(strategy, assets); // ensure strategy can take
    strategy.deposit(assets);       // send assets to strategy
}

// Events:
emit Deposit(caller=msg.sender, receiver=receiver, assets=assets, shares=shares);
return shares;
```

**Rationale**: 
- Check paused status and disallow zero
- `preview_deposit` calculates shares = floor(assets * totalSupply / totalAssets) or if vault empty, uses initial exchange rate with offset
- Rounding down means user possibly "loses" a tiny fraction <1 share, which stays in vault
- Require shares > 0 to avoid donation scenarios
- Transfer assets from user to vault
- Invest via strategy in `after_deposit` hook (shares already minted, so strategy gain/loss doesn't affect this transaction's share calculation)
- Emit event

## mint(shares, receiver) -> assets

```pseudocode
mint(uint256 shares, address receiver) -> uint256 assets
require(!paused, "paused");
require(shares > 0, "Zero shares");
uint256 assets = preview_mint(shares);
// preview_mint calculates assets needed, rounding up
require(assets > 0, "Assets=0"); 

mint_shares(receiver, shares);

bool success = asset.transfer_from(caller, this, assets);
require(success, "Transfer failed");

if(strategy) {
    asset.approve(strategy, assets);
    strategy.deposit(assets);
}

emit Deposit(caller=msg.sender, receiver=receiver, assets=assets, shares=shares);
return assets;
```

**Rationale**: Similar to deposit, except caller specifies shares and we derive assets. Rounding up on assets means caller might pay slightly more, benefiting existing holders.

## withdraw(assets, receiver, owner) -> shares

```pseudocode
withdraw(uint256 assets, address receiver, address owner) -> uint256 shares
require(!paused, "paused");
require(assets > 0, "Zero assets");

uint256 sharesToBurn = preview_withdraw(assets); 
// preview_withdraw accounts for withdrawal fee or rounding (shares up)
require(sharesToBurn > 0, "No shares calculated"); 

if(msg.sender != owner) {
    // allow someone with approval to withdraw on owner's behalf
    uint256 allowed = allowance(owner, msg.sender);
    require(allowed >= sharesToBurn, "Share allowance too low");
    if(allowed != type(uint256).max) {
        // deduct allowance if not infinite
        approve(owner, msg.sender, allowed - sharesToBurn);
    }
}

burn_shares(owner, sharesToBurn);  // internal: reduce owner balance and totalSupply

uint256 amountOut;
if(strategy) {
    // If vault has some idle assets, use those first to save gas:
    uint256 idle = asset.balance_of(this);
    if(idle >= assets) {
        amountOut = assets;
        // leave strategy alone
    } else {
        uint256 needFromStrategy = assets - idle;
        uint256 withdrawn = strategy.withdraw(needFromStrategy);
        require(withdrawn >= needFromStrategy * 999/1000, "Slippage too high");
        amountOut = idle + withdrawn;
    }
} else {
    // no strategy, assets are directly in vault
    amountOut = assets;
}

asset.transfer(receiver, amountOut);
emit Withdraw(caller=msg.sender, receiver=receiver, owner=owner, assets=amountOut, shares=sharesToBurn);
return sharesToBurn;
```

**Rationale**:
- Check allowances if caller != owner
- Calculate shares to burn (rounding up)
- Burn shares
- Use idle assets first, then pull from strategy
- Check slippage tolerance (0.1% - likely not needed as Vesu should give exact)
- Transfer to receiver
- Emit event

## redeem(shares, receiver, owner) -> assets

```pseudocode
redeem(uint256 shares, address receiver, address owner) -> uint256 assets
require(!paused, "paused");
require(shares > 0, "Zero shares");

if(msg.sender != owner) {
    uint256 allowed = allowance(owner, msg.sender);
    require(allowed >= shares, "Share allowance low");
    if(allowed != max) {
        approve(owner, msg.sender, allowed - shares);
    }
}

uint256 assetsOut = preview_redeem(shares); 
// This returns floor(assets) for given shares
require(assetsOut > 0, "Zero assets output");

burn_shares(owner, shares);

uint256 idle = asset.balance_of(this);
if(strategy) {
    if(idle >= assetsOut) {
        // no need to withdraw from strategy
    } else {
        uint256 need = assetsOut - idle;
        uint256 withdrawn = strategy.withdraw(need);
        require(withdrawn >= need * 999/1000, "Slippage");
        assetsOut = idle + withdrawn;
    }
}

asset.transfer(receiver, assetsOut);
emit Withdraw(caller=msg.sender, receiver=receiver, owner=owner, assets=assetsOut, shares=shares);
return assetsOut;
```

**Rationale**: Similar to withdraw, but input is shares. Calculate assets (rounding down), burn shares, pull from strategy if needed, transfer to receiver.

## Conversion and Preview Functions

### total_assets()

```pseudocode
total_assets() -> u256
if(strategy is set) {
    return strategy.total_assets() + asset.balance_of(this);
} else {
    return asset.balance_of(this);
}
```

Sums vault idle balance + strategy's reported assets (which includes accrued interest).

### convert_to_shares(assets)

```pseudocode
convert_to_shares(uint256 assets) -> u256
if(totalSupply == 0) {
    // If vault empty, use initial exchange rate with virtual offset
    // With offset configured for 1:1 initial rate
    return assets;
} else {
    // shares = assets * totalSupply / totalAssets (floor)
    return floor_div(assets * totalSupply, total_assets());
}
```

Rounds down. Uses 256-bit math to avoid overflow.

### convert_to_assets(shares)

```pseudocode
convert_to_assets(uint256 shares) -> u256
if(totalSupply == 0) {
    return 0;
} else {
    // assets = shares * totalAssets / totalSupply
    return floor_div(shares * total_assets(), totalSupply);
}
```

Rounds down. If shares == totalSupply, should get totalAssets (minus tiny rounding).

### preview_deposit(assets)

```pseudocode
preview_deposit(uint256 assets) -> u256
// No fees in v0, so effectively:
return convert_to_shares(assets);
// Deposit rounding is toward zero (floor) for shares
```

Same as `convert_to_shares` in no-fee scenario.

### preview_mint(shares)

```pseudocode
preview_mint(uint256 shares) -> u256
if(totalSupply == 0) {
    // 1:1 initial (with offset)
    assets = shares;
} else {
    // assets = ceil(shares * totalAssets / totalSupply)
    assets = ceil_div(shares * total_assets(), totalSupply);
}
return assets;
```

Rounds up on assets (favor vault).

### preview_withdraw(assets)

```pseudocode
preview_withdraw(uint256 assets) -> u256
// shares = ceil(assets * totalSupply / totalAssets)
// Rounding up because to get that many assets, possibly a fraction of share must be fully burned
return ceil_div(assets * totalSupply, total_assets());
```

Rounds up on shares (favor vault).

### preview_redeem(shares)

```pseudocode
preview_redeem(uint256 shares) -> u256
// assets = convert_to_assets(shares) (already floors)
return convert_to_assets(shares);
```

Same as `convert_to_assets` (rounds down).

## Rounding Summary

- **Deposit/Mint**: Round shares down, assets up (favor vault)
- **Withdraw/Redeem**: Round shares up for withdraw, assets down for redeem (favor vault)
- Tiny rounding dust accumulates in vault, benefiting remaining holders
