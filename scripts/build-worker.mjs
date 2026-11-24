import {readdir, readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';

// The same Vite build remains portable under a GLUG subdirectory. The Worker
// also embeds it so the microsite can run with only a D1 binding on Sites.
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8'};
const assets = {};
async function collect(dir='') {
  for (const file of await readdir(join('dist/client',dir),{withFileTypes:true})) {
    const path=join(dir,file.name);
    if (file.isDirectory()) { await collect(path); continue; }
    if (!mime[extname(path)]) throw new Error('Unknown asset type: '+path);
    assets['/'+path]=[mime[extname(path)],(await readFile(join('dist/client',path))).toString('base64')];
  }
}
await collect();
await mkdir('dist/server',{recursive:true});
const contact=await readFile('server/contact.mjs','utf8');
const handler=await readFile('server/handler.js','utf8');
await writeFile('dist/server/index.js',contact+'\nconst assets = '+JSON.stringify(assets)+';\n'+handler);
