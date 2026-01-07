# Dependencies and External Integrations

This document lists all dependencies, external protocols, and configuration requirements.

## OpenZeppelin Cairo Components

### Required Components

1. **ERC4626Component**
   - Provides ERC-4626 standard implementation
   - Includes virtual shares/assets offset for inflation attack protection
   - Handles conversion functions, preview functions
   - Emits Deposit and Withdraw events

2. **ERC20Component**
   - Provides ERC-20 token functionality for vault shares
   - Includes balance tracking, transfers, approvals
   - Emits Transfer events

3. **ERC20MetadataComponent**
   - Provides name, symbol, decimals for vault shares
   - Should match underlying asset's decimals

4. **PausableComponent**
   - Provides pause/unpause functionality
   - Emits Paused and Unpaused events

5. **OwnableComponent** (or AccessControlComponent)
   - Provides access control for admin functions
   - Ownable: single owner model (simpler)
   - AccessControl: role-based (more flexible, but more complex)

### Version

- OpenZeppelin Cairo contracts version 3.x (specify in Scarb.toml)
- Verify exact version and API compatibility

### Configuration

- Use `ERC4626DefaultNoFees` trait for no-fee configuration
- Ensure decimals match underlying asset (fetch via interface call if needed)
- Virtual offset configured automatically by OZ component (verify default)

## External Protocol Integration

### Vesu V2

**Protocol**: Vesu V2 Lending Protocol on Starknet

**Integration Point**: Vesu's WBTC VToken (ERC-4626 compliant vault)

**Required Interface**:
```cairo
trait IVesuVToken {
    fn deposit(amount: u256, receiver: ContractAddress) -> u256;  // returns shares
    fn withdraw(amount: u256, to: ContractAddress, from: ContractAddress) -> u256;
    fn redeem(shares: u256, to: ContractAddress, from: ContractAddress) -> u256;
    fn balance_of(account: ContractAddress) -> u256;  // returns shares
    fn convert_to_assets(shares: u256) -> u256;
    fn convert_to_shares(assets: u256) -> u256;
    fn total_assets() -> u256;
    fn total_supply() -> u256;
}
```

**Addresses**:
- **Mainnet**: TBD (verify from Vesu documentation)
- **Testnet**: TBD (verify from Vesu documentation)
- **Local/Devnet**: Use MockVesuPool for testing

**Key Behaviors**:
- VToken is ERC-4626 compliant
- Interest accrues as exchange rate increases (convertToAssets returns more over time)
- Deposit returns VToken shares
- Withdraw/redeem returns underlying WBTC

**Token Approvals**:
- Strategy must approve VToken to spend WBTC before depositing
- Can be done once with large amount or per-deposit

## Underlying Asset: WBTC

**Token**: Wrapped Bitcoin on Starknet

**Required Interface**:
```cairo
trait IERC20 {
    fn transfer(recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
    fn approve(spender: ContractAddress, amount: u256) -> bool;
    fn balance_of(account: ContractAddress) -> u256;
    fn decimals() -> u8;
    fn name() -> felt252;
    fn symbol() -> felt252;
}
```

**Addresses**:
- **Mainnet**: TBD (verify from Starknet documentation - WBTC may be 18 decimals if minted natively)
- **Testnet**: TBD
- **Local/Devnet**: Use MockWBTC for testing

**Decimals**:
- Verify actual decimals on Starknet (may be 8 like Ethereum WBTC, or 18 if native Starknet token)
- Vault shares should match underlying decimals

## Build System

### Scarb

**Purpose**: Cairo package manager and build system

**Configuration** (`Scarb.toml`):
```toml
[package]
name = "hash_yield_contracts"
version = "0.1.0"
edition = "2024_07"

[dependencies]
openzeppelin_cairo = { git = "https://github.com/OpenZeppelin/cairo-contracts.git", tag = "v3.x.x" }
```

**Commands**:
- `scarb build` - Build contracts
- `scarb test` - Run tests (if configured)
- `scarb fmt` - Format code

## Testing Framework

### Starknet Foundry

**Purpose**: Testing framework for Cairo contracts

**Configuration** (`snfoundry.toml`):
```toml
[snforge]
# Configuration for Starknet Foundry
```

**Features**:
- Native Rust-based, fast execution
- Supports property-based tests and fuzzing
- Provides cheatcodes
- Supports Cairo `#[test]` functions

**Commands**:
- `snforge test` - Run all tests
- `snforge test --match <pattern>` - Run specific tests
- `snforge test --fuzz` - Run fuzz tests

### Alternative: Python + Starknet Devnet

**Purpose**: For complex scenarios or event verification

**Dependencies**:
- `starknet.py` or similar Python SDK
- `pytest` for test framework
- Starknet Devnet for local network

**Usage**: Sparingly, for complex flows

## Constants and Configuration

### Virtual Offset (Inflation Attack Protection)

- Configured automatically by OZ's ERC4626Component
- Default: 1 virtual share and 1 virtual asset (or δ-decimals offset)
- Ensures initial exchange rate = 1, prevents empty vault scenario
- Verify OZ default and adjust if needed

### Fee Configuration

- **v0**: No fees (use `ERC4626DefaultNoFees`)
- **Future**: Can enable fees via OZ's `FeeConfigTrait`

### Access Control

- **v0**: Use Ownable (single admin)
- **Future**: Can upgrade to AccessControl for role-based permissions

## Deployment Dependencies

### Deployment Scripts

- Starknet CLI or Python scripts
- Account contract for deployment
- Sufficient STRK for deployment fees

### Post-Deployment

- Verify contract addresses on block explorer
- Set admin to multisig/governance
- Initialize strategy
- Call `vault.setStrategy(strategy)`

## Security Dependencies

### Audits

- OpenZeppelin contracts are audited
- Our contracts should be audited before mainnet
- Strategy contract especially needs audit (holds all assets)

### Monitoring

- Block explorer integration
- Event monitoring (Deposit, Withdraw, Harvest, etc.)
- Dashboard tracking totalAssets vs totalSupply

## Version Compatibility

- **Cairo**: Version compatible with Scarb edition 2024_07
- **Starknet**: Compatible with current Starknet mainnet
- **OpenZeppelin**: Version 3.x (verify exact version)
- **Starknet Foundry**: Latest stable version

## Notes

- All external addresses should be configurable (not hardcoded)
- Use constants file or constructor parameters
- Verify all addresses on mainnet/testnet before deployment
- Mock contracts should match real contract interfaces for accurate testing
