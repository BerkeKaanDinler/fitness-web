import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["media/**", ".vercel/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["script.js", "sw.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      "no-undef": "off",
      "no-unused-vars": "off",
    },
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
