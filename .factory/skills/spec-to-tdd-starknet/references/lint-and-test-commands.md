# Lint And Test Commands

## Default Commands (Override Per Repo)
- `scarb fmt` (format)
- `scarb build`
- `snforge test`

## CI Guidance
- Run `scripts/validate_coverage.py` before tests, with explicit paths:
  - `--root <PROJECT_ROOT> --spec-docs-dir <SPEC_DOCS_DIR> --btt <BTT_DIR> --tests <TESTS_DIR>`
- Build must pass before any TDD implementation begins.
