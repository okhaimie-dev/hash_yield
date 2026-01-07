# BTT (Bulloak-Style Test Trees)

Use tree files to encode scenario coverage. Every leaf must include a TEST-ID.

## File Location
- `BTT_DIR/<Domain>.tree` (configured per repo)

## Format
- Indentation defines hierarchy
- Leaves must include `TEST-...` identifiers

Example:
```
VaultTest
|-- When vault is initialized
|   `-- It should start empty [TEST-VAULT-001]
|-- When depositing assets
|   |-- When assets > 0
|   |   `-- It should mint shares correctly [TEST-VAULT-002]
|   `-- When assets = 0
|       `-- It should revert [TEST-VAULT-003]
```

## Rules
- Every TEST-ID in the manifest must appear at least once in a `.tree` file.
- Each leaf should map 1:1 with a manifest entry.
