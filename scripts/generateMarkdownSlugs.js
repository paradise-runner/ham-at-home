
const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../src/markdown/posts');
const slugs = fs.readdirSync(postsDir)
  .filter(file => file.endsWith('.md'))
  .map(file => path.basename(file, '.md'));

const envFilePath = path.join(__dirname, '../.env.local');
const envContent = `MARKDOWN_SLUGS=${slugs.join(',')}\n`;

fs.writeFileSync(envFilePath, envContent);
console.log(`Generated MARKDOWN_SLUGS for ${slugs.length} posts.`);