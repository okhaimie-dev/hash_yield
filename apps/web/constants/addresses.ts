/**
 * Contract addresses for each environment
 *
 * These addresses are automatically updated by the deployment scripts.
 * Run `bun run deploy:all && bun run sync-addresses` to update local addresses.
 *
 * Address Sources:
 * - Local: Deployed to Katana via deploy scripts (auto-synced)
 * - Sepolia: Manually deployed to testnet
 * - Mainnet: Production deployment addresses
 *
 * @see packages/scripts/src/sync-addresses.ts
 */
export const CONTRACT_ADDRESSES = {
  local: {
    // These addresses are auto-synced from packages/contracts/deployments/local.json
    vault: "0x421a8da319922c1b1377c6eebc1a86ea9b221e9ae485452d1486db124842971",
    wbtc: "0x2df6c26f2f3cd45a86def523b54ba315337ef4b492d42290883f5876775a593",
    vesu: "0x5350023973945be3917ac7dba50ceb034c44bd6f574f14a38d5457af9c70459",
    ekubo: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  sepolia: {
    vault: "0x0000000000000000000000000000000000000000000000000000000000000000",
    wbtc: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", // Sepolia STRK (placeholder)
    vesu: "0x0000000000000000000000000000000000000000000000000000000000000000",
    ekubo: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
  mainnet: {
    vault: "0x0000000000000000000000000000000000000000000000000000000000000000",
    wbtc: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac", // Mainnet WBTC
    vesu: "0x0000000000000000000000000000000000000000000000000000000000000000",
    ekubo: "0x0000000000000000000000000000000000000000000000000000000000000000",
  },
} as const;

export type ContractName = keyof (typeof CONTRACT_ADDRESSES)["sepolia"];

/**
 * Try to load local addresses from deployment manifest at runtime.
 * Falls back to static addresses if manifest doesn't exist.
 *
 * This allows hot-reloading of deployed addresses during development.
 */
export const getLocalAddresses = async (): Promise<
  (typeof CONTRACT_ADDRESSES)["local"]
> => {
  // In browser context, use static addresses
  if (typeof window !== "undefined") {
    return CONTRACT_ADDRESSES.local;
  }

  // In Node.js/Bun context, try to load from manifest
  try {
    const fs = await import("fs");
    const path = await import("path");

    const manifestPath = path.resolve(
      process.cwd(),
      "../packages/contracts/deployments/local.json"
    );

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      return {
        vault: manifest.contracts?.vault || CONTRACT_ADDRESSES.local.vault,
        wbtc: manifest.contracts?.wbtc || CONTRACT_ADDRESSES.local.wbtc,
        vesu: manifest.contracts?.vesuPool || CONTRACT_ADDRESSES.local.vesu,
        ekubo: CONTRACT_ADDRESSES.local.ekubo,
      };
    }
  } catch {
    // Silently fall back to static addresses
  }

  return CONTRACT_ADDRESSES.local;
};
