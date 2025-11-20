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

    // Find and modify all babel-loader rules to include preset-react
    config.module.rules.forEach((rule) => {
      if (rule.use) {
        const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
        uses.forEach((use) => {
          if (use.loader && use.loader.includes('babel-loader')) {
            use.options = use.options || {};
            use.options.presets = use.options.presets || [];
            // Add preset-react if not already present
            const hasReactPreset = use.options.presets.some(preset =>
              (Array.isArray(preset) && preset[0].includes('preset-react')) ||
              (typeof preset === 'string' && preset.includes('preset-react'))
            );
            if (!hasReactPreset) {
              use.options.presets.push(require.resolve('@babel/preset-react'));
            }
            // Ensure babelrc is enabled
            delete use.options.babelrc;
            delete use.options.configFile;
          }
        });
      }
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
