import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/build/**/*.test.ts", "tests/smoke/**/*.test.ts"],
  },
});
