export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/api/contact') return receiveContact(request, env.DB);
    if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
    const asset = assets[path==='/' ? '/index.html' : path];
    if (!asset) return new Response('Page not found',{status:404});
    const [type,base64] = asset;
    const headers = {'Content-Type':type,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'};
    return new Response(request.method==='HEAD' ? null : Uint8Array.from(atob(base64), c=>c.charCodeAt(0)),{headers});
  }
};
