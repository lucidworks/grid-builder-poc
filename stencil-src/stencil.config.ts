import { Config } from '@stencil/core';
import { sass } from '@stencil/sass';
import path from 'path';

export const config: Config = {
  namespace: 'grid-builder',
  globalStyle: 'src/global/global.scss',
  plugins: [sass()],
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
      // Output to parent directory's stencil/ folder
      dir: '../stencil',
      buildDir: 'build',
      baseUrl: '.',  // Attempt to use relative paths (but StencilJS still generates absolute paths)
                      // WORKAROUND: Run `npm run fix-paths` after building to convert absolute paths
                      // to relative paths for GitHub Pages subdirectory deployment
      empty: true,
      copy: [
        { src: 'assets' },
        { src: '../../shared', dest: 'shared' }
      ]
    },
    {
      type: 'dist',
      esmLoaderPath: '../loader',
    }
  ],
  testing: {
    browserHeadless: "shell",
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox'],
    transformIgnorePatterns: ['node_modules/(?!(@vaadin)/)'],
    moduleNameMapper: {
      '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/__mocks__/fileMock.js',
    },
    // Transform only .js files (for dependencies), NOT .ts/.tsx - Stencil's compiler handles those
    transform: {
      '^.+\\.js$': path.join(__dirname, 'testing/jest-transform.js'),
    },
  },
};
