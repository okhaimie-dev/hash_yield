# Deploy Contracts Command

Deploy contracts to local devnet and sync artifacts to frontend.

## Prerequisites Check

Before deploying, verify:
1. Devnet is running: `lsof -i :5050` should show a process
2. Contracts are built: `packages/contracts/target/dev/` has `.contract_class.json` files

## Deployment Steps

Execute these commands in order:

```bash
# 1. Check devnet is running
curl -s http://127.0.0.1:5050 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"starknet_blockNumber","id":1}'

# 2. Build contracts (if needed)
cd packages/contracts && scarb build

# 3. Deploy all contracts
cd packages/scripts && bun run deploy:all

# 4. Sync ABIs and addresses to frontend
bun run sync:all

# 5. Verify contracts work
bun run src/test-contracts.ts
```

## Quick Deploy (Single Command)

If devnet is already running and contracts are built:

```bash
cd packages/scripts && bun run deploy:all && bun run sync:all
```

## Output

After successful deployment:
- Contract addresses saved to `packages/contracts/deployments/local.json`
- ABIs extracted to `apps/web/constants/abis/`
- Addresses synced to `apps/web/constants/addresses.ts`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Devnet not running" | Start with `bun run devnet` in packages/scripts |
| "Contract not found" | Contracts may need redeployment after devnet restart |
| "Class already declared" | This is normal - class hashes are cached |
| "Insufficient funds" | Use pre-funded devnet accounts (automatic) |
