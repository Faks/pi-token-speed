/**
 * Inline path-alias resolver.
 *
 * Patches Node.js's internal Module._resolveFilename so that
 * `@pi-token-speed/*` imports resolve to `./src/*` relative to this
 * file's directory.  Zero external dependencies — works when `pi` loads
 * the extension from a git clone cache without `npm install`.
 */
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const aliasPrefix = "@pi-token-speed/";
const srcRoot = join(__dirname, "src");

// Capture the original resolver before we patch it
// In Node.js, Module is accessible via require('module').Module
// In some environments (like vitest), we need to handle this gracefully
const Module = (require as any).module?.constructor || 
               (require as any).main?.constructor;

if (Module && Module._resolveFilename) {
  const originalResolve = Module._resolveFilename;

  /**
   * Custom resolver: if the requested module starts with our alias prefix,
   * rewrite it to a filesystem path under src/.
   */
  function customResolve(
    id: string,
    parent: { filename?: string; paths?: string[] },
    _options: unknown,
    _factory: unknown
  ): string {
    if (!id.startsWith(aliasPrefix)) {
      return originalResolve(id, parent, _options, _factory);
    }

    // Strip the prefix and resolve relative to src/
    const relative = id.slice(aliasPrefix.length);
    const resolvedPath = join(srcRoot, relative);

    // Check if the resolved path exists with .ts extension
    const tsPath = resolvedPath.endsWith(".ts") ? resolvedPath : resolvedPath + ".ts";
    if (existsSync(tsPath)) {
      return tsPath;
    }

    // Try as directory/index.ts
    const indexPath = join(resolvedPath, "index.ts");
    if (existsSync(indexPath)) {
      return indexPath;
    }

    // Fall back to original resolution for non-ts files
    return originalResolve(id, parent, _options, _factory);
  }

  // Apply the patch
  Module._resolveFilename = customResolve;
}
