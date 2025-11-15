// Babel transform for Jest tests
// NOTE: This transforms decorators for testing - components won't render with newSpecPage
const config = {
  presets: [
    ['@babel/preset-env', {
      targets: 'node 8',
      modules: 'commonjs'
    }],
    ['@babel/preset-typescript', {
      jsxPragma: 'h',
      jsxPragmaFrag: 'Fragment',
      isTSX: true,
      allExtensions: true
    }]
  ],

  plugins: [
    // Decorators must come first
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    '@babel/proposal-object-rest-spread',
    ['@babel/plugin-transform-react-jsx', {
      pragma: 'h',
      pragmaFrag: 'Fragment'
    }]
  ]
};

module.exports = require('babel-jest').default.createTransformer(config);
