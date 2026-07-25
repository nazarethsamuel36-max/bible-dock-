const fs = require('fs');
const path = require('path');

console.log('=== Bible Dock Deployment Diagnostic ===\n');

// Check if public files exist
console.log('1. Checking public files...');
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  const files = fs.readdirSync(publicDir);
  console.log('✓ Public directory exists');
  console.log('  Files:', files.length);
  
  // Check for bible_index.json
  if (fs.existsSync(path.join(publicDir, 'bible_index.json'))) {
    const stats = fs.statSync(path.join(publicDir, 'bible_index.json'));
    console.log(`✓ bible_index.json exists (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log('✗ bible_index.json missing');
  }
  
  // Check for data directory
  const dataDir = path.join(publicDir, 'data');
  if (fs.existsSync(dataDir)) {
    const enDir = path.join(dataDir, 'en');
    const hiDir = path.join(dataDir, 'hi');
    
    if (fs.existsSync(enDir)) {
      const enFiles = fs.readdirSync(enDir);
      console.log(`✓ data/en/ exists (${enFiles.length} files)`);
    } else {
      console.log('✗ data/en/ missing');
    }
    
    if (fs.existsSync(hiDir)) {
      const hiFiles = fs.readdirSync(hiDir);
      console.log(`✓ data/hi/ exists (${hiFiles.length} files)`);
    } else {
      console.log('✗ data/hi/ missing');
    }
  } else {
    console.log('✗ data/ directory missing');
  }
} else {
  console.log('✗ Public directory missing');
}

// Check package.json
console.log('\n2. Checking package.json...');
if (fs.existsSync(path.join(__dirname, 'package.json'))) {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
  console.log('✓ package.json exists');
  console.log('  Name:', pkg.name);
  console.log('  Version:', pkg.version);
  console.log('  Scripts:', Object.keys(pkg.scripts).join(', '));
} else {
  console.log('✗ package.json missing');
}

// Check next.config
console.log('\n3. Checking Next.js config...');
const configFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
let configFound = false;
for (const configFile of configFiles) {
  if (fs.existsSync(path.join(__dirname, configFile))) {
    console.log(`✓ ${configFile} exists`);
    configFound = true;
    break;
  }
}
if (!configFound) {
  console.log('⚠ No Next.js config file found (using defaults)');
}

// Check app directory structure
console.log('\n4. Checking app directory structure...');
const appDir = path.join(__dirname, 'app');
if (fs.existsSync(appDir)) {
  console.log('✓ app/ directory exists');
  
  const requiredFiles = ['page.tsx', 'layout.tsx', 'globals.css'];
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(appDir, file))) {
      console.log(`✓ app/${file} exists`);
    } else {
      console.log(`✗ app/${file} missing`);
    }
  }
  
  // Check subdirectories
  const subdirs = ['dock', 'presentation'];
  for (const subdir of subdirs) {
    const subdirPath = path.join(appDir, subdir);
    if (fs.existsSync(subdirPath)) {
      const pageFile = path.join(subdirPath, 'page.tsx');
      if (fs.existsSync(pageFile)) {
        console.log(`✓ app/${subdir}/page.tsx exists`);
      } else {
        console.log(`✗ app/${subdir}/page.tsx missing`);
      }
    } else {
      console.log(`✗ app/${subdir}/ missing`);
    }
  }
} else {
  console.log('✗ app/ directory missing');
}

// Check for large files
console.log('\n5. Checking for large files...');
const checkLargeFiles = (dir, maxSizeMB = 10) => {
  const largeFiles = [];
  const walk = (currentDir) => {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        walk(filePath);
      } else if (stats.size > maxSizeMB * 1024 * 1024) {
        largeFiles.push({ path: filePath, size: stats.size });
      }
    }
  };
  walk(dir);
  return largeFiles;
};

const largeFiles = checkLargeFiles(__dirname, 10);
if (largeFiles.length > 0) {
  console.log(`⚠ Found ${largeFiles.length} large files (>10MB):`);
  largeFiles.forEach(f => {
    console.log(`  ${f.path} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
  });
} else {
  console.log('✓ No large files found (>10MB)');
}

console.log('\n=== Diagnostic Complete ===');
