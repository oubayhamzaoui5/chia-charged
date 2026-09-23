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
    ".local-tools/**",
    ".local-preview/**",
    "backend/pb_migrations/**",
  ]),
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["tests/*.cjs"],
    // These isolated test loaders intentionally emulate CommonJS modules.
    rules: { "@next/next/no-assign-module-variable": "off" },
  },
  {
    files: ["backend/pb_hooks/*.js"],
    // PocketBase supplies runtime types through its generated reference file.
    rules: { "@typescript-eslint/triple-slash-reference": "off" },
  },
]);

export default eslintConfig;
