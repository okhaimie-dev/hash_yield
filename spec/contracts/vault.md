# Vault Contract Specification

## Overview

The Vault is the core ERC-4626 contract implementing the vault standard on Starknet. It inherits from OpenZeppelin's ERC4626Component, making it also an ERC-20 token representing vault shares.

## Storage Layout

```cairo
#[storage]
struct Storage {
    // Core vault state
    asset: ContractAddress,              // WBTC token address
    currentStrategy: ContractAddress,     // Active strategy (can be 0)
    
    // Component storage (OZ)
    // ERC20Component storage (name, symbol, decimals, totalSupply, balances, allowances)
    // ERC4626Component storage (asset, virtual offset)
    // PausableComponent storage (paused state)
}
```

### Storage Details

- **asset**: The underlying asset token address (WBTC)
- **currentStrategy**: Pointer to the active strategy contract implementing IStrategy. Can be `ContractAddress(0)` if no strategy is set.
- **Component Storage**: OpenZeppelin components manage their own substorage:
  - ERC20Component: name, symbol, decimals, totalSupply, balances mapping, allowances mapping
  - ERC4626Component: asset address, virtual shares/assets offset (for inflation attack protection)
  - PausableComponent: paused boolean

**Note**: Decimals for vault shares should match the underlying asset's decimals (typically 18 for Starknet WBTC, but verify). OZ's default is 18, but we should explicitly set it to match the asset.

## Function Signatures

### ERC-4626 Standard Functions

#### View Functions

```cairo
fn asset() -> ContractAddress
```
Returns the underlying asset token address (WBTC).

```cairo
fn total_assets() -> u256
```
Returns the total amount of underlying assets the vault holds or has invested. 
- If strategy is set: `asset.balanceOf(vault) + strategy.totalAssets()`
- If no strategy: `asset.balanceOf(vault)`

```cairo
fn convert_to_shares(assets: u256) -> u256
```
Pure/view function. Converts an asset amount to the equivalent number of vault shares at current exchange rate, rounded down (per ERC-4626).

```cairo
fn convert_to_assets(shares: u256) -> u256
```
Pure function. Converts a number of vault shares to the current equivalent amount of underlying assets, rounded down.

```cairo
fn max_deposit(receiver: ContractAddress) -> u256
```
Returns the maximum assets that can be deposited for receiver. In v0, returns `type(u256).max` (unlimited).

```cairo
fn max_mint(receiver: ContractAddress) -> u256
```
Returns the maximum shares that can be minted for receiver. In v0, unlimited.

```cairo
fn max_withdraw(owner: ContractAddress) -> u256
```
Returns the maximum assets that can be withdrawn by owner. Basically `convert_to_assets(owner's share balance)`, minus any withdrawal caps or if paused.

```cairo
fn max_redeem(owner: ContractAddress) -> u256
```
Returns the maximum shares owner can redeem (basically their share balance if not paused).

#### State-Changing Functions

```cairo
fn deposit(ref self: ContractState, assets: u256, receiver: ContractAddress) -> u256
```
Deposits `assets` amount of underlying from caller into the vault, crediting `receiver` with vault shares.

**Returns**: Number of shares minted.

**Requirements**:
- `assets > 0`
- Vault not paused
- Caller must have approved vault for at least `assets` WBTC

**Emits**: `DepositEvent(caller, receiver, assets, shares)`

```cairo
fn mint(ref self: ContractState, shares: u256, receiver: ContractAddress) -> u256
```
Mints exactly `shares` vault tokens for `receiver`, pulling the necessary assets from caller.

**Returns**: Actual assets taken.

**Requirements**:
- `shares > 0`
- Vault not paused
- Caller must have approved enough assets

**Emits**: `DepositEvent(caller, receiver, assets, shares)`

```cairo
fn withdraw(
    ref self: ContractState, 
    assets: u256, 
    receiver: ContractAddress, 
    owner: ContractAddress
) -> u256
```
Burns enough shares from `owner` to retrieve `assets` underlying, and sends those assets to `receiver`.

**Returns**: Shares burned.

**Requirements**:
- `assets > 0`
- `owner` has at least `previewWithdraw(assets)` shares
- If `caller != owner`, caller must have allowance for owner's shares ≥ shares needed
- Vault not paused

**Emits**: `WithdrawEvent(caller, receiver, owner, assets, sharesBurned)`

```cairo
fn redeem(
    ref self: ContractState, 
    shares: u256, 
    receiver: ContractAddress, 
    owner: ContractAddress
) -> u256
```
Burns exactly `shares` from `owner` to return underlying assets to `receiver`.

**Returns**: Assets sent.

**Requirements**:
- `shares > 0`
- `owner` has ≥ `shares`
- If `caller != owner`, allowance required
- Vault not paused

**Emits**: `WithdrawEvent(caller, receiver, owner, assets, shares)`

### Admin Functions

```cairo
fn set_strategy(ref self: ContractState, new_strategy: ContractAddress)
```
Non-standard external function. Only ADMIN role can call. Switches the vault's strategy.

**Requirements**:
- Caller is admin
- `new_strategy` implements IStrategy
- `new_strategy.asset() == vault.asset()` (safety check)
- Recommended: pause vault before switching

**Process**:
1. Pause vault (recommended)
2. If old strategy exists, call `oldStrategy.withdrawAll()`
3. Transfer all assets to vault
4. If `new_strategy != 0`, deposit all assets into new strategy
5. Update `currentStrategy = new_strategy`
6. Unpause vault

**Emits**: `StrategySwitched(oldStrategy, newStrategy)`

```cairo
fn pause(ref self: ContractState)
```
Pauses the vault. Only ADMIN can call. When paused, deposit, mint, withdraw, redeem should revert.

**Emits**: `Paused(account)`

```cairo
fn unpause(ref self: ContractState)
```
Unpauses the vault. Only ADMIN can call.

**Emits**: `Unpaused(account)`

```cairo
fn emergency_withdraw(ref self: ContractState)
```
Admin-only. Calls `strategy.emergencyWithdraw()` and transfers all received assets to vault. After this, vault is likely in a shutdown state (paused).

**Emits**: `EmergencyWithdraw(amountRecovered)`

```cairo
fn harvest(ref self: ContractState)
```
Calls `strategy.harvest()` and handles any returned profit/loss. Can be public or restricted to admin/keeper.

**Returns**: `(profit: u256, loss: u256)`

**Emits**: `Harvest(profit, loss, totalAssets)`

### Constructor

```cairo
fn constructor(
    ref self: ContractState,
    asset_address: ContractAddress,
    name: felt252,
    symbol: felt252
)
```

Initializes the vault with:
- Asset token address
- Share token name (e.g., "WBTC Vault")
- Share token symbol (e.g., "vWBTC")

**Initialization**:
- Call OZ's `ERC4626.initializer(asset_address)`
- Call OZ's `ERC20Metadata.initializer(name, symbol, decimals)`
- Set decimals to match underlying asset's decimals (fetch via interface call if needed)
- Initialize virtual shares/assets offset (OZ component handles this)

## Events

```cairo
#[event]
enum Event {
    #[flat] ERC20Event: ERC20Component::Event,  // Transfer events for shares
    DepositEvent: (
        ContractAddress caller,
        ContractAddress receiver,
        u256 assets,
        u256 shares
    ),
    WithdrawEvent: (
        ContractAddress caller,
        ContractAddress receiver,
        ContractAddress owner,
        u256 assets,
        u256 shares
    ),
    StrategySwitched: (
        ContractAddress old_strategy,
        ContractAddress new_strategy
    ),
    Harvest: (
        u256 profit,
        u256 loss,
        u256 total_assets
    ),
    EmergencyWithdraw: (
        u256 amount_recovered
    ),
    // From PausableComponent
    Paused: (ContractAddress account),
    Unpaused: (ContractAddress account)
}
```

**Note**: If OZ's ERC4626Component already defines Deposit/Withdraw events, use those instead to avoid duplication.

## Hooks

The vault uses OZ's ERC4626 hooks:

- **after_deposit**: Called after shares are minted. Forwards assets to strategy if set.
- **before_withdraw**: Called before assets are transferred. Pulls assets from strategy if needed.

## Access Control

- Uses OZ's Ownable or AccessControl
- Admin role: `setStrategy`, `pause`, `unpause`, `emergencyWithdraw`
- Optional Keeper role: `harvest` (or public)
- Users: `deposit`, `mint`, `withdraw`, `redeem` (their own)

## Rounding Rules

- **Deposit/Mint**: Round shares down (favor vault/existing shareholders)
- **Withdraw/Redeem**: Round shares up for withdraw, assets down for redeem (favor vault)
- Tiny rounding dust accumulates in vault, benefiting remaining holders

## Security Features

- Virtual shares/assets offset to prevent inflation attacks
- Reentrancy guard on state-changing functions
- Pausable for emergency stops
- Strategy asset validation on `setStrategy`
