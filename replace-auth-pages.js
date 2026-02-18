const fs = require('fs');
const path = require('path');

const frontendDir = 'c:\\Users\\Dell\\Documents\\riseflowhub_v1.0\\frontend';

// Copy login page_modern.tsx to page.tsx
const loginModern = path.join(frontendDir, 'src', 'app', 'login', 'page_modern.tsx');
const loginOld = path.join(frontendDir, 'src', 'app', 'login', 'page.tsx');

try {
  const modernLoginContent = fs.readFileSync(loginModern, 'utf8');
  fs.writeFileSync(loginOld, modernLoginContent, 'utf8');
  console.log('✅ Login page replaced with modern version');
} catch (err) {
  console.error('❌ Error replacing login page:', err.message);
}

// Copy register page_modern.tsx to page.tsx
const registerModern = path.join(frontendDir, 'src', 'app', 'register', 'page_modern.tsx');
const registerOld = path.join(frontendDir, 'src', 'app', 'register', 'page.tsx');

try {
  const modernRegisterContent = fs.readFileSync(registerModern, 'utf8');
  fs.writeFileSync(registerOld, modernRegisterContent, 'utf8');
  console.log('✅ Register page replaced with modern version');
} catch (err) {
  console.error('❌ Error replacing register page:', err.message);
}

console.log('✅ Modern design application complete!');
