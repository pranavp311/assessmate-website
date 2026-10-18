// Show the compact top bar once the hero's own header has faded or scrolled away.
// On wide screens the hero header stays in the sticky stage while it fades, so this
// goes by scroll distance rather than visibility.
const topbar = document.querySelector('.topbar');
if (topbar) {
  topbar.hidden = false;
  let ticking = false;
  const update = () => {
    const on = window.scrollY > 320;
    topbar.classList.toggle('is-on', on);
    topbar.inert = !on;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

// Hero zoom: as the tall hero scrolls past, seek each paused CSS animation to the matching
// point. Driven from here rather than animation-timeline, which some browsers leave stale
// when scrolling back up.
const hero = document.querySelector('.hero');
if (hero) {
  const live = window.matchMedia('(min-width: 1000px) and (prefers-reduced-motion: no-preference)');
  // Each animation's share of the scroll run, as [start, end] fractions.
  const ranges = { text: [0, 0.25], win: [0, 1], dim: [0.35, 0.7], cap: [0.5, 0.7] };
  const clamp = (v) => Math.min(Math.max(v, 0), 0.9999);
  let pending = false;
  const frame = () => {
    pending = false;
    if (!live.matches) return;
    const run = hero.offsetHeight - window.innerHeight;
    const p = run > 0 ? clamp(-hero.getBoundingClientRect().top / run) : 0;
    for (const [k, [a, b]] of Object.entries(ranges)) {
      hero.style.setProperty('--p-' + k, clamp((p - a) / (b - a)).toFixed(4));
    }
  };
  const queue = () => { if (!pending) { pending = true; requestAnimationFrame(frame); } };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  live.addEventListener('change', queue);
  frame();
}

// Demo chat in the hero panel. Static content; nothing is sent anywhere.
const chat = document.querySelector('.chat');
const chipsEl = document.querySelector('.chips');
const input = document.querySelector('.composer input');
const sendBtn = document.querySelector('.composer .send');

const SHEET_ICON = '<span class="src src-sheet" aria-hidden="true"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="2"></rect><path d="M4 10h16M4 15h16M10 4v16"></path></svg></span>';
const NOTE_ICON = '<span class="src src-note" aria-hidden="true"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 4h9l4 4v12H6z"></path><path d="M9 12h7M9 16h5"></path></svg></span>';
const PLUS = 'M12 5v14M5 12h14';
const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

const CHIPS = [
  { label: "What's missing?", flag: false,
    reply: "There isn't enough on social interaction yet. Only one session mentions it. Add another observation and I'll draft that part too." },
  { label: 'Check fine motor skills', flag: true,
    reply: 'Poor fine motor skills: 1 out of 5 with quadrupod grasp. Occupational therapy needs your supervisor to sign off, so I have flagged it for them.' }
];

let added = false;

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

// .chat uses column-reverse, so new messages are prepended to stay at the bottom.
function push(node) {
  const wrap = document.createElement('div');
  wrap.className = 'msg';
  wrap.appendChild(node);
  chat.prepend(wrap);
  return wrap;
}

function userMsg(text, files) {
  const box = el('<div class="u-wrap"></div>');
  if (files) {
    box.appendChild(el(`<div class="files"><span class="file">${SHEET_ICON}Assessment sheet</span><span class="file">${NOTE_ICON}Observation notes</span></div>`));
  }
  const bubble = el('<div class="u-bubble"></div>');
  bubble.textContent = text;
  box.appendChild(bubble);
  push(box);
}

function textMsg(text, flag, link) {
  const row = el('<div class="a-row"></div>');
  if (flag) row.appendChild(el('<span class="flag" aria-hidden="true">!</span>'));
  const t = el('<div class="a-text"></div>');
  t.textContent = text;
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.label;
    t.append(' ', a);
  }
  row.appendChild(t);
  push(row);
}

function draftMsg() {
  const node = el(`
    <div class="a-draft">
      <div class="a-text">Here's a draft from her scores and your notes.</div>
      <div class="draft">
        <p class="draft-p"><strong>Expressive language.</strong> Mei Lin scored 8 out of 20 for vocabulary <span class="num">1</span> and uses two to three word phrases when asking for things <span class="num">2</span>. Speech and language therapy is recommended.</p>
        <div class="srcs">
          <div class="srcrow"><span class="num">1</span>${SHEET_ICON}Assessment sheet<b>Vocabulary 8/20</b></div>
          <div class="srcrow"><span class="num">2</span>${NOTE_ICON}Your notes<b>Session 2</b></div>
        </div>
        <button class="add" type="button" data-done="false"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PLUS}"></path></svg><span>Add to casenote</span></button>
      </div>
    </div>`);
  const btn = node.querySelector('.add');
  btn.addEventListener('click', () => {
    if (added) return;
    added = true;
    btn.dataset.done = 'true';
    btn.disabled = true;
    btn.querySelector('path').setAttribute('d', CHECK);
    btn.querySelector('span').textContent = 'Added to your casenote';
  });
  push(node);
}

// Each reply owns its typing indicator and timeout, so overlapping questions both resolve.
function reply(text, flag, link) {
  const typing = push(el('<div class="typing" role="status" aria-label="Assessmate is writing"><span></span><span></span><span></span></div>'));
  setTimeout(() => {
    typing.remove();
    textMsg(text, flag, link);
  }, 1100);
}

function renderChips() {
  chipsEl.innerHTML = '';
  CHIPS.forEach((c) => {
    if (c.used) return;
    const b = el('<button class="chip-btn" type="button"></button>');
    b.textContent = c.label;
    b.addEventListener('click', () => {
      c.used = true;
      renderChips();
      userMsg(c.label);
      reply(c.reply, c.flag);
    });
    chipsEl.appendChild(b);
  });
}

function send() {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  userMsg(text);
  reply('This is a demo, so I can only answer the suggested questions.', false,
    { href: 'mailto:pranavpappu@u.nus.edu?subject=Assessmate%20demo', label: 'Book a demo to try it on your own cases.' });
}

sendBtn.addEventListener('click', send);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

userMsg('Draft the areas of need for Mei Lin.', true);
draftMsg();
renderChips();

// Feature showcase: on wide screens the stage sticks while the section scrolls past,
// and the slide shown follows how far through the section the reader is.
const showcase = document.querySelector('.showcase');
if (showcase) {
  const tabs = [...showcase.querySelectorAll('.feat-tab')];
  const slides = [...showcase.querySelectorAll('.feat-slide')];
  const stage = showcase.querySelector('.showcase-stage');
  const wide = window.matchMedia('(min-width: 1000px)');
  let current = -1;

  const setActive = (i) => {
    if (i === current) return;
    current = i;
    tabs.forEach((t, k) => {
      if (k === i) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    slides.forEach((s, k) => {
      s.classList.toggle('is-on', k === i);
      s.inert = k !== i;
    });
  };

  // How far the reader is through the sticky run, 0 to 1.
  const progress = () => {
    const run = showcase.offsetHeight - stage.offsetHeight;
    const top = -showcase.getBoundingClientRect().top;
    return Math.min(Math.max(top / run, 0), 0.9999);
  };

  let queued = false;
  const update = () => {
    queued = false;
    if (!wide.matches) return;
    setActive(Math.floor(progress() * slides.length));
  };

  // On phones every slide is shown in turn, so none is hidden.
  const reset = () => {
    if (wide.matches) { current = -1; update(); return; }
    slides.forEach((s) => { s.classList.add('is-on'); s.inert = false; });
  };

  window.addEventListener('scroll', () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  // Clicking a feature scrolls to the middle of its stretch of the section.
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  tabs.forEach((t, k) => t.addEventListener('click', () => {
    if (!wide.matches) return;
    const run = showcase.offsetHeight - stage.offsetHeight;
    const top = showcase.getBoundingClientRect().top + window.scrollY + run * (k + 0.5) / slides.length;
    window.scrollTo({ top, behavior: still.matches ? 'auto' : 'smooth' });
  }));

  wide.addEventListener('change', reset);
  reset();
}

// FAQ: animate each answer open and closed instead of snapping.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.qa').forEach((item) => {
  const summary = item.querySelector('summary');
  const body = item.querySelector('.qa-body');
  let anim = null;
  let closing = false;
  summary.addEventListener('click', (e) => {
    if (reduceMotion.matches || !body.animate) return;
    e.preventDefault();
    // A closed <details> can still report its content's height, so start closed answers at 0.
    const from = item.open ? body.getBoundingClientRect().height : 0;
    if (anim) anim.cancel();
    if (!item.open || closing) {
      closing = false;
      item.classList.remove('is-closing');
      item.open = true;
      const to = body.scrollHeight;
      anim = body.animate([{ height: from + 'px', opacity: from ? 1 : 0 }, { height: to + 'px', opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(.25, .8, .25, 1)' });
    } else {
      closing = true;
      item.classList.add('is-closing');
      anim = body.animate([{ height: from + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: 220, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
      const done = anim;
      done.onfinish = () => { item.open = false; closing = false; item.classList.remove('is-closing'); done.cancel(); };
    }
  });
});
