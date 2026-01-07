# Fixtures And Scenario Setup

## Fixture Principles
- Keep fixtures small and composable.
- Avoid hidden side effects; return explicit structs.
- Prefer typed structs for bundles (users, deployed contracts, balances).

## Typical Fixtures
- `setup_users()` -> returns admin + 2-3 user accounts.
- `setup_token()` -> deploys mock token, mints to users.
- `setup_protocol()` -> deploys core contracts with mock dependencies.

## Scenario Examples
- "Single user deposit and withdraw"
- "Multiple users with rounding"
- "Paused state flows"
- "Emergency path"

## Where To Put Them
- `src/testing/fixtures.cairo` module for reusable setups.
- Tests should compose fixtures rather than duplicating setup logic.

## Exemplar-Style Patterns
- **Constants module**: define addresses, default balances, and time/epoch parameters in one place and re-use across tests.
- **Role setup helpers**: helpers to assign admin/roles for tests (e.g., governance, security, token admin).
- **Block/time helpers**: helpers to advance block number and timestamps for time-dependent logic.
- **Flow scaffolding**: large scenario tests encapsulate setup + test steps in structs with `setup`/`test` functions to keep per-test logic minimal.
