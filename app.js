document.documentElement.classList.add('js');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
}
menu.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    menu.focus();
  }
});
const filters = document.querySelector('.filters');
if (filters) {
  filters.hidden = false;
  filters.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    document.querySelectorAll('.event-card').forEach(card => {
      card.hidden = button.dataset.filter !== 'All' && card.dataset.kind !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    document.querySelector('#filter-status').textContent = count + (count === 1 ? ' event shown' : ' events shown');
  });
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.hash));
  let pending = false;
  function activeLink() {
    const section = sections.filter(item => item.getBoundingClientRect().top <= Math.min(220, innerHeight * .34)).pop() || sections[0];
    links.forEach(link => {
      const active = link.hash === '#' + section.id;
      link.classList.toggle('current', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    pending = false;
  }
  window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(activeLink); } }, {passive: true});
  activeLink();
}

const contact = document.querySelector('#contact-form');
if (contact) {
  const status = contact.querySelector('.form-status');
  if (location.protocol === 'file:') {
    document.querySelector('#hosted-contact').hidden = false;
    status.textContent = 'Open the hosted form to send an enquiry from this offline copy.';
  }
  const submit = contact.querySelector('button[type="submit"]');
  let requestId;
  contact.addEventListener('input', () => {
    requestId = undefined;
    status.textContent = '';
  });
  contact.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !contact.reportValidity()) return;
    if (typeof crypto.randomUUID === 'function') requestId ??= crypto.randomUUID();
    const payload = Object.fromEntries(new FormData(contact));
    payload.id = requestId;
    submit.disabled = true;
    contact.setAttribute('aria-busy', 'true');
    status.dataset.error = 'false';
    status.textContent = 'Sending your message…';
    try {
      const response = await fetch(contact.action, {
        method:'POST',
        headers:{'Content-Type':'application/json', Accept:'application/json'},
        body:JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.received) {
        if ([422,429].includes(response.status) && result.message) {
          status.dataset.error = 'true';
          status.textContent = result.message;
          return;
        }
        throw new Error();
      }
      if (requestId === payload.id) contact.reset();
      document.querySelector('#hosted-contact').hidden = true;
      requestId = undefined;
      status.textContent = 'Thank you. The Source Lab has received your message.';
    } catch {
      status.dataset.error = 'true';
      status.textContent = 'Your message could not be confirmed. Try again or use the hosted contact form.';
      document.querySelector('#hosted-contact').hidden = false;
    } finally {
      contact.removeAttribute('aria-busy');
      submit.disabled = false;
    }
  });
}

// The sprite sheet contains 15 columns and 7 rows of Open Peeps artwork.
// See assets/hero/credits.txt for the artists and original animation.
function startHeroMotion() {
  const canvas = document.querySelector('#hero-crowd canvas');
  const control = document.querySelector('#motion-control button');
  if (!canvas || !control) return;
  const context = canvas.getContext('2d');
  const sheet = new Image();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let visible = true;
  let frame = 0;
  let previous = 0;
  let width = 0;
  let height = 0;
  let walkers = [];

  function draw(delta) {
    context.clearRect(0, 0, width, height);
    const cellWidth = sheet.naturalWidth / 15;
    const cellHeight = sheet.naturalHeight / 7;
    for (const person of walkers) {
      const w = person.height * cellWidth / cellHeight;
      person.distance = (person.distance + delta * person.speed) % (width + w);
      const x = person.right ? person.distance - w : width - person.distance;
      const y = person.floor - person.height - (1 + Math.sin(person.distance * .27)) * 1.25;
      context.save();
      context.translate(x + (person.right ? 0 : w), y);
      context.scale(person.right ? 1 : -1, 1);
      context.drawImage(sheet, person.cell % 15 * cellWidth, Math.floor(person.cell / 15) * cellHeight,
        cellWidth, cellHeight, 0, 0, w, person.height);
      context.restore();
    }
  }
  function animate(now) {
    draw(previous ? Math.min((now - previous) / 1000, .08) : 0);
    previous = now;
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);
    previous = 0;
    document.documentElement.dataset.heroMotion = paused ? 'paused' : 'running';
    control.hidden = false;
    const label = paused ? 'Play animations' : 'Pause animations';
    control.setAttribute('aria-label', label);
    control.title = label;
    control.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
    if (walkers.length && !document.hidden && visible && !paused) frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (!context || !sheet.naturalWidth) return;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(105, Math.max(6, Math.ceil(width / 58)));
    const cells = Array.from({length:105}, (_, i) => i);
    walkers = Array.from({length:count}, (_, i) => {
      const scale = .77 + Math.random() * .23;
      const right = Math.random() > .5;
      const slot = (i + Math.random() * .7) / count;
      return {cell:cells.splice(Math.floor(Math.random() * cells.length),1)[0], right,
        height:height * .94 * scale, floor:height * (1 - (1 - scale) * .46),
        distance:width * (right ? slot : 1 - slot), speed:22 + Math.random() * 21};
    }).sort((a,b) => a.floor - b.floor);
    draw(0);
    sync();
  }
  control.addEventListener('click', () => { paused = !paused; sync(); });
  preference.addEventListener('change', event => { paused = event.matches; sync(); });
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(canvas);
  sheet.onload = resize;
  sheet.src = './assets/hero/crowd.webp';
  sync();
}
startHeroMotion();
