import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const cauHinhChung = tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.next-desktop/**',
      '**/next-env.d.ts',
      '**/.expo/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/out/**',
      '**/.turbo/**',
      '**/.farm-ui-v3-backup/**',
      '**/.agrimarket-backup/**',
      'packages/api-client/generated/**',
      '**/src/generated/prisma/**',
      'apps/mobile/src/components/ui/**',
    
      '**/.agrimarket-fix-backup/**',
      // Agent workspace cua Kilo (worktree clone + node_modules), khong phai source duoc lint.
      '**/.kilo/**',
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
    // React Native / Metro yêu cầu static `require('literal-path')` để bundle local assets.
    // Chỉ nới rule cho asset manifest này, không tắt no-require-imports toàn dự án.
    files: [
      'apps/mobile/src/lib/homepage-data.ts',
      'apps/mobile/src/lib/anh-du-phong.ts',
      'apps/mobile/src/lib/bai-viet-mobile.ts',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/metro.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);

export default cauHinhChung;
