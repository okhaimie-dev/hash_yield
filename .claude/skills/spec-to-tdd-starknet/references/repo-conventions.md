# Repo Conventions

## Paths (Default Layout - Override When Repo Differs)
- `src/contracts/interfaces/` for traits/interfaces
- `src/contracts/abstracts/` for abstract shells
- `src/contracts/mocks/` for mocks
- `src/testing/` for helpers and fixtures
- `tests/` for test files
- `SPEC_DOCS_DIR` for manifest + invariants + risk matrix
- `BTT_DIR` for tree files

If the repo already has a different layout (e.g., tests co-located under `src/`), align to that layout and update `TESTS_DIR`, `BTT_DIR`, and `SPEC_DOCS_DIR` accordingly.

## Naming
- Test IDs: `TEST-<DOMAIN>-<NNN>` (e.g., `TEST-VAULT-001`)
- Invariants: `INV-<NN>`
- Risks: `R-<N>`

## File Naming (Relative To `TESTS_DIR`)
- `unit/test_<domain>_<topic>.cairo`
- `integration/test_<domain>_<topic>.cairo`
- `properties/prop_<topic>.cairo`
