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
  const submit = contact.querySelector('button[type="submit"]');
  let requestId;
  contact.addEventListener('input', () => {
    requestId = undefined;
    status.textContent = '';
  });
  contact.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !contact.reportValidity()) return;
    requestId ??= crypto.randomUUID();
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
      requestId = undefined;
      status.textContent = 'Thank you. The Source Lab has received your message.';
    } catch {
      status.dataset.error = 'true';
      status.textContent = 'Your message could not be confirmed. Please try again or contact the cell on Instagram.';
    } finally {
      contact.removeAttribute('aria-busy');
      submit.disabled = false;
    }
  });
}
