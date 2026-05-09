import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'build/', 'node_modules/'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],

      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],

      'no-restricted-properties': [
        'error',

        // --- Dangerous HTML injection ---
        {
          property: 'innerHTML',
          message: 'Do not use innerHTML. Use textContent or DOM APIs instead.',
        },
        {
          property: 'outerHTML',
          message: 'Do not use outerHTML.',
        },
        {
          property: 'insertAdjacentHTML',
          message: 'Avoid insertAdjacentHTML. Use DOM creation instead.',
        },

        // --- Inline styles ---
        {
          property: 'style',
          message: 'Do not use inline styles. Use classes instead.',
        },
      ],
    },
  },

  {
    files: ['**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
