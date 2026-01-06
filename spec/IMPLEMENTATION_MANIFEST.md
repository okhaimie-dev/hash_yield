# Implementation Manifest

This document serves as the master index for all implementation-focused specifications extracted from the deep research document.

## Overview

This specification focuses on the **implementation details** needed to scaffold and build the ERC-4626 BTC Vault system on Starknet. It extracts:

- Contract interfaces and function signatures
- Storage layouts
- Event definitions
- Core logic/pseudocode
- Complete testing specifications (invariants, test trees, test stubs, infrastructure)

## Quick Reference

### Contracts
- **[Vault](./contracts/vault.md)** - Main ERC-4626 vault contract
- **[Strategy Interface](./contracts/strategy-interface.md)** - IStrategy trait definition
- **[LendingStrategyV0](./contracts/lending-strategy-v0.md)** - Concrete strategy implementation

### Logic
- **[Vault Core Logic](./logic/vault-core-logic.md)** - ERC-4626 function implementations
- **[Strategy Logic](./logic/strategy-logic.md)** - Strategy function implementations
- **[Admin Logic](./logic/admin-logic.md)** - Admin and emergency functions

### Testing
- **[Test Manifest](./testing/TEST_MANIFEST.md)** - Complete catalog of all tests
- **[Invariants](./testing/invariants.md)** - 10 system invariants
- **[Pre/Post Conditions](./testing/pre-post-conditions.md)** - Function contracts
- **[Risk Matrix](./testing/risk-matrix.md)** - Risk ID → Test mapping
- **[Property Tests](./testing/property-tests.md)** - Property-based test specifications
- **[Test Trees](./testing/test-trees/)** - Bulloak BTT format test trees
- **[Test Stubs](./testing/test-stubs/)** - Arrange-Act-Assert test skeletons
- **[Infrastructure](./testing/infrastructure.md)** - Mocks, helpers, fixtures

### Dependencies
- **[Dependencies](./dependencies.md)** - OZ components, external protocols

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Scarb project with OZ dependencies
- [ ] Create mock contracts (MockWBTC, MockStrategy, MockVesuPool)
- [ ] Set up test infrastructure (Starknet Foundry)

### Phase 2: Interfaces
- [ ] Define IStrategy trait
- [ ] Define event enums
- [ ] Define error types

### Phase 3: Vault Core
- [ ] Implement Vault with OZ ERC4626Component
- [ ] Implement core ERC-4626 functions (stubs)
- [ ] Write basic unit tests

### Phase 4: Strategy Integration
- [ ] Implement MockStrategy
- [ ] Integrate strategy hooks in Vault
- [ ] Write integration tests

### Phase 5: Production Strategy
- [ ] Implement LendingStrategyV0
- [ ] Write full integration tests

### Phase 6: Admin & Security
- [ ] Implement access control
- [ ] Implement pausable
- [ ] Write security tests

### Phase 7: Test Suite
- [ ] Implement all test trees
- [ ] Write property tests
- [ ] Write invariant tests

## Key Design Decisions

- **Vault**: Non-upgradeable (immutable), uses OZ ERC4626Component
- **Strategy**: Swappable via setStrategy (admin-controlled)
- **Fees**: Zero in v0 (no-fee default)
- **Upgradeability**: No proxy pattern, deploy new contracts for upgrades
- **Testing**: Starknet Foundry with Bulloak BTT format

## Function Signature Quick Reference

### Vault (ERC-4626)
- `asset() -> ContractAddress`
- `total_assets() -> u256`
- `convert_to_shares(u256 assets) -> u256`
- `convert_to_assets(u256 shares) -> u256`
- `deposit(u256 assets, ContractAddress receiver) -> u256 shares`
- `mint(u256 shares, ContractAddress receiver) -> u256 assets`
- `withdraw(u256 assets, ContractAddress receiver, ContractAddress owner) -> u256 shares`
- `redeem(u256 shares, ContractAddress receiver, ContractAddress owner) -> u256 assets`
- `setStrategy(ContractAddress newStrategy)` (admin only)
- `pause()` / `unpause()` (admin only)
- `emergencyWithdraw()` (admin only)
- `harvest()` (admin/keeper)

### Strategy Interface
- `asset() -> ContractAddress`
- `total_assets() -> u256`
- `deposit(u256 amount) -> u256`
- `withdraw(u256 amount) -> u256`
- `withdraw_all() -> u256`
- `harvest() -> (u256 profit, u256 loss)`
- `emergency_withdraw() -> u256`

## Storage Quick Reference

### Vault Storage
- `asset: ContractAddress` - WBTC token address
- `currentStrategy: ContractAddress` - Active strategy (can be 0)
- `paused: bool` - Pause state
- Plus OZ component storage (ERC20, ERC4626, Pausable)

### Strategy Storage
- `asset: ContractAddress` - WBTC address
- `vToken: ContractAddress` - Vesu VToken address
- `vault: ContractAddress` - Backpointer to vault
- `lastReportedAssets: u256` - For profit calculation

## Events

- `DepositEvent(caller, receiver, assets, shares)`
- `WithdrawEvent(caller, receiver, owner, assets, shares)`
- `StrategySwitched(old, new)`
- `Harvest(profit, loss, totalAssets)`
- `EmergencyWithdraw(amountRecovered)`
- `Paused(account)` / `Unpaused(account)`

## Testing Summary

- **10 Invariants** (INV-1 through INV-10)
- **10 Risks** (R-1 through R-10) mapped to tests
- **4 Test Trees** (Vault, Strategy, Integration, Security)
- **Test Types**: Unit, Integration, Property/Fuzz, Fork
- **Test Framework**: Starknet Foundry

See [TEST_MANIFEST.md](./testing/TEST_MANIFEST.md) for complete test catalog.
