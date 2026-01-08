# Repo Conventions

## Paths (Ekubo-Style Layout - Preferred)
```
src/
├── lib.cairo                    # Module root with pub mod declarations
├── <main_contract>.cairo        # Primary contract implementation
├── components/                  # Reusable starknet components
│   ├── owned.cairo             # Ownership component
│   ├── upgradeable.cairo       # Upgrade component
│   └── ...
├── interfaces/                  # Trait definitions
│   ├── core.cairo              # ICore, ILocker, IExtension
│   ├── erc20.cairo             # IERC20
│   └── ...
├── types/                       # Custom types and structs
│   ├── keys.cairo              # PoolKey, PositionKey
│   ├── i129.cairo              # Signed integer type
│   └── ...
├── math/                        # Math utilities (optional)
└── tests/                       # Co-located tests (preferred)
    ├── helper.cairo            # Deployer trait, fixtures, utils
    ├── mocks/                  # Mock contracts
    │   ├── mock_erc20.cairo
    │   └── locker.cairo
    ├── <module>_test.cairo     # Test files
    └── tests.cairo             # Test module declarations
```

## Alternative Layout (Separate Tests)
```
src/
├── lib.cairo
├── contracts/
│   ├── interfaces/
│   ├── abstracts/
│   └── mocks/
└── testing/
    ├── fixtures.cairo
    └── helpers.cairo
tests/
├── unit/
├── integration/
└── btt/
```

## lib.cairo Pattern
```cairo
pub mod core;
pub mod positions;

#[cfg(test)]
pub(crate) mod tests;

pub mod components {
    pub mod owned;
    pub mod upgradeable;
}

pub mod interfaces {
    pub mod core;
    pub mod erc20;
}

pub mod types {
    pub mod keys;
    pub mod i129;
}
```

## Naming Conventions

### Test IDs
- Format: `TEST-<DOMAIN>-<FUNCTION>-<NNN>`
- Examples:
  - `TEST-CORE-SWAP-001`
  - `TEST-POSITIONS-MINT-001`
  - `TEST-OWNED-TRANSFER-001`

### Invariants
- Format: `INV-<NN>`
- Example: `INV-01: Total supply equals sum of all balances`

### Risks
- Format: `R-<N>`
- Example: `R-1: Reentrancy on withdraw`

## File Naming

### Co-located Tests (Preferred)
- `src/tests/<module>_test.cairo`
- `src/tests/helper.cairo`
- `src/tests/mocks/<mock_name>.cairo`

### Separate Tests
- `tests/unit/test_<domain>_<topic>.cairo`
- `tests/integration/test_<domain>_<topic>.cairo`
- `tests/properties/prop_<topic>.cairo`

## Interface Pattern
```cairo
#[starknet::interface]
pub trait ICore<TContractState> {
    fn get_pool_price(self: @TContractState, pool_key: PoolKey) -> PoolPrice;
    fn swap(ref self: TContractState, pool_key: PoolKey, params: SwapParameters) -> Delta;
}
```

## Type Definitions
- Use `#[derive(Copy, Drop, Serde)]` for parameter structs
- Use `#[derive(Copy, Drop, Serde, PartialEq, Hash)]` for key structs
- Implement `StorePacking` for storage-optimized types
- Implement `Zero` trait for types that need zero values
