/**
 * Jest Setup
 * ===========
 *
 * Global mocks and setup for Jest tests
 */

// Mock IntersectionObserver for virtual-renderer tests
global.IntersectionObserver = class IntersectionObserver {
  constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}

  observe() {
    return null;
  }

  disconnect() {
    return null;
  }

  unobserve() {
    return null;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  root = null;
  rootMargin = '';
  thresholds = [];
} as any;
