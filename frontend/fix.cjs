const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/['"]\.\.\/\.\.\/\.\.\/components/g, "'@/components");
      content = content.replace(/['"]\.\.\/\.\.\/\.\.\/contexts/g, "'@/contexts");
      content = content.replace(/['"]\.\.\/\.\.\/\.\.\/hooks/g, "'@/hooks");
      content = content.replace(/['"]\.\.\/\.\.\/components/g, "'@/components");
      content = content.replace(/['"]\.\.\/\.\.\/contexts/g, "'@/contexts");
      content = content.replace(/['"]\.\.\/components/g, "'@/components");
      content = content.replace(/['"]\.\.\/contexts/g, "'@/contexts");
      content = content.replace(/onChange=\{\(e\) =>/g, "onChange={(e: any) =>");
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceInDir(path.join(__dirname, 'src'));
