// Jest configuration for Stencil project
// This bypasses the Stencil CLI --spec bug by using @stencil/core/testing preset directly
//
// NOTE: For test coverage, use `npm run test:coverage` which runs `stencil test --spec --coverage`
// Coverage configuration is in stencil.config.ts testing section
module.exports = {
  preset: '@stencil/core/testing',
  testRegex: '(/__tests__/.*|(\\.| /)(test|spec|e2e))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testRunner: 'jest-jasmine2',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
