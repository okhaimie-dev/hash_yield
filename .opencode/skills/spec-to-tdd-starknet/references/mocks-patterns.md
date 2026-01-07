# Mock Contract Patterns

## Goals
- Make external dependencies deterministic.
- Provide hooks to simulate yield, loss, and reverts.

## Common Mocks
- ERC20 mock with mint/burn helpers and configurable decimals.
- Strategy mock with controllable `total_assets` and optional hooks for profit/loss.
- External protocol mock with adjustable exchange rate or total assets.

## Mock Guidelines
- Minimal surface area required by tests.
- Explicit helpers for state manipulation (e.g., `set_exchange_rate`).
- Avoid business logic beyond what's needed for tests.

## Exemplar-Style Notes
- Prefer mock helpers that expose deterministic state reads (balances, totals).
- Keep mock names and interfaces stable so tests stay readable.
