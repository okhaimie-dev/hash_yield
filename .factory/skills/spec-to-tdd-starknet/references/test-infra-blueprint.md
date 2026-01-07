# Testing Infrastructure Blueprint (Exemplar Patterns)

This file encodes best practices inspired by a high-quality Starknet repo. Use these patterns even when the exemplar itself is not available.

## Project Layout (Default Example - Override Per Repo)
- `src/contracts/`: product code (interfaces, abstracts, mocks)
- `src/testing/`: reusable test helpers and fixtures
- `TESTS_DIR/unit/`, `TESTS_DIR/integration/`, `TESTS_DIR/properties/` (or co-located tests under `src/`)
- `BTT_DIR`: BTT tree files
- `SPEC_DOCS_DIR`: manifest, invariants, risk matrix, pre/post conditions

## Snforge Setup
- Use `snforge_std` in `dev-dependencies`.
- Expose `snforge test` via `[scripts]` in Scarb.
- Allow prebuilt plugin for snforge.

## Exemplar-Derived Patterns
- **Centralized test utilities**: a `test_utils` module that exposes constants, deployment helpers, role setup helpers, and cheatcode wrappers (e.g., caller impersonation, time/block manipulation).
- **Event assertions**: a dedicated `event_test_utils` module with small helper functions that compare emitted events against expected structs and selectors.
- **Cheatcodes usage**: frequent use of snforge cheatcodes to set caller, time, and block state, plus event spying utilities for assertion.
- **Event spies**: use snforge event spies and helper assertions (e.g., "assert number of events") to keep tests small.
- **Flow-style integration tests**: complex scenarios modeled as "flows" with `setup` and `test` phases; flows are declared as structs and executed via shared helpers.
- **Coverage guardrails**: a script that asserts every declared flow has at least one test (mirrors the role of `validate_coverage.py` for manifest/BTT/stubs).

### Concrete Patterns To Mirror
- **`test_utils` contents**: constants (addresses, amounts, epoch params), deployment helpers, role assignment helpers, and wrappers around snforge cheatcodes.
- **`event_test_utils` contents**: one assertion helper per event type, using event spies and expected selectors.
- **Flow harness**: a small "system" helper that wires up core contracts and exposes convenience methods (e.g., "advance epoch", "attest", "upgrade"). Each flow calls `setup` then `test`.
- **Scripted coverage**: a small script that parses a flow list and verifies each flow is tested; adapt this mindset to your manifest/BTT/stub coverage checks.

#### Example Helper Names (inspired by a high-quality repo)
- Cheatcode helpers: `cheat_caller_address_once`, `start_cheat_block_number_global`, `start_cheat_block_timestamp_global`.
- Event helpers: `assert_expected_event_emitted`, `assert_number_of_events`, and per-event assertion wrappers.
- Token helpers: `deploy_mock_erc20_decimals_contract`, `fund`, `approve`, `custom_decimals_token`.
- Role helpers: `set_account_as_*` helpers for admin/roles used in tests.

## Test Patterns
- Keep deployment and fixture logic in `src/testing/fixtures`.
- Keep generic helpers (assertions, event decoding, math) in `src/testing/helpers`.
- Use dedicated mock contracts under `src/contracts/mocks`.
- Use deterministic naming for accounts and fixtures.
-
- **Co-located tests (optional)**: In some repos, tests live next to the code under `src/<module>/test.cairo` with `#[cfg(test)]` modules. If this is the repo convention, align `TESTS_DIR` to that structure instead of forcing a separate `tests/` directory.

## Scenario Builders
- Prefer small, composable fixture functions:
  - `setup_users()`
  - `deploy_token()`
  - `deploy_vault()`
  - `deploy_strategy()`
- Scenario-specific setup should live in test files, not in global fixtures.
-
- **Flow helpers**: keep reusable scenario logic in helpers (e.g., "advance epoch", "stake and attest", "upgrade and migrate"). These should be used to keep tests short and consistent.

## Test File Style
- Each test file starts with a short list of TEST-IDs it contains.
- Each test includes a `// TEST-ID: ...` marker.
- Keep one logical scenario per test.
