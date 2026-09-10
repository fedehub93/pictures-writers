import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "handlebars": path.resolve(__dirname, "node_modules/handlebars/dist/handlebars.js"),
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
      "next/cache": path.resolve(__dirname, "tests/mocks/next-cache.ts"),
    },
  },
  test: {
    globals: false,
    environment: "node",
    globalSetup: "./tests/global-setup.ts",
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30000,
    fileParallelism: false,
    exclude: ["node_modules", ".reference/**", ".next/**"],
  },
});
