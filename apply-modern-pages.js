const fs = require('fs');
const path = require('path');

try {
  // Read modern login page
  const modernLogin = fs.readFileSync(
    path.join(__dirname, 'frontend', 'src', 'app', 'login', 'page_modern.tsx'),
    'utf8'
  );
  
  // Write to production login page
  fs.writeFileSync(
    path.join(__dirname, 'frontend', 'src', 'app', 'login', 'page.tsx'),
    modernLogin,
    'utf8'
  );
  
  console.log('✅ Modern login page applied successfully');
  
  // Read modern register page
  const modernRegister = fs.readFileSync(
    path.join(__dirname, 'frontend', 'src', 'app', 'register', 'page_modern.tsx'),
    'utf8'
  );
  
  // Write to production register page
  fs.writeFileSync(
    path.join(__dirname, 'frontend', 'src', 'app', 'register', 'page.tsx'),
    modernRegister,
    'utf8'
  );
  
  console.log('✅ Modern register page applied successfully');
  console.log('✅ All modern designs applied! Ready to build.');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
