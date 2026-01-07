# Snforge Config Guidance

## Minimal Scarb Settings
Use these sections in `Scarb.toml` as a baseline:

```
[dev-dependencies]
snforge_std = "0.51.1"  # Use latest stable version (>=0.50.0 required)

[scripts]
test = "snforge test"

[tool.scarb]
allow-prebuilt-plugins = ["snforge_std"]
```

## Test Directory Structure
For tests in a separate `tests/` directory (integration tests), create a `tests/lib.cairo` file that imports test modules:

```
// tests/lib.cairo
mod unit {
    mod test_example;
}

mod integration {
    mod test_flows;
}

mod properties {
    mod prop_invariants;
}
```

Each test file should contain `#[test]` functions with TEST-ID comments.

## Optional Fork Config
Add fork configs only when needed for integration tests. Comment out placeholder URLs to avoid parse errors:

```
# [[tool.snforge.fork]]
# name = "MAINNET_LATEST"
# url = "REPLACE_WITH_RPC_URL"  # Replace with actual RPC URL when needed
# block_id.tag = "latest"
```

Uncomment and configure with real RPC URL only when fork testing is needed.

## Notes
- Keep versions aligned with the repo toolchain.
- If the repo has existing snforge config, extend it rather than replace it.
- Tests in `tests/` directory require a `tests/lib.cairo` entry point.
- Tests in `src/` can use `#[cfg(test)]` modules (unit tests co-located with code).
