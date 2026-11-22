// Rechenfreunde – Rechnen mit Bildern für Zahlen von 0 bis 24
'use strict';

const MAX = 24;
const WORDS = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn',
  'zwanzig', 'einundzwanzig', 'zweiundzwanzig', 'dreiundzwanzig', 'vierundzwanzig'];

const $ = (id) => document.getElementById(id);
const rnd = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pts = (n) => (n === 1 ? 'Punkt' : 'Punkte');
// Schmaler Bildschirm (iPhone hochkant): Grafiken mit grösserer Schrift zeichnen
const isNarrow = () => window.innerWidth < 600;

/* ---------- Vorlesen ---------- */
function say(text) {
  if (!('speechSynthesis' in window)) return;
  const clean = text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/−/g, ' minus ')
    .replace(/\+/g, ' plus ')
    .replace(/=/g, ' gleich ')
    .replace(/×/g, ' mal ')
    .replace(/ : /g, ' geteilt durch ')
    .replace(/→/g, ', dann ');
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = 'de-DE';
  u.rate = 0.9;
  speechSynthesis.speak(u);
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.speak');
  if (btn) say(btn.closest('.explain').querySelector('.text').textContent);
});

/* ---------- Punktefeld: Reihen à 10, aufgeteilt in 5 + 5 ---------- */
// cells: Array mit 'a' (rot), 'b' (blau), 'x' (weggenommen) – alles andere ist leer
function renderField(el, cells, opts = {}) {
  const minRows = opts.minRows ?? 2;
  const rows = Math.max(minRows, Math.ceil(cells.length / 10));
  const prev = el._prev || [];
  el.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    for (let h = 0; h < 2; h++) {
      const half = document.createElement('div');
      half.className = 'half';
      for (let c = 0; c < 5; c++) {
        const i = r * 10 + h * 5 + c;
        const s = cells[i] || '';
        const cell = document.createElement('div');
        cell.className = 'cell ' + s;
        if (s && prev[i] !== s) cell.classList.add('pop');
        if (s === 'x') cell.textContent = '✕';
        if (opts.onCell) {
          cell.classList.add('click');
          cell.addEventListener('click', () => opts.onCell(i));
        }
        half.appendChild(cell);
      }
      row.appendChild(half);
    }
    el.appendChild(row);
  }
  el._prev = cells.slice();
}

/* ---------- Zahlenstrahl 0–24 mit Sprüngen ---------- */
function renderLine(el, { mark = null, start = null, jumps = [], onPick = null } = {}) {
  const x = (i) => 20 + i * 40;
  const base = 100;
  const narrow = isNarrow();
  const k = narrow ? 1.7 : 1; // Vergrösserung für kleine Bildschirme
  let s = `<svg viewBox="0 0 1000 ${narrow ? 160 : 140}" role="img" aria-label="Zahlenstrahl von 0 bis 24">
    <defs>
      <marker id="arr-b" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#3b82f6"/></marker>
      <marker id="arr-r" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#d9482a"/></marker>
    </defs>
    <line x1="${x(0)}" y1="${base}" x2="${x(MAX)}" y2="${base}" stroke="#2d2a32" stroke-width="3"/>`;
  for (let i = 0; i <= MAX; i++) {
    const big = i % 10 === 0, mid = i % 5 === 0;
    const t = big ? 14 : mid ? 10 : 6;
    s += `<line x1="${x(i)}" y1="${base - t}" x2="${x(i)}" y2="${base + t}" stroke="#2d2a32" stroke-width="${big ? 3 : 2}"/>`;
    // Auf dem iPhone nur jede zweite Zahl beschriften, dafür gross genug zum Lesen
    if (!narrow || i % 2 === 0) {
      s += `<text x="${x(i)}" y="${base + (narrow ? 50 : 34)}" text-anchor="middle" font-size="${(big ? 22 : 18) * k * (narrow ? 1.1 : 1)}" font-weight="${mid ? 900 : 600}" fill="${big ? '#d9482a' : '#2d2a32'}">${i}</text>`;
    }
  }
  if (start !== null) s += `<circle cx="${x(start)}" cy="${base}" r="${9 * k}" fill="#ff6b4a"/>`;
  for (const j of jumps) {
    const up = j.to > j.from;
    const h = Math.min(70, 22 + Math.abs(j.to - j.from) * 6);
    const mx = (x(j.from) + x(j.to)) / 2;
    const color = up ? '#3b82f6' : '#d9482a';
    s += `<path d="M${x(j.from)},${base - 12} Q${mx},${base - 12 - h * 2} ${x(j.to)},${base - 12}" fill="none" stroke="${color}" stroke-width="4" marker-end="url(#arr-${up ? 'b' : 'r'})"/>`;
    s += `<text x="${mx}" y="${base - 18 - h}" text-anchor="middle" font-size="${20 * k}" font-weight="900" fill="${color}">${up ? '+' : '−'}${Math.abs(j.to - j.from)}</text>`;
  }
  if (mark !== null) s += `<circle cx="${x(mark)}" cy="${base}" r="${13 * k}" fill="#22a565" stroke="#fff" stroke-width="3"/>`;
  if (onPick) {
    for (let i = 0; i <= MAX; i++) {
      s += `<g class="pick" data-n="${i}"><rect x="${x(i) - 20}" y="40" width="40" height="100" fill="transparent" rx="8"/></g>`;
    }
  }
  s += '</svg>';
  el.innerHTML = s;
  if (onPick) {
    el.querySelectorAll('.pick').forEach((g) => g.addEventListener('click', () => onPick(+g.dataset.n)));
  }
}

/* ---------- Tabs ---------- */
document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#tabs button').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.id === b.dataset.tab));
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}));

/* ======================================================
   1) Zahlen entdecken
   ====================================================== */
const discover = { n: 7 };

function renderDiscover() {
  const n = discover.n;
  $('e-num').textContent = n;
  $('e-word').textContent = n === 1 ? 'eins – ein Punkt' : `${WORDS[n]} – ${n} ${pts(n)}`;
  renderField($('e-field'), Array(n).fill('a'));

  const facts = [];
  if (n >= 10) {
    const z = Math.floor(n / 10), e = n % 10;
    facts.push(`${z} volle${z === 1 ? 'r' : ''} Zehner und ${e} Einzelne`);
  } else if (n > 5) {
    facts.push(`${n} = 5 + ${n - 5}`);
  } else if (n === 5) {
    facts.push('5 = eine Hand voll ✋');
  }
  if (n > 0) facts.push(`eins weniger: ${n - 1}`);
  if (n < MAX) facts.push(`eins mehr: ${n + 1}`);
  if (n % 10 === 0 && n > 0) facts.push(`${n} ist eine volle Zehnerzahl!`);
  else if (n < 20 || n < MAX) facts.push(`bis zur ${Math.floor(n / 10) * 10 + 10} fehlen ${10 - (n % 10)}`);
  if (n % 2 === 0 && n > 0) facts.push(`verdoppeln: ${n / 2} + ${n / 2} = ${n}`);
  $('e-facts').innerHTML = facts.map((f) => `<span class="chip">${f}</span>`).join('');

  renderLine($('e-line'), { mark: n, onPick: (k) => { discover.n = k; renderDiscover(); say(WORDS[k]); } });
  $('e-dec').disabled = n <= 0;
  $('e-inc').disabled = n >= MAX;
}
$('e-dec').addEventListener('click', () => { if (discover.n > 0) { discover.n--; renderDiscover(); say(WORDS[discover.n]); } });
$('e-inc').addEventListener('click', () => { if (discover.n < MAX) { discover.n++; renderDiscover(); say(WORDS[discover.n]); } });

/* ======================================================
   2) + 3) Plus und Minus Schritt für Schritt
   ====================================================== */
function countList(from, to) {
  const out = [];
  if (from <= to) for (let i = from; i <= to; i++) out.push(i);
  else for (let i = from; i >= to; i--) out.push(i);
  return out.join(', ');
}

function plusSteps(a, b) {
  const cells = (nb) => Array(a).fill('a').concat(Array(nb).fill('b'));
  const steps = [{ cells: cells(0), text: `Wir haben ${a} rote ${pts(a)}.`, jumps: [], mark: a }];
  if (b === 0) {
    steps.push({ cells: cells(0), text: `Plus 0 heisst: Es kommt nichts dazu. Also bleibt es ${a}. 🎉`, jumps: [], mark: a, done: true });
    return steps;
  }
  let cur = a, added = 0, split = false;
  const jumps = [];
  while (added < b) {
    const rest = b - added;
    const nextTen = Math.floor(cur / 10) * 10 + 10;
    const take = cur + rest > nextTen ? nextTen - cur : rest;
    let text;
    if (take < rest) {
      split = true;
      text = `Zuerst machen wir die ${nextTen} voll. Dafür brauchen wir ${take} blaue: ${cur} + ${take} = ${cur + take}.`;
    } else if (split) {
      text = `Von den ${b} blauen sind noch ${take} übrig: ${cur} + ${take} = ${cur + take}.`;
    } else {
      text = `Jetzt kommen ${b} blaue dazu. Wir zählen weiter: ${countList(cur + 1, cur + take)}.`;
    }
    jumps.push({ from: cur, to: cur + take });
    cur += take; added += take;
    steps.push({ cells: cells(added), text, jumps: jumps.slice(), mark: cur });
  }
  let final = `Also: ${a} + ${b} = ${a + b}. 🎉`;
  if (a + b === 10 && a > 0) final += ` ${a} und ${b} sind Zehnerfreunde!`;
  else if (split) final += ' Mit der vollen 10 ist es ganz leicht!';
  steps.push({ cells: cells(b), text: final, jumps, mark: a + b, done: true });
  return steps;
}

function minusSteps(a, b) {
  const cells = (nx) => Array(a - nx).fill('a').concat(Array(nx).fill('x'));
  const steps = [{ cells: cells(0), text: `Wir haben ${a} rote ${pts(a)}.`, jumps: [], mark: a }];
  if (b === 0) {
    steps.push({ cells: cells(0), text: `Minus 0 heisst: Wir nehmen nichts weg. Also bleibt es ${a}. 🎉`, jumps: [], mark: a, done: true });
    return steps;
  }
  let cur = a, removed = 0, split = false;
  const jumps = [];
  while (removed < b) {
    const rest = b - removed;
    const prevTen = cur % 10 === 0 ? cur - 10 : Math.floor(cur / 10) * 10;
    const take = cur - rest < prevTen ? cur - prevTen : rest;
    let text;
    if (take < rest) {
      split = true;
      text = `Zuerst nehmen wir ${take} weg, bis wir genau bei ${prevTen} sind: ${cur} − ${take} = ${cur - take}.`;
    } else if (split) {
      text = `Wir müssen noch ${take} wegnehmen: ${cur} − ${take} = ${cur - take}.`;
    } else {
      text = `Jetzt nehmen wir ${b} weg. Wir zählen rückwärts: ${countList(cur - 1, cur - take)}.`;
    }
    jumps.push({ from: cur, to: cur - take });
    cur -= take; removed += take;
    steps.push({ cells: cells(removed), text, jumps: jumps.slice(), mark: cur });
  }
  let final = `Also: ${a} − ${b} = ${a - b}. 🎉`;
  if (a === 10 && b < 10) final += ` Denn ${b} und ${a - b} sind Zehnerfreunde.`;
  final += ` Probe: ${a - b} + ${b} = ${a}.`;
  steps.push({ cells: cells(b), text: final, jumps, mark: a - b, done: true });
  return steps;
}

function makeExplorer(prefix, op) {
  const st = { a: +$(prefix + '-a').textContent, b: +$(prefix + '-b').textContent, i: 0, steps: [] };

  function clamp() {
    if (op === '+') {
      st.a = Math.max(0, Math.min(MAX, st.a));
      st.b = Math.max(0, Math.min(MAX - st.a, st.b));
    } else {
      st.a = Math.max(1, Math.min(MAX, st.a));
      st.b = Math.max(0, Math.min(st.a, st.b));
    }
  }
  function reset() {
    clamp();
    $(prefix + '-a').textContent = st.a;
    $(prefix + '-b').textContent = st.b;
    st.steps = op === '+' ? plusSteps(st.a, st.b) : minusSteps(st.a, st.b);
    st.i = 0;
    $(prefix + '-field')._prev = [];
    show();
  }
  function show() {
    const step = st.steps[st.i];
    renderField($(prefix + '-field'), step.cells);
    $(prefix + '-text').textContent = step.text;
    $(prefix + '-res').textContent = step.done ? (op === '+' ? st.a + st.b : st.a - st.b) : '?';
    renderLine($(prefix + '-line'), { start: st.a, jumps: step.jumps, mark: st.i > 0 ? step.mark : null });
    $(prefix + '-next').disabled = st.i >= st.steps.length - 1;
  }

  document.querySelectorAll(`#${op === '+' ? 'plus' : 'minus'} .stepper button`).forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.for.endsWith('-a') ? 'a' : 'b';
      st[key] += +btn.dataset.d;
      reset();
    });
  });
  $(prefix + '-next').addEventListener('click', () => {
    if (st.i < st.steps.length - 1) { st.i++; show(); say(st.steps[st.i].text); }
  });
  $(prefix + '-reset').addEventListener('click', reset);
  $(prefix + '-rand').addEventListener('click', () => {
    if (op === '+') { st.a = rnd(2, 15); st.b = rnd(2, Math.min(9, MAX - st.a)); }
    else { st.a = rnd(5, MAX); st.b = rnd(2, Math.min(9, st.a)); }
    reset();
  });
  reset();
  return show;
}

/* ======================================================
   4) Zehnerfreunde
   ====================================================== */
const friends = { n: 7, cells: [], found: new Set(), solved: false };

function newFriend() {
  let n;
  const open = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((k) => !friends.found.has(k));
  const pool = open.length ? open : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  do { n = pool[rnd(0, pool.length - 1)]; } while (pool.length > 1 && n === friends.n);
  friends.n = n;
  friends.cells = Array(n).fill('a').concat(Array(10 - n).fill(''));
  friends.solved = false;
  $('f-field')._prev = [];
  $('f-text').textContent = `Hier sind ${n} rote ${pts(n)}. Tippe auf die leeren Kreise, bis die 10 voll ist!`;
  renderFriends();
}

function renderFriends() {
  const blue = friends.cells.filter((c) => c === 'b').length;
  $('f-eq').innerHTML = `<span style="color:var(--red-dark)">${friends.n}</span> + <span style="color:var(--blue-dark)">${blue}</span> = ${friends.n + blue}`;
  renderField($('f-field'), friends.cells, {
    minRows: 1,
    onCell: (i) => {
      if (friends.solved || i < friends.n) return;
      friends.cells[i] = friends.cells[i] === 'b' ? '' : 'b';
      checkFriends();
      renderFriends();
    },
  });
  $('f-list').innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) =>
    `<div class="friend ${friends.found.has(k) ? 'found' : ''}">${friends.found.has(k) ? `${k} + ${10 - k}` : '? + ?'}</div>`).join('');
}

function checkFriends() {
  const blue = friends.cells.filter((c) => c === 'b').length;
  if (friends.n + blue === 10) {
    friends.solved = true;
    friends.found.add(friends.n);
    const all = friends.found.size === 9 ? ' Du hast alle Zehnerfreunde gefunden! 🏆' : '';
    $('f-text').textContent = `Super! ${friends.n} + ${blue} = 10. ${friends.n} und ${blue} sind Zehnerfreunde! 🎉${all}`;
    say($('f-text').textContent);
  }
}
$('f-new').addEventListener('click', newFriend);

/* ======================================================
   5) Üben
   ====================================================== */
const practice = { type: 'plus', range: 10, a: 0, b: 0, op: '+', stars: 0, streak: 0, locked: false };
try { practice.stars = +localStorage.getItem('rechenfreunde-stars') || 0; } catch (e) { /* ohne Speicher */ }

function setupToggle(id, key, conv) {
  $(id).querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    $(id).querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    practice[key] = conv(b.dataset.v);
    newTask();
  }));
}
setupToggle('u-type', 'type', (v) => v);
setupToggle('u-range', 'range', (v) => +v);

function newTask() {
  const M = practice.range;
  const op = practice.type === 'mix' ? (Math.random() < 0.5 ? '+' : '−') : practice.type === 'plus' ? '+' : '−';
  let a, b;
  do {
    if (op === '+') { a = rnd(1, M - 1); b = rnd(1, M - a); }
    else { a = rnd(2, M); b = rnd(1, a - 1); }
  } while (a === practice.a && b === practice.b);
  Object.assign(practice, { a, b, op, locked: false });
  $('u-task').textContent = `${a} ${op} ${b} = ?`;
  $('u-feedback').textContent = '';
  $('u-feedback').className = 'feedback';
  $('u-help').hidden = true;
  $('u-pad').innerHTML = '';
  for (let i = 0; i <= M; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.addEventListener('click', () => answer(i, btn));
    $('u-pad').appendChild(btn);
  }
  renderScore();
}

function answer(n, btn) {
  if (practice.locked) return;
  const { a, b, op } = practice;
  const right = op === '+' ? a + b : a - b;
  if (n === right) {
    practice.locked = true;
    practice.stars++;
    practice.streak++;
    try { localStorage.setItem('rechenfreunde-stars', practice.stars); } catch (e) { /* ohne Speicher */ }
    btn.classList.add('right');
    $('u-task').textContent = `${a} ${op} ${b} = ${right}`;
    const praise = ['Richtig! ⭐', 'Super gemacht! ⭐', 'Toll! ⭐', 'Genau! ⭐', 'Prima! ⭐'];
    $('u-feedback').textContent = practice.streak >= 3 ? `${practice.streak} richtig hintereinander! 🔥` : praise[rnd(0, praise.length - 1)];
    $('u-feedback').className = 'feedback good';
    renderScore();
    setTimeout(newTask, 1500);
  } else {
    practice.streak = 0;
    btn.classList.remove('wrong');
    void btn.offsetWidth; // Animation neu starten
    btn.classList.add('wrong');
    $('u-feedback').textContent = 'Noch nicht ganz. Schau dir die Punkte an und zähle nach! 👀';
    $('u-feedback').className = 'feedback bad';
    showHelp();
    renderScore();
  }
}

function showHelp() {
  const { a, b, op } = practice;
  $('u-help').hidden = false;
  $('u-field')._prev = [];
  if (op === '+') {
    renderField($('u-field'), Array(a).fill('a').concat(Array(b).fill('b')));
    renderLine($('u-line'), { start: a, jumps: plusSteps(a, b).at(-1).jumps });
  } else {
    renderField($('u-field'), Array(a - b).fill('a').concat(Array(b).fill('x')));
    renderLine($('u-line'), { start: a, jumps: minusSteps(a, b).at(-1).jumps });
  }
}

function renderScore() {
  $('u-stars').textContent = `⭐ ${practice.stars}`;
  $('u-streak').textContent = practice.streak >= 2 ? `🔥 ${practice.streak}` : '';
}
$('u-tip').addEventListener('click', showHelp);
$('u-skip').addEventListener('click', () => { practice.streak = 0; newTask(); });

/* ======================================================
   6) Zahlen-Golf – Rechenrätsel für Fortgeschrittene
   ====================================================== */
const SYM = { '+': '+', '-': '−', '*': '×', '/': ':' };
const clubLabel = (c) => `${SYM[c.t]}${c.n}`;
const calcText = (a, c, r) => `${a} ${SYM[c.t]} ${c.n} = ${r}`;

function applyClub(v, c) {
  switch (c.t) {
    case '+': return v + c.n;
    case '-': return v - c.n;
    case '*': return v * c.n;
    case '/': return v % c.n === 0 ? v / c.n : null;
  }
  return null;
}

// Kürzeste Wege suchen (Breitensuche); Wasser und Aus sind verboten
function golfSearch(start, clubs, max, water) {
  const dist = new Map([[start, 0]]);
  const prev = new Map();
  const queue = [start];
  while (queue.length) {
    const v = queue.shift();
    const d = dist.get(v);
    if (d >= 8) continue;
    clubs.forEach((c, ci) => {
      const w = applyClub(v, c);
      if (w === null || w < 0 || w > max || water.includes(w) || dist.has(w)) return;
      dist.set(w, d + 1);
      prev.set(w, { from: v, ci });
      queue.push(w);
    });
  }
  return { dist, prev };
}

function golfPath(res, target) {
  const steps = [];
  let v = target;
  while (res.prev.has(v)) {
    const p = res.prev.get(v);
    steps.unshift({ from: p.from, to: v, ci: p.ci });
    v = p.from;
  }
  return steps;
}

function pickClubs(lvl) {
  if (lvl === 1) {
    return [
      { t: '+', n: rnd(16, 30), name: 'Driver' },
      { t: '+', n: rnd(5, 14), name: 'Eisen' },
      { t: '-', n: rnd(3, 9), name: 'Wedge' },
    ];
  }
  if (lvl === 2) {
    return [
      { t: '*', n: 2, name: 'Holz' },
      { t: '+', n: rnd(3, 13), name: 'Eisen' },
      { t: '-', n: rnd(2, 9), name: 'Wedge' },
      { t: '/', n: 2, name: 'Chip' },
    ];
  }
  return [
    { t: '*', n: 3, name: 'Driver' },
    { t: '+', n: rnd(5, 25), name: 'Eisen' },
    { t: '-', n: rnd(3, 15), name: 'Wedge' },
    { t: '/', n: [2, 4, 5][rnd(0, 2)], name: 'Chip' },
  ];
}

function genHole(h) {
  const lvl = h <= 3 ? 1 : h <= 6 ? 2 : 3;
  const max = [0, 100, 200, 500][lvl];
  const [minD, maxD] = [[0, 0], [3, 4], [3, 5], [4, 6]][lvl];
  for (let t = 0; t < 3000; t++) {
    const clubs = pickClubs(lvl);
    const start = rnd(1, [0, 20, 30, 60][lvl]);
    const water = [];
    let res = golfSearch(start, clubs, max, water);
    const cands = [...res.dist].filter(([, d]) => d >= minD && d <= maxD).map(([v]) => v);
    if (!cands.length) continue;
    const target = cands[rnd(0, cands.length - 1)];
    // Wasser genau auf den kürzesten Weg legen, damit man umdenken muss
    for (let k = 0; k < lvl - 1; k++) {
      const mids = golfPath(res, target).slice(0, -1).map((s) => s.to);
      if (!mids.length) break;
      water.push(mids[rnd(0, mids.length - 1)]);
      res = golfSearch(start, clubs, max, water);
      if (!res.dist.has(target)) break;
    }
    if (!res.dist.has(target) || res.dist.get(target) > maxD + 1) continue;
    const opt = res.dist.get(target);
    return { lvl, max, clubs, start, target, water, opt, par: opt + 1 };
  }
  // Notfall (sollte praktisch nie passieren)
  return { lvl: 1, max: 100, clubs: [{ t: '+', n: 10, name: 'Eisen' }, { t: '-', n: 1, name: 'Putter' }], start: 5, target: 34, water: [], opt: 5, par: 6 };
}

const golf = { holes: [], hole: 1, h: null, ball: 0, strokes: 0, hist: [], done: false, tip: null, hinted: false, card: [] };

function scoreName(diff) {
  const names = { '-3': 'Albatros', '-2': 'Eagle', '-1': 'Birdie', 0: 'Par', 1: 'Bogey', 2: 'Doppel-Bogey' };
  return names[diff] ?? `${diff} über Par`;
}
const fmtDiff = (d) => (d === 0 ? '±0' : d > 0 ? `+${d}` : `${d}`);
const roundDiff = () => golf.card.reduce((s, c) => s + (c ? c.strokes - c.par : 0), 0);

function startRound() {
  golf.holes = Array.from({ length: 9 }, (_, i) => genHole(i + 1));
  golf.card = [];
  golf.hole = 1;
  loadHole();
}

function loadHole() {
  const h = golf.h = golf.holes[golf.hole - 1];
  Object.assign(golf, { ball: h.start, strokes: 0, hist: [], done: false, tip: null, hinted: false });
  let intro = `Loch ${golf.hole}: Bring den Ball von ${h.start} genau auf ${h.target}. Par ist ${h.par}.`;
  if (golf.hole === 4) intro = `Neu ab Loch 4: Schläger mit × und : und Wasser 💦! ` + intro;
  if (golf.hole === 7) intro = `Die Profi-Löcher: Der Platz geht jetzt bis ${h.max}! ` + intro;
  if (h.water.length) intro += ` Achtung Wasser auf ${h.water.join(' und ')}.`;
  $('g-text').textContent = intro;
  $('g-next').hidden = true;
  renderGolf();
}

function hit(ci) {
  if (golf.done) return;
  const h = golf.h, c = h.clubs[ci];
  const r = applyClub(golf.ball, c);
  if (r === null) return;
  golf.strokes++;
  golf.tip = null;
  let text;
  if (r < 0 || r > h.max) {
    golf.strokes++;
    golf.hist.push({ from: golf.ball, to: r, kind: 'ob' });
    text = `🚫 Aus! ${calcText(golf.ball, c, r)}, das ist ausserhalb vom Platz (0 bis ${h.max}). 1 Strafschlag, nochmal von ${golf.ball}.`;
  } else if (h.water.includes(r)) {
    golf.strokes++;
    golf.hist.push({ from: golf.ball, to: r, kind: 'water' });
    text = `💦 Platsch! ${calcText(golf.ball, c, r)}, genau ins Wasser. 1 Strafschlag, nochmal von ${golf.ball}.`;
  } else {
    golf.hist.push({ from: golf.ball, to: r, kind: 'ok' });
    text = `${calcText(golf.ball, c, r)}.`;
    golf.ball = r;
    if (r === h.target) { finishHole(); return; }
    text += ` Noch ${Math.abs(h.target - r)} bis zum Loch.`;
  }
  if (golf.strokes >= h.par + 5) {
    golf.done = true;
    golf.card[golf.hole - 1] = { par: h.par, strokes: h.par + 5, hint: golf.hinted };
    text += ` Ball aufgehoben, dieses Loch war knifflig! So wäre es gegangen: ${solutionText()}.`;
    afterHole();
  }
  $('g-text').textContent = text;
  renderGolf();
}

function solutionText() {
  const h = golf.h;
  return golfPath(golfSearch(h.start, h.clubs, h.max, h.water), h.target)
    .map((s) => calcText(s.from, h.clubs[s.ci], s.to)).join(' → ');
}

function finishHole() {
  const h = golf.h;
  golf.done = true;
  golf.card[golf.hole - 1] = { par: h.par, strokes: golf.strokes, hint: golf.hinted };
  const diff = golf.strokes - h.par;
  let t = `⛳ Eingelocht mit ${golf.strokes} ${golf.strokes === 1 ? 'Schlag' : 'Schlägen'}: ${scoreName(diff)}!`;
  if (diff < 0) t += ' 🐦';
  if (golf.strokes === h.opt) t += ' Das war der kürzeste Weg, perfekt gerechnet!';
  else t += ` Der kürzeste Weg hat ${h.opt} Schläge: ${solutionText()}.`;
  $('g-text').textContent = t;
  afterHole();
  if (golf.hole === 9) $('g-text').textContent += ` Runde fertig: ${fmtDiff(roundDiff())}.`;
  say($('g-text').textContent);
  renderGolf();
}

function afterHole() {
  $('g-next').hidden = false;
  if (golf.hole === 9) {
    $('g-next').textContent = 'Neue Runde ▶';
    try {
      const best = localStorage.getItem('rechenfreunde-golf-best');
      if (best === null || roundDiff() < +best) localStorage.setItem('rechenfreunde-golf-best', roundDiff());
    } catch (e) { /* ohne Speicher */ }
  } else {
    $('g-next').textContent = 'Nächstes Loch ▶';
  }
}

function renderGolf() {
  const h = golf.h;
  $('g-hole').textContent = `${golf.hole}/9`;
  $('g-par').textContent = h.par;
  $('g-strokes').textContent = golf.strokes;
  $('g-total').textContent = fmtDiff(roundDiff());
  $('g-ball').textContent = golf.ball;
  $('g-target').textContent = h.target;
  $('g-dist').textContent = Math.abs(h.target - golf.ball);
  renderCourse();

  const el = $('g-clubs');
  el.innerHTML = '';
  h.clubs.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'club' + (golf.tip === i ? ' tip' : '');
    b.innerHTML = `<small>${c.name}</small><b>${clubLabel(c)}</b>`;
    const r = applyClub(golf.ball, c);
    b.disabled = golf.done || r === null;
    if (r === null && !golf.done) b.title = `${golf.ball} : ${c.n} geht nicht auf`;
    b.addEventListener('click', () => hit(i));
    el.appendChild(b);
  });
  $('g-hint').disabled = golf.done;

  // Scorekarte
  let head = '<tr><th>Loch</th>', par = '<tr><th>Par</th>', me = '<tr><th>Du</th>';
  let sumPar = 0, sumMe = 0;
  for (let i = 0; i < 9; i++) {
    const hh = golf.holes[i], c = golf.card[i];
    const cur = i === golf.hole - 1 ? ' class="cur"' : '';
    head += `<th>${i + 1}</th>`;
    par += `<td>${hh.par}</td>`;
    if (c) {
      const d = c.strokes - c.par;
      const cls = d < 0 ? 's-birdie' : d === 0 ? 's-par' : d === 1 ? 's-bogey' : 's-worse';
      me += `<td class="${cls}" title="${scoreName(d)}">${c.strokes}${c.hint ? '<sup>🧢</sup>' : ''}</td>`;
      sumPar += c.par; sumMe += c.strokes;
    } else {
      me += `<td${cur}></td>`;
    }
  }
  head += '<th>Σ</th></tr>';
  par += `<td><b>${golf.holes.reduce((s, x) => s + x.par, 0)}</b></td></tr>`;
  me += `<td><b>${sumMe || ''}</b></td></tr>`;
  $('g-card').innerHTML = head + par + me;
  try {
    const best = localStorage.getItem('rechenfreunde-golf-best');
    $('g-best').textContent = best !== null ? `🏆 Beste Runde bisher: ${fmtDiff(+best)}` : '';
  } catch (e) { /* ohne Speicher */ }
}

function renderCourse() {
  const h = golf.h, max = h.max, base = 150;
  const narrow = isNarrow();
  const f = narrow ? 2 : 1; // Vergrösserung für kleine Bildschirme
  const H = narrow ? 250 : 220;
  const X = (v) => 40 + Math.max(-0.03, Math.min(1.03, v / max)) * 920;
  let s = `<svg viewBox="0 0 1000 ${H}" role="img" aria-label="Golfplatz von 0 bis ${max}">
    <rect width="1000" height="${H}" fill="#6fbf69"/>
    <rect y="100" width="1000" height="85" fill="#93d686"/>`;
  for (let i = 0; i < 10; i++) s += `<rect x="${i * 100}" y="100" width="50" height="85" fill="rgba(255,255,255,.10)"/>`;
  const parts = narrow ? 2 : 4;
  for (let k = 0; k <= parts; k++) {
    const v = (max * k) / parts;
    s += `<line x1="${X(v)}" y1="186" x2="${X(v)}" y2="194" stroke="#1f5a2c" stroke-width="3"/>
      <text x="${X(v)}" y="${narrow ? 236 : 214}" text-anchor="middle" font-size="${18 * f}" font-weight="900" fill="#1f5a2c">${v}</text>`;
  }
  for (const w of h.water) {
    s += `<ellipse cx="${X(w)}" cy="${base}" rx="${28 * (narrow ? 1.6 : 1)}" ry="${15 * (narrow ? 1.6 : 1)}" fill="#4aa3e8" stroke="#2b7cc0" stroke-width="3"/>
      <text x="${X(w)}" y="${base + 6 * f}" text-anchor="middle" font-size="${16 * f}" font-weight="900" fill="#fff">${w}</text>`;
  }
  s += `<rect x="${X(h.start) - 12 * f}" y="${base + 8}" width="${24 * f}" height="${8 * f}" rx="3" fill="#fff"/>`;
  if (!narrow) s += `<text x="${X(h.start)}" y="${base + 34}" text-anchor="middle" font-size="16" font-weight="700" fill="#1f5a2c">Start ${h.start}</text>`;
  const fx = X(h.target);
  const fh = 72 * (narrow ? 1.2 : 1);
  s += `<ellipse cx="${fx}" cy="${base}" rx="${11 * f}" ry="${5 * f}" fill="#222"/>
    <line x1="${fx}" y1="${base}" x2="${fx}" y2="${base - fh}" stroke="#444" stroke-width="${4 * f}"/>
    <polygon points="${fx},${base - fh} ${fx + 38 * f},${base - fh + 12 * f} ${fx},${base - fh + 24 * f}" fill="#ff4a3d"/>
    <text x="${fx}" y="${base - fh - 8}" text-anchor="middle" font-size="${24 * f}" font-weight="900" fill="#fff" stroke="#1f5a2c" stroke-width="4" paint-order="stroke">${h.target}</text>`;
  let lastPath = null;
  golf.hist.forEach((m, i) => {
    const x1 = X(m.from), x2 = X(m.to);
    const hgt = Math.min(110, 20 + Math.abs(x2 - x1) * 0.25);
    const d = `M${x1},${base} Q${(x1 + x2) / 2},${base - 2 * hgt} ${x2},${base}`;
    const color = m.kind === 'ok' ? '#ffffff' : m.kind === 'water' ? '#2b7cc0' : '#d9482a';
    const last = i === golf.hist.length - 1;
    s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${3 * f}" stroke-dasharray="${8 * f} ${7 * f}" opacity="${last ? 1 : 0.55}"/>`;
    if (m.kind === 'water') s += `<text x="${x2}" y="${base - 22 * f}" text-anchor="middle" font-size="${26 * f}">💦</text>`;
    if (m.kind === 'ob') s += `<text x="${x2}" y="${base - 12 * f}" text-anchor="middle" font-size="${26 * f}">🚫</text>`;
    if (last && m.kind === 'ok') lastPath = d;
  });
  const br = 10 * (narrow ? 1.7 : 1);
  if (lastPath) {
    s += `<circle r="${br}" fill="#fff" stroke="#333" stroke-width="2"><animateMotion dur="0.7s" fill="freeze" path="${lastPath}"/></circle>`;
  } else {
    s += `<circle cx="${X(golf.ball)}" cy="${base}" r="${br}" fill="#fff" stroke="#333" stroke-width="2"/>`;
  }
  s += '</svg>';
  $('g-course').innerHTML = s;
}

$('g-hint').addEventListener('click', () => {
  const h = golf.h;
  const res = golfSearch(golf.ball, h.clubs, h.max, h.water);
  if (!res.dist.has(h.target)) {
    $('g-text').textContent = '🧢 Caddie: Von hier wird es sehr schwierig. Starte das Loch lieber neu.';
  } else {
    const first = golfPath(res, h.target)[0];
    const c = h.clubs[first.ci];
    const rest = res.dist.get(h.target) - 1;
    golf.tip = first.ci;
    golf.hinted = true;
    $('g-text').textContent = `🧢 Caddie: Nimm den ${c.name} ${clubLabel(c)}. ` +
      (rest === 0 ? 'Damit bist du direkt im Loch!' : `Danach brauchst du noch ${rest} ${rest === 1 ? 'Schlag' : 'Schläge'}.`);
  }
  renderGolf();
});
$('g-retry').addEventListener('click', () => { if (!golf.done) loadHole(); });
$('g-next').addEventListener('click', () => {
  if (golf.hole === 9) startRound();
  else { golf.hole++; loadHole(); }
});
$('g-newround').addEventListener('click', startRound);

/* ---------- Start ---------- */
renderDiscover();
const explorers = [makeExplorer('p', '+'), makeExplorer('m', '−')];
newFriend();
newTask();
startRound();

// Bei Drehen des Geräts oder Grössenänderung Zahlenstrahl und Golfplatz neu zeichnen
let wasNarrow = isNarrow();
window.addEventListener('resize', () => {
  if (isNarrow() === wasNarrow) return;
  wasNarrow = isNarrow();
  renderDiscover();
  explorers.forEach((show) => show());
  renderGolf();
  if (!$('u-help').hidden) showHelp();
});

// Offline-Modus (nur über https oder localhost möglich)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* ohne Offline-Modus */ });
}
