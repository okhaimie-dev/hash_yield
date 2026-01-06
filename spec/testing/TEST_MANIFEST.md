# Test Manifest

Complete catalog of all tests to be written, with preconditions, postconditions, test types, and other metadata.

## Test Organization

Tests are organized by category:
- **Unit Tests**: Individual component testing
- **Integration Tests**: Vault + Strategy + External protocol
- **Property Tests**: Property-based and fuzz tests
- **Security Tests**: Edge cases, attacks, invariants

## Test Catalog

### Unit Tests - Vault Basic

#### TEST-VAULT-001: deposit_mint_basic
- **Type**: Unit
- **File**: `tests/unit/test_vault_basic.cairo`
- **Tree Path**: `VaultTest > When depositing assets > When assets > 0 and vault empty`
- **Preconditions**: 
  - Vault deployed with MockWBTC, no strategy
  - User A has 1000 WBTC, approved vault
- **Postconditions**:
  - After deposit: `vault.balanceOf(A) == 500`, `vault.totalSupply() == 500`, `vault.totalAssets() == 500`
  - Deposit event emitted
  - After mint: `vault.balanceOf(A) == 600`, totalAssets increased
- **Invariants Checked**: INV-1, INV-2
- **Risks Covered**: None (happy path)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

#### TEST-VAULT-002: withdraw_redeem_basic
- **Type**: Unit
- **File**: `tests/unit/test_vault_basic.cairo`
- **Tree Path**: `VaultTest > When withdrawing assets > When owner has sufficient shares`
- **Preconditions**: 
  - Vault with 600 shares/assets, user A has 600 shares
- **Postconditions**:
  - After withdraw: `vault.balanceOf(A)` decreased by sharesBurned ≈ 100
  - User A's WBTC balance increased by 100
  - After redeem: `vault.balanceOf(A)` decreased by 50
  - Withdraw events emitted
  - Final: vault has 450 assets, totalSupply 450
  - INV-1, INV-2 hold
- **Invariants Checked**: INV-1, INV-2
- **Risks Covered**: None (happy path)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

#### TEST-VAULT-003: zero_amount_reverts
- **Type**: Unit
- **File**: `tests/unit/test_vault_basic.cairo`
- **Tree Path**: `VaultTest > When depositing assets > When assets = 0`
- **Preconditions**: Vault with any state
- **Postconditions**: All calls revert with appropriate error
- **Invariants Checked**: None (negative test)
- **Risks Covered**: R-2 (edge case)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

#### TEST-VAULT-004: preview_functions_consistency
- **Type**: Unit
- **File**: `tests/unit/test_vault_basic.cairo`
- **Tree Path**: `VaultTest > When using convertToShares/convertToAssets`
- **Preconditions**: Vault with some assets and shares
- **Postconditions**: 
  - `previewDeposit(x)` == actual shares minted from `deposit(x)`
  - `previewMint(shares)` == actual assets pulled from `mint(shares)`
  - Preview functions are pure (no state change)
- **Invariants Checked**: INV-3 (rounding)
- **Risks Covered**: None
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

### Unit Tests - Vault Edge Cases

#### TEST-VAULT-005: multiple_depositors_and_rounding
- **Type**: Unit
- **File**: `tests/unit/test_vault_edgecases.cairo`
- **Tree Path**: `VaultTest > When depositing assets > When assets > 0 and vault has existing deposits`
- **Preconditions**: 
  - Users A and B each have 1000 WBTC, approved vault
  - Vault empty, no strategy
- **Postconditions**:
  - A deposits 101 → gets 101 shares
  - B deposits 203 → gets correct shares based on exchange rate
  - A deposits 50 → gets correct shares
  - Total supply = sum of shares, totalAssets = 354
  - Each user's asset equivalent <= assets they put in (rounding losses)
  - No more than 1 wei lost per deposit
- **Invariants Checked**: INV-1, INV-2, INV-3
- **Risks Covered**: R-2 (rounding accumulation)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

#### TEST-VAULT-006: share_transfer_and_approval
- **Type**: Unit
- **File**: `tests/unit/test_vault_edgecases.cairo`
- **Tree Path**: `VaultTest > When ERC20 functions are used`
- **Preconditions**: 
  - User A has 100 shares, B has 50 shares
- **Postconditions**:
  - A transfers 20 to B → A=80, B=70
  - A approves B for 30 → allowance set
  - B calls transferFrom(A, C, 10) → A=70, C=10, allowance reduced
  - totalSupply unchanged
  - No effect on totalAssets
- **Invariants Checked**: INV-2, INV-4
- **Risks Covered**: R-10 (ERC20 compliance)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

#### TEST-VAULT-007: pause_functionality
- **Type**: Unit
- **File**: `tests/unit/test_vault_edgecases.cairo`
- **Tree Path**: `VaultTest > When vault is paused`
- **Preconditions**: 
  - Vault with deposits, admin is test account
- **Postconditions**:
  - Admin calls pause → paused = true
  - User deposit → revert "paused"
  - User withdraw → revert (if we block)
  - Admin unpause → paused = false
  - Operations succeed again
  - No state change during pause
- **Invariants Checked**: INV-7
- **Risks Covered**: R-7 (paused mode confusion)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

### Integration Tests - Strategy

#### TEST-INT-001: deposit_goes_to_strategy
- **Type**: Integration
- **File**: `tests/integration/test_strategy_integration.cairo`
- **Tree Path**: `IntegrationTest > When a user deposits into vault with strategy active`
- **Preconditions**:
  - MockWBTC, MockVesuPool deployed
  - StrategyV0 deployed with MockVesuPool
  - Vault deployed, strategy set to StrategyV0
  - User A has 500 WBTC, approved vault
- **Postconditions**:
  - Vault share balance of A ≈ 500
  - Vault asset balance ≈ 0 (strategy took all)
  - Strategy totalAssets == 500
  - MockVesuPool balanceOf(strategy) > 0
  - Deposit event emitted
- **Invariants Checked**: INV-1, INV-5
- **Risks Covered**: None (happy path)
- **Mocks Required**: MockWBTC, MockVesuPool
- **Fuzz**: No
- **Fork**: No

#### TEST-INT-002: withdraw_takes_from_strategy
- **Type**: Integration
- **File**: `tests/integration/test_strategy_integration.cairo`
- **Tree Path**: `IntegrationTest > When a user withdraws after yield accrual`
- **Preconditions**: Continue from TEST-INT-001 (500 in strategy)
- **Postconditions**:
  - Strategy.withdraw called for ~200
  - MockVesuPool balanceOf(strategy) reduced
  - User A received 200 WBTC
  - Vault totalAssets ≈ 300
  - Shares burned ≈ 200
  - Withdraw event emitted
- **Invariants Checked**: INV-1, INV-2
- **Risks Covered**: None (happy path)
- **Mocks Required**: MockWBTC, MockVesuPool
- **Fuzz**: No
- **Fork**: No

#### TEST-INT-003: yield_accrual_reflected
- **Type**: Integration
- **File**: `tests/integration/test_strategy_integration.cairo`
- **Tree Path**: `IntegrationTest > When multiple users deposit, then external yield accrues`
- **Preconditions**: Vault with 300 in strategy
- **Postconditions**:
  - MockVesuPool exchange rate set to 1.1 (10% gain)
  - vault.totalAssets ≈ 330
  - User withdraws 50 → shares burned < 50 (share price > 1)
  - vault.harvest() reports profit ≈ 30, loss 0
  - Harvest event emitted
  - Share price only increased
- **Invariants Checked**: INV-1, INV-2
- **Risks Covered**: None (happy path)
- **Mocks Required**: MockWBTC, MockVesuPool
- **Fuzz**: No
- **Fork**: No

#### TEST-INT-004: strategy_switch_migration
- **Type**: Integration
- **File**: `tests/integration/test_strategy_integration.cairo`
- **Tree Path**: `IntegrationTest > When strategy is switched to new strategy`
- **Preconditions**: 
  - Vault with ~280 in StrategyV0
  - New MockStrategy deployed
- **Postconditions**:
  - Old strategy withdrawAll called → old pool has 0 assets
  - New strategy deposit called → new pool has 280 assets
  - vault.currentStrategy = newStrategy
  - vault.totalAssets still 280
  - User shares unaffected
  - StrategySwitched event emitted
- **Invariants Checked**: INV-1, INV-2, INV-5
- **Risks Covered**: R-6 (misuse of setStrategy)
- **Mocks Required**: MockWBTC, MockVesuPool, MockStrategy
- **Fuzz**: No
- **Fork**: No

### Integration Tests - Emergency

#### TEST-EMERG-001: emergency_withdraw_sequence
- **Type**: Integration
- **File**: `tests/integration/test_emergency.cairo`
- **Tree Path**: `IntegrationTest > When emergencyWithdraw is triggered mid-yield`
- **Preconditions**:
  - Vault + Strategy with 280 assets
  - Simulate loss: MockVesuPool total assets reduced to 200
- **Postconditions**:
  - Strategy.emergencyWithdraw called → returns 200
  - Vault has 200 WBTC
  - vault.totalAssets == 200, totalSupply unchanged
  - vault.currentStrategy = 0
  - EmergencyWithdraw event emitted
  - User redeems all shares → gets 200 WBTC (loss realized)
  - All shares burned, vault empty
  - Further deposits revert
- **Invariants Checked**: INV-1, INV-2, INV-8, INV-9
- **Risks Covered**: R-4 (external protocol failure)
- **Mocks Required**: MockWBTC, MockVesuPool
- **Fuzz**: No
- **Fork**: No

#### TEST-EMERG-002: unauthorized_emergency
- **Type**: Integration
- **File**: `tests/integration/test_emergency.cairo`
- **Tree Path**: `SecurityTest > When non-admin calls admin functions`
- **Preconditions**: Vault with strategy and funds
- **Postconditions**: All unauthorized calls revert "Unauthorized"
- **Invariants Checked**: None (negative test)
- **Risks Covered**: R-6 (misuse of setStrategy)
- **Mocks Required**: MockWBTC, MockVesuPool
- **Fuzz**: No
- **Fork**: No

### Security Tests

#### TEST-SEC-001: inflation_attack_simulation
- **Type**: Security
- **File**: `tests/security/test_inflation_attack.cairo`
- **Tree Path**: `SecurityTest > When attacker attempts inflation attack`
- **Preconditions**:
  - Vault empty
  - Attacker has WBTC
- **Postconditions**:
  - Attacker deposits 1 wei → gets minimal shares
  - Attacker donates large amount to vault (direct transfer)
  - Victim deposits → should still receive >0 shares
  - Attacker doesn't profit (offset active)
- **Invariants Checked**: INV-1, INV-2, INV-3
- **Risks Covered**: R-1 (inflation attack)
- **Mocks Required**: MockWBTC
- **Fuzz**: No
- **Fork**: No

#### TEST-SEC-002: reentrancy_guard
- **Type**: Security
- **File**: `tests/security/test_reentrancy.cairo`
- **Tree Path**: `SecurityTest > Invariant checks throughout operations`
- **Preconditions**: 
  - Malicious strategy that tries to reenter vault
- **Postconditions**: Reentrancy prevented (revert or guard active)
- **Invariants Checked**: INV-6
- **Risks Covered**: R-3 (reentrancy attack)
- **Mocks Required**: MockWBTC, MaliciousStrategy
- **Fuzz**: No
- **Fork**: No

#### TEST-SEC-003: strategy_asset_mismatch
- **Type**: Security
- **File**: `tests/security/test_strategy_validation.cairo`
- **Tree Path**: `SecurityTest > When admin misconfigures`
- **Preconditions**: 
  - Strategy with different asset deployed
- **Postconditions**: `setStrategy` reverts "Invalid strategy"
- **Invariants Checked**: INV-5
- **Risks Covered**: R-6 (misuse of setStrategy)
- **Mocks Required**: MockWBTC, MockToken (different), WrongStrategy
- **Fuzz**: No
- **Fork**: No

### Property Tests

#### TEST-PROP-001: random_sequence_no_loss
- **Type**: Property/Fuzz
- **File**: `tests/properties/prop_invariants.cairo`
- **Tree Path**: N/A (property test)
- **Preconditions**: 
  - Vault with MockStrategy
  - Generate N random operations (deposit/withdraw)
- **Postconditions**: 
  - After each op: INV-1, INV-2, INV-3 hold
  - Share price non-decreasing
  - No negative balances
  - No runtime errors
- **Invariants Checked**: INV-1, INV-2, INV-3
- **Risks Covered**: R-2, R-8
- **Mocks Required**: MockWBTC, MockStrategy
- **Fuzz**: Yes
- **Fork**: No

#### TEST-PROP-002: equivalent_deposit_withdraw
- **Type**: Property/Fuzz
- **File**: `tests/properties/prop_invariants.cairo`
- **Tree Path**: N/A (property test)
- **Preconditions**: Vault with any state
- **Postconditions**: 
  - User deposits X then withdraws X → net change ≤ 0
  - Loss ≤ 1 unit of asset
  - Vault totalAssets back to initial
- **Invariants Checked**: INV-1, INV-2, INV-3
- **Risks Covered**: R-2 (rounding)
- **Mocks Required**: MockWBTC
- **Fuzz**: Yes
- **Fork**: No

#### TEST-PROP-003: parallel_deposit_order
- **Type**: Property/Fuzz
- **File**: `tests/properties/prop_invariants.cairo`
- **Tree Path**: N/A (property test)
- **Preconditions**: Vault empty
- **Postconditions**: 
  - Scenario 1: A deposits X, B deposits Y
  - Scenario 2: B deposits Y, A deposits X
  - Final totalAssets and totalSupply identical
  - User A's asset-equivalent differs ≤ 1 unit
- **Invariants Checked**: INV-1, INV-2, INV-3
- **Risks Covered**: R-2 (rounding)
- **Mocks Required**: MockWBTC
- **Fuzz**: Yes
- **Fork**: No

## Test Statistics

- **Total Tests**: 16+ (property tests generate many cases)
- **Unit Tests**: 7
- **Integration Tests**: 6
- **Security Tests**: 3
- **Property Tests**: 3 (with fuzzing)
- **Fuzz Tests**: 3
- **Fork Tests**: 0 (future)

## Test Coverage

### By Invariant
- INV-1: 12 tests
- INV-2: 12 tests
- INV-3: 8 tests
- INV-4: 1 test
- INV-5: 2 tests
- INV-6: 1 test
- INV-7: 1 test
- INV-8: 1 test
- INV-9: 1 test

### By Risk
- R-1: 1 test
- R-2: 4 tests
- R-3: 1 test
- R-4: 1 test
- R-6: 3 tests
- R-7: 1 test
- R-8: 1 test
- R-10: 1 test

## Test Implementation Notes

- All tests use Arrange-Act-Assert pattern
- Mock contracts required: MockWBTC, MockVesuPool, MockStrategy
- Test framework: Starknet Foundry
- Property tests use fuzzing with random inputs
- Each test should check relevant invariants
- Negative tests verify proper reverts
