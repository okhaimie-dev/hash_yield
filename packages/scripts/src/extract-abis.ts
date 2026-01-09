#!/usr/bin/env bun
/**
 * Extract ABIs from Sierra JSON and write to frontend
 *
 * Reads contract artifacts from packages/contracts/target/dev/
 * Writes TypeScript ABI files to apps/web/constants/abis/
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ARTIFACTS_PATH = path.resolve(__dirname, "../../contracts/target/dev");
const MANIFEST_FILE = path.join(ARTIFACTS_PATH, "hash_yield.starknet_artifacts.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../../apps/web/constants/abis");

// Contract name -> output filename + export name mapping
const CONTRACT_MAP: Record<string, { filename: string; exportName: string }> = {
  Vault: { filename: "vault", exportName: "vaultAbi" },
  LendingStrategyV0: { filename: "strategy", exportName: "strategyAbi" },
  MockWBTC: { filename: "erc20", exportName: "erc20Abi" },
};

interface ManifestContract {
  id: string;
  package_name: string;
  contract_name: string;
  module_path: string;
  artifacts: {
    sierra: string;
    casm: string;
  };
}

interface Manifest {
  version: number;
  contracts: ManifestContract[];
}

function box(title: string, lines: string[]): void {
  const width = Math.max(title.length, ...lines.map((l) => l.length)) + 4;
  const top = "┌" + "─".repeat(width) + "┐";
  const bottom = "└" + "─".repeat(width) + "┘";

  console.log(top);
  console.log("│ " + title.padEnd(width - 2) + " │");
  console.log("├" + "─".repeat(width) + "┤");
  for (const line of lines) {
    console.log("│ " + line.padEnd(width - 2) + " │");
  }
  console.log(bottom);
}

async function main() {
  console.log("\n🔄 Extracting ABIs from contract artifacts...\n");

  // Check manifest exists
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error(`❌ Manifest not found: ${MANIFEST_FILE}`);
    console.error("   Run 'scarb build' first.");
    process.exit(1);
  }

  // Read manifest
  const manifest: Manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_PATH)) {
    fs.mkdirSync(OUTPUT_PATH, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_PATH}\n`);
  }

  const extracted: string[] = [];
  const exports: string[] = [];

  // Extract ABIs for each mapped contract
  for (const contract of manifest.contracts) {
    const mapping = CONTRACT_MAP[contract.contract_name];
    if (!mapping) {
      continue; // Skip unmapped contracts (mocks, etc.)
    }

    const sierraPath = path.join(ARTIFACTS_PATH, contract.artifacts.sierra);

    if (!fs.existsSync(sierraPath)) {
      console.warn(`⚠️  Sierra file not found for ${contract.contract_name}: ${sierraPath}`);
      continue;
    }

    // Load Sierra JSON and extract ABI
    const sierra = JSON.parse(fs.readFileSync(sierraPath, "utf-8"));
    const abi = sierra.abi;

    if (!abi) {
      console.warn(`⚠️  No ABI found in ${contract.contract_name}`);
      continue;
    }

    // Generate TypeScript file
    const outputFile = path.join(OUTPUT_PATH, `${mapping.filename}.ts`);
    const content = `// Auto-generated from ${contract.artifacts.sierra}
// Do not edit manually - run 'bun run sync:abis' to regenerate

export const ${mapping.exportName} = ${JSON.stringify(abi, null, 2)} as const;

export type ${capitalizeFirst(mapping.exportName)}Type = typeof ${mapping.exportName};
`;

    fs.writeFileSync(outputFile, content);
    extracted.push(`${mapping.filename}.ts (${mapping.exportName})`);
    exports.push(`export { ${mapping.exportName} } from './${mapping.filename}';`);

    console.log(`✅ ${contract.contract_name} → ${mapping.filename}.ts`);
  }

  // Generate index.ts
  const indexContent = `// Auto-generated - do not edit manually
// Run 'bun run sync:abis' to regenerate

${exports.join("\n")}
`;

  fs.writeFileSync(path.join(OUTPUT_PATH, "index.ts"), indexContent);
  console.log(`✅ Generated index.ts\n`);

  // Summary
  box("ABI Extraction Complete", [
    `Extracted: ${extracted.length} ABIs`,
    `Output: apps/web/constants/abis/`,
    "",
    "Files:",
    ...extracted.map((f) => `  • ${f}`),
    "  • index.ts",
  ]);

  console.log("\n💡 Next steps:");
  console.log("   1. Import ABIs in your hooks:");
  console.log('      import { vaultAbi, erc20Abi } from "@/constants/abis"');
  console.log("   2. Use with starknet-react hooks:");
  console.log("      useReadContract({ abi: vaultAbi, ... })\n");
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
