# Environment Configuration

## Overview

This document describes how environment-specific configuration works in the StackBTC frontend. The application supports three environments with different network configurations, contract addresses, and feature flags.

## Quick Reference

| Environment | Network | RPC URL | Use Case |
|------------|---------|---------|----------|
| **local** | Katana (local node) | http://localhost:5050 | Local development with Katana |
| **sepolia** | Starknet Sepolia | https://api.cartridge.gg/x/starknet/sepolia | Testing/staging on testnet |
| **mainnet** | Starknet Mainnet | https://api.cartridge.gg/x/starknet/mainnet | Production deployment |

## Architecture

### File Structure

```
/constants/
├── index.ts        # Main config export, environment detection, APP_CONFIG
├── chains.ts       # RPC URLs, chain IDs, explorers per environment
├── addresses.ts    # Contract addresses per environment
└── features.ts     # Feature flags and query config per environment
```

### Environment Detection Flow

```
[.env file] → [NEXT_PUBLIC_STARKNET_ENV] → [constants/index.ts] → [APP_CONFIG]
                                                ↓
                            [Used by components, hooks, providers]
```

The environment is determined in the following order:
1. `NEXT_PUBLIC_STARKNET_ENV` environment variable
2. Falls back to `sepolia` in development (`NODE_ENV !== 'production'`)
3. Falls back to `mainnet` in production (`NODE_ENV === 'production'`)

## Setup Guide

### 1. Environment Files

The project includes three environment configuration files:

**`.env.development`** (default for `npm run dev`)
```bash
NEXT_PUBLIC_STARKNET_ENV=local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**`.env.staging`** (for testnet deployment)
```bash
NEXT_PUBLIC_STARKNET_ENV=sepolia
NEXT_PUBLIC_API_URL=https://staging-api.stackbtc.com
```

**`.env.production`** (for mainnet deployment)
```bash
NEXT_PUBLIC_STARKNET_ENV=mainnet
NEXT_PUBLIC_API_URL=https://api.stackbtc.com
```

**`.env.local`** (gitignored, for local secrets)
```bash
# Copy .env.local.example to .env.local
# Add your local overrides and secrets here
NEXT_PUBLIC_STARKNET_ENV=local  # Optional override
```

### 2. Configure Contract Addresses

Update contract addresses in [`constants/addresses.ts`](../constants/addresses.ts):

```typescript
export const CONTRACT_ADDRESSES = {
  local: {
    vault: "0x123...",  // Your deployed Katana address
    wbtc: "0x456...",   // Your deployed Katana address
    // ...
  },
  sepolia: {
    vault: "0x789...",  // Your deployed Sepolia address
    wbtc: "0xabc...",   // Sepolia WBTC address
    // ...
  },
  mainnet: {
    vault: "0xdef...",  // Your deployed Mainnet address
    wbtc: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    // ...
  },
};
```

### 3. Running Different Environments

#### Local Development (Katana)
```bash
bun dev:local
# or
NEXT_PUBLIC_STARKNET_ENV=local bun dev
```

#### Sepolia Testnet
```bash
bun dev:staging
# or
NEXT_PUBLIC_STARKNET_ENV=sepolia bun dev
```

#### Build for Production
```bash
bun build:prod
# or
NEXT_PUBLIC_STARKNET_ENV=mainnet bun build
```

## Usage Examples

### Basic Usage

Access the current environment configuration:

```typescript
import { APP_CONFIG } from '@/constants';

// Get current environment
console.log(APP_CONFIG.environment); // 'local' | 'sepolia' | 'mainnet'

// Access chain configuration
console.log(APP_CONFIG.chain.rpcUrl);
console.log(APP_CONFIG.chain.name);

// Check environment
if (APP_CONFIG.isDev) {
  console.log("Running in development mode");
}
```

### Getting Contract Addresses

```typescript
import { getContractAddress } from '@/constants';

// Type-safe contract address access
const vaultAddress = getContractAddress('vault');
const wbtcAddress = getContractAddress('wbtc');
const vesuAddress = getContractAddress('vesu');
```

### Conditional Features

```typescript
import { APP_CONFIG } from '@/constants';

// Show dev tools only in development
{APP_CONFIG.features.devTools && <ReactQueryDevtools />}

// Use mock data in local environment
if (APP_CONFIG.features.mockData) {
  return mockVaultData;
}

// Enable analytics only in production
if (APP_CONFIG.features.analytics) {
  trackEvent('page_view');
}
```

### Environment-Specific Query Configuration

```typescript
import { APP_CONFIG } from '@/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: APP_CONFIG.queryConfig.staleTime,
      gcTime: APP_CONFIG.queryConfig.gcTime,
      refetchInterval: APP_CONFIG.queryConfig.refetchInterval,
    },
  },
});
```

## Configuration Details

### Feature Flags

Each environment has different feature flags:

| Feature | Local | Sepolia | Mainnet |
|---------|-------|---------|---------|
| Dev Tools | ✅ | ✅ | ❌ |
| Mock Data | ✅ | ❌ | ❌ |
| Analytics | ❌ | ❌ | ✅ |

### Query Configuration

Cache and refetch timing varies by environment:

| Setting | Local | Sepolia | Mainnet |
|---------|-------|---------|---------|
| Stale Time | 10s | 30s | 60s |
| Refetch Interval | 15s | 30s | 60s |
| GC Time | 5m | 10m | 15m |

## Troubleshooting

### Issue: "Missing contract address for X"

**Cause:** Contract address is not defined for the current environment.

**Solution:** 
1. Check your current environment: `console.log(APP_CONFIG.environment)`
2. Update the contract address in `constants/addresses.ts` for that environment
3. Restart the dev server

### Issue: RPC connection fails

**Cause:** RPC URL is incorrect or unreachable.

**Solution:**
1. Verify the RPC URL in `constants/chains.ts`
2. Check if local Katana is running (for local environment)
3. Test the RPC URL with curl: `curl -X POST <RPC_URL> -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"starknet_chainId","params":[],"id":1}'`

### Issue: Environment not switching

**Cause:** Environment variable not being read correctly.

**Solution:**
1. Restart the Next.js dev server
2. Verify the environment variable is set: `echo $NEXT_PUBLIC_STARKNET_ENV`
3. Check that the variable name starts with `NEXT_PUBLIC_`
4. Clear Next.js cache: `rm -rf .next`

### Issue: "Vault contract not deployed" error

**Cause:** Using mock data with a contract address that's all zeros.

**Solution:**
1. Deploy your contracts to the target network
2. Update the contract addresses in `constants/addresses.ts`
3. Restart the application

## Related Documentation

- [Tanstack Query Guide](./TANSTACK_QUERY.md) (coming soon)
- [Starknet React Documentation](https://starknet-react.com/)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` - it's gitignored for a reason
- Only use `NEXT_PUBLIC_` prefix for variables that should be exposed to the browser
- Secret keys (API keys, private keys) should NEVER use the `NEXT_PUBLIC_` prefix
- Contract addresses are public information and safe to commit
