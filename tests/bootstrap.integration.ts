/**
 * Integration test for bootstrap.ts — runs with Node.js directly (not vitest).
 * Verifies the actual runtime behavior when pi loads the extension.
 *
 * Run with: npx tsx tests/bootstrap.integration.ts
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const projectRoot = join(__dirname, "..");

  // Import bootstrap to apply the patch
  // @ts-ignore - dynamic import for testing
  await import(join(projectRoot, "src", "bootstrap.ts"));

  // Verify the patch is active by checking if aliased modules resolve
  const aliasedModules = [
    "@pi-token-speed/Commands/commands",
    "@pi-token-speed/Core/engine",
    "@pi-token-speed/Core/events",
    "@pi-token-speed/UI/renderer",
    "@pi-token-speed/Config/settings",
    "@pi-token-speed/Config/options",
    "@pi-token-speed/constants",
    "@pi-token-speed/Commands/validation",
    "@pi-token-speed/Core/sliding-window",
  ];

  let allPassed = true;

  for (const module of aliasedModules) {
    try {
      // This will throw if the patch isn't working
      // @ts-ignore - dynamic require for testing
      const resolved = require.resolve(module);
      const isValid = resolved.includes("/src/") && resolved.endsWith(".ts");
      
      if (!isValid) {
        console.error(`FAIL: ${module} resolved to unexpected path: ${resolved}`);
        allPassed = false;
      } else {
        console.log(`PASS: ${module} → ${resolved.split("/").slice(-3).join("/")}`);
      }
    } catch (e) {
      console.error(`FAIL: ${module} — ${(e as Error).message}`);
      allPassed = false;
    }
  }

  // Verify non-existent modules still fail
  try {
    // @ts-ignore
    require.resolve("@pi-token-speed/non-existent-module");
    console.error("FAIL: non-existent module should have thrown");
    allPassed = false;
  } catch {
    console.log("PASS: non-existent module correctly throws");
  }

  // Verify standard Node.js resolution still works
  try {
    // @ts-ignore
    const resolved = require.resolve("node:path");
    console.log(`PASS: node:path → ${resolved.split("/").slice(-2).join("/")}`);
  } catch (e) {
    console.error(`FAIL: node:path — ${(e as Error).message}`);
    allPassed = false;
  }

  if (allPassed) {
    console.log("\n✅ All bootstrap integration tests passed");
    process.exit(0);
  } else {
    console.error("\n❌ Some bootstrap integration tests failed");
    process.exit(1);
  }
}

main().catch(e => {
  console.error("Test runner error:", e);
  process.exit(1);
});
