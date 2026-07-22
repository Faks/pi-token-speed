import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@pi-token-speed/": path.resolve(__dirname, "src") + "/",
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
  },
});
