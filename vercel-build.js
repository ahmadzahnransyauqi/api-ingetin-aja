// vercel-build.js - Custom build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Running custom Vercel build script...');

try {
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    console.error('❌ package.json not found');
    process.exit(1);
  }

  // Read package.json
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check if pg is in dependencies
  if (!pkg.dependencies.pg) {
    console.log('⚠️ pg not in dependencies, adding...');
    pkg.dependencies.pg = '^8.11.3';
    pkg.dependencies['pg-hstore'] = '^2.3.4';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install --production', { stdio: 'inherit' });

  // Verify pg installation
  console.log('🔍 Verifying packages...');
  try {
    require('pg');
    console.log('✅ pg package verified');
  } catch (e) {
    console.error('❌ pg package missing, installing...');
    execSync('npm install pg@8.11.3 pg-hstore@2.3.4 --no-save', { stdio: 'inherit' });
  }

  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
