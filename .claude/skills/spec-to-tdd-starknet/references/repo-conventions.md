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

## Type Aliases Pattern (Starknet-Staking Style)
```cairo
pub type Commission = u16;
pub type Amount = u128;
pub type Index = u128;
pub type Epoch = u64;
pub type PublicKey = felt252;
pub type BlockNumber = u64;
```

## Structured Error Pattern (Starknet-Staking Style)
Use enums with `Describable` trait for human-readable errors:

```cairo
use starkware_utils::errors::{Describable, ErrorDisplay};

#[derive(Drop)]
pub enum Error {
    AMOUNT_LESS_THAN_MIN_STAKE,
    STAKER_EXISTS,
    STAKER_NOT_EXISTS,
    CALLER_CANNOT_INCREASE_STAKE,
    CONTRACT_IS_PAUSED,
}

impl DescribableError of Describable<Error> {
    fn describe(self: @Error) -> ByteArray {
        match self {
            Error::AMOUNT_LESS_THAN_MIN_STAKE => "Amount is less than min stake",
            Error::STAKER_EXISTS => "Staker already exists",
            Error::STAKER_NOT_EXISTS => "Staker does not exist",
            Error::CALLER_CANNOT_INCREASE_STAKE => "Caller cannot increase stake",
            Error::CONTRACT_IS_PAUSED => "Contract is paused",
        }
    }
}
```

Then compose errors across modules:
```cairo
#[derive(Drop)]
pub enum GenericError {
    StakingError: StakingError,
    PoolError: PoolError,
    // Shared errors
    AMOUNT_IS_ZERO,
    ZERO_ADDRESS,
}
```

## lib.cairo Visibility Pattern
```cairo
pub mod staking;
pub mod pool;
pub(crate) mod constants;      // Internal constants
pub mod errors;
pub mod types;

#[cfg(test)]
pub(crate) mod event_test_utils;  // Test-only modules
#[cfg(test)]
mod flow_test;
#[cfg(test)]
pub(crate) mod test_utils;
```

## Feature Flags for Tests
```cairo
// In lib.cairo
#[cfg(test)]
#[cfg(feature: 'fork_test')]
pub(crate) mod fork_test;

// In Scarb.toml
[features]
fork_test = []
```
