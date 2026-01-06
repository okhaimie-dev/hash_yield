# Implementation Specification - Starknet BTC Vault

This directory contains the **implementation-focused** specifications extracted from the deep research document. This is the scaffolding foundation for building the ERC-4626 BTC Vault system.

## 📋 Quick Start

1. **Start here**: Read [IMPLEMENTATION_MANIFEST.md](./IMPLEMENTATION_MANIFEST.md) for overview and navigation
2. **Contracts**: See [contracts/](./contracts/) for interface and storage specifications
3. **Logic**: See [logic/](./logic/) for function implementation pseudocode
4. **Testing**: See [testing/TEST_MANIFEST.md](./testing/TEST_MANIFEST.md) for complete test catalog

## 📁 Directory Structure

```
specs/002-starknet-btc-vault/
├── IMPLEMENTATION_MANIFEST.md    # Master index + quick reference
├── README.md                      # This file
│
├── contracts/                     # Contract specifications
│   ├── vault.md                   # Vault interface, storage, events
│   ├── strategy-interface.md       # IStrategy trait
│   └── lending-strategy-v0.md     # LendingStrategyV0 implementation
│
├── logic/                         # Function implementation logic
│   ├── vault-core-logic.md        # ERC-4626 functions pseudocode
│   ├── strategy-logic.md           # Strategy functions pseudocode
│   └── admin-logic.md             # Admin/emergency functions
│
├── testing/                       # Complete testing specifications
│   ├── TEST_MANIFEST.md           # Test catalog (all tests listed)
│   ├── invariants.md              # 10 system invariants
│   ├── pre-post-conditions.md      # Function contracts
│   ├── risk-matrix.md             # Risk ID → Test mapping
│   ├── property-tests.md           # Property-based test specs
│   ├── infrastructure.md           # Mocks, helpers, fixtures
│   │
│   ├── test-trees/                # Bulloak BTT format
│   │   ├── Vault.tree
│   │   ├── Strategy.tree
│   │   ├── Integration.tree
│   │   └── Security.tree
│   │
│   └── test-stubs/                # Arrange-Act-Assert skeletons
│       ├── unit/
│       ├── integration/
│       └── properties/
│
└── dependencies.md                 # OZ components, external deps
```

## 🎯 What's Included

### Contract Specifications
- ✅ Complete function signatures with types
- ✅ Storage layouts
- ✅ Event definitions
- ✅ Access control requirements

### Implementation Logic
- ✅ Pseudocode for all functions
- ✅ Rounding rules
- ✅ Error handling
- ✅ State transitions

### Testing Infrastructure
- ✅ **10 Invariants** (INV-1 through INV-10)
- ✅ **10 Risks** (R-1 through R-10) mapped to tests
- ✅ **4 Test Trees** in Bulloak BTT format
- ✅ **16+ Test Cases** cataloged with full details
- ✅ **Test Stubs** in Arrange-Act-Assert format
- ✅ **Property Tests** specifications
- ✅ **Mock Contracts** requirements
- ✅ **Testing Infrastructure** setup

## 🚀 Next Steps

1. **Review** the manifest and understand the structure
2. **Scaffold** the actual contract files using the specifications
3. **Implement** functions following the pseudocode
4. **Write Tests** using the test stubs and trees as guides
5. **Verify** invariants and risks are covered

## 📊 Test Coverage Summary

- **Total Tests**: 16+ (property tests generate many cases)
- **Unit Tests**: 7
- **Integration Tests**: 6  
- **Security Tests**: 3
- **Property/Fuzz Tests**: 3
- **Test Trees**: 4 (BTT format)
- **Invariants**: 10
- **Risks Mapped**: 10

## 🔗 Key Documents

- **[IMPLEMENTATION_MANIFEST.md](./IMPLEMENTATION_MANIFEST.md)** - Start here for navigation
- **[TEST_MANIFEST.md](./testing/TEST_MANIFEST.md)** - Complete test catalog
- **[invariants.md](./testing/invariants.md)** - System invariants
- **[risk-matrix.md](./testing/risk-matrix.md)** - Risk → Test mapping

## 📝 Notes

- All specifications are extracted from `specs/original-deep-research.md`
- This is **scaffolding** - actual implementation comes next
- Test trees use Bulloak BTT format for systematic test organization
- Mock contracts are specified but not yet implemented
- Dependencies are listed but versions need verification
