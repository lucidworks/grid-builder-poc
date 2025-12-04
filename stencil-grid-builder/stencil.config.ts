import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import path from 'path';

// Build demo components only when BUILD_DEMO=true
const buildDemo = process.env.BUILD_DEMO === 'true';

export const config: Config = {
  namespace: 'grid-builder',
  globalStyle: 'src/global/global.scss',
  plugins: [sass()],
  // Exclude demo components from production builds
  excludeSrc: buildDemo ? [] : ['**/demo/**'],
  outputTargets: [
    // NPM distribution
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    },
    // Type definitions for custom elements
    {
      type: 'dist-custom-elements',
    },
    // Documentation
    {
      type: 'docs-readme',
    },
    // Demo/testing (includes demo components)
    {
      type: 'www',
      serviceWorker: null,
      copy: [
        { src: 'demo' }, // Copy demo folder to www/demo
        { src: 'demo/index.html', dest: 'index.html' } // Also copy index.html to www root
      ]
    },
  ],
  testing: {
    browserHeadless: 'shell',
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    transformIgnorePatterns: ['node_modules/(?!(@vaadin)/)'],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        '<rootDir>/__mocks__/fileMock.js',
    },
    // Transform only .js files (for dependencies), NOT .ts/.tsx - Stencil's compiler handles those
    transform: {
      '^.+\\.js$': path.join(__dirname, 'testing/jest-transform.js'),
    },
    // Coverage configuration
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.spec.{ts,tsx}',
      '!src/**/*.e2e.{ts,tsx}',
      '!src/**/*.stories.{ts,tsx}',
      '!src/demo/**',
      '!src/types/**',
      '!src/global/**',
      '!src/index.ts',
      '!src/utils/version.ts',
      '!src/components.d.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'text-summary', 'html', 'lcov', 'json'],
    coverageThreshold: {
      global: {
        // Current baseline: ~60% coverage across all metrics
        // Set thresholds slightly below current to catch regressions
        // TODO: Incrementally increase these as coverage improves
        branches: 54,    // Currently 54.1%
        functions: 60,   // Currently 60.69%
        lines: 60,       // Currently 60.85%
        statements: 60,  // Currently 60.46%
      },
    },
  },
};
