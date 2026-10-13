const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '../src/main/assets');
const targetDirs = [
  path.resolve(__dirname, '../dist/main/assets'),
  path.resolve(__dirname, '../dist/assets'),
  path.resolve(__dirname, '../build'),
];

if (fs.existsSync(srcDir)) {
  for (const targetDir of targetDirs) {
    fs.mkdirSync(targetDir, { recursive: true });
    const files = fs.readdirSync(srcDir);
    for (const f of files) {
      const srcFile = path.join(srcDir, f);
      const destFile = path.join(targetDir, f);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
  }
  console.log('✓ Successfully synchronized tray and app assets to dist.');
}
