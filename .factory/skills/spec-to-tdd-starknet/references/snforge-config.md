# Snforge Config Guidance

## Minimal Scarb Settings
Use these sections in `Scarb.toml` as a baseline:

```
[dev-dependencies]
snforge_std = "<version>"

[scripts]
test = "snforge test"

[tool.scarb]
allow-prebuilt-plugins = ["snforge_std"]
```

## Optional Fork Config
Add fork configs only when needed for integration tests:

```
[[tool.snforge.fork]]
name = "MAINNET_LATEST"
url = "<rpc-url>"
block_id.tag = "latest"
```

## Notes
- Keep versions aligned with the repo toolchain.
- If the repo has existing snforge config, extend it rather than replace it.
