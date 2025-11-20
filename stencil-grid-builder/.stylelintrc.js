module.exports = {
  rules: {
    'at-rule-empty-line-before': null,
    'block-closing-brace-newline-after': null, //seems to cause annoying/useless warnings e.g. if/else block in SCSS
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-block-semicolon-newline-after': null,
    'declaration-block-semicolon-newline-before': null,
    'declaration-block-semicolon-space-after': null,
    'declaration-block-semicolon-space-before': null,
    'declaration-block-trailing-semicolon': null, // prettier always adds the trailing semicolon
    'declaration-empty-line-before': null,
    'no-eol-whitespace': null,
    'rule-empty-line-before': null,
    'selector-type-no-unknown': null,
  },
  extends: ['stylelint-config-recommended-scss', 'stylelint-config-idiomatic-order'],
};
