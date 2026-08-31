import { defineConfig, globalIgnores } from "eslint/config";
import { fixupPluginRules } from "@eslint/compat";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactPlugin from "eslint-plugin-react";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";

// eslint-plugin-react, eslint-plugin-import and eslint-plugin-jsx-a11y still
// call deprecated context APIs (e.g. context.getFilename()) that were removed
// in ESLint 10. fixupPluginRules supplies compatibility shims. Plugin names
// cannot be redefined across flat config objects, so we replace the raw
// plugin instances inside the eslint-config-next configs with the fixed-up
// ones before merging.
const compatPlugins = {
  react: fixupPluginRules(reactPlugin),
  import: fixupPluginRules(importPlugin),
  "jsx-a11y": fixupPluginRules(jsxA11y),
};

const patchPlugins = (configs) =>
  configs.map((config) =>
    config.plugins &&
    ["react", "import", "jsx-a11y"].some((name) => config.plugins[name])
      ? { ...config, plugins: { ...config.plugins, ...compatPlugins } }
      : config,
  );

const eslintConfig = defineConfig([
  ...patchPlugins(nextVitals),
  ...patchPlugins(nextTs),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated Prisma client output.
    "generated/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-namespace": [
        "error",
        {
          allowDeclarations: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);

export default eslintConfig;
