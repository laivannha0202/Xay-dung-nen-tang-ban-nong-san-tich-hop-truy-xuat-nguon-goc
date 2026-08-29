import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const cauHinhChung = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/next-env.d.ts',
      '**/.expo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/out/**',
      '**/.turbo/**',
      'packages/api-client/generated/**',
      '**/src/generated/prisma/**',
      'apps/mobile/src/components/ui/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: globals.node,
    },
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/metro.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);

export default cauHinhChung;
