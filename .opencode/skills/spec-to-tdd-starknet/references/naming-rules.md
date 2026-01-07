# Naming Rules

## Test IDs
- Format: `TEST-<DOMAIN>-<NNN>`
- Examples: `TEST-VAULT-001`, `TEST-STRATEGY-010`
- NNN is zero-padded.

## Invariants
- Format: `INV-<NN>` (zero-padded optional)

## Risks
- Format: `R-<N>`

## Test Files
- Use `test_<domain>_<topic>.cairo`.
- Include `// TEST-ID: TEST-...` lines for every test in the file.
