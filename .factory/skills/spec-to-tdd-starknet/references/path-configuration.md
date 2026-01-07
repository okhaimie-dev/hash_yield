# Path Configuration (Repo-Agnostic)

This skill must be portable. Always define paths relative to a chosen project root.

## Required Path Inputs
- `PROJECT_ROOT`: absolute or repo-relative root.
- `SPEC_PATH`: path to the input spec file, relative to `PROJECT_ROOT`.
- `TEMPLATE_DEST`: directory where the template asset is copied, relative to `PROJECT_ROOT`.
- `TESTS_DIR`: root directory for test files, relative to `PROJECT_ROOT`.
- `BTT_DIR`: directory for BTT tree files, relative to `PROJECT_ROOT`.
- `SPEC_DOCS_DIR`: directory for test-spec docs (manifest, invariants, risk matrix), relative to `PROJECT_ROOT`.

## Recommended Defaults (override if repo already has a structure)
- `TEMPLATE_DEST`: `.` (repo root) or `protocol/` if the repo is multi-project.
- `TESTS_DIR`: `tests/`
- `BTT_DIR`: `tests/btt/`
- `SPEC_DOCS_DIR`: `tests/specs/`

## Rules
- If the repo already has a tests layout, align to it rather than forcing a new one.
- If tests live under `src/` (co-located), set `TESTS_DIR` accordingly (e.g., `src/<module>/tests/`).
- If a separate `specs/` folder exists inside the repo, it can be used for `SPEC_DOCS_DIR` only if it is standard for that repo.
