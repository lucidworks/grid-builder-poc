// Jest configuration for Stencil project
// This bypasses the Stencil CLI --spec bug by using @stencil/core/testing preset directly
module.exports = {
  preset: '@stencil/core/testing',
  testRegex: '(/__tests__/.*|(\\.| /)(test|spec|e2e))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testRunner: 'jest-jasmine2',
};
