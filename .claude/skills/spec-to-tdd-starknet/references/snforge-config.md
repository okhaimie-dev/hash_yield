# Snforge Config Guidance

## Minimal Scarb Settings (Latest - 2025)
Use these sections in `Scarb.toml` as a baseline:

```toml
[dev-dependencies]
snforge_std = "0.51.1"
assert_macros = "2.15.0"

[[target.starknet-contract]]
sierra = true

[scripts]
test = "snforge test"

[tool.scarb]
allow-prebuilt-plugins = ["snforge_std"]
```

## Optional snfoundry.toml
For deployment/cast configuration, create `snfoundry.toml`:
```toml
[sncast.default]
url = "https://starknet-sepolia.public.blastapi.io/rpc/v0_9"
accounts-file = "../account-file"
account = "mainuser"
```

## Optional Fork Config
Add fork configs in `Scarb.toml` when needed for integration tests:

```toml
[[tool.snforge.fork]]
name = "MAINNET_LATEST"
url = "http://your.rpc.url"
block_id.tag = "latest"

[[tool.snforge.fork]]
name = "SEPOLIA"
url = "http://your.rpc.url"
block_id.number = "123"
```

## Coverage Support
Enable coverage by uncommenting in `Scarb.toml`:
```toml
[profile.dev.cairo]
unstable-add-statements-code-locations-debug-info = true
unstable-add-statements-functions-debug-info = true
inlining-strategy = "avoid"
```

## Notes
- Keep versions aligned with the repo toolchain
- `snforge_std = "0.51.1"` is the latest as of January 2025
- `assert_macros` matches the starknet version (2.15.0)
- If the repo has existing snforge config, extend it rather than replace it
