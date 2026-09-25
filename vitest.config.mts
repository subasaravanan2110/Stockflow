import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, ".") } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    coverage: { reporter: ["text", "html"], include: ["lib/**/*.ts"] },
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/stockflow_test",
      AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
    },
  },
});
