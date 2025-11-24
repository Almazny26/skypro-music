import next from '@next/eslint-plugin-next';
import typescriptParser from '@typescript-eslint/parser';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': next,
      '@typescript-eslint': typescriptEslintPlugin,
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
