module.exports = {
  rules: {
    'at-rule-empty-line-before': null,
    'block-closing-brace-newline-after': null, //seems to cause annoying/useless warnings e.g. if/else block in SCSS
    'color-function-notation': 'legacy', // move to modern after upgrade to stencil-scss v2
    'comment-empty-line-before': [
      'always',
      {
        ignore: ['stylelint-commands', 'after-comment']
      }
    ],
    'custom-property-pattern': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-block-semicolon-newline-after': null,
    'declaration-block-semicolon-newline-before': null,
    'declaration-block-semicolon-space-after': null,
    'declaration-block-semicolon-space-before': null,
    'declaration-block-trailing-semicolon': null, // prettier always adds the trailing semicolon
    'declaration-colon-space-after': 'always',
    'declaration-empty-line-before': null,
    'function-name-case': null,
    'length-zero-no-unit': true,
    'max-empty-lines': 2,
    'media-feature-colon-space-after': 'always',
    'media-feature-colon-space-before': 'never',
    'media-feature-parentheses-space-inside': 'never',
    'media-query-list-comma-space-after': 'always',
    'media-query-list-comma-space-before': 'never',
    'no-eol-whitespace':null,
    'property-no-vendor-prefix': null,
    'rule-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-comment']
      }
    ],
    'scss/at-mixin-pattern': null,
    'scss/no-global-function-names': null,
    'selector-attribute-brackets-space-inside': 'never',
    'selector-class-pattern': null,
    'selector-combinator-space-after': 'always',
    'selector-combinator-space-before': 'always',
    'selector-descendant-combinator-no-non-space': true,
    'selector-pseudo-class-parentheses-space-inside': 'never',
    'selector-pseudo-element-colon-notation': 'double',
    'selector-type-no-unknown': null,
    'string-quotes': null,
    'value-no-vendor-prefix': null,
  },
  extends: ['stylelint-config-standard-scss', 'stylelint-config-recommended-scss', 'stylelint-config-idiomatic-order'],
};
