# Lint And Test Commands

## Default Commands
- `scarb fmt` - format Cairo code
- `scarb build` - compile contracts
- `snforge test` - run tests (via script: `scarb run test`)

## Test Commands
```bash
# Run all tests
snforge test

# Run specific test
snforge test test_increase_balance

# Run tests matching pattern
snforge test test_swap

# Run with verbose output
snforge test -v
```

## Coverage (if enabled in Scarb.toml)
```bash
snforge test --coverage
```

## CI Guidance
- Run `scripts/validate_coverage.py` before tests, with explicit paths:
  - `--root <PROJECT_ROOT> --spec-docs-dir <SPEC_DOCS_DIR> --btt <BTT_DIR> --tests <TESTS_DIR>`
- Build must pass before any TDD implementation begins
- All `scarb fmt` checks must pass
