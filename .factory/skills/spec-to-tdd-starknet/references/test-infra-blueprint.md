# Testing Infrastructure Blueprint (Ekubo-Inspired Patterns)

Best practices inspired by production-grade Starknet projects like Ekubo.

## Project Layout (Ekubo-Style)
```
src/
├── lib.cairo                    # Module declarations
├── core.cairo                   # Main contract
├── components/                  # Reusable components (owned, upgradeable, etc.)
├── interfaces/                  # Trait definitions (ICore, IERC20, etc.)
├── types/                       # Custom types (i129, PoolKey, Delta, etc.)
├── math/                        # Math utilities
├── extensions/                  # Extension contracts
└── tests/                       # Co-located tests (preferred pattern)
    ├── helper.cairo             # Deployer, fixtures, assertions
    ├── mocks/                   # Mock contracts (locker, erc20, etc.)
    ├── core_test.cairo
    └── <module>_test.cairo
```

Alternative layout with separate tests directory is also acceptable.

## Scarb.toml Configuration (Latest - 2025)
```toml
[package]
name = "project_name"
version = "0.1.0"
edition = "2024_07"

[dependencies]
starknet = "2.15.0"

[dev-dependencies]
snforge_std = "0.51.1"
assert_macros = "2.15.0"

[[target.starknet-contract]]
sierra = true

[scripts]
test = "snforge test"

[tool.scarb]
allow-prebuilt-plugins = ["snforge_std"]

[tool.fmt]
sort-module-level-items = true

# Uncomment for coverage support:
# [profile.dev.cairo]
# unstable-add-statements-code-locations-debug-info = true
# unstable-add-statements-functions-debug-info = true
# inlining-strategy = "avoid"
```

## Core Pattern: snforge Deploy Helper
```cairo
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use starknet::ContractAddress;

pub fn deploy_contract(name: ByteArray) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
    contract_address
}

pub fn deploy_contract_with_calldata(name: ByteArray, calldata: @Array<felt252>) -> ContractAddress {
    let contract = declare(name).unwrap().contract_class();
    let (contract_address, _) = contract.deploy(calldata).unwrap();
    contract_address
}

pub fn default_owner() -> ContractAddress {
    12121212121212.try_into().unwrap()
}
```

## Alternative: Deployer Trait Pattern (Ekubo-style for complex setups)
For projects needing deterministic deployment ordering or complex setup flows:
```cairo
#[derive(Drop, Copy)]
pub struct Deployer {
    nonce: felt252,
}

impl DefaultDeployer of core::traits::Default<Deployer> {
    fn default() -> Deployer {
        Deployer { nonce: 0 }
    }
}

#[generate_trait]
pub impl DeployerTraitImpl of DeployerTrait {
    fn get_next_nonce(ref self: Deployer) -> felt252 {
        let nonce = self.nonce;
        self.nonce += 1;
        nonce
    }

    fn deploy_core(ref self: Deployer) -> ICoreDispatcher {
        let (address, _) = deploy_syscall(
            Core::TEST_CLASS_HASH.try_into().unwrap(),
            self.get_next_nonce(),
            serialize(@default_owner()).span(),
            true,
        ).expect('core deploy failed');
        ICoreDispatcher { contract_address: address }
    }
}
```

## Mock Contracts Pattern
```cairo
#[starknet::contract]
pub mod MockERC20 {
    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, initial_balance: u128) {
        self.balances.write(owner, initial_balance.into());
    }

    #[abi(embed_v0)]
    impl IERC20Impl of IERC20<ContractState> { /* ... */ }
}
```

## Action/Result Pattern for Complex Tests
```cairo
#[derive(Copy, Drop, Serde)]
pub enum Action {
    UpdatePosition: (PoolKey, UpdateParams, ContractAddress),
    Swap: (PoolKey, SwapParams, ContractAddress),
    FlashBorrow: (ContractAddress, u128, u128),
}

#[derive(Copy, Drop, Serde)]
pub enum ActionResult {
    UpdatePosition: Delta,
    Swap: Delta,
    FlashBorrow: (),
}

#[starknet::interface]
pub trait ITestLocker<TContractState> {
    fn call(ref self: TContractState, action: Action) -> ActionResult;
}
```

## Balance Tracking Pattern
```cairo
#[derive(Drop, Copy)]
pub struct Balances {
    token0_core: u256,
    token1_core: u256,
    token0_user: u256,
    token1_user: u256,
}

fn get_balances(token0: IERC20, token1: IERC20, core: ContractAddress, user: ContractAddress) -> Balances { /* ... */ }

fn assert_balances_delta(before: Balances, after: Balances, delta: Delta) {
    assert(diff(after.token0_core, before.token0_core) == delta.amount0, 'token0_balance');
    // ...
}
```

## Test Helper Functions
```cairo
pub fn default_owner() -> ContractAddress {
    12121212121212.try_into().unwrap()
}

pub fn diff(x: u256, y: u256) -> i129 {
    let (lower, upper) = if x < y { (x, y) } else { (y, x) };
    let diff = upper - lower;
    assert(diff.high == 0, 'diff_overflow');
    i129 { mag: diff.low, sign: (x < y) & (diff != 0) }
}

pub fn update_position(setup: SetupResult, bounds: Bounds, liquidity: i129, recipient: ContractAddress) -> Delta {
    update_position_inner(setup.core, setup.pool_key, setup.locker, bounds, liquidity, recipient)
}
```

## Test File Pattern
```cairo
use starknet::testing::set_contract_address;
use crate::tests::helper::{Deployer, DeployerTrait, default_owner};

fn setup() -> (IClearDispatcher, IERC20Dispatcher, ContractAddress) {
    let mut d: Deployer = Default::default();
    let test_contract = /* deploy */;
    let token = d.deploy_mock_token_with_balance(owner: test_contract, starting_balance: 100);
    let caller = 123456.try_into().unwrap();
    set_contract_address(caller);
    (IClearDispatcher { contract_address: test_contract }, IERC20Dispatcher { contract_address: token.contract_address }, caller)
}

#[test]
fn test_clear() {
    let (contract, erc20, caller) = setup();
    assert_eq!(erc20.balanceOf(contract.contract_address), 100);
    contract.clear(erc20);
    assert_eq!(erc20.balanceOf(caller), 100);
}

#[test]
#[should_panic(expected: ('CLEAR_AT_LEAST_MINIMUM', 'ENTRYPOINT_FAILED'))]
fn test_clear_minimum_fails() {
    let (contract, erc20, _) = setup();
    contract.clear_minimum(erc20, 101);
}
```

## Component Pattern
```cairo
#[starknet::interface]
pub trait IOwned<TContractState> {
    fn get_owner(self: @TContractState) -> ContractAddress;
    fn transfer_ownership(ref self: TContractState, new_owner: ContractAddress);
}

pub trait Ownable<TContractState> {
    fn initialize_owned(ref self: TContractState, owner: ContractAddress);
    fn require_owner(self: @TContractState) -> ContractAddress;
}

#[starknet::component]
pub mod Owned {
    #[storage]
    pub struct Storage { pub owner: ContractAddress }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event { OwnershipTransferred: OwnershipTransferred }

    #[embeddable_as(OwnedImpl)]
    pub impl Owned<TContractState, +HasComponent<TContractState>> of IOwned<ComponentState<TContractState>> {
        fn get_owner(self: @ComponentState<TContractState>) -> ContractAddress { self.owner.read() }
        fn transfer_ownership(ref self: ComponentState<TContractState>, new_owner: ContractAddress) { /* ... */ }
    }
}
```

## Custom Types Pattern
```cairo
#[derive(Copy, Drop, Serde, Debug)]
pub struct i129 {
    pub mag: u128,
    pub sign: bool,
}

impl i129StorePacking of StorePacking<i129, felt252> {
    fn pack(value: i129) -> felt252 { /* ... */ }
    fn unpack(value: felt252) -> i129 { /* ... */ }
}

impl i129Add of Add<i129> { fn add(lhs: i129, rhs: i129) -> i129 { /* ... */ } }
impl i129Zero of Zero<i129> { fn zero() -> i129 { i129 { mag: 0, sign: false } } }
```

## Test File Naming
- Co-located: `src/tests/<module>_test.cairo`
- Separate: `tests/unit/test_<module>.cairo`
- Each test includes `// TEST-ID: TEST-...` marker
