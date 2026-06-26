const fs = require('fs');

function replaceInFile(file, replacements) {
  let content = fs.readFileSync(file, 'utf8');
  for (const [find, replace] of replacements) {
    content = content.replace(new RegExp(find, 'g'), replace);
  }
  fs.writeFileSync(file, content);
}

// App.tsx
replaceInFile('src/app/App.tsx', [
  ['#2d3748', '#0f172a'], // slate 800 to slate 900
  ['#a0aec0', '#475569'], // slate 400 to slate 600
  ['#8492a6', '#475569'], // slate 500-ish to slate 600
  ['#4a5568', '#0f172a']  // slate 600 to slate 900 (used in main text wrapper)
]);

// theme.css
replaceInFile('src/styles/theme.css', [
  ['--foreground: #2d3748', '--foreground: #0f172a'],
  ['--card-foreground: #2d3748', '--card-foreground: #0f172a'],
  ['--muted-foreground: #718096', '--muted-foreground: #475569'],
  ['--secondary-foreground: #4a5568', '--secondary-foreground: #334155'],
  ['--sidebar-foreground: #4a5568', '--sidebar-foreground: #334155'],
  ['--sidebar-accent-foreground: #2d3748', '--sidebar-accent-foreground: #0f172a']
]);

console.log('Colors replaced successfully!');
