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
    transformIgnorePatterns: ['node_modules/(?!(@vaadin)/)'],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
        '<rootDir>/__mocks__/fileMock.js',
    },
    // Transform only .js files (for dependencies), NOT .ts/.tsx - Stencil's compiler handles those
    transform: {
      '^.+\\.js$': path.join(__dirname, 'testing/jest-transform.js'),
    },
  },
};
