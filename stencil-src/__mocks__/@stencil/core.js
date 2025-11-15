// Mock for @stencil/core to provide no-op decorators for testing

// No-op decorator factory
const noopDecorator = () => () => {};

// Export all Stencil decorators as no-ops
module.exports = {
  Component: noopDecorator,
  Prop: noopDecorator,
  State: noopDecorator,
  Watch: noopDecorator,
  Event: noopDecorator,
  EventEmitter: class EventEmitter {
    emit() {}
  },
  Method: noopDecorator,
  Element: noopDecorator,
  Listen: noopDecorator,
  Host: 'div',
  h: (tag, props, ...children) => ({ tag, props, children }),
  Fragment: 'fragment',
  getElement: () => document.createElement('div'),
};
