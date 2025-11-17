// Babel plugin to transform Stencil decorators into no-ops for testing
module.exports = function() {
  return {
    name: 'transform-stencil-decorators',
    visitor: {
      Decorator(path) {
        const decoratorName = path.node.expression.type === 'Identifier'
          ? path.node.expression.name
          : path.node.expression.callee?.name;

        // Remove Stencil decorators but keep the class
        const stencilDecorators = [
          'Component',
          'Prop',
          'State',
          'Watch',
          'Event',
          'EventEmitter',
          'Method',
          'Element',
          'Listen'
        ];

        if (stencilDecorators.includes(decoratorName)) {
          path.remove();
        }
      }
    }
  };
};
