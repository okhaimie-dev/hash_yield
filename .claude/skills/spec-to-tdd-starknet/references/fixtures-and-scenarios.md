# Fixtures And Scenario Setup

## Fixture Principles
- Keep fixtures small and composable
- Avoid hidden side effects; return explicit structs
- Prefer typed structs for bundles (deployed contracts, balances)
- Use Deployer trait pattern for consistent deployments

## Setup Result Pattern
```cairo
#[derive(Copy, Drop)]
pub struct SetupPoolResult {
    pub token0: IMockERC20Dispatcher,
    pub token1: IMockERC20Dispatcher,
    pub pool_key: PoolKey,
    pub core: ICoreDispatcher,
    pub locker: ICoreLockerDispatcher,
}

fn setup_pool(
    ref self: Deployer,
    fee: u128,
    tick_spacing: u128,
    initial_tick: i129,
    extension: ContractAddress,
) -> SetupPoolResult {
    let core = self.deploy_core();
    let locker = self.deploy_locker(core);
    let (token0, token1) = self.deploy_two_mock_tokens();

    let pool_key = PoolKey {
        token0: token0.contract_address,
        token1: token1.contract_address,
        fee,
        tick_spacing,
        extension,
    };

    core.initialize_pool(pool_key, initial_tick);

    SetupPoolResult { token0, token1, pool_key, core, locker }
}
```

## Test File Setup Pattern
```cairo
fn setup() -> (IContractDispatcher, IERC20Dispatcher, ContractAddress) {
    let mut d: Deployer = Default::default();
    let contract = /* deploy */;
    let token = d.deploy_mock_token_with_balance(owner: contract, starting_balance: 100);
    let caller = 123456.try_into().unwrap();
    set_contract_address(caller);
    (IContractDispatcher { contract_address: contract }, IERC20Dispatcher { contract_address: token.contract_address }, caller)
}
```

## Scenario Examples
- "Single user deposit and withdraw"
- "Swap with liquidity in range"
- "Swap across tick boundaries"
- "Flash loan borrow and repay"
- "Position update with fee collection"

## Where To Put Them
- `src/tests/helper.cairo` for Deployer and fixtures
- `src/tests/mocks/` for mock contracts
- Tests should compose fixtures rather than duplicating setup logic

## Balance Tracking Pattern
```cairo
#[derive(Drop, Copy)]
pub struct Balances {
    token0_balance_core: u256,
    token1_balance_core: u256,
    token0_balance_recipient: u256,
    token1_balance_recipient: u256,
}

fn get_balances(
    token0: IMockERC20Dispatcher,
    token1: IMockERC20Dispatcher,
    core: ICoreDispatcher,
    recipient: ContractAddress,
) -> Balances {
    Balances {
        token0_balance_core: token0.balanceOf(core.contract_address),
        token1_balance_core: token1.balanceOf(core.contract_address),
        token0_balance_recipient: token0.balanceOf(recipient),
        token1_balance_recipient: token1.balanceOf(recipient),
    }
}

fn assert_balances_delta(before: Balances, after: Balances, delta: Delta) {
    assert(diff(after.token0_balance_core, before.token0_balance_core) == delta.amount0, 'token0_balance_core');
    // ... more assertions
}
```

## Helper Functions
```cairo
pub fn default_owner() -> ContractAddress {
    12121212121212.try_into().unwrap()
}

pub fn switch_to_owner() {
    set_contract_address(default_owner());
}
```
