import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';

// Optional hosting package. The site itself runs directly from index.html.
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const assets = {};
async function copyAsset(path) {
  const type = types[extname(path)];
  if (!type) throw new Error('Unknown asset type: '+path);
  assets['/'+path] = [type,(await readFile(path)).toString('base64')];
  await mkdir(join('dist/client',dirname(path)),{recursive:true});
  await copyFile(path,join('dist/client',path));
}
async function copyDirectory(dir) {
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const path = join(dir,entry.name);
    if (entry.isDirectory()) await copyDirectory(path);
    else if (entry.isFile()) await copyAsset(path);
  }
}
for (const file of ['index.html','app.js','style.css']) await copyAsset(file);
for (const dir of ['assets','events']) await copyDirectory(dir);
await mkdir('dist/server',{recursive:true});
const contact = await readFile('server/contact.mjs','utf8');
const handler = await readFile('server/handler.js','utf8');
await writeFile('dist/server/index.js',contact+'\nconst assets = '+JSON.stringify(assets)+';\n'+handler);
