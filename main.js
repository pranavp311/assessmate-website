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

function textMsg(text, flag) {
  const row = el('<div class="a-row"></div>');
  if (flag) row.appendChild(el('<span class="flag" aria-hidden="true">!</span>'));
  const t = el('<div class="a-text"></div>');
  t.textContent = text;
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
function reply(text, flag) {
  const typing = push(el('<div class="typing" role="status" aria-label="Assessmate is writing"><span></span><span></span><span></span></div>'));
  setTimeout(() => {
    typing.remove();
    textMsg(text, flag);
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
  reply('This is a demo, so I can only answer the suggested questions. Book a demo to try Assessmate on your own cases.', false);
}

sendBtn.addEventListener('click', send);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });

userMsg('Draft the areas of need for Mei Lin.', true);
draftMsg();
renderChips();
