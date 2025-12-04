// Jest configuration for Stencil project
// This bypasses the Stencil CLI --spec bug by using @stencil/core/testing preset directly
module.exports = {
  preset: '@stencil/core/testing',
  testRegex: '(/__tests__/.*|(\\.| /)(test|spec|e2e))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testRunner: 'jest-jasmine2',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Coverage configuration
  //
  // NOTE: Coverage reporting has known limitations with @stencil/core/testing preset
  // due to how Stencil transpiles components. Coverage numbers may be inaccurate.
  // For accurate coverage, consider using standalone Jest with babel-jest transform
  // or Istanbul/nyc CLI tools outside of the Stencil test runner.
  //
  // Run coverage: npm run test:coverage
  // View HTML report: open coverage/lcov-report/index.html
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}', // Exclude test files
    '!src/**/*.e2e.{ts,tsx}', // Exclude e2e test files
    '!src/**/*.stories.{ts,tsx}', // Exclude Storybook stories
    '!src/demo/**', // Exclude demo components
    '!src/types/**', // Exclude type definitions (no runtime code)
    '!src/global/**', // Exclude global styles
    '!src/index.ts', // Exclude barrel export
    '!src/utils/version.ts', // Exclude generated version file
    '!src/components.d.ts', // Exclude auto-generated component types
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '\\.spec\\.(ts|tsx)$',
    '\\.e2e\\.(ts|tsx)$',
    '\\.stories\\.(ts|tsx)$',
    '/demo/',
    '/types/',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text', // Console output
    'text-summary', // Brief summary
    'html', // Detailed HTML report
    'lcov', // For CI/CD integration
    'json', // For programmatic access
  ],
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
