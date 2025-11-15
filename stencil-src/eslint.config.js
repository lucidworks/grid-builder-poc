// eslint.config.js
const globals = require('globals');
const tsESLintParser = require('@typescript-eslint/parser');
const eslintPlugins = {
  sonarjs: require('eslint-plugin-sonarjs'),
  prettier: require('eslint-plugin-prettier/recommended'),
  typescriptESLint: require('typescript-eslint'),
  jsdoc: require('eslint-plugin-jsdoc'),
  nonull: require('eslint-plugin-no-null'),
  import: require('eslint-plugin-import'),
  react: require('eslint-plugin-react'),
  preferArrow: require('eslint-plugin-prefer-arrow'),
  unicorn: require('eslint-plugin-unicorn'),
  stylistic: require('@stylistic/eslint-plugin'),
};

module.exports = [
  eslintPlugins.sonarjs.configs.recommended,
  ...eslintPlugins.typescriptESLint.configs.recommended,
  eslintPlugins.jsdoc.configs['flat/recommended-typescript'],
  {
    plugins: {
      '@typescript-eslint': eslintPlugins.typescriptESLint.plugin,
      jsdoc: eslintPlugins.jsdoc,
      'no-null': eslintPlugins.nonull,
      import: eslintPlugins.import,
      react: eslintPlugins.react,
      'prefer-arrow': eslintPlugins.preferArrow,
      unicorn: eslintPlugins.unicorn,
      '@stylistic': eslintPlugins.stylistic,
    },
    languageOptions: {
      ecmaVersion: 6,
      globals: {
        ...globals.browser,
      },
      parser: tsESLintParser,
      parserOptions: {
        sourceType: 'module',
        project: './tsconfig.eslint.json',
        tsconfigRootDir: './',
        ecmaFeatures: {
          jsx: true, // Allows for the parsing of JSX
        },
      },
    },
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/__mocks__/**/*', 'node_modules'],
    rules: {
      // disable default eslint rules to avoid conflicts with the recommended configs extensions
      'dot-notation': 'off',
      'no-empty-function': 'off',
      'no-shadow': 'off',
      'no-unused-expressions': 'off',
      'no-use-before-define': 'off',

      indent: 'off',

      // default eslint rules
      complexity: 'off',
      'constructor-super': 'error',
      eqeqeq: ['error', 'smart'],
      'guard-for-in': 'error',
      'id-denylist': 'error',
      'id-match': 'error',
      'max-classes-per-file': 'off', // Allow multiple classes per file for spec files
      'no-bitwise': 'error',
      'no-caller': 'error',
      'no-cond-assign': 'error',
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-case': 'error',
      'no-duplicate-imports': 'error',
      'no-empty': 'error',
      'no-eval': 'error',
      'no-extra-bind': 'error',
      'no-fallthrough': 'off',
      'no-invalid-this': 'off',
      'no-irregular-whitespace': 'off',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-redeclare': 'error',
      'no-restricted-imports': 'error',
      'no-sequences': 'error',
      'no-sparse-arrays': 'error',
      'no-template-curly-in-string': 'error',
      'no-throw-literal': 'error',
      'no-undef-init': 'error',
      'no-unsafe-finally': 'error',
      'no-unused-labels': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
      radix: 'error',
      'use-isnan': 'error',
      'valid-typeof': 'off',

      // deprecated in @typescript-eslint and moved to @stylistic
      '@stylistic/arrow-parens': ['off', 'off'],
      '@stylistic/brace-style': ['off', 'off'],
      '@stylistic/comma-dangle': 'off',
      '@stylistic/eol-last': 'off',
      '@stylistic/indent': 'off', // Let Prettier handle indentation
      '@stylistic/jsx-equals-spacing': 'off',
      '@stylistic/jsx-tag-spacing': [
        'off',
        {
          afterOpening: 'allow',
          closingSlash: 'allow',
        },
      ],
      '@stylistic/jsx-wrap-multilines': 'off',
      '@stylistic/linebreak-style': 'off',
      '@stylistic/max-len': 'off',
      '@stylistic/member-delimiter-style': [
        'off',
        {
          multiline: {
            delimiter: 'none',
            requireLast: true,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false,
          },
        },
      ],
      '@stylistic/new-parens': 'off',
      '@stylistic/newline-per-chained-call': 'off',
      '@stylistic/no-extra-semi': 'off',
      '@stylistic/no-multiple-empty-lines': 'off',
      '@stylistic/no-trailing-spaces': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/padded-blocks': [
        'off',
        {
          blocks: 'never',
        },
        {
          allowSingleLineBlocks: true,
        },
      ],
      '@stylistic/quotes': 'off',
      '@stylistic/semi': ['off', null],
      '@stylistic/type-annotation-spacing': 'off',
      '@stylistic/quote-props': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/semi': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/space-in-parens': ['off', 'never'],
      '@stylistic/spaced-comment': [
        'error',
        'always',
        {
          markers: ['/'],
        },
      ],

      '@typescript-eslint/adjacent-overload-signatures': 'error',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/dot-notation': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'off',
        {
          accessibility: 'explicit',
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'allow',
        },
      ],
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            Object: 'Avoid using the `Object` type. Did you mean `object`?',
            Function: 'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
            Boolean: 'Avoid using the `Boolean` type. Did you mean `boolean`?',
            Number: 'Avoid using the `Number` type. Did you mean `number`?',
            String: 'Avoid using the `String` type. Did you mean `string`?',
            Symbol: 'Avoid using the `Symbol` type. Did you mean `symbol`?',
          },
        },
      ],
      '@typescript-eslint/no-shadow': [
        'error',
        {
          hoist: 'all',
        },
      ],
      '@typescript-eslint/no-this-alias': [
        'error',
        {
          allowDestructuring: true,
        },
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/parameter-properties': 'off',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-function-type': 'error',
      '@typescript-eslint/prefer-namespace-keyword': 'error',
      '@typescript-eslint/triple-slash-reference': [
        'error',
        {
          path: 'always',
          types: 'prefer-import',
          lib: 'always',
        },
      ],
      '@typescript-eslint/typedef': 'off',
      '@typescript-eslint/unified-signatures': 'error',
      'import/no-internal-modules': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true, // StencilJS uses @stencil/core as devDependency
        },
      ],
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-indentation': 'error',
      'no-null/no-null': 'off',
      'prefer-arrow/prefer-arrow-functions': 'off', // Allow both arrow and regular functions
      'react/jsx-boolean-value': 'error',
      'react/jsx-key': 'off',
      'react/jsx-no-bind': 'off',
      'react/no-string-refs': 'error',
      'react/self-closing-comp': 'error',
      'sonarjs/no-invalid-await': 'warn',
      'sonarjs/todo-tag': 'warn',
      'sonarjs/public-static-readonly': 'warn',
      'sonarjs/function-return-type': 'warn',
      'sonarjs/no-selector-parameter': 'warn',
      'sonarjs/no-nested-functions': 'off', // Allow nested functions for event handlers
      'sonarjs/pseudo-random': 'off', // Allow Math.random() for demo data generation
      'sonarjs/slow-regex': 'warn', // Warn but don't fail
      'sonarjs/no-ignored-exceptions': 'warn', // Warn but don't fail
      'sonarjs/no-identical-functions': 'warn', // Warn but don't fail
      'sonarjs/void-use': 'off', // Allow void for side-effect-only function calls
      'sonarjs/prefer-regexp-exec': 'off', // Allow .match() for simpler regex usage
      'sonarjs/no-unused-vars': 'off', // Use TypeScript's own no-unused-vars instead
      'sonarjs/no-dead-store': 'off', // Allow intentional unused assignments for side effects
      'no-underscore-dangle': 'off',
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-returns-check': 'warn',
      'jsdoc/require-returns-description': 'warn',
      'jsdoc/require-jsdoc': 'off', // Don't require JSDoc on all functions
      'jsdoc/require-param': 'off', // Don't require @param tags
      'jsdoc/require-param-description': 'off', // Don't require param descriptions
      'jsdoc/require-returns': 'off', // Don't require @returns tags
      'unicorn/prefer-ternary': 'error',
    },
  },
  // Test file specific configuration
  {
    files: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: {
      // Custom rule to warn about large test files that may cause Jest memory issues
      'max-lines': [
        'warn',
        {
          max: 1000,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'sonarjs/no-duplicate-string': 'off', // Allow duplicate strings in tests
      'sonarjs/no-identical-functions': 'off', // Allow similar test setups
    },
  },
  eslintPlugins.prettier, // recommended to be last in order to allow eslint-config-prettier to override other configs
];
