# Workflow Gates

Use this gate sequence every time. Stop after each gate and ask the user to confirm before proceeding.

## Gate 0 - Intake & Constraints
- Confirm `PROJECT_ROOT`, `SPEC_PATH`, `TEMPLATE_DEST`, `TESTS_DIR`, `BTT_DIR`, `SPEC_DOCS_DIR`.
- Confirm allowed edit scope.
- Confirm desired test toolchain (Scarb + snforge default or repo-specific).
- Confirm where the template will be copied inside the repo.

## Gate 1 - Decomposition Map
- Extract a coverage map from the spec: contracts, storage, events, logic flows, invariants, risks, and test requirements.
- Present a concise map (no files) and ask for confirmation.

## Gate 2 - Apply Template
- Copy the template asset into `TEMPLATE_DEST`.
- Adjust config files (Scarb/snforge) to match repo needs and layout.
- Do not add business logic.

## Gate 3 - Interface + Abstract Skeletons
- Create Cairo interface/trait files and abstract shells.
- Only include signatures, storage, events, and access control surfaces.
- No real logic.

## Gate 4 - Testing Specs + Placeholders
- Create test manifest, invariants, risk matrix, and pre/post conditions under `SPEC_DOCS_DIR`.
- Generate BTT `.tree` files under `BTT_DIR`.
- Create placeholder tests under `TESTS_DIR` (unit/integration/properties structure as configured).
- Every test must include a `TEST-ID:` marker.

## Gate 5 - Validate Coverage
- Run `scripts/validate_coverage.py` with explicit paths from the path configuration.
- Fix any missing mappings until validation passes.

## Gate 6 - Handoff
- Summarize what is ready for the implementation agent.
- Confirm that all constraints are met and nothing beyond spec was added.
