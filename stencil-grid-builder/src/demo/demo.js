// Demo initialization script
// This file loads the blog app demo when running the library in dev mode

import { blogComponentDefinitions } from './utils/component-definitions.js';

// Initialize the blog app with demo data
const blogApp = document.querySelector('blog-app');
if (blogApp) {
  console.log('Blog app demo loaded!');
}
