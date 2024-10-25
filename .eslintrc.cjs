module.exports = {
  extends: [
    `eslint:recommended`,
    `plugin:react/recommended`,
    `plugin:react/jsx-runtime`,
    `@electron-toolkit/eslint-config-ts/recommended`,
    // `@electron-toolkit/eslint-config-prettier`,
  ],
  overrides: [
    {
      files: [`*.d.ts`],
      rules: {
        quotes: `off`,
      },
    },
  ],
  rules: {
    "react/prop-types": `off`,
    quotes: [`error`, `backtick`],
    "@typescript-eslint/no-unused-vars": [
      `error`,
      {
        argsIgnorePattern: `^_`,
        varsIgnorePattern: `^_`,
      },
    ],
  },
};
