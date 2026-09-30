import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["e2e/**/*.e2e.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // Um servidor Next + um Chromium real por arquivo já usam bastante memória/porta.
    fileParallelism: false,
  },
});
