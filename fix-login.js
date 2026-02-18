const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'frontend', 'src', 'app', 'login', 'page_modern.tsx');
const target = path.join(__dirname, 'frontend', 'src', 'app', 'login', 'page.tsx');

try {
  const content = fs.readFileSync(source, 'utf8');
  fs.writeFileSync(target, content, 'utf8');
  console.log('✅ Successfully copied page_modern.tsx to page.tsx');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
