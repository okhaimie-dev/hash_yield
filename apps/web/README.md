# StackBTC Web Frontend

Bitcoin-Native Yield Aggregator on Starknet

## Quick Start

```bash
# Install dependencies (from monorepo root)
bun install

# Run local development (default - connects to local Katana)
bun dev

# Run against Sepolia testnet
bun dev:staging

# Run against Mainnet (read-only)
NEXT_PUBLIC_STARKNET_ENV=mainnet bun dev

# Build for production
bun build:prod
```

## 📚 Documentation

Comprehensive documentation is available in [`/docs`](./docs/):

- **[Environment Setup](./docs/ENVIRONMENT_SETUP.md)** - Configure local/staging/production environments
- **[Documentation Index](./docs/README.md)** - Full documentation index

## Environment Configuration

The app supports three environments with different network configurations:

| Environment | Command | Network | Use Case |
|------------|---------|---------|----------|
| **local** | `bun dev:local` | Katana (localhost:5050) | Local development |
| **sepolia** | `bun dev:staging` | Starknet Sepolia | Testing/staging |
| **mainnet** | `bun build:prod` | Starknet Mainnet | Production |

**Quick Setup:**

1. Copy environment example:
   ```bash
   cp .env.local.example .env.local
   ```

2. Run in your preferred environment:
   ```bash
   bun dev:local      # Local Katana
   bun dev:staging    # Sepolia testnet
   ```

3. Update contract addresses in [`constants/addresses.ts`](./constants/addresses.ts) after deployment

📖 See [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md) for detailed configuration.

## Tech Stack

- **Next.js 16** - App Router with React 19
- **Tanstack Query v5** - Data fetching, caching, and state management
- **Starknet React v5** - Blockchain wallet connection and contract interactions
- **Tailwind CSS 4** - Utility-first styling
- **TypeScript** - Type safety
- **Lucide Icons** - Icon library
- **Recharts** - Data visualization

## Project Structure

```
/apps/web/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page (landing + vault dashboard)
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Navbar.tsx         # Navigation
│   ├── DepositCard.tsx    # Deposit/withdraw interface
│   ├── YieldCard.tsx      # Yield statistics display
│   └── StrategyFlow.tsx   # Strategy visualization
├── constants/             # Environment & configuration
│   ├── index.ts           # Main APP_CONFIG export
│   ├── chains.ts          # RPC URLs and chain configs
│   ├── addresses.ts       # Contract addresses per environment
│   └── features.ts        # Feature flags & query config
├── contexts/              # React contexts
│   └── starknet-provider.tsx  # Starknet & Query providers
├── hooks/                 # Custom hooks (Tanstack Query)
│   ├── useVaultStats.ts   # Fetch vault statistics
│   ├── useUserBalance.ts  # Fetch user balances
│   ├── useDeposit.ts      # Deposit mutation
│   └── useWithdraw.ts     # Withdrawal mutation
├── types/                 # TypeScript type definitions
└── docs/                  # Developer documentation
    ├── README.md          # Documentation index
    └── ENVIRONMENT_SETUP.md  # Environment configuration guide
```

## Key Features

### Environment-Aware Configuration
- Type-safe configuration system
- Automatic environment detection
- Per-environment feature flags and query settings

### Data Fetching with Tanstack Query
- Automatic caching and background refetching
- Optimistic updates for transactions
- Loading and error states
- React Query DevTools (development only)

### Starknet Integration
- Wallet connection (Cartridge, Argent, Braavos)
- Contract reads and writes
- Transaction handling with error recovery

## Deployment & Artifact Pipeline

### Overview

The deployment pipeline gets contracts deployed to a network and syncs artifacts (ABIs + addresses) to the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│  1. scarb build           → target/dev/*.contract_class.json│
│  2. bun run deploy:all    → deploys to devnet               │
│  3. bun run sync:all      → ABIs + addresses to frontend    │
│  4. bun run dev           → start frontend                  │
└─────────────────────────────────────────────────────────────┘
```

### Full Local Development Setup

```bash
# Terminal 1: Start local devnet
cd packages/scripts
bun run devnet

# Terminal 2: Build and deploy contracts
cd packages/contracts
scarb build

cd ../scripts
bun run deploy:all      # Deploys mocks + vault + strategy
bun run sync:all        # Syncs ABIs and addresses to frontend

# Terminal 3: Start frontend
cd apps/web
bun run dev
```

### Script Reference

| Script | Location | Description |
|--------|----------|-------------|
| `bun run devnet` | packages/scripts | Start local Katana devnet |
| `bun run deploy:mocks` | packages/scripts | Deploy mock WBTC and VesuPool |
| `bun run deploy:vault` | packages/scripts | Deploy Vault and Strategy |
| `bun run deploy:all` | packages/scripts | Deploy everything (mocks + vault) |
| `bun run sync:abis` | packages/scripts | Extract ABIs to frontend |
| `bun run sync:addresses` | packages/scripts | Sync addresses to frontend |
| `bun run sync:all` | packages/scripts | Run both sync scripts |
| `bun run faucet` | packages/scripts | Mint test WBTC tokens |
| `bun run test-contracts` | packages/scripts | Verify contract reads work |

### Generated Files

After running `sync:all`, these files are generated/updated:

```
apps/web/constants/
├── abis/
│   ├── vault.ts      # Vault ABI (auto-generated)
│   ├── strategy.ts   # Strategy ABI (auto-generated)
│   ├── erc20.ts      # ERC20 ABI (auto-generated)
│   └── index.ts      # Re-exports
└── addresses.ts      # Updated with deployed addresses
```

### Testing with Real Contracts

1. **Disable mock data** in `constants/features.ts`:
   ```typescript
   local: {
     mockData: false,  // Set to false
   }
   ```

2. **Get test tokens**:
   ```bash
   cd packages/scripts
   bun run faucet --amount 100000000  # 1 BTC (8 decimals)
   ```

3. **Verify contracts work**:
   ```bash
   bun run src/test-contracts.ts
   ```

### Redeploying After Contract Changes

```bash
# 1. Rebuild contracts
cd packages/contracts && scarb build

# 2. Redeploy (devnet state persists until restart)
cd ../scripts && bun run deploy:all

# 3. Sync new ABIs to frontend
bun run sync:all

# 4. Restart frontend (hot reload may not pick up ABI changes)
```

## Development

### Available Scripts

```bash
# Development
bun dev              # Default dev (local Katana)
bun dev:local        # Explicit local environment
bun dev:staging      # Sepolia testnet

# Building
bun build            # Build with current env
bun build:staging    # Build for Sepolia
bun build:prod       # Build for Mainnet

# Quality
bun lint             # Run ESLint
bun check-types      # TypeScript type checking
```

### Environment Variables

The app uses environment-specific `.env` files:

- `.env.development` - Local development defaults
- `.env.staging` - Sepolia testnet configuration
- `.env.production` - Mainnet configuration
- `.env.local` - Local overrides (gitignored, create from `.env.local.example`)

**Required variables:**
- `NEXT_PUBLIC_STARKNET_ENV` - Target environment (local | sepolia | mainnet)
- `NEXT_PUBLIC_API_URL` - API base URL

### Adding New Contract Addresses

1. Deploy your contracts to the target network
2. Update `constants/addresses.ts`:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     sepolia: {
       vault: "0xYourVaultAddress",
       wbtc: "0xYourWBTCAddress",
       // ...
     },
   };
   ```
3. Restart the dev server

## Related Documentation

- [Protocol Specification](../../spec/README.md) - Smart contract specs and logic
- [Contract Package](../../packages/contracts/README.md) - Cairo contract implementation
- [Public Docs Site](../docs/README.md) - User-facing documentation

## Troubleshooting

### Contract Not Found Error
**Solution:** Update contract addresses in `constants/addresses.ts` after deployment.

### RPC Connection Failed
**Solution:** 
- Local: Ensure Katana is running on port 5050
- Sepolia/Mainnet: Check RPC URL in `constants/chains.ts`

### Environment Not Switching
**Solution:** Restart the dev server after changing `NEXT_PUBLIC_STARKNET_ENV`.

For more troubleshooting tips, see the [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md#troubleshooting).

## Contributing

1. Follow the existing code structure and patterns
2. Use the custom hooks for data fetching
3. Add TypeScript types for all new interfaces
4. Update documentation when adding new features
5. Test in all three environments before deploying

## License

[Add your license here]
