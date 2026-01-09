/**
 * Utility functions for deployment scripts
 *
 * Provides:
 * - Contract declaration and deployment helpers
 * - Address manifest management (read/write deployed addresses)
 * - RPC provider creation
 * - Account setup for Katana
 */

import {
  Account,
  RpcProvider,
  Contract,
  json,
  CallData,
  hash,
  type CompiledContract,
  type DeclareContractPayload,
  type CairoAssembly,
} from "starknet";
import fs from "fs";
import path from "path";
import {
  ARTIFACTS_PATH,
  ADDRESS_MANIFEST_PATH,
  KATANA_ACCOUNTS,
  getCurrentConfig,
  type DeployEnvironment,
} from "./config.js";

// ============================================================================
// Provider & Account Setup
// ============================================================================

/**
 * Create an RPC provider for the current environment
 */
export const createProvider = (rpcUrl?: string): RpcProvider => {
  const config = getCurrentConfig();
  return new RpcProvider({
    nodeUrl: rpcUrl || config.rpcUrl,
  });
};

/**
 * Create a deployer account using devnet pre-funded accounts
 * For non-local environments, requires DEPLOYER_PRIVATE_KEY and DEPLOYER_ADDRESS env vars
 *
 * Note: starknet.js v9 uses options object for Account constructor
 */
export const createDeployerAccount = (provider: RpcProvider): Account => {
  const config = getCurrentConfig();

  if (config.isLocal) {
    // Use devnet pre-funded account (starknet.js v9 signature)
    return new Account({
      provider,
      address: KATANA_ACCOUNTS.deployer.address,
      signer: KATANA_ACCOUNTS.deployer.privateKey,
    });
  }

  // For testnet/mainnet, use environment variables
  const address = process.env.DEPLOYER_ADDRESS;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!address || !privateKey) {
    throw new Error(
      "DEPLOYER_ADDRESS and DEPLOYER_PRIVATE_KEY must be set for non-local deployments"
    );
  }

  return new Account({
    provider,
    address,
    signer: privateKey,
  });
};

/**
 * Create a test user account (for faucet operations)
 */
export const createUserAccount = (
  provider: RpcProvider,
  userIndex: 0 | 1 = 0
): Account => {
  const users = [KATANA_ACCOUNTS.user1, KATANA_ACCOUNTS.user2];
  const user = users[userIndex];
  return new Account({
    provider,
    address: user.address,
    signer: user.privateKey,
  });
};

// ============================================================================
// Contract Loading & Declaration
// ============================================================================

/**
 * Load a compiled contract artifact (Sierra) from the build directory
 */
export const loadContractArtifact = (artifactName: string): CompiledContract => {
  const artifactPath = path.join(ARTIFACTS_PATH, artifactName);

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Contract artifact not found: ${artifactPath}\nRun 'scarb build' first.`);
  }

  const artifact = json.parse(fs.readFileSync(artifactPath, "utf-8"));
  return artifact;
};

/**
 * Load a CASM artifact (compiled contract class) from the build directory
 */
export const loadCasmArtifact = (casmName: string): CairoAssembly => {
  const casmPath = path.join(ARTIFACTS_PATH, casmName);

  if (!fs.existsSync(casmPath)) {
    throw new Error(`CASM artifact not found: ${casmPath}\nEnsure 'casm = true' in Scarb.toml and run 'scarb build'.`);
  }

  const casm = json.parse(fs.readFileSync(casmPath, "utf-8"));
  return casm;
};

/**
 * Declare a contract class on the network
 * Returns the class hash if successful, or existing class hash if already declared
 *
 * @param account - The account to use for declaration
 * @param artifactName - Sierra contract artifact filename
 * @param casmName - CASM compiled contract class filename
 */
export const declareContract = async (
  account: Account,
  artifactName: string,
  casmName: string
): Promise<string> => {
  const artifact = loadContractArtifact(artifactName);
  const casm = loadCasmArtifact(casmName);

  // Compute class hash to check if already declared
  const classHash = hash.computeContractClassHash(artifact);

  // Try to get the class - if it exists, it's already declared
  try {
    // Use the account's provider to check if class exists
    const provider = new RpcProvider({ nodeUrl: getCurrentConfig().rpcUrl });
    await provider.getClass(classHash);
    console.log(`  Class already declared: ${classHash}`);
    return classHash;
  } catch (checkError: any) {
    // Check if this is a "class hash not found" error
    const errorStr = checkError?.message || checkError?.toString() || "";
    if (!errorStr.includes("not found") && !errorStr.includes("28") && !errorStr.includes("CLASS_HASH_NOT_FOUND")) {
      // If it's some other error (not "not found"), re-throw
      // But first check if it might be the class existing error in disguise
      if (errorStr.includes("already declared")) {
        console.log(`  Class already declared: ${classHash}`);
        return classHash;
      }
    }

    // Class not found, declare it
    console.log(`  Declaring class...`);
    const declarePayload: DeclareContractPayload = {
      contract: artifact,
      casm: casm,
    };

    try {
      const declareResponse = await account.declare(declarePayload);
      await account.waitForTransaction(declareResponse.transaction_hash);
      console.log(`  Declared: ${declareResponse.class_hash}`);
      return declareResponse.class_hash;
    } catch (declareError: any) {
      // If declaration fails because class is already declared, return the class hash
      const declareErrorStr = declareError?.message || declareError?.toString() || "";
      if (declareErrorStr.includes("already declared")) {
        console.log(`  Class already declared (caught during declare): ${classHash}`);
        return classHash;
      }
      throw declareError;
    }
  }
};

/**
 * Deploy a contract instance from a declared class
 */
export const deployContract = async (
  account: Account,
  classHash: string,
  constructorCalldata: any[],
  salt?: string
): Promise<{ address: string; txHash: string }> => {
  const deployResponse = await account.deployContract({
    classHash,
    constructorCalldata: CallData.compile(constructorCalldata),
    salt: salt || undefined,
  });

  await account.waitForTransaction(deployResponse.transaction_hash);

  console.log(`  Deployed at: ${deployResponse.contract_address}`);
  return {
    address: deployResponse.contract_address,
    txHash: deployResponse.transaction_hash,
  };
};

/**
 * Declare and deploy a contract in one step
 *
 * @param account - The account to use for declaration and deployment
 * @param artifactName - Sierra contract artifact filename
 * @param casmName - CASM compiled contract class filename
 * @param constructorCalldata - Arguments for the constructor
 * @param salt - Optional salt for deterministic address
 */
export const declareAndDeploy = async (
  account: Account,
  artifactName: string,
  casmName: string,
  constructorCalldata: any[],
  salt?: string
): Promise<{ classHash: string; address: string; txHash: string }> => {
  const classHash = await declareContract(account, artifactName, casmName);
  const { address, txHash } = await deployContract(
    account,
    classHash,
    constructorCalldata,
    salt
  );
  return { classHash, address, txHash };
};

// ============================================================================
// Address Manifest Management
// ============================================================================

export interface AddressManifest {
  environment: DeployEnvironment;
  timestamp: string;
  blockNumber?: number;
  contracts: {
    vault?: string;
    strategy?: string;
    wbtc?: string;
    vesuPool?: string;
    mockWbtc?: string;
    mockVesuPool?: string;
    mockStrategy?: string;
  };
  classHashes: {
    vault?: string;
    strategy?: string;
    mockWbtc?: string;
    mockVesuPool?: string;
    mockStrategy?: string;
  };
}

/**
 * Get the manifest file path for an environment
 */
const getManifestPath = (env: DeployEnvironment): string => {
  return path.join(ADDRESS_MANIFEST_PATH, `${env}.json`);
};

/**
 * Load the address manifest for an environment
 */
export const loadManifest = (env?: DeployEnvironment): AddressManifest | null => {
  const environment = env || getCurrentConfig().environment;
  const manifestPath = getManifestPath(environment);

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  return json.parse(fs.readFileSync(manifestPath, "utf-8"));
};

/**
 * Save the address manifest for an environment
 */
export const saveManifest = (manifest: AddressManifest): void => {
  const manifestPath = getManifestPath(manifest.environment);

  // Ensure directory exists
  if (!fs.existsSync(ADDRESS_MANIFEST_PATH)) {
    fs.mkdirSync(ADDRESS_MANIFEST_PATH, { recursive: true });
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved to: ${manifestPath}`);
};

/**
 * Create a new manifest or update an existing one
 */
export const createOrUpdateManifest = (
  updates: Partial<AddressManifest["contracts"]>,
  classHashUpdates?: Partial<AddressManifest["classHashes"]>
): AddressManifest => {
  const config = getCurrentConfig();
  const existing = loadManifest() || {
    environment: config.environment,
    timestamp: new Date().toISOString(),
    contracts: {},
    classHashes: {},
  };

  const manifest: AddressManifest = {
    ...existing,
    timestamp: new Date().toISOString(),
    contracts: { ...existing.contracts, ...updates },
    classHashes: { ...existing.classHashes, ...classHashUpdates },
  };

  saveManifest(manifest);
  return manifest;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for devnet to be ready
 */
export const waitForDevnet = async (
  rpcUrl: string,
  maxAttempts = 30,
  delayMs = 1000
): Promise<boolean> => {
  const provider = new RpcProvider({ nodeUrl: rpcUrl });

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await provider.getChainId();
      return true;
    } catch {
      if (i < maxAttempts - 1) {
        await sleep(delayMs);
      }
    }
  }

  return false;
};

/**
 * Sleep for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Format an address for display (shortened)
 */
export const shortAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Parse command line arguments
 */
export const parseArgs = (): Record<string, string | boolean> => {
  const args: Record<string, string | boolean> = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  return args;
};
