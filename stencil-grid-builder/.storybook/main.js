const path = require('path');

module.exports = {
  staticDirs: ['../dist'],

  previewHead: (head) => (`
    ${head}
    <script type="module" src="grid-builder/grid-builder.esm.js"></script>
    <link rel="stylesheet" href="grid-builder/grid-builder.css">
  `),

  stories: [
    '../src/**/*.stories.@(js|ts|tsx|mdx)',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-knobs',
  ],

  babel: async (options) => {
    return {
      ...options,
      presets: [
        ...(options.presets || []),
        '@babel/preset-react',
      ],
    };
  },

  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(__dirname, '../'),
    });

    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, '../src'),
    ];

    return config;
  },

  framework: {
    name: '@storybook/web-components-webpack5',
    options: {}
  },

  docs: {
    autodocs: false
  }
}
