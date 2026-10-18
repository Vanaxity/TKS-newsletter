import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Runs against the real Supabase project. Not part of `npm test` or CI.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.int.test.ts"],
    testTimeout: 30000,
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
