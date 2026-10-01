import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react()],
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/.next/**", "e2e/**"],
  },
});
