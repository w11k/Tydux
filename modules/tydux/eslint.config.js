// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**", "coverage/**"],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.ts"],
        rules: {
            // The Tydux API is intentionally generic and relies on `any` in several places.
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {argsIgnorePattern: "^_", varsIgnorePattern: "^_"},
            ],
            "no-empty": "off",
            // Intentional patterns in the (partly vendored) codebase.
            "@typescript-eslint/no-this-alias": "off",
            "no-prototype-builtins": "off",
            "prefer-const": "warn",
        },
    },
    {
        files: ["**/*.test.ts", "**/testing/**/*.ts"],
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
        },
    },
);
