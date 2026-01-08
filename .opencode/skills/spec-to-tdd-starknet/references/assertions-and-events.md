# Assertions And Events

## Assertions
- Prefer explicit state comparisons (balances, supply, totals)
- Validate invariant boundaries after each operation
- Keep rounding tolerances explicit (e.g., <= 1 unit)
- Use `wide_abs_diff` for comparing amounts with tolerance

```cairo
use starkware_utils::math::abs::wide_abs_diff;

assert!(wide_abs_diff(actual_rewards, expected_rewards) < 100);
```

## Events
- Use snforge event spies for event assertions
- Validate event name, selector, and all fields
- Create per-event assertion helpers

## Event Test Utils Module Pattern (Starknet-Staking Style)
Create a dedicated `event_test_utils.cairo` module:

```cairo
use snforge_std::cheatcodes::events::{Event, EventSpy, EventSpyTrait};

pub(crate) fn assert_new_staker_event(
    spied_event: @(ContractAddress, Event),
    staker_address: ContractAddress,
    reward_address: ContractAddress,
    operational_address: ContractAddress,
    self_stake: Amount,
) {
    let expected_event = StakingEvents::NewStaker {
        staker_address, reward_address, operational_address, self_stake,
    };
    assert_expected_event_emitted(
        :spied_event,
        :expected_event,
        expected_event_selector: @selector!("NewStaker"),
        expected_event_name: "NewStaker",
    );
}

pub(crate) fn assert_stake_balance_changed_event(
    spied_event: @(ContractAddress, Event),
    staker_address: ContractAddress,
    old_self_stake: Amount,
    new_self_stake: Amount,
) {
    let expected_event = StakingEvents::StakeOwnBalanceChanged {
        staker_address, old_self_stake, new_self_stake,
    };
    assert_expected_event_emitted(
        :spied_event,
        :expected_event,
        expected_event_selector: @selector!("StakeOwnBalanceChanged"),
        expected_event_name: "StakeOwnBalanceChanged",
    );
}
```

## Using Event Spies
```cairo
use snforge_std::{spy_events, EventSpyTrait};

#[test]
fn test_stake_emits_event() {
    let mut spy = spy_events();
    
    // Perform action
    staking_dispatcher.stake(reward_address, operational_address, amount);
    
    // Get events
    let events = spy.get_events();
    assert!(events.len() == 1, 'expected 1 event');
    
    // Assert event
    assert_new_staker_event(
        spied_event: events.at(0),
        staker_address: caller,
        reward_address: reward_address,
        operational_address: operational_address,
        self_stake: amount,
    );
}
```

## Safe Dispatcher for Error Testing
```cairo
#[test]
#[feature("safe_dispatcher")]
fn test_cannot_stake_with_zero() {
    let safe_dispatcher = IStakingSafeDispatcher { contract_address };
    
    match safe_dispatcher.stake(reward_address, operational_address, 0) {
        Result::Ok(_) => panic!("Should have panicked"),
        Result::Err(panic_data) => {
            assert(*panic_data.at(0) == 'Amount is zero', *panic_data.at(0));
        }
    };
}
```

## Panic Assertion Helper
```cairo
use starkware_utils_testing::test_utils::assert_panic_with_error;

#[test]
fn test_staker_not_exists() {
    let result = safe_dispatcher.staker_info(non_existent_address);
    assert_panic_with_error(:result, expected_error: Error::STAKER_NOT_EXISTS);
}
```
