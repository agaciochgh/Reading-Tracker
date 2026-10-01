/* Reading Quest — a reading tracker for kids.
 * Everything lives in localStorage on this device; Parent settings can export/import a backup. */
'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const STORE_KEY = 'reading-quest-v1';
const APP_VERSION = '2026-10-01.3'; // bump with each release so parents can see which version a device runs
const AVATARS = ['🦊', '🐼', '🦄', '🐸', '🐯', '🐙', '🦖', '🐧', '🐨', '🦁', '🐰', '🚀', '🐶', '🐱', '🦋', '🐲', '🌟', '🧚'];
const COLORS = ['#7c5cff', '#ff5c8a', '#ff8a3d', '#12b886', '#339af0', '#e64980', '#f59f00', '#15aabf'];
const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FORMATS = { print: ['📖', 'Physical book'], ebook: ['📱', 'Digital book'], audio: ['🎧', 'Audiobook'] };
const formatChips = (current, key) => Object.entries(FORMATS).map(([id, [icon, label]]) =>
  `<button type="button" class="choice ${current === id ? 'on' : ''}" data-action="draft" data-key="${key}" data-val="${id}">${icon} ${label}</button>`).join('');
const CHEERS = ['Awesome!', 'Great job!', 'Super reader!', 'Way to go!', 'Fantastic!', 'You rock!', 'Brilliant!'];

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  books: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h13"/><path d="M9 7h6"/></svg>',
  badges: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/></svg>',
  stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const hueOf = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
/** Monday of the week containing d (weeks run Monday to Sunday). */
const weekStart = (d = new Date()) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -((d.getDay() + 6) % 7));
const dailyGoalOf = (k) => k.dailyGoal || 20;
const weeklyGoalOf = (k) => k.weeklyGoal || dailyGoalOf(k) * 5;
const WEEKLY_PRESETS = [60, 90, 120, 150, 180, 240, 300];
const WEEKLY_MIN = 10;
const WEEKLY_MAX = 3000;
/** "2h 15m a week: about 27 min a day if they read 5 days a week." */
function weeklyHint(value) {
  const m = Math.round(Number(value));
  if (!(m >= WEEKLY_MIN && m <= WEEKLY_MAX)) return `Type a number of minutes between ${WEEKLY_MIN} and ${WEEKLY_MAX.toLocaleString()}.`;
  return `${fmtMinutes(m)} a week: about <b>${Math.round(m / 5)} min a day</b> if they read 5 days a week (${Math.round(m / 7)} min if every day). Weeks run Monday to Sunday.`;
}
const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m}m`);
const fmtDate = (k) => {
  const today = dayKey();
  if (k === today) return 'Today';
  if (k === dayKey(addDays(new Date(), -1))) return 'Yesterday';
  return parseKey(k).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
function blankState() {
  return { version: 1, kids: [], books: [], sessions: [], settings: {}, activeKidId: null, timer: null };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return blankState();
    return normalize(JSON.parse(raw));
  } catch {
    return blankState();
  }
}

function normalize(s) {
  const base = blankState();
  if (!s || typeof s !== 'object') return base;
  return {
    ...base,
    ...s,
    kids: Array.isArray(s.kids) ? s.kids : [],
    books: Array.isArray(s.books) ? s.books : [],
    sessions: Array.isArray(s.sessions) ? s.sessions : [],
    settings: s.settings && typeof s.settings === 'object' ? s.settings : {},
  };
}

let state = load();
// With several readers sharing a device, start on "Who's reading?".
const ui = {
  tab: 'home', bookFilter: 'reading', picking: state.kids.length > 1, modal: null,
  statsRange: 'week', statsOffset: 0,
  parentOpen: false, // true while Parent settings (or one of its sub-screens) is unlocked
};

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  Sync.push();
}

const kid = () => state.kids.find((k) => k.id === state.activeKidId) || null;
const kidBooks = (kidId) => state.books.filter((b) => b.kidId === kidId);
const kidSessions = (kidId) => state.sessions.filter((s) => s.kidId === kidId);
const bookById = (id) => state.books.find((b) => b.id === id) || null;

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------
function minutesByDay(kidId) {
  const map = {};
  for (const s of kidSessions(kidId)) map[s.date] = (map[s.date] || 0) + (s.minutes || 0);
  return map;
}

function currentStreak(byDay) {
  let d = new Date();
  if (!byDay[dayKey(d)]) d = addDays(d, -1); // today not read yet: streak is still alive from yesterday
  let n = 0;
  while (byDay[dayKey(d)] > 0) { n++; d = addDays(d, -1); }
  return n;
}

function bestStreak(byDay) {
  const days = Object.keys(byDay).filter((k) => byDay[k] > 0).sort();
  let best = 0, run = 0, prev = null;
  for (const k of days) {
    run = prev && dayKey(addDays(parseKey(prev), 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

function statsFor(k) {
  const sessions = kidSessions(k.id);
  const books = kidBooks(k.id);
  const byDay = minutesByDay(k.id);
  const finished = books.filter((b) => b.status === 'finished');
  const weekendDays = new Set();
  const byWeek = {};
  for (const d of Object.keys(byDay)) {
    const dt = parseKey(d);
    if (dt.getDay() === 6 && byDay[dayKey(addDays(dt, 1))]) weekendDays.add(d);
    const wk = dayKey(weekStart(dt));
    byWeek[wk] = (byWeek[wk] || 0) + byDay[d];
  }
  return {
    byDay,
    sessions: sessions.length,
    minutes: sessions.reduce((a, s) => a + (s.minutes || 0), 0),
    pages: sessions.reduce((a, s) => a + (s.pages || 0), 0),
    booksFinished: finished.length,
    fiveStars: finished.filter((b) => b.rating === 5).length,
    streak: currentStreak(byDay),
    bestStreak: bestStreak(byDay),
    maxDay: Math.max(0, ...Object.values(byDay)),
    goalDays: Object.values(byDay).filter((m) => m >= dailyGoalOf(k)).length,
    weeksGoalMet: Object.values(byWeek).filter((m) => m >= weeklyGoalOf(k)).length,
    weekends: weekendDays.size,
    today: byDay[dayKey()] || 0,
    thisWeek: byWeek[dayKey(weekStart())] || 0,
  };
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
const BADGES = [
  { id: 'first-read', icon: '📖', name: 'First Page', desc: 'Log your first reading', stat: 'sessions', goal: 1 },
  { id: 'goal-1', icon: '🎯', name: 'Bullseye', desc: 'Hit your daily goal', stat: 'goalDays', goal: 1 },
  { id: 'week-1', icon: '🏆', name: 'Week Winner', desc: 'Hit your weekly goal', stat: 'weeksGoalMet', goal: 1 },
  { id: 'streak-3', icon: '🔥', name: 'On Fire', desc: 'Read 3 days in a row', stat: 'bestStreak', goal: 3 },
  { id: 'first-book', icon: '🐛', name: 'Bookworm', desc: 'Finish your first book', stat: 'booksFinished', goal: 1 },
  { id: 'hour', icon: '⏰', name: 'Hour Power', desc: 'Read 60 minutes total', stat: 'minutes', goal: 60 },
  { id: 'streak-7', icon: '🌈', name: 'Week Wonder', desc: 'Read 7 days in a row', stat: 'bestStreak', goal: 7 },
  { id: 'marathon', icon: '🏃', name: 'Marathon', desc: 'Read 60 minutes in one day', stat: 'maxDay', goal: 60 },
  { id: 'weekend', icon: '🏖️', name: 'Weekend Reader', desc: 'Read on a Saturday and Sunday', stat: 'weekends', goal: 1 },
  { id: 'loved', icon: '💖', name: 'Love It!', desc: 'Give a book 5 stars', stat: 'fiveStars', goal: 1 },
  { id: 'pages-500', icon: '📚', name: 'Page Turner', desc: 'Read 500 pages', stat: 'pages', goal: 500 },
  { id: 'books-5', icon: '🦉', name: 'Wise Owl', desc: 'Finish 5 books', stat: 'booksFinished', goal: 5 },
  { id: 'goal-10', icon: '🏹', name: 'Sharpshooter', desc: 'Hit your goal on 10 days', stat: 'goalDays', goal: 10 },
  { id: 'week-4', icon: '🗓️', name: 'Month of Wins', desc: 'Hit your weekly goal 4 times', stat: 'weeksGoalMet', goal: 4 },
  { id: 'hours-10', icon: '🚀', name: 'Rocket Reader', desc: 'Read 10 hours total', stat: 'minutes', goal: 600 },
  { id: 'books-10', icon: '🧙', name: 'Book Wizard', desc: 'Finish 10 books', stat: 'booksFinished', goal: 10 },
  { id: 'streak-30', icon: '👑', name: 'Reading Royalty', desc: 'Read 30 days in a row', stat: 'bestStreak', goal: 30 },
  { id: 'pages-2000', icon: '🏔️', name: 'Mountain of Pages', desc: 'Read 2,000 pages', stat: 'pages', goal: 2000 },
  { id: 'week-12', icon: '🥇', name: 'Season Champ', desc: 'Hit your weekly goal 12 times', stat: 'weeksGoalMet', goal: 12 },
  { id: 'books-25', icon: '🐉', name: 'Legendary', desc: 'Finish 25 books', stat: 'booksFinished', goal: 25 },
  { id: 'hours-50', icon: '🌌', name: 'Galaxy Brain', desc: 'Read 50 hours total', stat: 'minutes', goal: 3000 },
];

/** Records newly earned badges for the kid and celebrates them. */
function checkBadges(k) {
  const st = statsFor(k);
  k.badges = k.badges || {};
  const fresh = BADGES.filter((b) => !k.badges[b.id] && st[b.stat] >= b.goal);
  for (const b of fresh) k.badges[b.id] = dayKey();
  if (fresh.length) {
    save();
    fresh.forEach((b, i) => setTimeout(() => toast(b.icon, `Badge unlocked: ${b.name}!`, b.desc), 400 + i * 900));
    confetti();
  }
}

// ---------------------------------------------------------------------------
// Rendering: covers & small parts
// ---------------------------------------------------------------------------
function coverHTML(b, extra = '') {
  const done = (b.status === 'finished' && extra !== 'plain' ? '<div class="done-badge">✓</div>' : '')
    + (b.format && b.format !== 'print' && FORMATS[b.format] ? `<div class="fmt-badge" title="${FORMATS[b.format][1]}">${FORMATS[b.format][0]}</div>` : '');
  const gen = `<div class="cover gen" style="--h:${b.hue ?? hueOf(b.title)}"><div class="t">${esc(b.title)}</div><div class="a">${esc(b.author || '')}</div>${done}</div>`;
  if (!b.coverUrl) return gen;
  // Swap in the generated cover if the image fails to load.
  return `<div class="cover" data-fallback="${esc(gen)}"><img src="${esc(b.coverUrl)}" alt="" loading="lazy" onerror="this.parentNode.outerHTML=this.parentNode.dataset.fallback" />${done}</div>`;
}

function bookCard(b) {
  const pct = b.totalPages ? clamp(Math.round(((b.currentPage || 0) / b.totalPages) * 100), 0, 100) : 0;
  let foot = '';
  if (b.status === 'reading' && b.totalPages) foot = `<div class="progress"><i style="width:${pct}%"></i></div>`;
  if (b.status === 'finished' && b.rating) foot = `<div class="stars-sm">${'★'.repeat(b.rating)}${'☆'.repeat(5 - b.rating)}</div>`;
  return `<button class="book" data-action="open-book" data-id="${b.id}">
    ${coverHTML(b)}
    <div class="meta"><div class="title">${esc(b.title)}</div>${b.author ? `<div class="author">${esc(b.author)}</div>` : ''}${foot}</div>
  </button>`;
}

function ringHTML(value, goal) {
  const r = 52, c = 2 * Math.PI * r;
  const pct = goal ? clamp(value / goal, 0, 1) : 0;
  return `<div class="ring">
    <svg viewBox="0 0 128 128"><circle class="track" cx="64" cy="64" r="${r}" fill="none" stroke-width="14"/>
    <circle class="bar" cx="64" cy="64" r="${r}" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}"/></svg>
    <div class="center"><div class="num">${value}</div><div class="of">of ${goal} min</div></div>
  </div>`;
}

/** Bar chart. items: [{ label, value, title, today, future }]; goal draws a dashed line and turns bars green. */
function barChart(items, { goal = 0, fmt = String, showValues = true } = {}) {
  const max = Math.max(goal * 1.25, ...items.map((it) => it.value), 1);
  const cols = items.map((it) => {
    const cls = it.future ? 'future' : goal && it.value >= goal ? 'met' : it.value > 0 ? 'on' : '';
    return `<div class="col" title="${esc(it.title || '')}"><div class="bar ${cls}" style="height:calc((100% - 24px) * ${it.value / max})">${showValues && it.value ? `<span class="v">${esc(fmt(it.value))}</span>` : ''}</div>
      <div class="day ${it.today ? 'today' : ''}">${esc(it.label)}</div></div>`;
  }).join('');
  // Bars sit above a 24px label strip, so the goal line uses the same scale.
  const line = goal ? `<div class="goal-line" style="bottom:calc(24px + (100% - 24px) * ${goal / max})"><span>Goal</span></div>` : '';
  return `<div class="week ${items.length > 12 ? 'dense' : ''}" style="grid-template-columns:repeat(${items.length},1fr)">${line}${cols}</div>`;
}

function weekHTML(k, byDay) {
  const today = dayKey();
  const items = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(addDays(weekStart(), i));
    const v = byDay[key] || 0;
    return { label: DAY_LETTERS[parseKey(key).getDay()], value: v, title: `${fmtDate(key)}: ${v} min`, today: key === today, future: key > today };
  });
  return barChart(items, { goal: dailyGoalOf(k) });
}

function weekGoalHTML(k, minutes, { light = false } = {}) {
  const goal = weeklyGoalOf(k);
  const pct = clamp((minutes / goal) * 100, 0, 100);
  const done = minutes >= goal;
  return `<div class="week-goal ${light ? 'light' : ''} ${done ? 'done' : ''}">
    <div class="wg-top"><span>${done ? '🏆 Weekly goal done!' : 'Weekly goal'}</span><b>${fmtMinutes(minutes)} / ${fmtMinutes(goal)}</b></div>
    <div class="wg-bar"><i style="width:${pct}%"></i></div>
  </div>`;
}

function heatHTML(k, byDay) {
  const goal = dailyGoalOf(k);
  const weeks = 15;
  const today = new Date();
  const start = addDays(weekStart(today), -(weeks - 1) * 7);
  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    const key = dayKey(d);
    const m = byDay[key] || 0;
    let cls = '';
    if (d > today) cls = 'future';
    else if (m >= goal * 2) cls = 'l4';
    else if (m >= goal) cls = 'l3';
    else if (m >= goal / 2) cls = 'l2';
    else if (m > 0) cls = 'l1';
    if (key === dayKey(today)) cls += ' today';
    cells.push(`<i class="${cls}" title="${esc(fmtDate(key))}: ${m} min"></i>`);
  }
  return `<div class="heat">${cells.join('')}</div>
    <div class="legend">Less <i style="background:var(--soft)"></i><i style="background:color-mix(in srgb,var(--accent) 30%,var(--soft))"></i><i style="background:color-mix(in srgb,var(--accent) 60%,var(--soft))"></i><i style="background:var(--accent)"></i><i style="background:var(--good)"></i> More</div>`;
}

function heroMessage(st, goal, weekGoal) {
  if (st.today >= goal * 2) return 'Double goal! You are unstoppable! 🚀';
  if (st.today >= goal) return 'Goal smashed today! 🎉';
  if (st.thisWeek >= weekGoal) return 'Weekly goal done! Extra reading is a bonus ⭐';
  if (st.today > 0) return `Only ${goal - st.today} more minutes to hit your goal!`;
  if (st.streak > 0) return `Keep your ${st.streak}-day streak going! 🔥`;
  return 'Ready for a reading adventure? 📚';
}

// ---------------------------------------------------------------------------
// Rendering: screens
// ---------------------------------------------------------------------------
function render() {
  const app = $('#app');
  const k = kid();
  document.documentElement.style.setProperty('--accent', k?.color || COLORS[0]);
  $('meta[name="theme-color"]').setAttribute('content', k?.color || COLORS[0]);

  if (!state.kids.length) { app.innerHTML = welcomeHTML(); return; }
  if (!k || ui.picking) { app.innerHTML = pickerHTML(); return; }

  const st = statsFor(k);
  const screens = { home: homeHTML, books: booksHTML, badges: badgesHTML, stats: statsHTML };
  app.innerHTML = `<div class="wrap">
    <header class="topbar">
      <button class="avatar" style="--kid:${esc(k.color)}" data-action="switch-kid" aria-label="Switch reader">${esc(k.avatar)}</button>
      <div class="hello"><h1>Hi, ${esc(k.name)}!</h1><div class="sub">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div></div>
      <button class="icon-btn" data-action="parent" aria-label="Parent settings">${ICONS.gear}</button>
    </header>
    ${screens[ui.tab](k, st)}
  </div>
  <nav class="nav">
    ${[['home', 'Home'], ['books', 'Books'], ['badges', 'Badges'], ['stats', 'Stats']]
      .map(([id, label]) => `<button class="${ui.tab === id ? 'on' : ''}" data-action="tab" data-tab="${id}">${ICONS[id]}${label}</button>`).join('')}
  </nav>`;
}

function welcomeHTML() {
  return `<div class="welcome"><div class="inner">
    <img class="logo pop" src="icon.svg" alt="" />
    <h1>Reading Quest</h1>
    <p class="lead">Track books, build streaks, and earn badges.<br/>Let's add your first reader!</p>
    <button class="btn btn-primary btn-block" data-action="add-kid">${ICONS.plus} Add a reader</button>
    ${Sync.enabled ? `<button class="btn btn-soft btn-block" style="margin-top:12px" data-action="parent">☁️ Sign in to your family account</button>` : ''}
    <p class="hint" style="margin-top:18px">Already have a backup? <a href="#" data-action="import" style="color:var(--accent)">Import it</a></p>
  </div></div>`;
}

function pickerHTML() {
  return `<div class="welcome"><div class="inner">
    <h1>Who's reading?</h1>
    <div class="pick">
      ${state.kids.map((k) => {
        const st = statsFor(k);
        return `<button class="who" data-action="choose-kid" data-id="${k.id}">
          <span class="avatar lg" style="--kid:${esc(k.color)}">${esc(k.avatar)}</span>${esc(k.name)}
          <span class="mini">${st.streak ? `🔥 ${st.streak} day streak` : '&nbsp;'}</span></button>`;
      }).join('')}
    </div>
    <button class="btn btn-soft" data-action="parent">${ICONS.gear} Parent settings</button>
  </div></div>`;
}

function homeHTML(k, st) {
  const goal = dailyGoalOf(k);
  const reading = kidBooks(k.id).filter((b) => b.status === 'reading');
  const recent = kidSessions(k.id).slice().sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt)).slice(0, 4);
  return `
    <section class="card hero">
      <div class="hero-row">
        ${ringHTML(st.today, goal)}
        <div class="hero-info">
          <div class="msg">${esc(heroMessage(st, goal, weeklyGoalOf(k)))}</div>
          <div class="pill-row">
            <span class="pill">🔥 ${plural(st.streak, 'day')}</span>
            <span class="pill">📚 ${st.booksFinished} read</span>
          </div>
        </div>
      </div>
      ${weekGoalHTML(k, st.thisWeek, { light: true })}
      <div class="hero-actions">
        <button class="btn btn-white" data-action="start-timer">${ICONS.play} Start timer</button>
        <button class="btn btn-white" data-action="log">${ICONS.plus} Log reading</button>
      </div>
    </section>

    <div class="section-title"><h2>Reading now</h2>${reading.length ? '<button class="link" data-action="tab" data-tab="books">See all</button>' : ''}</div>
    <div class="shelf">
      ${reading.map(bookCard).join('')}
      <button class="add-tile" data-action="add-book"><span class="plus">+</span>Add a book</button>
    </div>

    <div class="section-title"><h2>This week</h2><span class="muted">${fmtMinutes(st.thisWeek)} of ${fmtMinutes(weeklyGoalOf(k))}</span></div>
    <section class="card">${weekHTML(k, st.byDay)}</section>

    ${recent.length ? `<div class="section-title"><h2>Recent reading</h2><button class="link" data-action="tab" data-tab="stats">History</button></div>
    <section class="card list" style="padding:6px 20px">${recent.map(sessionRow).join('')}</section>` : ''}`;
}

function sessionRow(s) {
  const b = bookById(s.bookId);
  const bits = [fmtMinutes(s.minutes || 0)];
  if (s.pages) bits.push(plural(s.pages, 'page'));
  bits.push(fmtDate(s.date));
  return `<div class="list-item">
    <div class="dot">${b ? '📖' : '✨'}</div>
    <div class="grow"><div class="t">${esc(b ? b.title : 'Free reading')}</div><div class="s">${bits.join(' · ')}</div></div>
    <button class="x" data-action="delete-session" data-id="${s.id}" aria-label="Delete">${ICONS.trash}</button>
  </div>`;
}

function booksHTML(k) {
  const all = kidBooks(k.id);
  const groups = { reading: 'Reading', want: 'Wishlist', finished: 'Finished' };
  const list = all.filter((b) => b.status === ui.bookFilter)
    .sort((a, b) => (b.finishedAt || b.createdAt || '').localeCompare(a.finishedAt || a.createdAt || ''));
  const empties = {
    reading: ['📖', 'No books on the go', 'Add the book you are reading right now.'],
    want: ['🌟', 'Your wish list is empty', 'Add books you want to read next!'],
    finished: ['🏆', 'No finished books yet', 'When you finish a book it will land here.'],
  };
  const [ic, h, p] = empties[ui.bookFilter];
  return `
    <div class="seg">${Object.entries(groups).map(([id, label]) =>
      `<button class="${ui.bookFilter === id ? 'on' : ''}" data-action="filter" data-filter="${id}">${label} <span class="c">${all.filter((b) => b.status === id).length}</span></button>`).join('')}
    </div>
    ${list.length
      ? `<div class="grid-books">${list.map(bookCard).join('')}<button class="add-tile" style="width:auto" data-action="add-book" data-status="${ui.bookFilter}"><span class="plus">+</span>Add a book</button></div>`
      : `<div class="card empty"><div class="big">${ic}</div><h3>${h}</h3><p>${p}</p><button class="btn btn-primary" data-action="add-book" data-status="${ui.bookFilter}">${ICONS.plus} Add a book</button></div>`}`;
}

function badgesHTML(k, st) {
  const earned = k.badges || {};
  const count = BADGES.filter((b) => earned[b.id]).length;
  return `
    <section class="card hero" style="text-align:center">
      <div style="font-size:44px">🏅</div>
      <div class="msg" style="font-family:var(--font-display);font-size:22px;font-weight:600">${count} of ${BADGES.length} badges</div>
      <div class="progress" style="background:rgba(255,255,255,.25);margin:12px auto 0;max-width:280px"><i style="width:${(count / BADGES.length) * 100}%;background:#fff"></i></div>
    </section>
    <div class="badges">
      ${BADGES.map((b) => {
        const got = earned[b.id];
        const pct = clamp((st[b.stat] / b.goal) * 100, 0, 100);
        return `<div class="badge ${got ? '' : 'locked'}">
          <div class="medal">${b.icon}</div>
          <div class="bn">${esc(b.name)}</div>
          <div class="bd">${esc(b.desc)}</div>
          ${got ? `<div class="when">Earned ${esc(fmtDate(got))}</div>` : `<div class="bp"><i style="width:${pct}%"></i></div>`}
        </div>`;
      }).join('')}
    </div>`;
}

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const RANGE_NAMES = { week: 'week', month: 'month', year: 'year' };

/** The week (Sun–Sat), month or year that is `offset` periods away from the current one. */
function periodRange(range, offset) {
  const now = new Date();
  const short = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  let start, end, label, sub = '';
  if (range === 'week') {
    start = addDays(weekStart(now), offset * 7);
    end = addDays(start, 6);
    sub = `${short(start)} – ${short(end)}`;
    label = offset === 0 ? 'This week' : offset === -1 ? 'Last week' : sub;
    if (offset < -1) sub = String(start.getFullYear());
  } else if (range === 'month') {
    start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    label = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    sub = offset === 0 ? 'This month' : offset === -1 ? 'Last month' : '';
  } else {
    start = new Date(now.getFullYear() + offset, 0, 1);
    end = new Date(start.getFullYear(), 11, 31);
    label = String(start.getFullYear());
    sub = offset === 0 ? 'This year' : offset === -1 ? 'Last year' : '';
  }
  return { range, start, end, startKey: dayKey(start), endKey: dayKey(end), label, sub };
}

function periodStats(k, p) {
  const goal = dailyGoalOf(k);
  const sessions = kidSessions(k.id).filter((s) => s.date >= p.startKey && s.date <= p.endKey);
  const byDay = {};
  for (const s of sessions) byDay[s.date] = (byDay[s.date] || 0) + (s.minutes || 0);
  const daily = Object.values(byDay).filter((m) => m > 0);
  const todayKey = dayKey();
  const lastKey = p.endKey < todayKey ? p.endKey : todayKey;
  const daysSoFar = lastKey < p.startKey ? 0 : Math.round((parseKey(lastKey) - parseKey(p.startKey)) / 864e5) + 1;
  const books = kidBooks(k.id).filter((b) => {
    if (b.status !== 'finished' || !b.finishedAt) return false;
    const d = dayKey(new Date(b.finishedAt));
    return d >= p.startKey && d <= p.endKey;
  });
  // Weeks that start (on Monday) inside this period and have begun; a week is counted whole even if it spills over.
  const allDays = minutesByDay(k.id);
  let weeksSoFar = 0, weeksMet = 0;
  for (let w = weekStart(parseKey(p.startKey)); dayKey(w) <= p.endKey && dayKey(w) <= todayKey; w = addDays(w, 7)) {
    if (dayKey(w) < p.startKey) continue;
    weeksSoFar++;
    let m = 0;
    for (let i = 0; i < 7; i++) m += allDays[dayKey(addDays(w, i))] || 0;
    if (m >= weeklyGoalOf(k)) weeksMet++;
  }
  return {
    sessions, byDay, books, daysSoFar, weeksSoFar, weeksMet,
    minutes: sessions.reduce((a, s) => a + (s.minutes || 0), 0),
    pages: sessions.reduce((a, s) => a + (s.pages || 0), 0),
    daysRead: daily.length,
    goalDays: daily.filter((m) => m >= goal).length,
    bestDay: Math.max(0, ...daily),
    avg: daily.length ? Math.round(daily.reduce((a, m) => a + m, 0) / daily.length) : 0,
  };
}

function periodChart(k, p, ps) {
  const today = dayKey();
  if (p.range === 'year') {
    const byMonth = Array(12).fill(0);
    for (const [d, m] of Object.entries(ps.byDay)) byMonth[parseKey(d).getMonth()] += m;
    const items = byMonth.map((v, i) => {
      const first = new Date(p.start.getFullYear(), i, 1);
      return {
        label: MONTH_LETTERS[i], value: v, future: dayKey(first) > today,
        today: dayKey(first).slice(0, 7) === today.slice(0, 7),
        title: `${first.toLocaleDateString(undefined, { month: 'long' })}: ${fmtMinutes(v)}`,
      };
    });
    return { title: 'Reading time per month', html: barChart(items, { fmt: (v) => (v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`) }) };
  }
  const items = [];
  for (let d = new Date(p.start); d <= p.end; d = addDays(d, 1)) {
    const key = dayKey(d);
    const v = ps.byDay[key] || 0;
    const label = p.range === 'week' ? DAY_LETTERS[d.getDay()] : d.getDate() === 1 || d.getDate() % 5 === 0 ? String(d.getDate()) : '';
    items.push({ label, value: v, today: key === today, future: key > today, title: `${fmtDate(key)}: ${v} min` });
  }
  return { title: 'Minutes per day', html: barChart(items, { goal: dailyGoalOf(k), showValues: p.range === 'week' }) };
}

function statsHTML(k, st) {
  const ranges = [['week', 'Week'], ['month', 'Month'], ['year', 'Year'], ['all', 'All time']];
  const seg = `<div class="seg">${ranges.map(([id, label]) =>
    `<button class="${ui.statsRange === id ? 'on' : ''}" data-action="stats-range" data-range="${id}">${label}</button>`).join('')}</div>`;
  if (ui.statsRange === 'all') return seg + allTimeHTML(k, st);

  const p = periodRange(ui.statsRange, ui.statsOffset);
  const ps = periodStats(k, p);
  // For the period still in progress, compare with the same stretch of the previous one (e.g. Sun–Wed vs Sun–Wed).
  const prevRange = periodRange(ui.statsRange, ui.statsOffset - 1);
  const partial = ui.statsOffset === 0;
  if (partial) prevRange.endKey = [prevRange.endKey, dayKey(addDays(prevRange.start, ps.daysSoFar - 1))].sort()[0];
  const prev = periodStats(k, prevRange);
  const vs = partial ? `this point last ${RANGE_NAMES[ui.statsRange]}` : `last ${RANGE_NAMES[ui.statsRange]}`;
  const name = RANGE_NAMES[ui.statsRange];
  let delta = '';
  if (prev.minutes && ps.minutes) {
    const pct = Math.round(((ps.minutes - prev.minutes) / prev.minutes) * 100);
    delta = pct >= 0
      ? `<span class="delta up">▲ ${pct}% more than ${vs}</span>`
      : `<span class="delta down">▼ ${-pct}% less than ${vs}</span>`;
  }
  const chart = periodChart(k, p, ps);
  const sessions = ps.sessions.slice().sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
  return `${seg}
    <div class="period-nav">
      <button class="icon-btn" data-action="stats-shift" data-by="-1" aria-label="Previous ${name}">‹</button>
      <div class="pl"><div class="pt">${esc(p.label)}</div>${p.sub ? `<div class="ps">${esc(p.sub)}</div>` : ''}</div>
      <button class="icon-btn" data-action="stats-shift" data-by="1" aria-label="Next ${name}" ${ui.statsOffset >= 0 ? 'disabled' : ''}>›</button>
    </div>
    <div class="tiles">
      <div class="tile"><div class="ic">⏱️</div><div class="n">${fmtMinutes(ps.minutes)}</div><div class="l">Time reading</div></div>
      <div class="tile"><div class="ic">📅</div><div class="n">${ps.daysRead}<small> / ${ps.daysSoFar}</small></div><div class="l">Days read</div></div>
      <div class="tile"><div class="ic">📄</div><div class="n">${ps.pages.toLocaleString()}</div><div class="l">Pages read</div></div>
      <div class="tile"><div class="ic">📚</div><div class="n">${ps.books.length}</div><div class="l">Books finished</div></div>
    </div>
    <section class="card">
      ${ui.statsRange === 'week' ? weekGoalHTML(k, ps.minutes) : ''}
      <div class="chart-head"><h3>${chart.title}</h3>${delta}</div>
      ${chart.html}
      <div class="facts">
        <span>🎯 Daily goal hit on <b>${plural(ps.goalDays, 'day')}</b></span>
        ${ui.statsRange !== 'week' && ps.weeksSoFar ? `<span>🏆 Weekly goal hit <b>${ps.weeksMet} of ${plural(ps.weeksSoFar, 'week')}</b></span>` : ''}
        <span>🏅 Best day <b>${fmtMinutes(ps.bestDay)}</b></span>
        <span>📈 Average <b>${fmtMinutes(ps.avg)}</b> a reading day</span>
      </div>
    </section>
    ${ps.books.length ? `<div class="section-title"><h2>Books finished</h2></div><div class="shelf">${ps.books.map(bookCard).join('')}</div>` : ''}
    <div class="section-title"><h2>Reading log</h2></div>
    <section class="card list" style="padding:6px 20px">
      ${sessions.length ? sessions.slice(0, 100).map(sessionRow).join('') : `<div class="empty"><div class="big">🗓️</div><p>No reading logged this ${name}.</p></div>`}
    </section>`;
}

function allTimeHTML(k, st) {
  const sessions = kidSessions(k.id).slice().sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
  return `
    <div class="tiles">
      <div class="tile"><div class="ic">⏱️</div><div class="n">${fmtMinutes(st.minutes)}</div><div class="l">Time reading</div></div>
      <div class="tile"><div class="ic">📚</div><div class="n">${st.booksFinished}</div><div class="l">Books finished</div></div>
      <div class="tile"><div class="ic">📄</div><div class="n">${st.pages.toLocaleString()}</div><div class="l">Pages read</div></div>
      <div class="tile"><div class="ic">🔥</div><div class="n">${st.bestStreak}</div><div class="l">Best streak (days)</div></div>
    </div>
    <div class="section-title"><h2>Reading calendar</h2></div>
    <section class="card">${heatHTML(k, st.byDay)}</section>
    <div class="section-title"><h2>History</h2></div>
    <section class="card list" style="padding:6px 20px">
      ${sessions.length ? sessions.slice(0, 60).map(sessionRow).join('') : '<div class="empty"><div class="big">🗓️</div><p>No reading logged yet.</p></div>'}
    </section>`;
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------
function openModal(type, data = {}) {
  ui.modal = { type, ...data };
  renderModal();
}

function closeModal() {
  const type = ui.modal?.type;
  ui.modal = null;
  $('#modal-root').innerHTML = '';
  if (!ui.parentOpen) return;
  if (type === 'parent') lockParent();
  else openModal('parent'); // finished a sub-screen (edit reader, change PIN…): back to Parent settings
}

function renderModal() {
  const m = ui.modal;
  const root = $('#modal-root');
  if (!m) { root.innerHTML = ''; return; }
  const body = `<div class="grip"></div>${MODALS[m.type](m)}`;
  const open = root.querySelector('.modal');
  // Already showing a sheet: swap its contents so it doesn't replay the open animation.
  if (open) open.innerHTML = body;
  else root.innerHTML = `<div class="modal-backdrop" data-action="backdrop"><div class="modal" role="dialog" aria-modal="true">${body}</div></div>`;
  const auto = root.querySelector('[autofocus]');
  if (auto && matchMedia('(min-width: 600px)').matches) auto.focus();
}

const head = (title) => `<div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-action="close" aria-label="Close">${ICONS.close}</button></div>`;

const MODALS = {
  kid(m) {
    const k = m.id ? state.kids.find((x) => x.id === m.id) : null;
    const d = m.draft || (m.draft = { name: k?.name || '', avatar: k?.avatar || pick(AVATARS), color: k?.color || COLORS[state.kids.length % COLORS.length], dailyGoal: k?.dailyGoal || 20, weeklyGoal: k ? weeklyGoalOf(k) : 120 });
    if (d.weeklyCustom === undefined) d.weeklyCustom = !WEEKLY_PRESETS.includes(Number(d.weeklyGoal));
    return `${head(k ? 'Edit reader' : 'New reader')}
    <form data-form="kid">
      <div style="display:flex;justify-content:center;margin-bottom:16px"><span class="avatar lg pop" style="--kid:${esc(d.color)}">${esc(d.avatar)}</span></div>
      <div class="field"><label for="kid-name">Name</label><input id="kid-name" class="input" name="name" maxlength="24" required value="${esc(d.name)}" placeholder="e.g. Maya" autofocus /></div>
      <div class="field"><span class="label">Pick a buddy</span><div class="emoji-pick">
        ${AVATARS.map((a) => `<button type="button" class="${a === d.avatar ? 'on' : ''}" data-action="draft" data-key="avatar" data-val="${a}">${a}</button>`).join('')}
      </div></div>
      <div class="field"><span class="label">Favorite color</span><div class="color-pick">
        ${COLORS.map((c) => `<button type="button" class="${c === d.color ? 'on' : ''}" style="background:${c}" data-action="draft" data-key="color" data-val="${c}" aria-label="${c}"></button>`).join('')}
      </div></div>
      <div class="field"><span class="label">Daily reading goal</span><div class="choices">
        ${[10, 15, 20, 30, 45, 60].map((g) => `<button type="button" class="choice ${g === d.dailyGoal ? 'on' : ''}" data-action="draft" data-key="dailyGoal" data-val="${g}">${g} min</button>`).join('')}
      </div></div>
      <div class="field"><span class="label">Weekly reading goal</span><div class="choices">
        ${WEEKLY_PRESETS.map((g) => `<button type="button" class="choice ${!d.weeklyCustom && g === Number(d.weeklyGoal) ? 'on' : ''}" data-action="draft" data-key="weeklyGoal" data-val="${g}">${fmtMinutes(g)}</button>`).join('')}
        <button type="button" class="choice ${d.weeklyCustom ? 'on' : ''}" data-action="draft" data-key="weeklyCustom" data-val="1">✏️ Custom</button>
      </div>
      ${d.weeklyCustom ? `<div class="custom-goal"><input id="kid-weekly" class="input" name="weeklyGoal" type="number" min="${WEEKLY_MIN}" max="${WEEKLY_MAX}" step="1" inputmode="numeric" required value="${esc(d.weeklyGoal)}" aria-label="Custom weekly goal in minutes" /><span>minutes a week</span></div>` : ''}
      <div class="hint" id="weekly-hint">${weeklyHint(d.weeklyGoal)}</div></div>
      <div class="modal-foot">
        ${k ? '<button type="button" class="btn btn-danger" data-action="delete-kid">Remove</button>' : ''}
        <button class="btn btn-primary">${k ? 'Save' : "Let's read!"}</button>
      </div>
    </form>`;
  },

  book(m) {
    const b = m.id ? bookById(m.id) : null;
    const d = m.draft || (m.draft = { title: b?.title || '', author: b?.author || '', totalPages: b?.totalPages || '', coverUrl: b?.coverUrl || '', status: b?.status || m.status || 'reading', format: b?.format || 'print' });
    const statuses = { reading: 'Reading now', want: 'Want to read', finished: 'Finished' };
    return `${head(b ? 'Edit book' : 'Add a book')}
    <form data-form="book">
      ${b ? '' : `<div class="field"><label for="book-search">Search for a book</label>
        <input id="book-search" class="input" data-search placeholder="Type a title or author…" autocomplete="off" autofocus />
        <div class="results" id="search-results"></div></div>`}
      <div style="display:flex;gap:16px;align-items:flex-start">
        <div style="width:84px;flex:none" id="draft-cover">${coverHTML({ ...d, title: d.title || '?' }, 'plain')}</div>
        <div style="flex:1;min-width:0">
          <div class="field"><label for="b-title">Title</label><input id="b-title" class="input" name="title" required maxlength="120" value="${esc(d.title)}" /></div>
          <div class="field"><label for="b-author">Author</label><input id="b-author" class="input" name="author" maxlength="80" value="${esc(d.author)}" /></div>
        </div>
      </div>
      <div class="field"><span class="label">What kind of book?</span><div class="choices">${formatChips(d.format, 'format')}</div></div>
      ${d.format === 'audio' ? '' : `<div class="field"><label for="b-pages">Number of pages <span style="color:var(--ink-3)">(optional)</span></label><input id="b-pages" class="input" name="totalPages" type="number" min="1" max="5000" inputmode="numeric" value="${esc(d.totalPages)}" /></div>`}
      <div class="field"><span class="label">Shelf</span><div class="choices">
        ${Object.entries(statuses).map(([id, label]) => `<button type="button" class="choice ${d.status === id ? 'on' : ''}" data-action="draft" data-key="status" data-val="${id}">${label}</button>`).join('')}
      </div></div>
      <div class="modal-foot"><button class="btn btn-primary">${b ? 'Save' : 'Add to my shelf'}</button></div>
    </form>`;
  },

  bookDetail(m) {
    const b = bookById(m.id);
    if (!b) return head('Book not found');
    const sessions = state.sessions.filter((s) => s.bookId === b.id);
    const minutes = sessions.reduce((a, s) => a + (s.minutes || 0), 0);
    const pct = b.totalPages ? clamp(Math.round(((b.currentPage || 0) / b.totalPages) * 100), 0, 100) : null;
    const actions = {
      reading: `<button class="btn btn-primary btn-block" data-action="start-timer" data-book="${b.id}">${ICONS.play} Read now</button>
        <button class="btn btn-soft btn-block" data-action="log" data-book="${b.id}">${ICONS.plus} Log reading</button>
        <button class="btn btn-soft btn-block" data-action="finish-book" data-id="${b.id}">🏁 I finished it!</button>`,
      want: `<button class="btn btn-primary btn-block" data-action="set-status" data-id="${b.id}" data-status="reading">📖 Start this book</button>`,
      finished: `<button class="btn btn-soft btn-block" data-action="finish-book" data-id="${b.id}">⭐ Change rating</button>
        <button class="btn btn-soft btn-block" data-action="set-status" data-id="${b.id}" data-status="reading">🔁 Read it again</button>`,
    };
    return `${head('')}
    <div class="book-detail">
      ${coverHTML(b)}
      <div style="min-width:0">
        <h2>${esc(b.title)}</h2>
        ${b.author ? `<div class="by">by ${esc(b.author)}</div>` : ''}
        <div class="by fmt">${FORMATS[b.format || 'print'].join(' ')}</div>
        ${b.rating ? `<div class="stars-sm" style="font-size:18px">${'★'.repeat(b.rating)}${'☆'.repeat(5 - b.rating)}</div>` : ''}
        <div class="mini-stats">
          <div><small>Time</small>${fmtMinutes(minutes)}</div>
          <div><small>Sessions</small>${sessions.length}</div>
          ${b.totalPages ? `<div><small>Page</small>${b.currentPage || 0} / ${b.totalPages}</div>` : ''}
        </div>
        ${pct !== null && b.status === 'reading' ? `<div class="progress" style="margin-top:12px"><i style="width:${pct}%"></i></div>` : ''}
      </div>
    </div>
    <div class="stack">
      ${actions[b.status] || ''}
      <div class="row">
        <button class="btn btn-soft" data-action="edit-book" data-id="${b.id}">Edit</button>
        <button class="btn btn-danger" data-action="delete-book" data-id="${b.id}">Remove</button>
      </div>
    </div>`;
  },

  log(m) {
    const k = kid();
    const reading = kidBooks(k.id).filter((b) => b.status === 'reading');
    const d = m.draft || (m.draft = { bookId: m.bookId ?? reading[0]?.id ?? '', minutes: m.minutes || dailyGoalOf(k), date: dayKey(), page: '', newTitle: '', newFormat: 'print' });
    const b = bookById(d.bookId);
    const otherTitles = kidBooks(k.id).filter((x) => x.status !== 'reading').map((x) => x.title);
    return `${head(m.fromTimer ? `${pick(CHEERS)} 🎉` : 'Log reading')}
    <form data-form="log">
      <div class="field"><span class="label">What did you read?</span><div class="choices">
        ${reading.map((rb) => `<button type="button" class="choice ${d.bookId === rb.id ? 'on' : ''}" data-action="draft" data-key="bookId" data-val="${rb.id}">${esc(rb.title)}</button>`).join('')}
        <button type="button" class="choice ${!d.bookId ? 'on' : ''}" data-action="draft" data-key="bookId" data-val="">✨ Something else</button>
      </div></div>
      ${b ? '' : `<div class="field"><label for="log-title">Name of the book</label>
        <input id="log-title" class="input" name="newTitle" required maxlength="120" list="log-titles" autocomplete="off" value="${esc(d.newTitle)}" placeholder="Type the title" />
        <datalist id="log-titles">${otherTitles.map((t) => `<option value="${esc(t)}"></option>`).join('')}</datalist>
        <div class="choices" style="margin-top:10px">${formatChips(d.newFormat, 'newFormat')}</div>
        <div class="hint">It goes on your Reading shelf so you can track it.</div></div>`}
      <div class="field"><span class="label">How long?</span>
        <div class="stepper">
          <button type="button" data-action="bump" data-by="-1" aria-label="1 minute less">−</button>
          <div class="val"><input name="minutes" type="number" min="1" max="600" inputmode="numeric" value="${esc(d.minutes)}" aria-label="Minutes" /><small>minutes</small></div>
          <button type="button" data-action="bump" data-by="1" aria-label="1 minute more">+</button>
        </div>
      </div>
      ${b && b.format !== 'audio' ? `<div class="field"><label for="log-page">What page are you on now?</label>
        <input id="log-page" class="input" name="page" type="number" min="0" ${b.totalPages ? `max="${b.totalPages}"` : ''} inputmode="numeric" value="${esc(d.page)}" placeholder="${b.currentPage ? `You were on page ${b.currentPage}` : 'Page number'}" />
        ${b.totalPages ? `<div class="hint">This book has ${b.totalPages} pages.</div>` : ''}</div>` : ''}
      <label class="check"><input type="checkbox" name="finished" ${d.finished ? 'checked' : ''} /> I finished this book! 🏁</label>
      <div class="field" style="margin-top:16px"><label for="log-date">When?</label><input id="log-date" class="input" name="date" type="date" max="${dayKey()}" value="${esc(d.date)}" /></div>
      <div class="modal-foot"><button class="btn btn-primary">${ICONS.check} Save reading</button></div>
    </form>`;
  },

  rate(m) {
    const b = bookById(m.id);
    const r = m.rating ?? b.rating ?? 0;
    const words = ['Tap a star!', 'Not for me', 'It was OK', 'Pretty good', 'Really good!', 'LOVED it!'];
    return `${head('You finished a book! 🏆')}
      <div style="text-align:center">
        <div style="width:120px;margin:0 auto 16px" class="pop">${coverHTML(b, 'plain')}</div>
        <h3 style="font-size:20px">${esc(b.title)}</h3>
        <p style="color:var(--ink-2);font-weight:700;margin:6px 0 16px">How many stars would you give it?</p>
        <div class="stars">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="${n <= r ? 'on' : ''}" data-action="rate" data-val="${n}" aria-label="${n} stars">⭐</button>`).join('')}</div>
        <p style="font-family:var(--font-display);font-size:20px;font-weight:600;margin:14px 0 20px">${words[r]}</p>
        <button class="btn btn-primary btn-block" data-action="save-rating" ${r ? '' : 'disabled'}>Add to my finished shelf</button>
      </div>`;
  },

  parent() {
    const locked = !!state.settings.pinHash;
    return `<div class="modal-head"><h2>Parent settings</h2>
        <button class="btn btn-soft lock-btn" data-action="parent-lock">${locked ? '🔒 Lock' : 'Done'}</button></div>
      <div class="field"><span class="label">Readers</span>
        <div class="list">
          ${state.kids.map((k) => {
            const st = statsFor(k);
            return `<div class="list-item"><span class="avatar" style="--kid:${esc(k.color)};width:42px;height:42px;font-size:22px;border-radius:14px">${esc(k.avatar)}</span>
            <div class="grow"><div class="t">${esc(k.name)}</div><div class="s">Goals ${dailyGoalOf(k)} min/day · ${fmtMinutes(weeklyGoalOf(k))}/week · ${st.booksFinished} books</div></div>
            <button class="btn btn-soft" style="padding:8px 14px" data-action="edit-kid" data-id="${k.id}">Edit</button></div>`;
          }).join('')}
        </div>
        <button class="btn btn-soft btn-block" style="margin-top:8px" data-action="add-kid">${ICONS.plus} Add a reader</button>
      </div>
      ${syncSectionHTML()}
      <div class="field"><span class="label">Parent PIN</span>
        ${state.settings.pinHash
          ? `<p class="hint" style="margin:0 0 10px">🔒 These settings, and deleting books or reading history, need your PIN.</p>
            <div class="row"><button class="btn btn-soft" data-action="pin-set">Change PIN</button><button class="btn btn-soft" data-action="pin-off">Turn off PIN</button></div>`
          : `<p class="hint" style="margin:0 0 10px">Lock these settings with a 4-digit PIN so kids can't change goals or delete things.</p>
            <button class="btn btn-soft btn-block" data-action="pin-set">🔒 Set a PIN</button>`}
      </div>
      <div class="field"><span class="label">Backup</span>
        <p class="hint" style="margin:0 0 10px">${Sync.status === 'synced' || Sync.status === 'syncing' ? 'Your data is also saved in your family account.' : 'Reading data is saved on this device only.'} Export a backup file to keep an extra copy.</p>
        <div class="row">
          <button class="btn btn-soft" data-action="export">⬇️ Export</button>
          <button class="btn btn-soft" data-action="import">⬆️ Import</button>
        </div>
      </div>
      <div class="field"><span class="label">Try it out</span>
        <button class="btn btn-soft btn-block" data-action="demo">🎲 Load demo readers</button>
      </div>
      <button class="btn btn-danger btn-block" data-action="reset">Erase everything</button>
      <button class="btn btn-primary btn-block" style="margin-top:12px" data-action="parent-lock">${locked ? '🔒 Lock & close settings' : 'Done'}</button>
      ${locked ? `<p class="hint" style="text-align:center">Settings also lock on their own after ${PARENT_IDLE_MIN} minutes without a tap, or when the app is closed.</p>` : ''}
      <p class="hint" style="text-align:center">App version ${APP_VERSION}</p>`;
  },

  pin(m) {
    const titles = { check: 'Grown-ups only 🔒', set: 'Choose a 4-digit PIN', confirm: 'Type the PIN again' };
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', m.mode === 'check' ? 'forgot' : '', '0', 'back'];
    return `${head(titles[m.mode])}
      <div class="pin-dots ${m.error ? 'shake' : ''}">${[0, 1, 2, 3].map((i) => `<i class="${i < m.entry.length ? 'on' : ''}"></i>`).join('')}</div>
      <p class="pin-msg ${m.error ? 'err' : ''}">${esc(m.error || (m.mode === 'check' ? 'Type the parent PIN' : m.mode === 'set' ? "Pick something the kids won't guess" : 'Just to be sure'))}</p>
      <div class="keypad">
        ${keys.map((k) => {
          if (!k) return '<span></span>';
          if (k === 'forgot') return '<button type="button" class="kp-text" data-action="pin-forgot">Forgot?</button>';
          if (k === 'back') return '<button type="button" class="kp-text" data-action="pin-key" data-val="back" aria-label="Delete">⌫</button>';
          return `<button type="button" data-action="pin-key" data-val="${k}">${k}</button>`;
        }).join('')}
      </div>`;
  },

  gate(m) {
    return `${head('Grown-up check')}
      <form data-form="gate">
        <p style="color:var(--ink-2);font-weight:700;margin:0 0 14px">Forgot the PIN? Answer this to get in, then set a new PIN in Parent settings.</p>
        <div class="field"><label for="gate-answer">What is ${m.a} × ${m.b}?</label>
          <input id="gate-answer" class="input" name="answer" type="number" inputmode="numeric" autocomplete="off" autofocus /></div>
        ${m.error ? `<p class="pin-msg err" style="text-align:left">${esc(m.error)}</p>` : ''}
        <div class="modal-foot"><button class="btn btn-primary">Continue</button></div>
      </form>`;
  },
};

function syncSectionHTML() {
  const label = '<span class="label">Family sync</span>';
  if (!Sync.enabled) {
    return `<div class="field">${label}<p class="hint" style="margin:0">☁️ Sync is off, so each device keeps its own data. To share reading across tablets and phones, set up a free Firebase project once (see <b>SYNC-SETUP.md</b> in the project).</p></div>`;
  }
  const st = Sync.status;
  if (st === 'loading') return `<div class="field">${label}<div class="spinner"></div></div>`;
  if (st === 'signed-out' || (st === 'error' && !Sync.email)) {
    return `<div class="field">${label}
      <p class="hint" style="margin:0 0 10px">Sign in with your family account on every device and reading stays in sync everywhere.</p>
      <form data-form="signin" class="stack">
        <input class="input" name="email" type="email" autocomplete="username" placeholder="Family email" value="${esc(ui.syncEmail || '')}" required />
        <input class="input" name="password" type="password" autocomplete="current-password" placeholder="Password (6+ characters)" required minlength="6" />
        ${ui.syncMsg ? `<p class="pin-msg ${ui.syncMsgErr ? 'err' : ''}" style="text-align:left;margin:0">${esc(ui.syncMsg)}</p>` : ''}
        <div class="row">
          <button class="btn btn-primary" ${ui.syncBusy ? 'disabled' : ''}>Sign in</button>
          <button type="button" class="btn btn-soft" data-action="sync-signup" ${ui.syncBusy ? 'disabled' : ''}>Create account</button>
        </div>
        <button type="button" class="link-btn" data-action="sync-reset">Forgot password?</button>
      </form></div>`;
  }
  const chip = st === 'error'
    ? `<span class="sync-chip err">⚠️ ${esc(Sync.error)}</span>`
    : st === 'synced' ? '<span class="sync-chip ok">✅ All synced</span>' : '<span class="sync-chip">🔄 Syncing…</span>';
  return `<div class="field">${label}
    <div class="list-item" style="border:0;padding-top:0"><div class="dot">☁️</div>
      <div class="grow"><div class="t">${esc(Sync.email)}</div><div class="s">${chip}</div></div>
      <button class="btn btn-soft" style="padding:8px 14px" data-action="sync-signout">Sign out</button></div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Parent PIN (a kid-proof lock, not real security: it lives in the family's own data)
// ---------------------------------------------------------------------------
const PARENT_IDLE_MIN = 2;
let parentIdleTimer = null;

function pinHash(pin, salt) {
  let h = 2166136261;
  for (const c of `${salt}:${pin}`) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

/** Run fn now if there's no PIN, otherwise ask for it first. Each protected action asks again. */
function requirePin(fn) {
  if (!state.settings.pinHash) return fn();
  openModal('pin', { mode: 'check', entry: '', then: fn });
}

function unlock(then) {
  closeModal();
  then?.();
}

function openParent() {
  ui.parentOpen = true;
  openModal('parent');
  touchParent();
}

/** Leave Parent settings; the next visit needs the PIN again. */
function lockParent(reason = '') {
  const wasOpen = ui.parentOpen;
  ui.parentOpen = false;
  clearTimeout(parentIdleTimer);
  if (ui.modal) { ui.modal = null; $('#modal-root').innerHTML = ''; }
  if (wasOpen && state.settings.pinHash) toast('🔒', 'Parent settings locked', reason);
}

// Any tap or key press while unlocked restarts the idle countdown.
function touchParent() {
  if (!ui.parentOpen) return;
  clearTimeout(parentIdleTimer);
  if (state.settings.pinHash) {
    parentIdleTimer = setTimeout(() => lockParent(`No taps for ${PARENT_IDLE_MIN} minutes`), PARENT_IDLE_MIN * 60 * 1000);
  }
}
['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, touchParent, true));

function pinKey(key) {
  const m = ui.modal;
  if (key === 'back') { m.entry = m.entry.slice(0, -1); m.error = ''; renderModal(); return; }
  if (m.entry.length >= 4) return;
  m.entry += key;
  m.error = '';
  if (m.entry.length < 4) { renderModal(); return; }
  if (m.mode === 'check') {
    if (pinHash(m.entry, state.settings.pinSalt) === state.settings.pinHash) { unlock(m.then); return; }
    Object.assign(m, { entry: '', error: 'Not quite. Try again!' });
  } else if (m.mode === 'set') {
    Object.assign(m, { first: m.entry, entry: '', mode: 'confirm' });
  } else if (m.first === m.entry) {
    const salt = uid();
    state.settings = { ...state.settings, pinSalt: salt, pinHash: pinHash(m.entry, salt) };
    save();
    toast('🔒', 'PIN saved', Sync.email ? 'It works on all your synced devices. Tap Lock when you\'re done.' : "Tap Lock when you're done");
    openModal('parent');
    return;
  } else {
    Object.assign(m, { entry: '', mode: 'set', error: "Those didn't match. Let's try again." });
  }
  renderModal();
}

// ---------------------------------------------------------------------------
// Book search (Open Library)
// ---------------------------------------------------------------------------
let searchTimer = null;
let searchSeq = 0;
let searchResults = [];

function onSearchInput(q) {
  clearTimeout(searchTimer);
  const box = $('#search-results');
  if (!box) return;
  if (q.trim().length < 3) { box.innerHTML = ''; return; }
  box.innerHTML = '<div class="spinner"></div>';
  searchTimer = setTimeout(async () => {
    const seq = ++searchSeq;
    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6&fields=key,title,author_name,cover_i,number_of_pages_median`;
      const res = await fetch(url);
      const data = await res.json();
      if (seq !== searchSeq || !$('#search-results')) return;
      searchResults = (data.docs || []).map((d) => ({
        title: d.title,
        author: (d.author_name || [])[0] || '',
        totalPages: d.number_of_pages_median || '',
        coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : '',
      }));
      $('#search-results').innerHTML = searchResults.length
        ? searchResults.map((r, i) => `<button type="button" class="result" data-action="pick-result" data-i="${i}">
            <div class="thumb">${coverHTML(r, 'plain')}</div>
            <div><div class="rt">${esc(r.title)}</div><div class="ra">${esc(r.author)}${r.totalPages ? ` · ${r.totalPages} pages` : ''}</div></div></button>`).join('')
        : '<p class="hint">No matches. Just type the details below!</p>';
    } catch {
      if (seq === searchSeq && $('#search-results')) $('#search-results').innerHTML = '<p class="hint">Search is offline. Type the details below instead.</p>';
    }
  }, 350);
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------
let timerTick = null;

function timerElapsed(t) {
  const end = t.pausedAt || Date.now();
  return Math.max(0, end - t.startedAt - (t.pausedMs || 0));
}

function renderTimer() {
  const root = $('#timer-root');
  const t = state.timer;
  clearInterval(timerTick);
  if (!t) { root.innerHTML = ''; return; }
  const k = state.kids.find((x) => x.id === t.kidId);
  const b = bookById(t.bookId);
  const bubbles = Array.from({ length: 10 }, (_, i) => {
    const size = 30 + ((i * 37) % 90);
    return `<span style="left:${(i * 53) % 100}%;width:${size}px;height:${size}px;animation-duration:${10 + ((i * 7) % 12)}s;animation-delay:-${(i * 3) % 10}s"></span>`;
  }).join('');
  root.innerHTML = `<div class="timer">
    <div class="bubbles">${bubbles}</div>
    <div class="who">${esc(k?.avatar || '')} ${esc(k?.name || '')} is reading…</div>
    <div class="clock ${t.pausedAt ? 'paused' : ''}" id="clock">0:00</div>
    ${b ? `<div class="tb">${coverHTML(b, 'plain')}<span>${esc(b.title)}</span></div>` : ''}
    <div class="goalmsg" id="goalmsg"></div>
    <div class="controls">
      <button class="round" data-action="timer-cancel" aria-label="Cancel">${ICONS.close}</button>
      <button class="round main" data-action="timer-toggle" aria-label="${t.pausedAt ? 'Resume' : 'Pause'}">${t.pausedAt ? ICONS.play : ICONS.pause}</button>
      <button class="round" data-action="timer-done" aria-label="Done">${ICONS.check}</button>
    </div>
    <div class="labels"><span>Cancel</span><span class="main">${t.pausedAt ? 'Resume' : 'Pause'}</span><span>Done</span></div>
  </div>`;
  const tick = () => {
    const ms = timerElapsed(t);
    const s = Math.floor(ms / 1000);
    const clock = $('#clock');
    if (!clock) return;
    clock.textContent = s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${Math.floor(s / 60)}:${pad(s % 60)}`;
    const goal = k?.dailyGoal || 20;
    const already = k ? minutesByDay(k.id)[dayKey()] || 0 : 0;
    const left = goal - already - Math.floor(s / 60);
    $('#goalmsg').textContent = left > 0 ? `${plural(left, 'minute')} to reach today's goal` : "🎯 You've reached today's goal!";
    if (left <= 0 && !t.celebrated) { t.celebrated = true; save(); confetti(); }
  };
  tick();
  timerTick = setInterval(tick, 1000);
}

// ---------------------------------------------------------------------------
// Toasts & confetti
// ---------------------------------------------------------------------------
function toast(icon, title, sub = '') {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="ti">${esc(icon)}</div><div>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
  const root = $('#toast-root');
  root.appendChild(el);
  while (root.children.length > 2) root.firstElementChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti');
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
  ctx.scale(dpr, dpr);
  const colors = ['#7c5cff', '#ff5c8a', '#ffd43b', '#20c997', '#339af0', '#ff8a3d'];
  const parts = Array.from({ length: 140 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 14 - 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    c: pick(colors),
  }));
  const t0 = performance.now();
  const frame = (t) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.cos(t / 100 + p.r));
      ctx.restore();
    }
    if (t - t0 < 3000) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
function commit() {
  save();
  render();
  const k = kid();
  if (k) checkBadges(k);
}

/** Find this reader's book by title, or put a new one on their Reading shelf. */
function findOrAddBook(k, title, format) {
  const t = title.trim();
  const same = kidBooks(k.id).find((b) => b.title.trim().toLowerCase() === t.toLowerCase());
  if (same) {
    if (same.status === 'want') same.status = 'reading';
    return same;
  }
  const b = {
    id: uid(), kidId: k.id, title: t, author: '', totalPages: null, coverUrl: '', format: format || 'print',
    hue: hueOf(t), status: 'reading', rating: null, currentPage: 0, createdAt: new Date().toISOString(), finishedAt: null,
  };
  state.books.push(b);
  return b;
}

function addSession({ bookId, newTitle, format, minutes, date, page, finished }) {
  const k = kid();
  const b = bookById(bookId) || (newTitle ? findOrAddBook(k, newTitle, format) : null);
  const before = statsFor(k);
  let pages = 0;
  if (b) {
    const prev = b.currentPage || 0;
    let now = page === '' || page == null ? null : clamp(Number(page), 0, b.totalPages || 100000);
    if (finished && b.totalPages) now = b.totalPages;
    if (now != null && now > prev) { pages = now - prev; b.currentPage = now; }
  }
  state.sessions.push({ id: uid(), kidId: k.id, bookId: b ? b.id : null, date, minutes, pages, createdAt: new Date().toISOString() });
  commit();
  const after = statsFor(k);
  const goal = dailyGoalOf(k);
  const weekGoal = weeklyGoalOf(k);
  if (before.thisWeek < weekGoal && after.thisWeek >= weekGoal) {
    confetti();
    toast('🏆', 'Weekly goal reached!', `${fmtMinutes(after.thisWeek)} this week. ${pick(CHEERS)}`);
  } else if (date === dayKey() && before.today < goal && after.today >= goal) {
    confetti();
    toast('🎯', 'Daily goal reached!', `${after.today} minutes today. ${pick(CHEERS)}`);
  } else {
    toast('📖', pick(CHEERS), `${fmtMinutes(minutes)} of reading logged`);
  }
  if (b && finished) openModal('rate', { id: b.id });
}

function loadDemo() {
  const mk = (name, avatar, color, dailyGoal) => ({ id: uid(), name, avatar, color, dailyGoal, weeklyGoal: dailyGoal * 5, badges: {}, createdAt: new Date().toISOString() });
  const a = mk('Maya', '🦄', '#7c5cff', 20);
  const b = mk('Leo', '🦖', '#12b886', 15);
  const books = [
    [a, 'Charlotte\'s Web', 'E. B. White', 184, 'finished', 5],
    [a, 'Matilda', 'Roald Dahl', 240, 'finished', 4],
    [a, 'The Wild Robot', 'Peter Brown', 288, 'reading', 0, 142],
    [a, 'Wonder', 'R. J. Palacio', 320, 'want', 0],
    [b, 'Dog Man', 'Dav Pilkey', 240, 'reading', 0, 96],
    [b, 'The Bad Guys', 'Aaron Blabey', 144, 'finished', 5],
    [b, 'Frog and Toad Are Friends', 'Arnold Lobel', 64, 'want', 0],
  ].map(([k, title, author, totalPages, status, rating, currentPage]) => ({
    id: uid(), kidId: k.id, title, author, totalPages, status, rating: rating || null,
    currentPage: status === 'finished' ? totalPages : currentPage || 0, hue: hueOf(title),
    createdAt: new Date().toISOString(), finishedAt: status === 'finished' ? new Date().toISOString() : null,
  }));
  const sessions = [];
  for (const [k, days, base] of [[a, 24, 20], [b, 9, 12]]) {
    const reading = books.find((x) => x.kidId === k.id && x.status === 'reading');
    for (let i = days; i >= 1; i--) {
      if (i % 9 === 4) continue; // a few missed days for realism
      const minutes = base + Math.round(Math.sin(i * 1.7) * 8 + 6);
      sessions.push({ id: uid(), kidId: k.id, bookId: reading.id, date: dayKey(addDays(new Date(), -i)), minutes, pages: Math.round(minutes / 2), createdAt: new Date().toISOString() });
    }
  }
  state.kids.push(a, b);
  state.books.push(...books);
  state.sessions.push(...sessions);
  state.activeKidId = a.id;
  for (const k of [a, b]) { const st = statsFor(k); for (const bd of BADGES) if (st[bd.stat] >= bd.goal) k.badges[bd.id] = dayKey(); }
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reading-quest-backup-${dayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    try {
      const data = normalize(JSON.parse(await file.text()));
      if (!data.kids.length) throw new Error('empty');
      if (state.kids.length && !confirm('Replace all current reading data with this backup?')) return;
      state = data;
      state.timer = null;
      closeModal();
      commit();
      renderTimer();
      toast('✅', 'Backup restored', `${plural(state.kids.length, 'reader')} imported`);
    } catch {
      toast('⚠️', "That file didn't work", 'Pick a Reading Quest backup (.json)');
    }
  };
  input.click();
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
const actions = {
  tab: (el) => { ui.tab = el.dataset.tab; render(); scrollTo({ top: 0, behavior: 'smooth' }); },
  filter: (el) => { ui.bookFilter = el.dataset.filter; render(); },
  'switch-kid': () => { ui.picking = true; render(); },
  'choose-kid': (el) => { state.activeKidId = el.dataset.id; ui.picking = false; ui.tab = 'home'; save(); render(); },
  parent: () => requirePin(openParent),
  'parent-lock': () => lockParent(),
  'add-kid': () => openModal('kid'),
  'edit-kid': (el) => openModal('kid', { id: el.dataset.id }),
  'delete-kid': () => {
    const k = state.kids.find((x) => x.id === ui.modal.id);
    if (!confirm(`Remove ${k.name} and all of their books and reading history?`)) return;
    state.kids = state.kids.filter((x) => x.id !== k.id);
    state.books = state.books.filter((b) => b.kidId !== k.id);
    state.sessions = state.sessions.filter((s) => s.kidId !== k.id);
    if (state.timer?.kidId === k.id) { state.timer = null; renderTimer(); }
    if (state.activeKidId === k.id) state.activeKidId = state.kids[0]?.id || null;
    closeModal();
    commit();
  },
  draft: (el) => {
    const m = ui.modal;
    syncDraftFromForm();
    const v = el.dataset.val;
    m.draft[el.dataset.key] = ['dailyGoal', 'weeklyGoal'].includes(el.dataset.key) ? Number(v) : v;
    if (el.dataset.key === 'weeklyGoal') m.draft.weeklyCustom = false;
    if (el.dataset.key === 'weeklyCustom') m.draft.weeklyCustom = true;
    if (el.dataset.key === 'bookId') m.draft.page = '';
    const search = $('[data-search]')?.value;
    const results = $('#search-results')?.innerHTML;
    renderModal();
    if (el.dataset.key === 'weeklyCustom') $('#kid-weekly')?.select();
    if (search != null && $('[data-search]')) { $('[data-search]').value = search; $('#search-results').innerHTML = results; }
  },
  // Mouse/touch presses are handled on pointerdown (with hold-to-repeat); this covers keyboard presses.
  bump: (el, e) => { if (e.detail === 0) bump(el); },
  'add-book': (el) => openModal('book', { status: el.dataset.status || 'reading' }),
  'edit-book': (el) => openModal('book', { id: el.dataset.id }),
  'open-book': (el) => openModal('bookDetail', { id: el.dataset.id }),
  'pick-result': (el) => {
    const r = searchResults[Number(el.dataset.i)];
    if (!r) return;
    Object.assign(ui.modal.draft, { title: r.title, author: r.author, totalPages: r.totalPages, coverUrl: r.coverUrl });
    renderModal();
  },
  'delete-book': (el) => requirePin(() => {
    const b = bookById(el.dataset.id);
    if (!confirm(`Remove "${b.title}" from the shelf? Reading time stays in your history.`)) return;
    state.books = state.books.filter((x) => x.id !== b.id);
    state.sessions.forEach((s) => { if (s.bookId === b.id) s.bookId = null; });
    closeModal();
    commit();
  }),
  'set-status': (el) => {
    const b = bookById(el.dataset.id);
    b.status = el.dataset.status;
    if (b.status === 'reading') { b.currentPage = 0; b.finishedAt = null; }
    closeModal();
    commit();
    toast('📖', `Started "${b.title}"`, 'Happy reading!');
  },
  'finish-book': (el) => openModal('rate', { id: el.dataset.id }),
  rate: (el) => { ui.modal.rating = Number(el.dataset.val); renderModal(); },
  'save-rating': () => {
    const b = bookById(ui.modal.id);
    const wasFinished = b.status === 'finished';
    b.rating = ui.modal.rating;
    b.status = 'finished';
    b.finishedAt = b.finishedAt || new Date().toISOString();
    if (b.totalPages) {
      // Count the unread remainder as pages read when a book is marked finished.
      const left = b.totalPages - (b.currentPage || 0);
      if (left > 0) {
        const last = state.sessions.filter((s) => s.bookId === b.id).sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''))[0];
        if (last) last.pages = (last.pages || 0) + left;
      }
      b.currentPage = b.totalPages;
    }
    closeModal();
    commit();
    if (!wasFinished) { confetti(); toast('🏆', 'Book finished!', `"${b.title}" is on your finished shelf`); }
  },
  log: (el) => openModal('log', { bookId: el.dataset.book }),
  'delete-session': (el) => requirePin(() => {
    if (!confirm('Delete this reading entry?')) return;
    state.sessions = state.sessions.filter((s) => s.id !== el.dataset.id);
    commit();
  }),
  'stats-range': (el) => { ui.statsRange = el.dataset.range; ui.statsOffset = 0; render(); },
  'stats-shift': (el) => { ui.statsOffset = Math.min(0, ui.statsOffset + Number(el.dataset.by)); render(); },
  'pin-key': (el) => pinKey(el.dataset.val),
  'pin-forgot': () => {
    const then = ui.modal.then;
    openModal('gate', { a: 12 + Math.floor(Math.random() * 8), b: 13 + Math.floor(Math.random() * 7), then });
  },
  'pin-set': () => openModal('pin', { mode: 'set', entry: '' }),
  'pin-off': () => {
    if (!confirm('Turn off the parent PIN?')) return;
    const { pinHash: _h, pinSalt: _s, ...rest } = state.settings;
    state.settings = rest;
    save();
    renderModal();
    toast('🔓', 'PIN turned off');
  },
  'sync-signup': (el) => syncAuth('signUp', el.closest('form')),
  'sync-reset': async (el) => {
    const email = el.closest('form').elements.email.value.trim();
    if (!email) { setSyncMsg('Type your family email first.', true); return; }
    try { await Sync.resetPassword(email); setSyncMsg(`Password reset email sent to ${email}.`); } catch (e) { setSyncMsg(e.message, true); }
  },
  'sync-signout': async () => {
    if (!confirm('Sign out of family sync on this device? Reading already here stays on this device.')) return;
    await Sync.signOut().catch(() => {});
    toast('☁️', 'Signed out', 'This device no longer syncs');
  },
  'start-timer': (el) => {
    const k = kid();
    const bookId = el.dataset.book || kidBooks(k.id).find((b) => b.status === 'reading')?.id || null;
    state.timer = { kidId: k.id, bookId, startedAt: Date.now(), pausedMs: 0, pausedAt: null };
    closeModal();
    save();
    renderTimer();
  },
  'timer-toggle': () => {
    const t = state.timer;
    if (t.pausedAt) { t.pausedMs += Date.now() - t.pausedAt; t.pausedAt = null; } else t.pausedAt = Date.now();
    save();
    renderTimer();
  },
  'timer-cancel': () => {
    if (timerElapsed(state.timer) > 60000 && !confirm('Stop the timer without saving?')) return;
    state.timer = null;
    save();
    renderTimer();
  },
  'timer-done': () => {
    const t = state.timer;
    const minutes = Math.max(1, Math.round(timerElapsed(t) / 60000));
    state.timer = null;
    state.activeKidId = t.kidId;
    ui.picking = false;
    save();
    renderTimer();
    render();
    openModal('log', { bookId: t.bookId || '', minutes, fromTimer: true });
  },
  close: closeModal,
  backdrop: (el, e) => { if (e.target === el) closeModal(); },
  export: exportData,
  import: (el, e) => { e.preventDefault(); importData(); },
  demo: () => { loadDemo(); closeModal(); commit(); toast('🎲', 'Demo readers added', 'Tap an avatar to switch readers'); },
  reset: () => {
    const where = Sync.email ? 'on EVERY device signed in to your family account' : 'on this device';
    if (!confirm(`Erase ALL readers, books and history ${where}? This cannot be undone.`)) return;
    state = blankState();
    closeModal();
    save();
    render();
    renderTimer();
  },
};

function setSyncMsg(msg, isErr = false) {
  ui.syncMsg = msg;
  ui.syncMsgErr = isErr;
  if (ui.modal?.type === 'parent') renderModal();
}

async function syncAuth(method, form) {
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  ui.syncEmail = email;
  if (!email || password.length < 6) { setSyncMsg('Type the family email and a password with 6+ characters.', true); return; }
  ui.syncBusy = true;
  setSyncMsg(method === 'signUp' ? 'Creating your family account…' : 'Signing in…');
  try {
    await Sync[method](email, password);
    ui.syncMsg = '';
    toast('☁️', method === 'signUp' ? 'Family account created!' : 'Signed in!', 'Reading will now sync across your devices');
  } catch (e) {
    ui.syncMsg = e.message;
    ui.syncMsgErr = true;
  } finally {
    ui.syncBusy = false;
    if (ui.modal?.type === 'parent') renderModal();
  }
}

function bump(el) {
  const input = $('input[name="minutes"]');
  input.value = clamp((Number(input.value) || 0) + Number(el.dataset.by), 1, 600);
}

// Holding + or − keeps counting, getting faster the longer it's held.
let bumpTimer = null;
function stopBump() { clearTimeout(bumpTimer); bumpTimer = null; }
document.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('[data-action="bump"]');
  if (!el) return;
  e.preventDefault();
  bump(el);
  let delay = 400;
  const repeat = () => { bump(el); delay = Math.max(40, delay * 0.8); bumpTimer = setTimeout(repeat, delay); };
  stopBump();
  bumpTimer = setTimeout(repeat, delay);
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, stopBump, true));

/** Keep typed values when a modal re-renders (e.g. after tapping a choice chip). */
function syncDraftFromForm() {
  const form = $('#modal-root form');
  const d = ui.modal?.draft;
  if (!form || !d) return;
  for (const el of form.elements) {
    if (!el.name) continue;
    d[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  }
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el, e);
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'kid-weekly') $('#weekly-hint').innerHTML = weeklyHint(e.target.value);
  if (e.target.matches('[data-search]')) onSearchInput(e.target.value);
  if (e.target.matches('#b-title, #b-author') && ui.modal?.draft) {
    syncDraftFromForm();
    const d = ui.modal.draft;
    $('#draft-cover').innerHTML = coverHTML({ ...d, title: d.title || '?' }, 'plain');
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target;
  const type = form.dataset.form;
  if (!type) return;
  e.preventDefault();
  if (type === 'gate') {
    const m = ui.modal;
    if (Number(form.elements.answer.value) === m.a * m.b) unlock(m.then);
    else { m.error = 'Not quite. Ask a grown-up!'; renderModal(); }
    return;
  }
  if (type === 'signin') { syncAuth('signIn', form); return; }
  syncDraftFromForm();
  const d = ui.modal.draft;

  if (type === 'kid') {
    const name = (d.name || '').trim();
    if (!name) return;
    d.weeklyGoal = Math.round(Number(d.weeklyGoal));
    if (!(d.weeklyGoal >= WEEKLY_MIN && d.weeklyGoal <= WEEKLY_MAX)) { $('#kid-weekly')?.focus(); return; }
    const existing = state.kids.find((x) => x.id === ui.modal.id);
    if (existing) Object.assign(existing, { name, avatar: d.avatar, color: d.color, dailyGoal: d.dailyGoal, weeklyGoal: d.weeklyGoal });
    else {
      const k = { id: uid(), name, avatar: d.avatar, color: d.color, dailyGoal: d.dailyGoal, weeklyGoal: d.weeklyGoal, badges: {}, createdAt: new Date().toISOString() };
      state.kids.push(k);
      state.activeKidId = k.id;
      ui.picking = false;
      ui.tab = 'home';
    }
    closeModal();
    commit();
  }

  if (type === 'book') {
    const title = d.title.trim();
    if (!title) return;
    const format = FORMATS[d.format] ? d.format : 'print';
    const totalPages = format !== 'audio' && Number(d.totalPages) > 0 ? Math.round(Number(d.totalPages)) : null;
    const existing = bookById(ui.modal.id);
    if (existing) {
      Object.assign(existing, { title, author: d.author.trim(), totalPages, format, status: d.status });
      if (d.status === 'finished') existing.finishedAt = existing.finishedAt || new Date().toISOString();
      closeModal();
      commit();
      return;
    }
    const b = {
      id: uid(), kidId: kid().id, title, author: d.author.trim(), totalPages, format, coverUrl: d.coverUrl || '',
      hue: hueOf(title), status: d.status, rating: null, currentPage: d.status === 'finished' ? totalPages || 0 : 0,
      createdAt: new Date().toISOString(), finishedAt: d.status === 'finished' ? new Date().toISOString() : null,
    };
    state.books.push(b);
    ui.bookFilter = d.status;
    closeModal();
    commit();
    if (d.status === 'finished') openModal('rate', { id: b.id });
    else toast(d.status === 'want' ? '🌟' : '📖', d.status === 'want' ? 'Added to your wish list' : 'Added to your shelf', title);
  }

  if (type === 'log') {
    const minutes = clamp(Math.round(Number(d.minutes) || 0), 1, 600);
    const date = d.date && d.date <= dayKey() ? d.date : dayKey();
    const newTitle = d.bookId ? '' : (d.newTitle || '').trim();
    if (!d.bookId && !newTitle) { $('#log-title')?.focus(); return; }
    const entry = { bookId: d.bookId || null, newTitle, format: d.newFormat, minutes, date, page: d.page, finished: !!d.finished };
    closeModal();
    addSession(entry);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && ui.modal) closeModal();
  if (ui.modal?.type === 'pin' && /^[0-9]$/.test(e.key)) pinKey(e.key);
  if (ui.modal?.type === 'pin' && e.key === 'Backspace') pinKey('back');
});

// Refresh "today" when the app comes back after midnight or from the background.
document.addEventListener('visibilitychange', () => {
  // Switching away from the app locks Parent settings.
  if (document.hidden) { if (ui.parentOpen) lockParent(); return; }
  render();
  if (state.timer) renderTimer();
});

Sync.init({
  get: () => state,
  // Another device changed something: take the family's data and redraw.
  apply: (data) => {
    Object.assign(state, data);
    if (state.activeKidId && !state.kids.some((k) => k.id === state.activeKidId)) state.activeKidId = null;
    save();
    render();
    if (ui.modal?.type === 'parent') renderModal();
  },
  onStatus: () => { if (ui.modal?.type === 'parent') renderModal(); },
});

render();
renderTimer();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  // Check for a new version whenever the app is opened or brought back, and reload once it's installed.
  // (If a form is open, wait until it's closed so nothing typed is lost.)
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  const reloadForUpdate = () => {
    if (reloading) return;
    if (ui.modal) { setTimeout(reloadForUpdate, 1000); return; }
    reloading = true;
    location.reload();
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) reloadForUpdate(); });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
}
