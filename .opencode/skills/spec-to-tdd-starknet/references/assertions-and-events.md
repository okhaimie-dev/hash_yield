# Assertions And Events

## Assertions
- Prefer explicit state comparisons (balances, supply, totals).
- Validate invariant boundaries after each operation.
- Keep rounding tolerances explicit (e.g., <= 1 unit).

## Events
- If event assertions are supported, validate:
  - event name
  - indexed fields (caller, receiver, owner)
  - assets/shares amounts
- If event assertions are not available, validate the state changes that imply them.

## Exemplar-Style Patterns
- Prefer event-specific assertion helpers (one helper per event) to keep tests concise.
- Use event spies to capture events and assert expected selectors + payloads.
- Use small helpers to assert number of events emitted when order is not important.
- Keep event assertions in a shared module so tests only pass in expected values.
