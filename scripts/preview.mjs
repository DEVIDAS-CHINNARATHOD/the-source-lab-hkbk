import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync, readFileSync} from 'node:fs';
import worker from '../dist/server/index.js';

mkdirSync('.sites-runtime',{recursive:true});
const db = new DatabaseSync('.sites-runtime/contact-preview.sqlite');
if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='contact_messages'").get())
  db.exec(readFileSync('drizzle/0000_contact_messages.sql','utf8'));
const DB = {prepare(query) { const stmt=db.prepare(query); return {bind(...args) {
  return {run:()=>({meta:stmt.run(...args)}),first:()=>stmt.get(...args)};
}}}};
const flag=process.argv.indexOf('--port');
const port=Number(flag>=0 ? process.argv[flag+1] : process.env.PORT || 4173);
createServer(async (req,res)=>{
  try {
    const init={method:req.method,headers:req.headers};
    if (req.method!=='GET' && req.method!=='HEAD') Object.assign(init,{body:req,duplex:'half'});
    const request=new Request('http://'+req.headers.host+req.url,init);
    const response=await worker.fetch(request,{DB});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500);res.end();}
}).listen(port,'0.0.0.0',()=>console.log('Preview listening on '+port));
