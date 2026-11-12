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

const rawSqlRestrictions = [
  {
    selector: "MemberExpression[property.name='$queryRawUnsafe']",
    message:
      "Use the $queryRaw tagged template. See AGENTS.md > Database > Raw SQL.",
  },
  {
    selector: "MemberExpression[property.name='$executeRawUnsafe']",
    message:
      "Use the $executeRaw tagged template. See AGENTS.md > Database > Raw SQL.",
  },
  {
    selector: "MemberExpression[object.name='Prisma'][property.name='raw']",
    message:
      "Identifiers must come from a closed allow-list, never from request data. See AGENTS.md > Database > Raw SQL.",
  },
];

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
    // Local reference repositories used by editor skills.
    ".reference/**",
  ]),
  {
    rules: {
      "no-restricted-syntax": ["error", ...rawSqlRestrictions],
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
  {
    // Standalone CommonJS scripts legitimately use require().
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Canvas contract: an anchor rendered directly by a block stays clickable
    // inside the editor and navigates the admin page instead of the preview.
    // Image is the only block allowed to emit `href`, because it spreads
    // getInertAnchorProps. See docs/puck-canvas.md.
    files: ["src/puck/blocks/**/*.tsx"],
    ignores: ["src/puck/blocks/Image/ui/image.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...rawSqlRestrictions,
        {
          selector: "JSXAttribute[name.name='href']",
          message:
            "Route links through InlineSmartLink, or spread getInertAnchorProps. See docs/puck-canvas.md.",
        },
      ],
    },
  },
  {
    // This hook mirrors the mutable state of a Tiptap editor: the library only
    // exposes it by pushing events, so the initial synchronous read is part of
    // subscribing. Keep it a warning instead of an error for this file only.
    files: ["src/modules/blog/posts/hooks/use-post-outline.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
