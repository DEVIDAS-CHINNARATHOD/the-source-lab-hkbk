const topics = new Set(['Joining the cell','Workshops and events','Collaboration','General enquiry']);
const limit = 24_576;

async function boundedBody(request) {
  if (Number(request.headers.get('content-length')) > limit) return null;
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  return new Blob(chunks).text();
}

export async function receiveContact(request, db) {
  const nativeForm = request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded');
  function reply(status, message) {
    const headers = { 'Cache-Control':'no-store' };
    if (status === 405) headers.Allow = 'POST';
    if (status === 429) headers['Retry-After'] = '60';
    if (!nativeForm) return Response.json({received:status===201, message}, {status, headers});
    // Only application-owned messages are rendered in this no-JavaScript response.
    headers['Content-Type'] = 'text/html; charset=utf-8';
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Contact · The Source Lab</title><link rel="stylesheet" href="../style.css"><main class="wrap section"><h1>The Source Lab</h1><p>${message}</p><p><a class="button dark" href="../index.html#contact">Back to contact</a></p></main></html>`, {status,headers});
  }
  if (request.method !== 'POST') return reply(405, 'Use the contact form to send a message.');
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply(403, 'Please send your message from this site.');
  if (!nativeForm && !request.headers.get('content-type')?.startsWith('application/json')) return reply(415,'Unsupported submission format.');
  const body = await boundedBody(request);
  if (body === null) return reply(413,'Your message is too long.');
  let data;
  try { data = nativeForm ? Object.fromEntries(new URLSearchParams(body)) : JSON.parse(body); }
  catch { return reply(400, 'The submission could not be read.'); }
  if (!data || typeof data !== 'object' || data.website) return reply(400,'Please check your submission.');
  const field = key => typeof data[key] === 'string' ? data[key].trim() : '';
  const name=field('name'), email=field('email').toLowerCase(), topic=field('topic'), message=field('message');
  const id=field('id') || crypto.randomUUID();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id)
    || !name || name.length > 90 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !topics.has(topic) || message.length < 5 || message.length > 3000)
    return reply(422,'Check your name, email and topic. The message must contain 5 to 3,000 characters.');
  try {
    // The single write reserves the id and enforces a short per-address cooldown atomically.
    const put = await db.prepare(`INSERT INTO contact_messages (id,name,email,topic,message)
      SELECT ?,?,?,?,? WHERE NOT EXISTS (
        SELECT 1 FROM contact_messages WHERE email=? AND received_at > datetime('now','-1 minute')
      ) ON CONFLICT(id) DO NOTHING`).bind(id,name,email,topic,message,email).run();
    if (!put.meta.changes) {
      const existing = await db.prepare('SELECT id FROM contact_messages WHERE id=? AND name=? AND email=? AND topic=? AND message=?').bind(id,name,email,topic,message).first();
      if (!existing) return reply(429,'Please wait one minute before sending another message.');
    }
    return reply(201,'Thank you. The Source Lab has received your message.');
  } catch {
    return reply(503,'The inbox is temporarily unavailable. Please try again.');
  }
}
