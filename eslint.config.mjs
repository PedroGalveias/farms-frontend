import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated test-coverage output.
    "coverage/**",
    // Worktrees the agent harness creates for background tasks. Each is a full
    // checkout of this repo, so linting it means linting a second (and third)
    // copy of every file — 226 problems from code that is not on this branch.
    ".claude/**",
  ]),
]);

export default eslintConfig;
