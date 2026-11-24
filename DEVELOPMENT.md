# The Source Lab · HKBK

Open `index.html` in a browser. The site uses HTML, CSS and vanilla JavaScript. Images, logos, fonts and artwork are in `assets/`. The four event pages are in `events/`. No dependencies or build step are required.

To try the contact inbox locally with Node.js 22.13 or later, run `node serve.mjs` and open http://127.0.0.1:4173. Enquiries go to an ignored SQLite file alongside the server and are never exposed through a website route. Static-only hosts can serve the entire frontend unchanged. Sending enquiries on those hosts requires a same-origin POST handler at `api/contact`, or use the link to the hosted form. The existing hosted site has its own private inbox.
