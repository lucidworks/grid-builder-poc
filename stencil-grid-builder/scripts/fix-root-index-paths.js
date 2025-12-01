/**
 * Fix root index.html script paths for relative deployment
 *
 * The source file uses ../build/ (for demo/index.html subdirectory)
 * But the root index.html needs ./build/ (at root level)
 *
 * This script runs after build to fix the root index.html
 */

const fs = require('fs');
const path = require('path');

const rootIndexPath = path.join(__dirname, '../www/index.html');

if (fs.existsSync(rootIndexPath)) {
  let content = fs.readFileSync(rootIndexPath, 'utf8');

  // Replace ../build/ with ./build/ for root index.html
  content = content.replace(
    /src="\.\.\/build\//g,
    'src="./build/'
  );

  fs.writeFileSync(rootIndexPath, content, 'utf8');
  console.log('✅ Fixed root index.html script paths (../build/ → ./build/)');
} else {
  console.log('⚠️  Root index.html not found, skipping path fix');
}
