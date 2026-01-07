# Mapping Spec To Tests

## Process
1. Extract contract surface (functions, events, storage).
2. Extract invariants and pre/post conditions.
3. Extract risks and edge cases.
4. Convert each item into a test entry in `TEST_MANIFEST.md` under `SPEC_DOCS_DIR`.
5. Add each test ID to a BTT tree leaf under `BTT_DIR`.
6. Create a stub test file under `TESTS_DIR` with a `// TEST-ID:` marker.

## Required Links
- Each test references an invariant (`INV-...`) or explicitly states "None".
- Each test lists risks covered (`R-...`) or explicitly states "None".
- Each risk maps to at least one test in `risk-matrix.md`.
