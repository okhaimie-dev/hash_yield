# Mock Contract Patterns

## Goals
- Make external dependencies deterministic
- Provide hooks to simulate various scenarios (success, failure, edge cases)
- Enable complex test flows (callbacks, reentrancy, flash loans)

## Common Mocks

### MockERC20
```cairo
#[starknet::contract]
pub mod MockERC20 {
    use starknet::storage::Map;
    use starknet::ContractAddress;

    #[storage]
    struct Storage {
        balances: Map<ContractAddress, u256>,
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        total_supply: u256,
        name: felt252,
        symbol: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        owner: ContractAddress,
        starting_balance: u128,
        name: felt252,
        symbol: felt252,
    ) {
        self.balances.write(owner, starting_balance.into());
        self.total_supply.write(starting_balance.into());
        self.name.write(name);
        self.symbol.write(symbol);
    }

    #[abi(embed_v0)]
    impl IERC20Impl of IERC20<ContractState> {
        fn balanceOf(self: @ContractState, account: ContractAddress) -> u256 {
            self.balances.read(account)
        }
        fn transfer(ref self: ContractState, recipient: ContractAddress, amount: u256) -> bool {
            // Implementation
            true
        }
        // ... other methods
    }

    // Test helpers - not part of standard interface
    #[generate_trait]
    impl MockHelpers of MockHelpersTrait {
        fn mint(ref self: ContractState, to: ContractAddress, amount: u256) {
            self.balances.write(to, self.balances.read(to) + amount);
            self.total_supply.write(self.total_supply.read() + amount);
        }
    }
}
```

### Test Locker (Callback Pattern)
```cairo
#[derive(Copy, Drop, Serde)]
pub enum Action {
    UpdatePosition: (PoolKey, UpdatePositionParameters, ContractAddress),
    Swap: (PoolKey, SwapParameters, ContractAddress),
    FlashBorrow: (ContractAddress, u128, u128),
}

#[derive(Copy, Drop, Serde)]
pub enum ActionResult {
    UpdatePosition: Delta,
    Swap: Delta,
    FlashBorrow: (),
}

#[starknet::contract]
pub mod CoreLocker {
    #[storage]
    struct Storage {
        core: ICoreDispatcher,
    }

    #[abi(embed_v0)]
    impl ILockerImpl of ILocker<ContractState> {
        fn locked(ref self: ContractState, id: u32, data: Span<felt252>) -> Span<felt252> {
            let core = self.core.read();
            let action: Action = consume_callback_data(core, data);

            let result = match action {
                Action::Swap((pool_key, params, recipient)) => {
                    let delta = core.swap(pool_key, params);
                    handle_delta(core, pool_key.token0, delta.amount0, recipient);
                    handle_delta(core, pool_key.token1, delta.amount1, recipient);
                    ActionResult::Swap(delta)
                },
                // ... other actions
            };

            serialize(@result).span()
        }
    }

    #[abi(embed_v0)]
    impl CoreLockerImpl of ICoreLocker<ContractState> {
        fn call(ref self: ContractState, action: Action) -> ActionResult {
            call_core_with_callback(self.core.read(), @action)
        }
    }
}
```

### Mock Extension
```cairo
#[starknet::contract]
pub mod MockExtension {
    #[storage]
    struct Storage {
        core: ICoreDispatcher,
        call_points: CallPoints,
        before_swap_called: bool,
        after_swap_called: bool,
    }

    #[abi(embed_v0)]
    impl IExtensionImpl of IExtension<ContractState> {
        fn before_swap(ref self: ContractState, caller: ContractAddress, pool_key: PoolKey, params: SwapParameters) {
            self.before_swap_called.write(true);
        }
        fn after_swap(ref self: ContractState, caller: ContractAddress, pool_key: PoolKey, params: SwapParameters, delta: Delta) {
            self.after_swap_called.write(true);
        }
        // ... other hooks with assert(false, 'never called') for unused ones
    }
}
```

## Mock Guidelines
- Minimal surface area required by tests
- Explicit helpers for state manipulation
- Use `assert(false, 'never called')` for extension hooks not under test
- Avoid business logic beyond what's needed
- Use `TEST_CLASS_HASH` for deployment in tests

## Deploying Mocks
```cairo
fn deploy_mock_token(ref self: Deployer, owner: ContractAddress, balance: u128) -> IMockERC20Dispatcher {
    let (address, _) = deploy_syscall(
        MockERC20::TEST_CLASS_HASH.try_into().unwrap(),
        self.get_next_nonce(),
        array![owner.into(), balance.into(), '', ''].span(),
        true,
    ).expect('token deploy failed');
    IMockERC20Dispatcher { contract_address: address }
}
```
