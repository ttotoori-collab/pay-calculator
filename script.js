'use strict';
/* ============================================
   How much did I earn? — 알바비 계산기
   데이터는 localStorage에 저장돼요.
   ============================================ */

const STORE_KEY = 'seran-albailgi-v1';
const BACKUP_KEY = 'seran-albailgi-v1-backup';   // 직전 상태 사본 (주 기록이 깨졌을 때 되살리기용)
const THEME_KEY = 'wallet-theme';          // 화면 모드만 따로 저장 (근무 기록과 별개)
const TAB_KEY = 'wallet-tab';              // 마지막으로 본 화면 (work | money)
const NUDGE_DAYS = 14;                     // 이만큼 백업을 안 받으면 한 번 알려줘요
const START = { y: 2026, m: 9 };          // 기본 화면: 2026년 10월 (월은 0부터)
const TAGS = [                             // Finder 태그 색, 등록 순서대로 자동 배정
  { name: 'Red', color: '#ec5a57' },
  { name: 'Orange', color: '#ef8d32' },
  { name: 'Yellow', color: '#efbd3c' },
  { name: 'Green', color: '#3cb64c' },
  { name: 'Blue', color: '#2a72de' },
  { name: 'Purple', color: '#a453d6' },
  { name: 'Gray', color: '#7b7b7b' }
];
const WD_MON = ['월', '화', '수', '목', '금', '토', '일'];   // 월요일 시작 (주휴 기준과 같게)
const WD_SUN = ['일', '월', '화', '수', '목', '금', '토'];   // Date.getDay() 순서

/* ---------- 아이콘 (얇은 선) ---------- */
const ICONS = {
  'chev-left': '<path d="M15 5l-7 7 7 7"/>',
  'chev-right': '<path d="M9 5l7 7-7 7"/>',
  'chev-down': '<path d="M6 9l6 6 6-6"/>',
  'chev-up': '<path d="M6 15l6-6 6 6"/>',
  updown: '<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6"/>',
  list: '<path d="M8.5 6.5H20M8.5 12H20M8.5 17.5H20"/><circle cx="4.5" cy="6.5" r=".9"/><circle cx="4.5" cy="12" r=".9"/><circle cx="4.5" cy="17.5" r=".9"/>',
  group: '<rect x="3" y="5" width="4.6" height="3.4" rx="1"/><rect x="9.7" y="5" width="4.6" height="3.4" rx="1"/><rect x="16.4" y="5" width="4.6" height="3.4" rx="1"/><rect x="3" y="10.3" width="4.6" height="3.4" rx="1"/><rect x="9.7" y="10.3" width="4.6" height="3.4" rx="1"/><rect x="16.4" y="10.3" width="4.6" height="3.4" rx="1"/><path d="M3 18h18"/>',
  share: '<path d="M12 3.5v11M8.2 7.2L12 3.5l3.8 3.7"/><path d="M8 10.5H6.5A1.5 1.5 0 0 0 5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7a1.5 1.5 0 0 0-1.5-1.5H16"/>',
  tag: '<path d="M20.2 12.8l-7.4 7.4a1.6 1.6 0 0 1-2.3 0L3.8 13.5a1.6 1.6 0 0 1-.5-1.1V5a1.6 1.6 0 0 1 1.6-1.6h7.4a1.6 1.6 0 0 1 1.1.5l6.8 6.7a1.6 1.6 0 0 1 0 2.2z"/><circle cx="8.2" cy="8.2" r="1.3"/>',
  more: '<circle cx="12" cy="12" r="8.8"/><circle cx="8.2" cy="12" r=".7" fill="currentColor"/><circle cx="12" cy="12" r=".7" fill="currentColor"/><circle cx="15.8" cy="12" r=".7" fill="currentColor"/>',
  sidebar: '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M9.5 4.5v15M5.5 8.5h1.6M5.5 11h1.6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.6"/><path d="M3.5 9.6h17M8 3v4M16 3v4"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2.6"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12.4h17"/>',
  wallet: '<path d="M16.5 5H6.6A2.6 2.6 0 0 0 4 7.6v9.8A2.6 2.6 0 0 0 6.6 20h11a2.4 2.4 0 0 0 2.4-2.4V9.4A2.4 2.4 0 0 0 17.6 7H4.3"/><path d="M20 11.2h-3.3a1.8 1.8 0 0 0 0 3.6H20"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.6"/><path d="M3.5 9h17M12 9v11"/><path d="M12 9C10.6 5.6 7 5.2 7 7.4 7 8.6 9.6 9 12 9zM12 9c1.4-3.4 5-3.8 5-1.6C17 8.6 14.4 9 12 9z"/>',
  cloud: '<path d="M7.2 18.5h9.9a4 4 0 0 0 .5-7.96A5.4 5.4 0 0 0 7.3 9.3a4.6 4.6 0 0 0-.1 9.2z"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/>',
  tags: '<circle cx="9.3" cy="12" r="5.2"/><path d="M13.2 7.4a5.2 5.2 0 1 1 0 9.2"/>',
  book: '<path d="M4 5.4A1.9 1.9 0 0 1 5.9 3.5H19a1 1 0 0 1 1 1v13.2"/><path d="M4 5.4v13.2A1.9 1.9 0 0 0 5.9 20.5H20"/><path d="M8 8.2h7.5M8 11.6h7.5M8 15h4.5"/>',
  bank: '<path d="M3.6 9.6 12 4.2l8.4 5.4"/><path d="M5.6 9.6v8.2M10 9.6v8.2M14 9.6v8.2M18.4 9.6v8.2"/><path d="M3.4 20.2h17.2"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- 작은 도우미 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const keyOf = dt => ymd(dt.getFullYear(), dt.getMonth(), dt.getDate());
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const toMin = t => { const [h, m] = String(t).split(':').map(Number); return h * 60 + m; };
const fromMin = n => { n = ((n % 1440) + 1440) % 1440; return `${pad(Math.floor(n / 60))}:${pad(n % 60)}`; };
const won = n => Math.round(n || 0).toLocaleString('ko-KR') + '원';
const fmtH = min => {
  min = Math.round(min);
  const h = Math.floor(min / 60), m = min % 60;
  if (!m) return `${h}시간`;
  return h ? `${h}시간 ${m}분` : `${m}분`;
};
const shortH = min => `${Math.round(min / 6) / 10}h`;
const md = dt => `${pad(dt.getMonth() + 1)}.${pad(dt.getDate())}`;
const finderDate = key => { const d = parseYmd(key); return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}. (${WD_SUN[d.getDay()]})`; };
const longDate = key => { const d = parseYmd(key); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WD_SUN[d.getDay()]})`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const safeColor = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : TAGS[0].color);
/* 공제율: 0~100, 소수점 둘째 자리까지. 값이 없거나 이상하면 기본값 */
const safeRate = (v, def) => {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  if (!isFinite(n)) return def;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
};
const rateText = r => String(Math.round(r * 100) / 100);     // 3.30 → "3.3"
const minus = n => n ? '−' + won(n) : won(0);
const TODAY = keyOf(new Date());
const THIS_M = (() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; })();

/* ============================================
   가계부 — 기본 카테고리
   id는 고정이에요 (바꾸면 예전 기록의 카테고리가 끊어져요)
   'etc-out' / 'etc-in'은 지울 수 없어요 — 카테고리를 지우면 그 기록이 여기로 와요
   ============================================ */
const CATS = [
  { id: 'food', name: '식비', emoji: '🍚', color: '#ec5a57', type: 'out' },
  { id: 'cafe', name: '카페·간식', emoji: '☕', color: '#c9803f', type: 'out' },
  { id: 'transit', name: '교통', emoji: '🚌', color: '#3f8ec9', type: 'out' },
  { id: 'shop', name: '쇼핑', emoji: '🛍️', color: '#d664a6', type: 'out' },
  { id: 'living', name: '생활', emoji: '🧻', color: '#6f8f5a', type: 'out' },
  { id: 'telecom', name: '통신·구독', emoji: '📱', color: '#7b6bd6', type: 'out' },
  { id: 'fun', name: '문화·여가', emoji: '🎬', color: '#d6a13c', type: 'out' },
  { id: 'edu', name: '교육', emoji: '📚', color: '#3fa89a', type: 'out' },
  { id: 'etc-out', name: '기타', emoji: '✨', color: '#8a8a8a', type: 'out' },
  { id: 'pay', name: '알바비', emoji: '💸', color: '#2e9e63', type: 'in' },
  { id: 'allowance', name: '용돈', emoji: '🎁', color: '#4a90d9', type: 'in' },
  { id: 'etc-in', name: '기타', emoji: '✨', color: '#8a8a8a', type: 'in' }
];
const FALLBACK_CAT = { out: 'etc-out', in: 'etc-in' };
const CAT_EMOJI = ['🍚','☕','🚌','🛍️','🧻','📱','🎬','📚','✨','💸','🎁','🏥','🐶','🎮','✈️','🎵','💄','🏠','⚽','🍺'];

/* ============================================
   저장 / 불러오기
   ============================================ */
const defaultState = () => ({
  version: 2, jobs: [], shifts: [], lastForm: null, lastExport: 0,
  entries: [], dayMemos: {}, categories: CATS.map(c => ({ ...c })), hiddenAuto: [],
  savings: [], savingSkips: [], budgets: {}, recurring: [], recurringSkips: []
});

function normalize(d) {
  if (!d || typeof d !== 'object') return defaultState();
  const jobs = Array.isArray(d.jobs) ? d.jobs
    .filter(j => j && j.id && j.name)
    .map(j => ({
      id: String(j.id),
      name: String(j.name).slice(0, 20),
      wage: Math.max(0, Math.round(Number(j.wage) || 0)),
      color: safeColor(j.color),
      weeklyBonus: j.weeklyBonus === true,  // 주휴수당 별도 지급 (없으면 해제 = 시급에 포함)
      // 공제 — 예전 데이터에는 없으니 "안 함"으로 채워요 (기록이 깨지지 않게)
      tax: j.tax === true,
      taxRate: safeRate(j.taxRate, 3.3),
      insurance: j.insurance === true,
      insuranceRate: safeRate(j.insuranceRate, 10),
      // 월급날 — 예전 데이터에는 없으니 매달 10일 · 지난달 근무분으로 채워요
      payday: Math.min(31, Math.max(1, Math.round(Number(j.payday)) || 10)),
      payMonth: j.payMonth === 'same' ? 'same' : 'prev'
    })) : [];
  const ids = new Set(jobs.map(j => j.id));
  const shifts = Array.isArray(d.shifts) ? d.shifts
    .filter(s => s && s.id && ids.has(String(s.jobId)) &&
      DATE_RE.test(s.date) && TIME_RE.test(s.start) && TIME_RE.test(s.end))
    .map(s => ({
      id: String(s.id), jobId: String(s.jobId), date: s.date, start: s.start, end: s.end,
      breaks: Array.isArray(s.breaks)
        ? s.breaks.filter(b => b && TIME_RE.test(b.start) && TIME_RE.test(b.end)).map(b => ({ start: b.start, end: b.end }))
        : []
    })) : [];
  // ---- 가계부 ----
  // 카테고리: 예전 데이터에 없으면 기본 카테고리로. 기본 '기타'는 지워졌어도 되살려요
  let categories = Array.isArray(d.categories) && d.categories.length
    ? d.categories
      .filter(c => c && c.id && c.name)
      .map(c => ({
        id: String(c.id),
        name: String(c.name).slice(0, 12),
        emoji: String(c.emoji || '✨').slice(0, 4),
        color: safeColor(c.color),
        type: c.type === 'in' ? 'in' : 'out'
      }))
    : CATS.map(c => ({ ...c }));
  for (const need of ['etc-out', 'etc-in']) {
    if (!categories.some(c => c.id === need)) categories.push({ ...CATS.find(c => c.id === need) });
  }
  const catOf = new Map(categories.map(c => [c.id, c]));

  // ---- 저축 통장 ----
  const savings = Array.isArray(d.savings) ? d.savings
    .filter(v => v && v.id && v.name && DATE_RE.test(v.start) && DATE_RE.test(v.end))
    .map(v => ({
      id: String(v.id),
      name: String(v.name).slice(0, 20),
      bank: String(v.bank || '').slice(0, 20),
      amount: Math.max(0, Math.round(Number(v.amount) || 0)),
      payday: Math.min(31, Math.max(1, Math.round(Number(v.payday)) || 25)),
      start: v.start, end: v.end,
      goal: Math.max(0, Math.round(Number(v.goal) || 0)),   // 0이면 목표액 없음
      color: safeColor(v.color),
      closed: DATE_RE.test(v.closed) ? v.closed : null      // 해지한 날 (없으면 null)
    })) : [];
  const savingIds = new Set(savings.map(v => v.id));

  const entries = Array.isArray(d.entries) ? d.entries
    .filter(e => e && e.id && DATE_RE.test(e.date) && Number(e.amount) > 0)
    .map(e => {
      const type = e.type === 'in' ? 'in' : e.type === 'save' ? 'save' : 'out';
      const cat = catOf.get(String(e.categoryId));
      const out = {
        id: String(e.id), date: e.date, type,
        amount: Math.round(Number(e.amount)),
        memo: String(e.memo || '').slice(0, 60)
      };
      if (type === 'save') out.savingId = savingIds.has(String(e.savingId)) ? String(e.savingId) : null;
      // 카테고리가 지워졌거나 종류가 안 맞으면 그 종류의 '기타'로
      else out.categoryId = cat && cat.type === type ? cat.id : FALLBACK_CAT[type];
      // 낭비 표시는 지출만. 예전 데이터에 없으면 false (꼭 필요했던 지출)
      if (type === 'out') out.wasted = e.wasted === true;
      return out;
    })
    // 통장이 사라진 저축 기록은 버려요 (어디에 넣은 돈인지 알 수 없어서)
    .filter(e => e.type !== 'save' || e.savingId) : [];

  // ---- 매달 고정 지출 ----
  const MONTH_RE = /^\d{4}-\d{2}$/;
  const recurring = Array.isArray(d.recurring) ? d.recurring
    .filter(r => r && r.id && r.name && Number(r.amount) > 0)
    .map(r => {
      const cat = catOf.get(String(r.categoryId));
      return {
        id: String(r.id),
        name: String(r.name).slice(0, 20),
        amount: Math.round(Number(r.amount)),
        day: Math.min(31, Math.max(1, Math.round(Number(r.day)) || 1)),
        categoryId: cat && cat.type === 'out' ? cat.id : FALLBACK_CAT.out,
        start: MONTH_RE.test(r.start) ? r.start : null,
        end: MONTH_RE.test(r.end) ? r.end : null
      };
    }) : [];

  // ---- 달마다 예산 ----
  const budgets = {};
  if (d.budgets && typeof d.budgets === 'object') {
    for (const [k, v] of Object.entries(d.budgets)) {
      if (MONTH_RE.test(k) && Number(v) >= 0) budgets[k] = Math.round(Number(v));
    }
  }
  const strList = x => Array.isArray(x) ? [...new Set(x.filter(v => typeof v === 'string'))] : [];

  const dayMemos = {};
  if (d.dayMemos && typeof d.dayMemos === 'object') {
    for (const [k, v] of Object.entries(d.dayMemos)) {
      if (DATE_RE.test(k) && typeof v === 'string' && v.trim()) dayMemos[k] = v.slice(0, 500);
    }
  }
  return {
    ...d,                       // 예전 버전에서 쓰던 값(메모 등)은 그대로 보관
    version: 2, jobs, shifts,
    lastForm: d.lastForm && TIME_RE.test(d.lastForm.start) ? d.lastForm : null,
    lastExport: Math.max(0, Number(d.lastExport) || 0),
    entries, dayMemos, categories,
    hiddenAuto: strList(d.hiddenAuto),
    savings, savingSkips: strList(d.savingSkips),
    budgets, recurring, recurringSkips: strList(d.recurringSkips)
  };
}

/* ---------- 저장소 상태 ----------
   기록은 이 브라우저 안에만 있어요. 그래서 못 읽었을 때 함부로 덮어쓰면 영영 사라져요.
   - locked: 기록을 못 읽은 상태. 복구를 고르기 전까지 저장을 아예 막아요
   - broken: 못 읽은 원본 문자열 (파일로 내려받아 둘 수 있게 보관)
*/
const store = { ok: true, locked: false, broken: null, recovered: false, persisted: null };

function readKey(k) {
  try { return localStorage.getItem(k); }
  catch (e) { store.ok = false; return null; }   // 시크릿 모드 등으로 저장소 자체를 못 쓰는 경우
}
function parseState(raw) {
  const n = normalize(JSON.parse(raw));
  if (!Array.isArray(n.jobs) || !Array.isArray(n.shifts)) throw new Error('모양이 이상해요');
  return n;
}

function load() {
  const raw = readKey(STORE_KEY);
  if (!store.ok || !raw) return defaultState();     // 저장소를 못 쓰거나, 처음 쓰는 사람
  try {
    return parseState(raw);
  } catch (e) {
    // 주 기록이 깨졌으면 사본으로 되살려 봐요
    const bak = readKey(BACKUP_KEY);
    if (bak) {
      try { const s2 = parseState(bak); store.recovered = true; store.broken = raw; return s2; }
      catch (e2) { /* 사본도 못 읽음 */ }
    }
    // 둘 다 못 읽음 → 덮어쓰지 않고 멈춰요 (원본은 저장소에 그대로 둬요)
    store.locked = true; store.broken = raw;
    return defaultState();
  }
}

let saveWarned = false;
function save() {
  if (store.locked) return;                        // 복구를 고르기 전에는 절대 덮어쓰지 않아요
  let json;
  try { json = JSON.stringify(state); } catch (e) { return; }
  try {
    const prev = localStorage.getItem(STORE_KEY);
    if (prev && prev !== json) localStorage.setItem(BACKUP_KEY, prev);   // 직전 상태를 사본으로 남김
    localStorage.setItem(STORE_KEY, json);
    store.ok = true;
    return;
  } catch (e) { /* 아래에서 다시 시도 */ }
  try {                                            // 자리가 모자라면 사본부터 버리고 다시
    localStorage.removeItem(BACKUP_KEY);
    localStorage.setItem(STORE_KEY, json);
    store.ok = true;
    return;
  } catch (e) { /* 진짜로 저장 불가 */ }
  store.ok = false;
  if (!saveWarned) {
    saveWarned = true;
    toast('기록을 저장하지 못했어요. 시크릿 모드이거나 저장 공간이 부족할 수 있어요.', {
      label: '백업 받기', ms: 8000, fn: exportData
    });
  }
}

/* 브라우저에게 "이 기록은 함부로 지우지 말아 주세요"라고 요청해요 (되면 좋고, 안 돼도 그만) */
async function askPersist() {
  try {
    if (!navigator.storage || !navigator.storage.persisted) return;
    store.persisted = await navigator.storage.persisted();
    if (!store.persisted && navigator.storage.persist) store.persisted = await navigator.storage.persist();
  } catch (e) { /* 무시 */ }
  renderStoreNote();
}

/* ============================================
   화면 모드 (자동 / 낮 / 밤)
   - 'auto'면 기기 설정을 따라가요 (라이트=낮, 다크=밤)
   - 실제로 칠해지는 값은 <html data-theme="day|night">
   ============================================ */
const THEME_COLOR = { day: '#2b96c4', night: '#0b1b3a' };
const darkMq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;

function loadTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'day' || v === 'night' ? v : 'auto';
  } catch (e) { return 'auto'; }
}
let themePref = loadTheme();
const resolvedTheme = () => themePref === 'auto' ? (darkMq && darkMq.matches ? 'night' : 'day') : themePref;

function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.setAttribute('data-theme', t);
  const meta = $('meta[name=theme-color]');
  if (meta) meta.setAttribute('content', THEME_COLOR[t]);
  $$('[data-action=theme]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === themePref)));
}
function setTheme(mode) {
  themePref = mode;
  try {
    if (mode === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, mode);
  } catch (e) { /* 시크릿 모드면 이번만 적용돼요 */ }
  applyTheme();
}
// 자동일 때 기기 설정이 바뀌면 같이 바뀌게
if (darkMq) {
  const onScheme = () => { if (themePref === 'auto') applyTheme(); };
  darkMq.addEventListener ? darkMq.addEventListener('change', onScheme) : darkMq.addListener(onScheme);
}

function loadTab() {
  try { const v = localStorage.getItem(TAB_KEY); return v === 'money' || v === 'save' ? v : 'work'; }
  catch (e) { return 'work'; }
}
function saveTab() {
  try { localStorage.setItem(TAB_KEY, ui.app); } catch (e) { /* 시크릿 모드 */ }
}

let state = load();
const ui = {
  app: loadTab(),        // work(알바) | money(가계부)
  view: 'calendar',      // calendar | jobs | pay | bonus
  mode: 'grid',          // grid(달력) | list(리스트)
  group: false,          // 알바별 묶어보기
  filter: null,          // 태그로 고른 알바 id
  sort: { key: 'date', dir: 1 },
  y: START.y, m: START.m
};

/* ============================================
   계산
   ============================================ */
const jobById = id => state.jobs.find(j => j.id === id);
const byDateStart = (a, b) => a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date);
const shiftsOn = (date, jobId) =>
  state.shifts.filter(s => s.date === date && (!jobId || s.jobId === jobId)).sort(byDateStart);
const monthShifts = (y, m, jobId) => {
  const pre = `${y}-${pad(m + 1)}`;
  return state.shifts.filter(s => s.date.startsWith(pre) && (!jobId || s.jobId === jobId)).sort(byDateStart);
};

/* 한 근무의 순수 근무시간(분)과 확인 메시지 */
function analyze(s) {
  const res = { minutes: 0, overnight: false, errors: [], warns: [] };
  if (!s.start || !s.end) { res.errors.push('근무 시작·종료 시간을 입력해 주세요.'); return res; }
  let st = toMin(s.start), en = toMin(s.end);
  if (en === st) { res.errors.push('시작과 종료 시간이 같아요.'); return res; }
  if (en < st) { en += 1440; res.overnight = true; }   // 자정을 넘기는 근무

  const ivs = [];
  let incomplete = false, outside = false;
  for (const b of s.breaks || []) {
    if (!b.start && !b.end) continue;
    if (!b.start || !b.end || b.start === b.end) { incomplete = true; continue; }
    let bs = toMin(b.start), be = toMin(b.end);
    if (res.overnight && bs < st) bs += 1440;
    if (be <= bs) be += 1440;
    const cs = Math.max(st, bs), ce = Math.min(en, be);
    if (cs !== bs || ce !== be) outside = true;
    if (ce > cs) ivs.push([cs, ce]);
  }
  // 겹치는 휴게시간은 한 번만 빼기
  ivs.sort((a, b) => a[0] - b[0]);
  let brk = 0, cs = null, ce = null, overlap = false;
  for (const [a, b] of ivs) {
    if (ce === null) { cs = a; ce = b; }
    else if (a < ce) { overlap = true; ce = Math.max(ce, b); }
    else { brk += ce - cs; cs = a; ce = b; }
  }
  if (ce !== null) brk += ce - cs;

  res.minutes = Math.max(0, en - st - brk);
  if (incomplete) res.errors.push('휴게시간의 시작·종료를 모두 입력해 주세요.');
  if (outside) res.warns.push('근무시간 밖에 있는 휴게시간은 빼고 계산했어요.');
  if (overlap) res.warns.push('겹치는 휴게시간은 한 번만 계산했어요.');
  if (!res.errors.length && res.minutes <= 0) res.errors.push('순수 근무시간이 0분이에요.');
  return res;
}
const netMinutes = s => analyze(s).minutes;
const shiftPay = s => { const j = jobById(s.jobId); return j ? Math.round(netMinutes(s) / 60 * j.wage) : 0; };

/* 그 달에 일요일이 있는 주(월~일) 목록 */
function weeksOfMonth(y, m) {
  const out = [];
  const first = new Date(y, m, 1);
  const sun = new Date(y, m, 1 + (7 - first.getDay()) % 7);
  while (sun.getMonth() === m) {
    const mon = new Date(sun.getFullYear(), sun.getMonth(), sun.getDate() - 6);
    out.push({ mon, sun: new Date(sun), monK: keyOf(mon), sunK: keyOf(sun) });
    sun.setDate(sun.getDate() + 7);
  }
  return out;
}

/* 주휴수당: 15시간 이상 → (주 근무시간 ÷ 40) × 8, 최대 8시간 */
function holidayFor(minutes, wage) {
  if (minutes < 15 * 60) return { ok: false, hours: 0, pay: 0 };
  const hours = Math.min(minutes / 60 / 40 * 8, 8);
  return { ok: true, hours, pay: Math.round(hours * wage) };
}

function monthCalc(y, m) {
  const pre = `${y}-${pad(m + 1)}`;
  const weeks = weeksOfMonth(y, m);
  const mins = new Map(state.shifts.map(s => [s.id, netMinutes(s)]));
  const paidWeeks = new Set();
  let total = 0, totalMin = 0, totalTax = 0, totalIns = 0, totalNet = 0;

  const jobs = state.jobs.map(job => {
    const mine = state.shifts.filter(s => s.jobId === job.id);
    const inMonth = mine.filter(s => s.date.startsWith(pre));
    const minutes = inMonth.reduce((a, s) => a + mins.get(s.id), 0);
    const base = Math.round(minutes / 60 * job.wage);      // 기본급: 실제 근무한 날짜의 달
    const wk = weeks.map(w => {
      const wmin = mine.filter(s => s.date >= w.monK && s.date <= w.sunK)
        .reduce((a, s) => a + mins.get(s.id), 0);
      const h = job.weeklyBonus ? holidayFor(wmin, job.wage) : { ok: false, hours: 0, pay: 0 };
      if (h.ok) paidWeeks.add(w.monK);
      return { ...w, minutes: wmin, ...h };
    });
    const holiday = wk.reduce((a, w) => a + w.pay, 0);
    // 합계(기본급+주휴수당)에서 공제를 빼면 실수령액. 각각 원 단위 반올림
    const gross = base + holiday;
    const tax = job.tax ? Math.round(gross * job.taxRate / 100) : 0;
    const ins = job.insurance ? Math.round(gross * job.insuranceRate / 100) : 0;
    const net = gross - tax - ins;
    total += gross; totalTax += tax; totalIns += ins; totalNet += net;
    totalMin += minutes;
    return {
      job, bonus: job.weeklyBonus, minutes, base, holiday, total: gross, weeks: wk,
      tax, ins, net, deducted: tax > 0 || ins > 0 || job.tax || job.insurance,
      holidayWeeks: wk.filter(w => w.ok).length,
      days: new Set(inMonth.map(s => s.date)).size,
      count: inMonth.length
    };
  });
  return { jobs, total, minutes: totalMin, paidWeeks: paidWeeks.size,
    tax: totalTax, ins: totalIns, net: totalNet, deducted: totalTax > 0 || totalIns > 0 };
}

/* 달 마지막 주가 다음 달로 넘어가면 안내 */
function spillWeek(y, m) {
  const last = new Date(y, m + 1, 0);
  if (last.getDay() === 0) return null;
  const mon = new Date(y, m, last.getDate() - (last.getDay() + 6) % 7);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { mon, sun };
}

/* ============================================
   가계부 계산
   ============================================ */
const catById = id => state.categories.find(c => c.id === id);
const catsOf = type => state.categories.filter(c => c.type === type);
const catSafe = (id, type) => catById(id) || catById(FALLBACK_CAT[type]) || state.categories[0];

/* 월급날에 자동으로 생기는 "알바비" 수입.
   저장하지 않고 그때그때 계산해요 — 근무를 고치면 바로 반영되게. */
function autoPayEntries(y, m) {
  const out = [];
  const last = new Date(y, m + 1, 0).getDate();
  for (const job of state.jobs) {
    const day = Math.min(job.payday || 10, last);          // 그 달에 없는 날짜면 말일로
    const date = ymd(y, m, day);
    // 어느 달 근무분인지
    const w = job.payMonth === 'same' ? new Date(y, m, 1) : new Date(y, m - 1, 1);
    const wc = monthCalc(w.getFullYear(), w.getMonth());
    const row = wc.jobs.find(r => r.job.id === job.id);
    if (!row || row.net <= 0) continue;
    const id = `auto:${job.id}:${date}`;
    if (state.hiddenAuto.includes(id)) continue;
    out.push({
      id, date, type: 'in', amount: row.net, categoryId: 'pay', auto: true,
      memo: `${job.name} · ${w.getMonth() + 1}월 근무분`
    });
  }
  return out;
}

/* ---------- 저축 통장 ---------- */
const savingById = id => state.savings.find(v => v.id === id);
const monthKey = (y, m) => `${y}-${pad(m + 1)}`;
/* 통장이 더 넣을 수 있는 마지막 날 — 만기일, 해지했으면 해지한 날 */
const savingLastDay = v => (v.closed && v.closed < v.end) ? v.closed : v.end;

/* 납입일마다 자동으로 생기는 저축 기록 (저장하지 않고 그때그때 계산) */
function autoSaveEntries(y, m) {
  const out = [];
  const last = new Date(y, m + 1, 0).getDate();
  for (const v of state.savings) {
    if (!v.amount) continue;
    const date = ymd(y, m, Math.min(v.payday, last));     // 그 달에 없는 날짜면 말일로
    if (date < v.start || date > savingLastDay(v)) continue;   // 시작 전·만기 후·해지 후는 안 넣어요
    const id = `save:${v.id}:${date}`;
    if (state.savingSkips.includes(id)) continue;
    out.push({ id, date, type: 'save', amount: v.amount, savingId: v.id, auto: true,
      memo: `${v.name} 자동 납입` });
  }
  return out;
}

/* 매달 고정 지출 */
function autoRecurEntries(y, m) {
  const out = [];
  const last = new Date(y, m + 1, 0).getDate();
  const mk = monthKey(y, m);
  for (const r of state.recurring) {
    if (r.start && mk < r.start) continue;
    if (r.end && mk > r.end) continue;
    const date = ymd(y, m, Math.min(r.day, last));
    const id = `recur:${r.id}:${date}`;
    if (state.recurringSkips.includes(id)) continue;
    out.push({ id, date, type: 'out', amount: r.amount, categoryId: r.categoryId, auto: true,
      memo: `${r.name} (매달)` });
  }
  return out;
}

/* 그 달 자동 기록 전부 (알바비 · 저축 · 고정 지출) */
const autoEntries = (y, m) => [...autoPayEntries(y, m), ...autoSaveEntries(y, m), ...autoRecurEntries(y, m)];

/* 그날 기록 (자동 + 직접 쓴 것) */
function entriesOn(date) {
  const [y, m] = date.split('-').map(Number);
  return [...autoEntries(y, m - 1).filter(e => e.date === date),
    ...state.entries.filter(e => e.date === date)];
}

/* 그 달 전체 */
function monthMoney(y, m) {
  const pre = monthKey(y, m);
  const list = [...autoEntries(y, m), ...state.entries.filter(e => e.date.startsWith(pre))];
  let income = 0, expense = 0, saved = 0, wasted = 0;
  const byCat = new Map();
  const byWaste = new Map();
  const byDay = new Map();
  const wastedList = [];
  for (const e of list) {
    if (e.type === 'in') income += e.amount;
    else if (e.type === 'save') saved += e.amount;
    else {
      expense += e.amount;
      byCat.set(e.categoryId, (byCat.get(e.categoryId) || 0) + e.amount);
      if (e.wasted) {
        wasted += e.amount;
        wastedList.push(e);
        byWaste.set(e.categoryId, (byWaste.get(e.categoryId) || 0) + e.amount);
      }
    }
    const d = byDay.get(e.date) || { in: 0, out: 0, save: 0, waste: 0 };
    d[e.type] += e.amount;
    if (e.type === 'out' && e.wasted) d.waste += e.amount;
    byDay.set(e.date, d);
  }
  const sortCats = mp => [...mp.entries()]
    .map(([id, sum]) => ({ cat: catSafe(id, 'out'), sum }))
    .sort((a, b) => b.sum - a.sum);
  const cats = sortCats(byCat);
  return { list, income, expense, saved, left: income - expense - saved,
    top: cats.slice(0, 3), cats, byDay, count: list.length,
    wasted, wastedList: wastedList.sort((a, b) => a.date.localeCompare(b.date)),
    wasteTop: sortCats(byWaste).slice(0, 3) };
}

/* 통장에 지금까지 모인 돈 — 오늘까지의 자동 납입 + 직접 넣은 돈 */
function savingPaid(v) {
  let total = 0, times = 0;
  const stop = savingLastDay(v) < TODAY ? savingLastDay(v) : TODAY;
  const a = parseYmd(v.start), b = parseYmd(stop);
  for (let d = new Date(a.getFullYear(), a.getMonth(), 1); d <= b; d.setMonth(d.getMonth() + 1)) {
    for (const e of autoSaveEntries(d.getFullYear(), d.getMonth())) {
      if (e.savingId === v.id && e.date <= stop) { total += e.amount; times++; }
    }
  }
  for (const e of state.entries) {
    if (e.type === 'save' && e.savingId === v.id && e.date <= TODAY) { total += e.amount; times++; }
  }
  return { total, times };
}

/* 통장 상태: 모인 돈 · 진행률 · 만기까지 며칠 · 이번 달 넣었는지 */
function savingInfo(v) {
  const { total, times } = savingPaid(v);
  const endD = parseYmd(v.end), todayD = parseYmd(TODAY);
  const dday = Math.round((endD - todayD) / 86400000);
  const statusDone = !!v.closed || dday < 0;
  const status = v.closed ? '해지' : dday < 0 ? '만기' : null;
  // 진행률: 목표액이 있으면 금액 기준, 없으면 만기까지 기간 기준
  let pct;
  if (v.goal > 0) pct = Math.min(100, Math.round(total / v.goal * 100));
  else {
    const all = parseYmd(v.end) - parseYmd(v.start);
    pct = all > 0 ? Math.min(100, Math.max(0, Math.round((todayD - parseYmd(v.start)) / all * 100))) : 100;
  }
  // 이번 달에 "실제로 넣은" 돈 — 납입일이 아직 안 왔으면 0
  // (달력·월 요약은 앞으로 나갈 돈까지 보여주지만, 통장 카드는 지금까지 넣은 것만 세요)
  const mk = monthKey(ui.y, ui.m);
  const thisMonth = [...autoSaveEntries(ui.y, ui.m), ...state.entries.filter(e => e.type === 'save' && e.date.startsWith(mk))]
    .filter(e => e.savingId === v.id && e.date <= TODAY)
    .reduce((a, e) => a + e.amount, 0);
  return { total, times, dday, status, statusDone, pct, thisMonth };
}

/* ---------- 달마다 예산 ---------- */
/* 이번 달 값이 없으면 가장 가까운 지난달 값을 기본으로 보여줘요 (저장은 안 함) */
function budgetOf(y, m) {
  const set = state.budgets[monthKey(y, m)];
  if (set !== undefined) return { amount: set, own: true };
  for (let i = 1; i <= 12; i++) {
    const d = new Date(y, m - i, 1);
    const v = state.budgets[monthKey(d.getFullYear(), d.getMonth())];
    if (v !== undefined) return { amount: v, own: false };
  }
  return { amount: 0, own: false };
}

/* 최근 N달 수입·지출·저축 */
function recentMonths(n = 6) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ui.y, ui.m - i, 1);
    const mm = monthMoney(d.getFullYear(), d.getMonth());
    out.push({ y: d.getFullYear(), m: d.getMonth(), label: `${d.getMonth() + 1}월`,
      income: mm.income, expense: mm.expense, saved: mm.saved });
  }
  return out;
}

/* 금액 짧게 — 휴대폰은 만원 단위, 컴퓨터는 원 단위 */
const moneyShort = n => isNarrow()
  ? `${(Math.round(n / 1000) / 10).toFixed(1)}만`
  : Math.round(n).toLocaleString('ko-KR');

function nextTagColor() {
  const used = new Set(state.jobs.map(j => j.color));
  const free = TAGS.find(t => !used.has(t.color));
  return (free || TAGS[state.jobs.length % TAGS.length]).color;
}

/* ============================================
   화면 그리기
   ============================================ */
const content = $('#content');            // 화면을 그리는 젖빛 카드
const scroller = $('#contentScroll');     // 그 카드를 담은 스크롤 영역 (밀기·스크롤은 여기서)

function renderAll() {
  renderSidebar();
  renderToolbar();
  renderContent();
}

/* 체크한 공제를 작은 배지로.
   사이드바(190px)는 좁아서 둘 다 체크했으면 "공제" 하나로 묶어요 (compact) */
const jobBadges = (j, compact) => {
  const b = [];
  if (j.weeklyBonus) b.push('주휴');
  if (compact && j.tax && j.insurance) b.push('공제');
  else {
    if (j.tax) b.push(`${rateText(j.taxRate)}%`);
    if (j.insurance) b.push('4대보험');
  }
  return b.map(t => `<span class="jbadge">${esc(t)}</span>`).join('');
};
/* 마우스를 올리면 뭘 떼는지 알 수 있게 */
const dedText = j => {
  const d = [];
  if (j.tax) d.push(`세금 ${rateText(j.taxRate)}%`);
  if (j.insurance) d.push(`4대보험 ${rateText(j.insuranceRate)}%`);
  return d.length ? ` · 공제 ${d.join(' + ')}` : '';
};

/* 사이드바 숫자: 100만 원부터는 '만' 단위로 짧게 */
const walletShort = n => n >= 1e6 ? `₩${Math.round(n / 1e4).toLocaleString('ko-KR')}만` : `₩${Math.round(n).toLocaleString('ko-KR')}`;

/* ---------- 사이드바 ---------- */
function renderSidebar() {
  const c = monthCalc(ui.y, ui.m);
  const tagActive = ui.filter && ui.view === 'calendar';
  const mm = monthMoney(ui.y, ui.m);
  const savedTotal = state.savings.filter(v => !v.closed).reduce((a, v) => a + savingPaid(v).total, 0);
  const fav = [
    ['calendar', 'calendar', 'Calendar', '달력'],
    ['jobs', 'briefcase', 'Jobs', '알바 등록'],
    ['pay', 'wallet', 'Monthly Pay', '월별 정산'],
    ['bonus', 'gift', 'Weekly Bonus', '주휴 내역']
  ];
  const tags = state.jobs.map(j => `
    <button type="button" class="sb-item ${ui.filter === j.id ? 'on' : ''}" data-action="filter" data-id="${esc(j.id)}" title="${esc(j.name)}만 보기${esc(dedText(j))}">
      <i class="tagdot" style="background:${j.color}"></i><span class="ell">${esc(j.name)}</span>${jobBadges(j, true)}
    </button>`).join('');
  $('#sbNav').innerHTML = `
    <div class="sb-sec">Favorites</div>
    ${fav.map(([v, ic, label, ko]) => `
      <button type="button" class="sb-item ${ui.app === 'work' && ui.view === v && !tagActive ? 'on' : ''}" data-action="view" data-view="${v}" title="${ko}">
        ${icon(ic)}<span>${label}</span>
      </button>`).join('')}
    <button type="button" class="sb-item ${ui.app === 'money' ? 'on' : ''}" data-action="go-app" data-app="money" title="가계부">
      ${icon('book')}<span>Money</span><span class="sb-num">${mm.count ? walletShort(mm.left) : ''}</span>
    </button>
    <button type="button" class="sb-item ${ui.app === 'save' ? 'on' : ''}" data-action="go-app" data-app="save" title="저축 통장">
      ${icon('bank')}<span>Savings</span><span class="sb-num">${savedTotal ? walletShort(savedTotal) : ''}</span>
    </button>
    <div class="sb-sec">iCloud</div>
    <button type="button" class="sb-item" data-action="view" data-view="pay" title="${ui.m + 1}월 실수령액${c.deducted ? ` (공제 전 ${won(c.total)})` : ''}">
      ${icon('cloud')}<span>This Month</span><span class="sb-num">${walletShort(c.net)}</span>
    </button>
    <button type="button" class="sb-item" data-action="view" data-view="bonus" title="${ui.m + 1}월 근무시간">
      ${icon('clock')}<span>Total Hours</span><span class="sb-num">${shortH(c.minutes)}</span>
    </button>
    <div class="sb-sec">Tags</div>
    ${tags || '<div class="sb-empty">알바를 등록하면 태그가 생겨요</div>'}
    <button type="button" class="sb-item" data-action="filter" data-id="" title="전체 보기">
      ${icon('tags')}<span>All Tags…</span>
    </button>`;
}

/* ---------- 연도·월 고르기 (날짜 글씨를 누르면 열려요) ---------- */
let ymOpen = false, ymYear = START.y;

function renderYmPicker() {
  const el = $('#ymPicker');
  if (!ymOpen) { el.hidden = true; el.innerHTML = ''; return; }
  let g = '';
  for (let i = 0; i < 12; i++) {
    const on = ymYear === ui.y && i === ui.m;
    const now = ymYear === THIS_M.y && i === THIS_M.m;
    g += `<button type="button" class="ym-m ${on ? 'on' : ''} ${now && !on ? 'now' : ''}" data-action="pick-ym" data-y="${ymYear}" data-m="${i}" aria-current="${on}">${i + 1}월</button>`;
  }
  el.innerHTML = `
    <div class="ym-head">
      <button type="button" class="tb-btn" data-action="ym-year" data-d="-1" aria-label="이전 해">${icon('chev-left')}</button>
      <b>${ymYear}년</b>
      <button type="button" class="tb-btn" data-action="ym-year" data-d="1" aria-label="다음 해">${icon('chev-right')}</button>
    </div>
    <div class="ym-grid">${g}</div>`;
  el.hidden = false;
}
function openYm() { ymOpen = true; ymYear = ui.y; renderYmPicker(); syncPanelButtons(); }
function closeYm() { if (!ymOpen) return; ymOpen = false; renderYmPicker(); syncPanelButtons(); }

/* ---------- 툴바 ---------- */
function renderToolbar() {
  $('#monthBtn').textContent = `${ui.y}년 ${ui.m + 1}월`;
  $('#todayBtn').disabled = ui.y === THIS_M.y && ui.m === THIS_M.m;   // 이번 달을 보고 있으면 흐리게
  const listMode = ui.view === 'calendar' && ui.mode === 'list';
  $('#modeBtn').innerHTML = icon(listMode ? 'list' : 'grid') + `<span class="mini">${icon('updown')}</span>`;
  $('#modeBtn').title = listMode ? '달력으로 보기' : '리스트로 보기';
  const g = $('#groupBtn');
  g.classList.toggle('on', ui.group);
  g.setAttribute('aria-pressed', String(ui.group));
  // 보기 전환·묶어보기는 알바 목록에만 쓰는 버튼이라 가계부에서는 숨겨요
  const workOnly = ui.app === 'work';
  $('#modeBtn').hidden = !workOnly;
  g.hidden = !workOnly;
  syncPanelButtons();
}

/* 패널·메뉴를 여는 툴바 버튼: 열려 있으면 회색 배경(.on), 닫히면 배경 없음 */
function syncPanelButtons() {
  const set = (el, on) => { if (!el) return; el.classList.toggle('on', on); el.setAttribute('aria-expanded', String(on)); };
  set($('#tagBtn'), sheetKind === 'jobs' || (sheetKind === 'job' && !!jobEdit && !jobEdit.id));   // 알바 관리 패널
  set($('#menuBtn'), !$('#menu').hidden);                              // ⋯ 메뉴
  set($('#monthBtn'), ymOpen);                                         // 연도·월 고르기
  set($('#sbToggle'), $('#window').classList.contains('sb-open'));     // 모바일 사이드바
}

/* 툴바 버튼으로 새 패널을 열 때는 다른 패널·메뉴를 모두 닫아요 */
function closePanels() {
  closeSheet();
  closeMenu();
  closeYm();
  closeSidebar();
}

/* ---------- 기록을 못 읽었을 때: 복구 화면 ---------- */
function renderLocked() {
  setStatus('기록을 읽지 못했어요 — 저장을 멈춰 뒀어요');
  content.innerHTML = `<div class="empty recover">
    <div class="big">🛟</div>
    <h2>저장된 기록을 읽지 못했어요</h2>
    <p>기록이 사라지지 않도록 <b>지금은 저장을 멈춰 뒀어요.</b><br>
      저장소에 있던 원래 값은 지우지 않고 그대로 두었어요. 아래에서 하나를 골라 주세요.</p>
    <div class="recover-btns">
      <button type="button" class="mbtn blue" data-action="import">백업 파일로 되살리기…</button>
      <button type="button" class="mbtn" data-action="download-broken">못 읽은 기록 내려받기</button>
      <button type="button" class="mbtn danger" data-action="start-over">새로 시작하기…</button>
    </div>
    <p class="note">"새로 시작하기"를 누르면 못 읽은 기록이 완전히 지워져요. 그 전에 꼭 내려받아 두세요.</p>
  </div>`;
}

/* ---------- 본문 ---------- */
/* 본문 카드 맨 위 [알바 | 가계부] 전환 (macOS 세그먼트 버튼) */
function appTabs() {
  const tab = (id, label) =>
    `<button type="button" class="seg-btn ${ui.app === id ? 'on' : ''}" data-action="go-app" data-app="${id}"
      aria-pressed="${ui.app === id}">${label}</button>`;
  return `<div class="seg" role="group" aria-label="화면 전환">${tab('work', '알바')}${tab('money', '가계부')}${tab('save', '저축')}</div>`;
}

function renderContent() {
  if (store.locked) { renderLocked(); return; }
  if (ui.app === 'money') { renderMoney(); return; }
  if (ui.app === 'save') { renderSavings(); return; }
  if (ui.view === 'jobs') renderJobs();
  else if (ui.view === 'pay') renderPay();
  else if (ui.view === 'bonus') renderBonus();
  else renderCalendar();
}

function setStatus(text) { $('#statusbar').textContent = text; }

function emptyJobs() {
  return `${appTabs()}<div class="empty">
    <div class="big">👛</div>
    <p>아직 등록한 알바가 없어요.<br>먼저 하고 있는 알바를 등록해 주세요.</p>
    <button type="button" class="mbtn blue" data-action="add-job">알바 등록</button>
  </div>`;
}

function filterBar() {
  const fj = ui.filter ? jobById(ui.filter) : null;
  if (!fj) return '';
  return `<div class="filter-bar"><span class="dot" style="background:${fj.color}"></span>
    <span><b>${esc(fj.name)}</b> 근무만 보는 중</span>
    <button type="button" class="linkbtn" data-action="filter" data-id="">전체 보기</button></div>`;
}

/* Calendar */
function renderCalendar() {
  const y = ui.y, m = ui.m;
  const calc = monthCalc(y, m);
  const list = monthShifts(y, m, ui.filter);
  setStatus(`${list.length}개 근무 · ${m + 1}월 총 ${won(calc.total)}${calc.deducted ? ` · 실수령 ${won(calc.net)}` : ''}`);
  if (!state.jobs.length) { content.innerHTML = emptyJobs(); return; }

  if (ui.mode === 'list') {
    content.innerHTML = `${appTabs()}${filterBar()}
      ${list.length ? listTable(list) : `<div class="empty"><p>${m + 1}월에는 아직 근무 기록이 없어요.</p><button type="button" class="mbtn" data-action="mode-grid">달력에서 기록하기</button></div>`}`;
    return;
  }
  content.innerHTML = `${appTabs()}${filterBar()}
    ${calendarGrid(y, m)}
    <div class="sec-title">${m + 1}월 알바비 <small>알바별 요약</small></div>
    ${summaryTable(calc)}`;
}

function calendarGrid(y, m) {
  const first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let h = '<div class="cal">';
  WD_MON.forEach(w => { h += `<div class="cal-wd">${w}</div>`; });
  for (let i = 0; i < offset; i++) h += '<div class="cell dim"></div>';
  for (let d = 1; d <= days; d++) {
    const key = ymd(y, m, d), wd = (offset + d - 1) % 7;
    const ss = shiftsOn(key, ui.filter);
    const cls = ['cell', 'day', wd >= 5 ? 'wkend' : '', key === TODAY ? 'today' : ''].join(' ');
    const evs = ss.map(s => {
      const j = jobById(s.jobId), min = netMinutes(s);
      return `<div class="ev" title="${esc(j.name)} ${s.start}~${s.end} (${fmtH(min)})"><span class="dot" style="background:${j.color}"></span>${shortH(min)}</div>`;
    }).join('');
    h += `<div class="${cls}" role="button" tabindex="0" data-action="open-day" data-date="${key}"
      aria-label="${m + 1}월 ${d}일${ss.length ? `, 근무 ${ss.length}개` : ''}"><span class="dnum">${d}</span>${evs}</div>`;
  }
  const trail = (7 - (offset + days) % 7) % 7;
  for (let i = 0; i < trail; i++) h += '<div class="cell dim"></div>';
  return h + '</div>';
}

/* ============================================
   가계부 화면
   ============================================ */
function renderMoney() {
  const y = ui.y, m = ui.m;
  const mm = monthMoney(y, m);
  setStatus(`${m + 1}월 수입 ${won(mm.income)} · 지출 ${won(mm.expense)}${mm.saved ? ` · 저축 ${won(mm.saved)}` : ''} · 남은 돈 ${won(mm.left)}`);
  content.innerHTML = `${appTabs()}
    ${budgetBar(y, m, mm)}
    ${moneyGrid(y, m, mm)}
    <div class="sec-title">${m + 1}월 가계부 <small>수입·지출 요약</small>
      <button type="button" class="mbtn small push" data-action="manage-recur">고정 지출</button>
      <button type="button" class="mbtn small" data-action="manage-cats">카테고리</button></div>
    ${moneySummary(mm)}
    ${moneyCharts(mm)}`;
}

/* ---------- 이번 달 예산 막대 ---------- */
function budgetBar(y, m, mm) {
  const { amount, own } = budgetOf(y, m);
  if (!amount) {
    return `<button type="button" class="budget none" data-action="set-budget">
      <span>${m + 1}월 예산을 정해 보세요</span><span class="b-set">예산 정하기</span></button>`;
  }
  const used = mm.expense, leftOver = amount - used;
  const pct = Math.min(100, Math.round(used / amount * 100));
  const level = used > amount ? 'over' : pct >= 80 ? 'warn' : 'ok';
  // 남은 날 (지난 달이면 0)
  const lastDay = new Date(y, m + 1, 0).getDate();
  const todayD = parseYmd(TODAY);
  const sameMonth = todayD.getFullYear() === y && todayD.getMonth() === m;
  const daysLeft = sameMonth ? lastDay - todayD.getDate() + 1 : (new Date(y, m, 1) > todayD ? lastDay : 0);
  const perDay = daysLeft > 0 && leftOver > 0 ? Math.floor(leftOver / daysLeft) : 0;
  return `<button type="button" class="budget ${level}" data-action="set-budget"
      title="눌러서 예산 바꾸기">
    <div class="b-top">
      <span class="b-label">${m + 1}월 예산${own ? '' : ' <small>(지난달과 같게)</small>'}</span>
      <span class="b-num"><b>${won(used)}</b> / ${won(amount)}</span>
    </div>
    <span class="b-track"><i style="width:${pct}%"></i></span>
    <div class="b-bot">
      <span>${leftOver >= 0 ? `${won(leftOver)} 남음` : `${won(-leftOver)} 넘었어요`}</span>
      <span>${perDay ? `하루 ${won(perDay)}씩 쓸 수 있어요` : daysLeft > 0 ? '' : '지난 달'}</span>
    </div>
    ${mm.wasted ? `<div class="b-waste">💸 낭비만 안 했으면 ${won(leftOver + mm.wasted)} 남았어요</div>` : ''}
  </button>`;
}

function moneyGrid(y, m, mm) {
  const first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let h = '<div class="cal money">';
  WD_MON.forEach(w => { h += `<div class="cal-wd">${w}</div>`; });
  for (let i = 0; i < offset; i++) h += '<div class="cell dim"></div>';
  for (let d = 1; d <= days; d++) {
    const key = ymd(y, m, d), wd = (offset + d - 1) % 7;
    const sum = mm.byDay.get(key);
    const cls = ['cell', 'day', wd >= 5 ? 'wkend' : '', key === TODAY ? 'today' : ''].join(' ');
    let evs = '';
    let label = '';
    if (sum && sum.in) { evs += `<div class="mv in">+${moneyShort(sum.in)}</div>`; label += `, 수입 ${won(sum.in)}`; }
    if (sum && sum.out) {
      evs += `<div class="mv out">−${moneyShort(sum.out)}${sum.waste ? '<i class="wdot">💸</i>' : ''}</div>`;
      label += `, 지출 ${won(sum.out)}${sum.waste ? `, 낭비 ${won(sum.waste)}` : ''}`;
    }
    if (sum && sum.save) { evs += `<div class="mv save">−${moneyShort(sum.save)}</div>`; label += `, 저축 ${won(sum.save)}`; }
    if (state.dayMemos[key]) evs += '<div class="mv memo" title="메모 있음">✎</div>';
    h += `<div class="${cls}" role="button" tabindex="0" data-action="open-money-day" data-date="${key}"
      aria-label="${m + 1}월 ${d}일${label}"><span class="dnum">${d}</span>${evs}</div>`;
  }
  const trail = (7 - (offset + days) % 7) % 7;
  for (let i = 0; i < trail; i++) h += '<div class="cell dim"></div>';
  return h + '</div>';
}

function moneySummary(mm) {
  if (!mm.count) {
    return `<div class="empty" style="padding:40px 20px">
      <div class="big">🧾</div>
      <p>${ui.m + 1}월에는 아직 기록이 없어요.<br>날짜를 눌러서 수입·지출을 적어 보세요.</p></div>`;
  }
  const bar = mm.top.length && mm.expense ? `
    <div class="sec-title" style="margin-top:16px">지출이 많은 곳 <small>상위 ${mm.top.length}개</small></div>
    <div class="top-cats">${mm.top.map(t => `
      <div class="top-row">
        <span class="top-name"><span class="cat-dot" style="background:${t.cat.color}">${t.cat.emoji}</span>${esc(t.cat.name)}</span>
        <span class="top-bar"><i style="width:${Math.round(t.sum / mm.top[0].sum * 100)}%;background:${t.cat.color}"></i></span>
        <span class="top-sum">${won(t.sum)} <small>${Math.round(t.sum / mm.expense * 100)}%</small></span>
      </div>`).join('')}</div>` : '';
  return `<table class="ftable sum money-sum">
      <tbody>
        <tr><td data-label="수입">수입</td><td class="r in">${won(mm.income)}</td></tr>
        <tr><td data-label="지출">지출</td><td class="r out">−${won(mm.expense)}</td></tr>
        ${mm.saved ? `<tr><td data-label="저축">저축</td><td class="r save">−${won(mm.saved)}</td></tr>` : ''}
      </tbody></table>
    <div class="grand"><span>${ui.m + 1}월 남은 돈 ${mm.saved ? '<small>수입 − 지출 − 저축</small>' : ''}</span><b class="${mm.left < 0 ? 'minus' : ''}">${won(mm.left)}</b></div>
    ${wasteRow(mm)}
    ${bar}`;
}

/* ---------- 이번 달 낭비 줄 (누르면 낭비 목록 시트) ---------- */
function wasteRow(mm) {
  if (!mm.expense) return '';
  const prev = monthMoney(ui.m === 0 ? ui.y - 1 : ui.y, (ui.m + 11) % 12).wasted;
  const diff = mm.wasted - prev;
  const delta = !mm.wasted && !prev ? ''
    : diff > 0 ? `지난달보다 +${won(diff)}`
      : diff < 0 ? `지난달보다 −${won(-diff)}` : '지난달과 같아요';
  if (!mm.wasted) {
    return `<div class="waste-row none"><div class="w-top">
      <span class="w-label">💸 이번 달 낭비</span><b>없어요</b></div>
      ${delta ? `<div class="w-bot"><span></span><span>${delta}</span></div>` : ''}</div>`;
  }
  const pct = Math.round(mm.wasted / mm.expense * 100);
  return `<button type="button" class="waste-row" data-action="show-wasted" title="눌러서 낭비 목록 보기">
    <div class="w-top"><span class="w-label">💸 이번 달 낭비</span><b>${won(mm.wasted)}</b></div>
    <div class="w-bot"><span>전체 지출의 ${pct}%</span><span>${delta}</span></div>
    ${mm.wasteTop.length ? `<div class="w-cats">${mm.wasteTop.map(t => `
      <span class="w-chip"><span class="cat-dot" style="background:${t.cat.color}">${t.cat.emoji}</span>${esc(t.cat.name)} ${won(t.sum)}</span>`).join('')}</div>` : ''}
  </button>`;
}

/* ---------- 낭비 목록 시트 ---------- */
function openWasteSheet() {
  const mm = monthMoney(ui.y, ui.m);
  const rows = mm.wastedList.map(e => {
    const c = catSafe(e.categoryId, 'out');
    const d = Number(e.date.slice(8, 10));
    return `<div class="day-row" role="button" tabindex="0" data-action="open-money-day" data-date="${e.date}">
      <span class="cat-dot" style="background:${c.color}">${c.emoji}</span>
      <span class="dr-main"><b>${d}일 ${esc(c.name)}</b>
        <span class="amt out">−${won(e.amount)}</span>
        ${e.memo ? `<small>${esc(e.memo)}</small>` : ''}</span></div>`;
  }).join('');
  openSheet('waste', `
    <div class="sheet-head" id="sheetTitle">${ui.m + 1}월 낭비한 돈</div>
    <div class="sheet-body">
      <div class="grand"><span>안 써도 됐던 돈 <small>${mm.expense ? `전체 지출의 ${Math.round(mm.wasted / mm.expense * 100)}%` : ''}</small></span><b class="minus waste">${won(mm.wasted)}</b></div>
      <div class="day-list">${rows || '<div class="day-empty">이번 달은 낭비한 기록이 없어요.</div>'}</div>
      <p class="hint" style="margin-left:0">날짜를 누르면 그날 기록으로 넘어가요. 목록에서 💸를 눌러 표시를 바꿀 수 있어요.</p>
    </div>
    <div class="sheet-foot">
      <span class="spacer"></span>
      <button type="button" class="mbtn blue" data-action="close-sheet">닫기</button>
    </div>`);
}

/* ============================================
   저축 통장 화면
   ============================================ */
function renderSavings() {
  const list = state.savings;
  const infos = list.map(v => ({ v, i: savingInfo(v) }));
  const total = infos.filter(x => !x.v.closed).reduce((a, x) => a + x.i.total, 0);
  setStatus(`통장 ${list.length}개 · 모인 돈 ${won(total)}`);
  if (!list.length) {
    content.innerHTML = `${appTabs()}<div class="empty">
      <div class="big">🏦</div>
      <p>아직 저축 통장이 없어요.<br>통장을 만들면 납입일마다 자동으로 기록돼요.</p>
      <button type="button" class="mbtn blue" data-action="add-saving">통장 만들기</button>
    </div>`;
    return;
  }
  content.innerHTML = `${appTabs()}
    <div class="save-total">
      <span>모은 돈 전부</span><b>${won(total)}</b>
      <small>${infos.filter(x => !x.v.closed).length}개 통장 · 해지한 통장은 빼고</small>
    </div>
    <div class="sec-title">저축 통장 <small>${list.length}개</small>
      <button type="button" class="mbtn small push" data-action="add-saving">+ 통장 만들기</button></div>
    <div class="save-list">${infos.map(savingCard).join('')}</div>
    <p class="note">납입일마다 "저축" 기록이 자동으로 생겨요. 통장을 눌러 고치거나, 날짜 칸에서 "건너뛰기"를 할 수 있어요.</p>`;
}

function savingCard({ v, i }) {
  const goalText = v.goal ? `목표 ${won(v.goal)}` : `${v.start.slice(2).replace(/-/g, '.')} ~ ${v.end.slice(2).replace(/-/g, '.')}`;
  const dday = i.status ? `<span class="s-badge ${v.closed ? 'off' : 'done'}">${i.status}</span>`
    : `<span class="s-badge">D-${i.dday}</span>`;
  return `<div class="save-card ${i.statusDone ? 'done' : ''}" role="button" tabindex="0" data-action="edit-saving" data-id="${esc(v.id)}">
    <div class="s-top">
      <span class="s-name"><i class="dot" style="background:${v.color}"></i><b>${esc(v.name)}</b>
        ${v.bank ? `<small>${esc(v.bank)}</small>` : ''}</span>
      ${dday}
    </div>
    <div class="s-mid">
      <b class="s-sum">${won(i.total)}</b>
      <small>${goalText}</small>
    </div>
    <span class="s-track"><i style="width:${i.pct}%;background:${v.color}"></i></span>
    <div class="s-bot">
      <span>매달 ${v.payday}일 · ${won(v.amount)} · ${i.times}번 넣음</span>
      <span class="${i.thisMonth ? 'paid' : 'unpaid'}">${i.statusDone ? '' : i.thisMonth ? `이번 달 ${won(i.thisMonth)} ✓` : '이번 달 아직'}</span>
    </div>
  </div>`;
}

/* ---------- 통장 만들기 / 고치기 ---------- */
let saveEdit = null;
function openSavingSheet(id) {
  const v = id ? savingById(id) : null;
  saveEdit = { id: v ? v.id : null, color: v ? v.color : nextTagColor() };
  const today = TODAY;
  const inOneYear = (() => { const d = parseYmd(today); d.setFullYear(d.getFullYear() + 1); return keyOf(d); })();
  openSheet('saving', `
    <div class="sheet-head" id="sheetTitle">${v ? '통장 수정' : '새 저축 통장'}</div>
    <form class="sheet-body" id="savingForm" autocomplete="off">
      <div class="frow"><label for="vName">이름</label>
        <input type="text" id="vName" maxlength="20" placeholder="예: 청년적금" value="${v ? esc(v.name) : ''}"></div>
      <div class="frow"><label for="vBank">은행</label>
        <input type="text" id="vBank" maxlength="20" placeholder="(선택) 예: 국민은행" value="${v ? esc(v.bank) : ''}"></div>
      <div class="frow"><label for="vAmount">월 납입액</label>
        <div class="fctl"><input type="number" id="vAmount" min="0" step="1" inputmode="numeric" style="width:130px;text-align:right"
          placeholder="300000" value="${v ? v.amount : ''}"> 원</div></div>
      <div class="frow"><span class="lbl">납입일</span>
        <div class="fctl">매달 <input type="number" id="vPayday" min="1" max="31" step="1" inputmode="numeric" style="width:62px;text-align:right"
          aria-label="납입일" value="${v ? v.payday : 25}">일</div></div>
      <div class="frow"><label for="vStart">시작일</label>
        <input type="date" id="vStart" value="${v ? v.start : today}"></div>
      <div class="frow"><label for="vEnd">만기일</label>
        <input type="date" id="vEnd" value="${v ? v.end : inOneYear}"></div>
      <div class="frow"><label for="vGoal">목표액</label>
        <div class="fctl"><input type="number" id="vGoal" min="0" step="1" inputmode="numeric" style="width:130px;text-align:right"
          placeholder="(선택) 안 적으면 기간으로" value="${v && v.goal ? v.goal : ''}"> 원</div></div>
      <div class="frow top"><span class="lbl">색</span>
        <div class="swatches" role="radiogroup" aria-label="색">
          ${TAGS.map(t => `<button type="button" class="sw ${t.color === saveEdit.color ? 'on' : ''}" style="background:${t.color}" data-action="pick-saving-color" data-color="${t.color}" role="radio" aria-checked="${t.color === saveEdit.color}" title="${t.name}" aria-label="${t.name}"></button>`).join('')}
        </div></div>
      ${v ? `<p class="hint">${v.closed ? `${v.closed}에 해지했어요. 그 뒤로는 자동 납입이 안 돼요.` : '해지하면 그 뒤로는 자동 납입이 생기지 않아요.'}</p>` : ''}
    </form>
    <div class="sheet-foot">
      ${v ? `<button type="button" class="mbtn plain" data-action="del-saving" data-id="${esc(v.id)}">통장 삭제</button>
             <button type="button" class="mbtn small" data-action="toggle-closed" data-id="${esc(v.id)}">${v.closed ? '해지 취소' : '해지하기'}</button>` : ''}
      <span class="spacer"></span>
      <button type="button" class="mbtn" data-action="close-sheet">취소</button>
      <button type="submit" class="mbtn blue" form="savingForm">저장</button>
    </div>`);
  setTimeout(() => { const n = $('#vName'); if (n && window.innerWidth > 760) n.focus(); }, 320);
}

function submitSaving() {
  const name = $('#vName').value.trim();
  const amount = Math.round(Number($('#vAmount').value) || 0);
  const start = $('#vStart').value, end = $('#vEnd').value;
  if (!name) { toast('통장 이름을 적어 주세요.'); $('#vName').focus(); return; }
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) { toast('시작일과 만기일을 골라 주세요.'); return; }
  if (end < start) { toast('만기일이 시작일보다 빨라요.'); $('#vEnd').focus(); return; }
  const data = {
    name: name.slice(0, 20), bank: $('#vBank').value.trim().slice(0, 20), amount,
    payday: Math.min(31, Math.max(1, Math.round(Number($('#vPayday').value)) || 25)),
    start, end, goal: Math.max(0, Math.round(Number($('#vGoal').value) || 0)),
    color: safeColor(saveEdit.color)
  };
  if (saveEdit.id) Object.assign(savingById(saveEdit.id), data);
  else state.savings.push({ id: uid(), ...data, closed: null });
  save(); closeSheet(); renderAll();
  toast(`"${name}" 저장했어요.`);
}

function toggleClosed(id) {
  const v = savingById(id); if (!v) return;
  v.closed = v.closed ? null : TODAY;
  save(); closeSheet(); renderAll();
  toast(v.closed ? `"${v.name}" 해지했어요. 자동 납입이 멈춰요.` : `"${v.name}" 해지를 취소했어요.`);
}

function deleteSaving(id) {
  const v = savingById(id); if (!v) return;
  const mine = state.entries.filter(e => e.type === 'save' && e.savingId === id);
  if (!confirm(`"${v.name}" 통장을 지울까요?${mine.length ? `\n직접 넣은 기록 ${mine.length}개도 같이 지워져요.` : ''}`)) return;
  const back = { at: state.savings.indexOf(v), saving: { ...v }, entries: mine.map(e => ({ ...e })) };
  state.savings = state.savings.filter(x => x.id !== id);
  state.entries = state.entries.filter(e => !(e.type === 'save' && e.savingId === id));
  save(); closeSheet(); renderAll();
  toast(`"${v.name}" 지웠어요.`, {
    label: '실행 취소', ms: 5000,
    fn: () => {
      if (savingById(back.saving.id)) return;
      state.savings.splice(Math.min(back.at, state.savings.length), 0, back.saving);
      state.entries = state.entries.concat(back.entries);
      save(); renderAll(); toast('되돌렸어요.');
    }
  });
}

/* ============================================
   월별 그래프 — 외부 라이브러리 없이 SVG로
   글자는 SVG 밖 HTML에 둬서 어느 크기에서도 또렷하게
   ============================================ */
function moneyCharts(mm) {
  const months = recentMonths(6);
  const max = Math.max(1, ...months.flatMap(x => [x.income, x.expense, x.saved]));
  const W = 300, H = 100, gw = W / months.length;      // 한 달이 차지하는 폭
  const bw = Math.min(9, (gw - 8) / 3);                // 막대 하나 폭
  let bars = '';
  months.forEach((x, i) => {
    const base = i * gw + (gw - bw * 3 - 4) / 2;
    [['income', x.income], ['expense', x.expense], ['saved', x.saved]].forEach(([k, v], j) => {
      const h = v > 0 ? Math.max(2, v / max * (H - 6)) : 0;
      if (!h) return;
      const fill = k === 'income' ? 'var(--income)' : k === 'expense' ? 'var(--expense)' : 'var(--saving)';
      bars += `<rect class="ch-bar" x="${(base + j * (bw + 2)).toFixed(1)}" y="${(H - h).toFixed(1)}"
        width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${fill}"
        data-action="chart-month" data-i="${i}" data-k="${k}"><title>${x.label} ${k === 'income' ? '수입' : k === 'expense' ? '지출' : '저축'} ${won(v)}</title></rect>`;
    });
  });

  // 이번 달 카테고리별 지출 도넛
  const cats = mm.cats.slice(0, 8);
  const R = 40, C = 2 * Math.PI * R;
  let off = 0, ring = '';
  cats.forEach((c, i) => {
    const len = c.sum / (mm.expense || 1) * C;
    ring += `<circle class="ch-arc" cx="50" cy="50" r="${R}" fill="none" stroke="${c.cat.color}" stroke-width="16"
      stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"
      data-action="chart-cat" data-i="${i}"><title>${esc(c.cat.name)} ${won(c.sum)}</title></circle>`;
    off += len;
  });

  return `<div class="sec-title" style="margin-top:20px">그래프 <small>최근 6개월 · 이번 달 지출</small></div>
    <div class="charts">
      <div class="chart">
        <svg viewBox="0 0 ${W} ${H}" class="ch-svg" role="img" aria-label="최근 6개월 수입·지출·저축">${bars}</svg>
        <div class="ch-labels">${months.map(x => `<span>${x.label}</span>`).join('')}</div>
        <div class="ch-legend">
          <span><i style="background:var(--income)"></i>수입</span>
          <span><i style="background:var(--expense)"></i>지출</span>
          <span><i style="background:var(--saving)"></i>저축</span>
        </div>
      </div>
      <div class="chart donut">
        ${mm.expense ? `<div class="donut-wrap">
          <svg viewBox="0 0 100 100" class="ch-svg" role="img" aria-label="이번 달 카테고리별 지출">
            <g transform="rotate(-90 50 50)">${ring}</g>
          </svg>
          <div class="donut-mid"><small>이번 달 지출</small><b>${won(mm.expense)}</b></div>
        </div>
        <div class="ch-legend wrap">${cats.map(c => `<span><i style="background:${c.cat.color}"></i>${esc(c.cat.name)}</span>`).join('')}</div>`
      : '<div class="day-empty" style="text-align:center">이번 달 지출이 없어요.</div>'}
      </div>
    </div>
    <div class="ch-info" id="chartInfo">막대나 조각을 누르면 금액이 보여요.</div>`;
}

/* Finder 목록 보기: 이름 / 날짜 / 시간 / 금액 */
function listTable(list) {
  const k = ui.sort.key, dir = ui.sort.dir;
  const rows = list.map(s => ({ s, j: jobById(s.jobId), min: netMinutes(s), pay: shiftPay(s) }));
  const cmp = {
    name: (a, b) => a.j.name.localeCompare(b.j.name, 'ko') || byDateStart(a.s, b.s),
    date: (a, b) => byDateStart(a.s, b.s),
    time: (a, b) => a.min - b.min || byDateStart(a.s, b.s),
    amount: (a, b) => a.pay - b.pay || byDateStart(a.s, b.s)
  }[k];
  rows.sort((a, b) => cmp(a, b) * dir);

  const head = (key, label, r) => `<th class="${r ? 'r' : ''} ${k === key ? 'sorted' : ''}" aria-sort="${k === key ? (dir > 0 ? 'ascending' : 'descending') : 'none'}">
    <button type="button" data-action="sort" data-key="${key}">${label}${k === key ? icon(dir > 0 ? 'chev-up' : 'chev-down') : ''}</button></th>`;
  const row = r => `<tr role="button" tabindex="0" data-action="open-shift" data-id="${esc(r.s.id)}">
      <td data-col="name"><span class="nm"><span class="dot" style="background:${r.j.color}"></span><span>${esc(r.j.name)}</span></span></td>
      <td data-col="date">${finderDate(r.s.date)}</td>
      <td data-col="time">${r.s.start}–${r.s.end} <span class="sub">· ${fmtH(r.min)}</span></td>
      <td data-col="amount" class="r">${won(r.pay)}</td></tr>`;

  let body = '';
  if (ui.group) {
    state.jobs.forEach(j => {
      const rs = rows.filter(r => r.j.id === j.id);
      if (!rs.length) return;
      const sum = rs.reduce((a, r) => a + r.pay, 0), min = rs.reduce((a, r) => a + r.min, 0);
      body += `<tr class="grp"><td colspan="4"><span class="nm"><span class="dot" style="background:${j.color}"></span>${esc(j.name)}<span class="sub">${rs.length}개 · ${fmtH(min)} · ${won(sum)}${j.weeklyBonus ? ' (주휴 제외)' : ''}</span></span></td></tr>`;
      body += rs.map(row).join('');
    });
  } else {
    body = rows.map(row).join('');
  }
  return `<table class="ftable cards">
    <thead><tr>${head('name', '이름')}${head('date', '날짜')}${head('time', '시간')}${head('amount', '금액', true)}</tr></thead>
    <tbody>${body}</tbody></table>`;
}

function summaryTable(c) {
  const dedRow = (label, value, cls = '') =>
    `<tr class="ded ${cls}"><td colspan="4">${label}</td><td class="r">${value}</td></tr>`;
  const rows = c.jobs.map(r => {
    // 공제를 체크한 알바만 아래에 줄을 더해요
    const extra = r.job.tax || r.job.insurance ? [
      r.job.tax ? dedRow(`세금 (${rateText(r.job.taxRate)}%)`, minus(r.tax)) : '',
      r.job.insurance ? dedRow(`4대보험 (${rateText(r.job.insuranceRate)}%)`, minus(r.ins)) : '',
      dedRow('실수령액', won(r.net), 'net')
    ].join('') : '';
    return `<tr role="button" tabindex="0" data-action="edit-job" data-id="${esc(r.job.id)}" title="${esc(r.job.name)} 수정">
      <td data-label="알바"><span class="nm"><span class="dot" style="background:${r.job.color}"></span><span>${esc(r.job.name)}</span></span> <span class="sub">${won(r.job.wage)}/시</span></td>
      <td data-label="근무시간" class="r">${fmtH(r.minutes)}</td>
      <td data-label="기본급" class="r">${won(r.base)}</td>
      <td data-label="주휴수당" class="r">${r.bonus
        ? `<span>${won(r.holiday)}${r.holidayWeeks ? ` <span class="sub">(${r.holidayWeeks}주)</span>` : ''}</span>`
        : '<span class="incl">시급 포함</span>'}</td>
      <td data-label="합계" class="r strong">${won(r.total)}</td></tr>${extra}`;
  }).join('');
  return `<table class="ftable sum">
      <thead><tr><th>알바</th><th class="r">근무시간</th><th class="r">기본급</th><th class="r">주휴수당</th><th class="r">합계</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <div class="grand"><span>${ui.m + 1}월 ${c.deducted ? '받을 돈' : '총 알바비'}</span><b>${won(c.deducted ? c.net : c.total)}</b></div>
    ${c.deducted ? `<div class="grand-sub">세전 ${won(c.total)} · 공제 ${minus(c.tax + c.ins)}</div>` : ''}`;
}

/* Monthly Pay */
function renderPay() {
  const c = monthCalc(ui.y, ui.m);
  setStatus(`${ui.y}년 ${ui.m + 1}월 정산 · 총 ${won(c.total)}${c.deducted ? ` · 실수령 ${won(c.net)}` : ''}`);
  if (!state.jobs.length) { content.innerHTML = emptyJobs(); return; }
  const spill = spillWeek(ui.y, ui.m);
  content.innerHTML = `${appTabs()}
    <div class="sec-title">Monthly Pay <small>${ui.y}년 ${ui.m + 1}월</small>
      <button type="button" class="mbtn small push" data-action="share">이미지로 저장</button></div>
    ${summaryTable(c)}
    <p class="note">기본급은 실제로 일한 날짜의 달에, 주휴수당은 그 주 일요일이 있는 달에 들어가요.${spill ? ` ${md(spill.mon)}~${md(spill.sun)} 주의 주휴수당은 ${spill.sun.getMonth() + 1}월 정산에 들어가요.` : ''}${c.deducted ? ' 공제는 합계(기본급 + 주휴수당)에 비율을 곱해서 원 단위로 반올림해요.' : ''}</p>`;
}

/* Weekly Bonus */
function renderBonus() {
  const c = monthCalc(ui.y, ui.m);
  setStatus(`${ui.m + 1}월 주휴수당 받은 주 ${c.paidWeeks}주`);
  if (!state.jobs.length) { content.innerHTML = emptyJobs(); return; }
  const spill = spillWeek(ui.y, ui.m);
  const bonusJobs = c.jobs.filter(r => r.bonus);
  const others = c.jobs.filter(r => !r.bonus);
  const boxes = bonusJobs.map(r => `
    <div class="sec-title"><span class="dot" style="background:${r.job.color}"></span>${esc(r.job.name)} <small>시급 ${won(r.job.wage)} · 주휴수당 ${won(r.holiday)}</small></div>
    <table class="ftable sum">
      <thead><tr><th>주 (월~일)</th><th class="r">근무시간</th><th class="r">주휴시간</th><th class="r">주휴수당</th></tr></thead>
      <tbody>${r.weeks.map((w, i) => `<tr>
        <td data-label="주">${i + 1}주 <span class="sub">${md(w.mon)}(월) ~ ${md(w.sun)}(일)</span></td>
        <td data-label="근무시간" class="r">${fmtH(w.minutes)}</td>
        <td data-label="주휴시간" class="r ${w.ok ? 'ok' : 'no'}">${w.ok ? fmtH(w.hours * 60) : '15시간 미만'}</td>
        <td data-label="주휴수당" class="r strong">${won(w.pay)}</td></tr>`).join('')}</tbody>
    </table>`).join('');
  content.innerHTML = `${appTabs()}
    <div class="sec-title">Weekly Bonus <small>${ui.y}년 ${ui.m + 1}월 주휴수당</small></div>
    ${boxes || `<div class="empty" style="padding:40px 20px"><p>주휴수당을 따로 받는 알바가 없어요.<br><small>알바 수정 창에서 "주휴수당 별도 지급"을 체크하면 여기에 주별로 나와요.</small></p>
      <button type="button" class="mbtn" data-action="view" data-view="jobs">Jobs 열기</button></div>`}
    ${others.length && boxes ? `<p class="note">${others.map(r => esc(r.job.name)).join(', ')}은(는) 시급에 주휴수당이 포함돼 있어 빼고 보여줘요.</p>` : ''}
    ${spill && boxes ? `<p class="note">※ ${md(spill.mon)}~${md(spill.sun)} 주는 일요일이 ${spill.sun.getMonth() + 1}월이라 ${spill.sun.getMonth() + 1}월에서 계산해요.</p>` : ''}
    <div class="sec-title">계산 방법</div>
    <ul class="rules">
      <li>"주휴수당 별도 지급"을 체크한 알바만 계산해요. 체크 안 한 알바는 근무시간 × 시급만 계산해요.</li>
      <li>한 주는 월요일~일요일, 알바별로 따로 계산해요.</li>
      <li>한 주 순수 근무시간이 15시간 이상이면 주휴수당이 생겨요.</li>
      <li>주휴시간 = (주 근무시간 ÷ 40) × 8, 최대 8시간 · 주휴수당 = 주휴시간 × 시급</li>
      <li>주 40시간 이하라면 그 주 급여의 20%와 같아요.</li>
      <li>시급을 바꾸면 지난 기록도 새 시급으로 다시 계산돼요.</li>
    </ul>`;
}

/* Jobs */
function renderJobs() {
  setStatus(`알바 ${state.jobs.length}개`);
  if (!state.jobs.length) { content.innerHTML = emptyJobs(); return; }
  const c = monthCalc(ui.y, ui.m);
  const rows = c.jobs.map(r => `<tr role="button" tabindex="0" data-action="edit-job" data-id="${esc(r.job.id)}">
      <td data-label="이름"><span class="nm"><span class="dot" style="background:${r.job.color}"></span><span>${esc(r.job.name)}</span>${jobBadges(r.job)}</span></td>
      <td data-label="시급" class="r">${won(r.job.wage)}${r.bonus ? '' : ' <span class="sub">(주휴 포함)</span>'}</td>
      <td data-label="${ui.m + 1}월 근무" class="r">${r.days}일 · ${fmtH(r.minutes)}</td>
      <td data-label="${ui.m + 1}월 금액" class="r strong">${won(r.total)}</td></tr>`).join('');
  content.innerHTML = `${appTabs()}
    <div class="sec-title">Jobs <small>눌러서 수정·삭제</small>
      <button type="button" class="mbtn small push" data-action="manage-jobs">알바 관리</button>
      <button type="button" class="mbtn small" data-action="add-job">+ 알바 등록</button></div>
    <table class="ftable sum">
      <thead><tr><th>이름</th><th class="r">시급</th><th class="r">${ui.m + 1}월 근무</th><th class="r">${ui.m + 1}월 금액</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <p class="note">태그 색은 등록 순서대로 Red → Orange → Yellow → Green → Blue → Purple → Gray로 정해져요.</p>`;
}

/* ============================================
   시트 (macOS 스타일 팝업)
   ============================================ */
const sheetWrap = $('#sheetWrap'), sheetEl = $('#sheet');
let sheetKind = null, closeTimer = null;

function openSheet(kind, html) {
  closeMenu(); closeYm(); closeSidebar();
  clearTimeout(closeTimer);
  sheetKind = kind;
  sheetEl.classList.remove('closing');
  sheetEl.innerHTML = html;
  sheetWrap.hidden = false;
  sheetEl.scrollTop = 0;
  // 애니메이션 다시 시작
  sheetEl.style.animation = 'none'; void sheetEl.offsetWidth; sheetEl.style.animation = '';
  sheetEl.focus({ preventScroll: true });
  syncPanelButtons();
}
function closeSheet() {
  if (sheetWrap.hidden) return;
  sheetKind = null; pop = null; jobEdit = null; mon = null; catEdit = null; saveEdit = null; recurEdit = null;
  sheetEl.classList.add('closing');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  closeTimer = setTimeout(() => {
    sheetWrap.hidden = true;
    sheetEl.classList.remove('closing');
    sheetEl.innerHTML = '';
  }, reduce ? 0 : 170);
  syncPanelButtons();
}

/* ---------- 근무 입력 시트 ---------- */
let pop = null;

function openDay(date, editId) {
  if (!state.jobs.length) { openJobSheet(); toast('먼저 알바를 등록해 주세요.'); return; }
  const dt = parseYmd(date);
  pop = { date, editId: null, jobId: null, start: '', end: '', breaks: [], copy: new Set(), showCopy: false, py: dt.getFullYear(), pm: dt.getMonth(), formOpen: false };
  // 이미 근무가 있는 날은 목록만 보여주고 입력칸은 접어둬요 (지우러 들어왔다가 실수로 또 넣는 일이 없게)
  pop.formOpen = !!editId || !shiftsOn(date).length;
  resetForm();
  openSheet('day', `
    <div class="sheet-head" id="sheetTitle">${longDate(date)}</div>
    <div class="sheet-body">
      <div class="day-list" id="dayList"></div>
      <button type="button" class="mbtn addbtn" id="addShift" data-action="open-shift-form" hidden>+ 근무 추가</button>
      <div id="shiftForm" hidden>
        <div class="form-head" id="formHead"><span id="formTitle"></span>
          <button type="button" class="linkbtn" data-action="cancel-edit" id="cancelEdit" hidden>새로 쓰기</button></div>
        <div class="frow"><label for="fJob">알바</label>
          <select id="fJob">${state.jobs.map(j => `<option value="${esc(j.id)}">${esc(j.name)} · ${won(j.wage)}</option>`).join('')}</select></div>
        <div class="frow"><label for="fStart">근무</label>
          <div class="fctl"><input type="time" id="fStart" aria-label="시작 시간"> – <input type="time" id="fEnd" aria-label="종료 시간"></div></div>
        <div class="frow top"><span class="lbl">휴게</span>
          <div class="col"><div id="breakList" class="col"></div>
            <button type="button" class="linkbtn" data-action="add-break">+ 휴게시간 추가</button></div></div>
        <div class="calc" id="calc"></div>
        <button type="button" class="disclose" data-action="toggle-copy" id="copyToggle" aria-expanded="false"></button>
        <div class="picker" id="picker" hidden></div>
      </div>
    </div>
    <div class="sheet-foot" id="dayFoot"></div>`);
  if (editId) startEdit(editId); else renderDaySheet();
}

/* 목록 · "+ 근무 추가" 버튼 · 입력칸 · 아래 버튼을 한 번에 맞춰 그려요 */
function renderDaySheet() {
  if (sheetKind !== 'day' || !pop) return;
  renderDayList();
  $('#addShift').hidden = pop.formOpen;
  $('#shiftForm').hidden = !pop.formOpen;
  renderFoot();
  if (pop.formOpen) refreshForm();
}

/* 아래 버튼은 지금 뭘 하고 있는지에 따라 달라져요 */
function renderFoot() {
  const foot = $('#dayFoot');
  if (!pop.formOpen) {                                   // 목록만 보는 중 → 닫기 하나만
    foot.innerHTML = '<span class="spacer"></span>' +
      '<button type="button" class="mbtn blue" data-action="close-sheet">닫기</button>';
    return;
  }
  const editing = !!pop.editId;
  foot.innerHTML = '<span class="spacer"></span>' +
    '<button type="button" class="mbtn" data-action="cancel-form">취소</button>' +
    `<button type="button" class="mbtn blue" data-action="save-shift">${editing ? '수정 저장' : '근무 추가'}</button>`;
}

/* 입력칸 펼치기 / 접기 */
function openShiftForm() {
  pop.formOpen = true;
  resetForm();
  renderDaySheet();
  const f = $('#shiftForm');
  if (f && f.scrollIntoView) f.scrollIntoView({ block: 'nearest' });
}
function closeShiftForm() {
  pop.formOpen = false;
  pop.editId = null;
  resetForm();
  renderDaySheet();
}
/* "취소" — 돌아갈 목록이 있으면 목록으로, 없으면 시트를 닫아요 */
function cancelForm() {
  if (shiftsOn(pop.date).length) closeShiftForm();
  else closeSheet();
}

function resetForm() {
  const l = state.lastForm;
  pop.editId = null;
  pop.jobId = (ui.filter && jobById(ui.filter)) ? ui.filter
    : (l && jobById(l.jobId)) ? l.jobId : state.jobs[0].id;
  pop.start = l ? l.start : '09:00';
  pop.end = l ? l.end : '18:00';
  pop.breaks = l && Array.isArray(l.breaks) ? l.breaks.map(b => ({ ...b })) : [];
}

function startEdit(id) {
  const s = state.shifts.find(x => x.id === id);
  if (!s) return;
  pop.editId = id;
  pop.formOpen = true;
  pop.jobId = s.jobId; pop.start = s.start; pop.end = s.end;
  pop.breaks = s.breaks.map(b => ({ ...b }));
  renderDaySheet();
}

function refreshForm() {
  $('#fJob').value = pop.jobId;
  $('#fStart').value = pop.start;
  $('#fEnd').value = pop.end;
  const editing = !!pop.editId;
  $('#formTitle').textContent = editing ? '근무 수정' : '새 근무';
  $('#formHead').classList.toggle('editing', editing);
  $('#cancelEdit').hidden = !editing;
  renderBreaks(); renderCalc(); renderPicker();
}

function renderDayList() {
  const ss = shiftsOn(pop.date);
  $('#dayList').innerHTML = ss.length ? ss.map(s => {
    const j = jobById(s.jobId);
    const br = s.breaks.length ? `휴게 ${s.breaks.map(b => `${b.start}–${b.end}`).join(', ')}` : '휴게 없음';
    return `<div class="day-row ${s.id === pop.editId ? 'editing' : ''}">
      <span class="dot" style="background:${j.color}"></span>
      <span class="dr-main"><b>${esc(j.name)}</b> ${s.start}–${s.end} · ${fmtH(netMinutes(s))}<small>${br} · ${won(shiftPay(s))}</small></span>
      <span class="dr-btns">
        <button type="button" class="mbtn small" data-action="edit-shift" data-id="${esc(s.id)}">수정</button>
        <button type="button" class="mbtn small danger" data-action="del-shift" data-id="${esc(s.id)}">삭제</button>
      </span></div>`;
  }).join('') : '<div class="day-empty">이 날은 아직 근무 기록이 없어요.</div>';
}

function renderBreaks() {
  $('#breakList').innerHTML = pop.breaks.length ? pop.breaks.map((b, i) => `
    <div class="fctl">
      <input type="time" data-bi="${i}" data-k="start" value="${b.start}" aria-label="휴게 ${i + 1} 시작"> –
      <input type="time" data-bi="${i}" data-k="end" value="${b.end}" aria-label="휴게 ${i + 1} 종료">
      <button type="button" class="xbtn" data-action="del-break" data-i="${i}" aria-label="휴게 ${i + 1} 지우기">×</button>
    </div>`).join('') : '<span class="sub" style="color:var(--gray2);padding-top:4px">휴게 없음</span>';
}

function formShift() {
  return { jobId: pop.jobId, start: pop.start, end: pop.end, breaks: pop.breaks.map(b => ({ start: b.start, end: b.end })) };
}

function renderCalc() {
  const a = analyze(formShift());
  const j = jobById(pop.jobId);
  let h = '';
  if (!a.errors.length || a.minutes > 0) {
    h += `순수 근무 <b>${fmtH(a.minutes)}</b>`;
    if (j) h += ` · 예상 <b>${won(a.minutes / 60 * j.wage)}</b>`;
    if (a.overnight) h += ' <span style="color:var(--gray)">(다음 날 새벽까지)</span>';
  }
  a.errors.forEach(e => { h += `<span class="err">${e}</span>`; });
  a.warns.forEach(w => { h += `<span class="warn">${w}</span>`; });
  $('#calc').innerHTML = h;
}

/* 반복 입력용 간이 달력 */
function renderPicker() {
  const t = $('#copyToggle');
  t.setAttribute('aria-expanded', String(pop.showCopy));
  t.innerHTML = `${icon('chev-right')} 다른 날짜에도 같은 근무 복사${pop.copy.size ? ` <b>${pop.copy.size}일</b>` : ''}`;
  const el = $('#picker');
  el.hidden = !pop.showCopy;
  if (!pop.showCopy) return;
  const y = pop.py, m = pop.pm;
  const baseWd = parseYmd(pop.date).getDay();
  const first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const worked = new Set(state.shifts.map(s => s.date));
  let g = WD_MON.map(w => `<span class="pw">${w}</span>`).join('');
  for (let i = 0; i < offset; i++) g += '<span></span>';
  for (let d = 1; d <= days; d++) {
    const key = ymd(y, m, d), wd = (offset + d - 1) % 7, isBase = key === pop.date;
    const cls = ['pk-day', wd >= 5 ? 'wkend' : '', worked.has(key) ? 'has' : '', pop.copy.has(key) ? 'picked' : '', isBase ? 'base' : ''].join(' ');
    g += `<button type="button" class="${cls}" ${isBase ? 'disabled title="기준 날짜"' : `data-action="pick-day" data-date="${key}"`}
      aria-pressed="${pop.copy.has(key)}" aria-label="${m + 1}월 ${d}일">${d}</button>`;
  }
  const picked = [...pop.copy].sort();
  el.innerHTML = `
    <div class="pk-head">
      <button type="button" class="tb-btn" data-action="pk-move" data-d="-1" aria-label="이전 달">${icon('chev-left')}</button>
      <span>${y}년 ${m + 1}월</span>
      <button type="button" class="tb-btn" data-action="pk-move" data-d="1" aria-label="다음 달">${icon('chev-right')}</button>
    </div>
    <div class="pk-grid">${g}</div>
    <div class="pk-btns">
      <button type="button" class="mbtn small" data-action="pk-weekday">이번 달 ${WD_SUN[baseWd]}요일 전체 선택</button>
      <button type="button" class="mbtn small" data-action="pk-clear">선택 해제</button>
    </div>
    <div class="pk-info">${picked.length
      ? `선택한 날짜 <b>${picked.length}</b>개: ${picked.map(k => md(parseYmd(k))).join(', ')}`
      : '복사할 날짜를 눌러서 골라 주세요. 분홍 점은 이미 근무가 있는 날이에요.'}</div>`;
}

function saveShift() {
  const data = formShift();
  data.breaks = data.breaks.filter(b => b.start && b.end);
  if (!data.jobId || !jobById(data.jobId)) { toast('알바를 골라 주세요.'); return; }
  const a = analyze(data);
  if (a.errors.length) { toast(a.errors[0]); return; }

  const wasEdit = !!pop.editId;
  if (wasEdit) {
    const s = state.shifts.find(x => x.id === pop.editId);
    if (s) Object.assign(s, data);
  } else {
    // 같은 날 · 같은 알바 · 같은 시간이 이미 있으면 한 번 물어봐요
    const dup = state.shifts.some(x => x.date === pop.date && x.jobId === data.jobId && x.start === data.start && x.end === data.end);
    if (dup && !confirm('이미 같은 근무가 있어요. 그래도 추가할까요?')) return;
    state.shifts.push({ id: uid(), date: pop.date, ...data });
  }
  let copied = 0, skipped = 0;
  for (const d of [...pop.copy].sort()) {
    if (d === pop.date) continue;
    const dup = state.shifts.some(x => x.date === d && x.jobId === data.jobId && x.start === data.start && x.end === data.end);
    if (dup) { skipped++; continue; }
    state.shifts.push({ id: uid(), date: d, ...data, breaks: data.breaks.map(b => ({ ...b })) });
    copied++;
  }
  state.lastForm = { ...data, breaks: data.breaks.map(b => ({ ...b })) };
  save();

  let msg = wasEdit ? '수정했어요.' : '근무를 추가했어요.';
  if (copied) msg += ` ${copied}일에 복사했어요.`;
  if (skipped) msg += ` (같은 근무가 있는 ${skipped}일은 건너뜀)`;
  toast(msg);
  closeSheet();
  renderAll();
}

/* 근무 삭제 — 바로 지우고 5초 동안 되돌릴 수 있어요. 삭제 때문에 입력칸이 열리지는 않아요. */
function deleteShift(id) {
  const at = state.shifts.findIndex(s => s.id === id);
  if (at < 0) return;
  const old = state.shifts[at];
  const back = { at, shift: { ...old, breaks: old.breaks.map(b => ({ ...b })) } };

  state.shifts.splice(at, 1);
  // 고치고 있던 근무를 지웠으면 입력칸을 접고 "닫기" 상태로 되돌려요
  if (pop && pop.editId === id) { pop.editId = null; pop.formOpen = false; resetForm(); }
  save();
  renderDaySheet();
  renderAll();

  toast('삭제했어요.', {
    label: '실행 취소',
    ms: 5000,
    fn: () => {
      if (state.shifts.some(s => s.id === back.shift.id)) return;   // 이미 되돌아왔으면 그냥 둠
      state.shifts.splice(Math.min(back.at, state.shifts.length), 0, back.shift);
      save();
      renderDaySheet();
      renderAll();
      toast('되돌렸어요.');
    }
  });
}

/* ============================================
   가계부 — 날짜 상세 시트
   근무 입력 시트와 같은 규칙: 기록이 있으면 입력칸을 접어둬요
   (지우고 나서 "저장"을 눌러 다시 생기는 실수가 없게)
   ============================================ */
let mon = null;   // money day 상태

function openMoneyDay(date, editId) {
  const dt = parseYmd(date);
  mon = { date, editId: null, type: 'out', amount: '', categoryId: FALLBACK_CAT.out, savingId: null, memo: '', wasted: false, formOpen: false };
  mon.formOpen = !!editId || !entriesOn(date).length;
  resetMoneyForm();
  openSheet('money', `
    <div class="sheet-head" id="sheetTitle">${longDate(date)}</div>
    <div class="sheet-body">
      <div class="day-list" id="monList"></div>
      <button type="button" class="mbtn addbtn" id="addEntry" data-action="open-entry-form" hidden>+ 기록 추가</button>
      <div id="entryForm" hidden>
        <div class="form-head" id="monFormHead"><span id="monFormTitle"></span>
          <button type="button" class="linkbtn" data-action="cancel-entry-edit" id="cancelEntryEdit" hidden>새로 쓰기</button></div>
        <div class="frow"><span class="lbl">종류</span>
          <div class="seg small" role="group" aria-label="수입 / 지출 / 저축">
            <button type="button" class="seg-btn" id="typeOut" data-action="entry-type" data-type="out">지출</button>
            <button type="button" class="seg-btn" id="typeIn" data-action="entry-type" data-type="in">수입</button>
            <button type="button" class="seg-btn" id="typeSave" data-action="entry-type" data-type="save">저축</button>
          </div></div>
        <div class="frow"><label for="eAmount">금액</label>
          <div class="fctl"><input type="number" id="eAmount" min="1" step="1" inputmode="numeric"
            placeholder="0" style="width:140px;text-align:right"> 원</div></div>
        <div class="frow" id="catRow"><label for="eCat">카테고리</label>
          <select id="eCat"></select></div>
        <div class="frow" id="savRow" hidden><label for="eSaving">통장</label>
          <select id="eSaving"></select></div>
        <div class="frow wide" id="wasteRow"><span class="lbl">이 지출, 꼭 필요했나요?</span>
          <div class="seg small waste" role="group" aria-label="꼭 필요 / 안 써도 됐음">
            <button type="button" class="seg-btn" id="wasteNo" data-action="entry-waste" data-w="0">꼭 필요 ✓</button>
            <button type="button" class="seg-btn" id="wasteYes" data-action="entry-waste" data-w="1">안 써도 됐음 💸</button>
          </div></div>
        <div class="frow"><label for="eMemo">메모</label>
          <input type="text" id="eMemo" maxlength="60" placeholder="(선택) 어디에 썼는지" style="flex:1;min-width:0"></div>
      </div>
      <div class="form-head" style="border-top:1px solid var(--faint)">오늘의 메모</div>
      <textarea id="dayMemo" class="daymemo" rows="2" maxlength="500" placeholder="오늘 하루는 어땠나요? (자동 저장)"></textarea>
    </div>
    <div class="sheet-foot" id="monFoot"></div>`);
  $('#dayMemo').value = state.dayMemos[date] || '';
  if (editId) startEntryEdit(editId); else renderMoneySheet();
}

/* 목록 · 추가 버튼 · 입력칸 · 아래 버튼을 한 번에 맞춰 그려요 */
function renderMoneySheet() {
  if (sheetKind !== 'money' || !mon) return;
  renderMonList();
  $('#addEntry').hidden = mon.formOpen;
  $('#entryForm').hidden = !mon.formOpen;
  renderMonFoot();
  if (mon.formOpen) refreshMoneyForm();
}

function renderMonFoot() {
  const foot = $('#monFoot');
  if (!mon.formOpen) {
    foot.innerHTML = '<span class="spacer"></span><button type="button" class="mbtn blue" data-action="close-sheet">닫기</button>';
    return;
  }
  const editing = !!mon.editId;
  foot.innerHTML = '<span class="spacer"></span>' +
    '<button type="button" class="mbtn" data-action="cancel-entry">취소</button>' +
    `<button type="button" class="mbtn blue" data-action="save-entry">${editing ? '수정 저장' : '추가'}</button>`;
}

function renderMonList() {
  const list = entriesOn(mon.date);
  $('#monList').innerHTML = list.length ? list.map(e => {
    const v = e.type === 'save' ? savingById(e.savingId) : null;
    const c = v ? { name: v.name, emoji: '🏦', color: v.color } : catSafe(e.categoryId, e.type);
    const sign = e.type === 'in' ? '+' : '−';
    // 💸 표시는 직접 쓴 지출에만 (수입·저축·자동 기록은 없음)
    const canWaste = !e.auto && e.type === 'out';
    return `<div class="day-row ${e.id === mon.editId ? 'editing' : ''} ${e.wasted ? 'wasted' : ''}">
      <span class="cat-dot" style="background:${c.color}">${c.emoji}</span>
      <span class="dr-main"><b>${esc(c.name)}</b>${e.auto ? '<span class="jbadge">자동</span>' : ''}
        <span class="amt ${e.type}">${sign}${won(e.amount)}${e.wasted ? '<i class="wmark" title="안 써도 됐던 돈">💸</i>' : ''}</span>
        ${e.memo ? `<small>${esc(e.memo)}</small>` : ''}</span>
      <span class="dr-btns">${canWaste
        ? `<button type="button" class="wbtn ${e.wasted ? 'on' : ''}" data-action="toggle-wasted" data-id="${esc(e.id)}"
             aria-pressed="${e.wasted ? 'true' : 'false'}"
             title="${e.wasted ? '안 써도 됐던 돈 — 눌러서 꼭 필요로' : '눌러서 안 써도 됐음으로'}">💸</button>` : ''}${e.auto
        ? `<button type="button" class="mbtn small" data-action="hide-auto" data-id="${esc(e.id)}" title="이번 달만 숨기기">숨기기</button>`
        : `<button type="button" class="mbtn small" data-action="edit-entry" data-id="${esc(e.id)}">수정</button>
           <button type="button" class="mbtn small danger" data-action="del-entry" data-id="${esc(e.id)}">삭제</button>`}
      </span></div>`;
  }).join('') : '<div class="day-empty">이 날은 아직 기록이 없어요.</div>';
}

function resetMoneyForm() {
  mon.editId = null;
  mon.amount = '';
  mon.memo = '';
  mon.wasted = false;   // 기본은 "꼭 필요"

  if (mon.type === 'save') { const open = state.savings.filter(v => !v.closed); mon.savingId = open.length ? open[0].id : (state.savings[0] || {}).id || null; }
  else mon.categoryId = FALLBACK_CAT[mon.type];
}

function refreshMoneyForm() {
  const editing = !!mon.editId;
  const kind = { in: '새 수입', out: '새 지출', save: '새 저축' }[mon.type];
  $('#monFormTitle').textContent = editing ? '기록 수정' : kind;
  $('#monFormHead').classList.toggle('editing', editing);
  $('#cancelEntryEdit').hidden = !editing;
  ['out', 'in', 'save'].forEach(t => $(`#type${t[0].toUpperCase()}${t.slice(1)}`).classList.toggle('on', mon.type === t));
  $('#eAmount').value = mon.amount;
  $('#eMemo').value = mon.memo;
  const saving = mon.type === 'save';
  $('#catRow').hidden = saving;
  $('#savRow').hidden = !saving;
  // 낭비 표시는 지출에만
  $('#wasteRow').hidden = mon.type !== 'out';
  $('#wasteNo').classList.toggle('on', !mon.wasted);
  $('#wasteYes').classList.toggle('on', !!mon.wasted);
  if (saving) {
    const open = state.savings.filter(v => !v.closed);
    const list = open.length ? open : state.savings;
    if (!list.some(v => v.id === mon.savingId)) mon.savingId = list.length ? list[0].id : null;
    $('#eSaving').innerHTML = list.length
      ? list.map(v => `<option value="${esc(v.id)}" ${v.id === mon.savingId ? 'selected' : ''}>${esc(v.name)}${v.bank ? ` · ${esc(v.bank)}` : ''}</option>`).join('')
      : '<option value="">먼저 통장을 만들어 주세요</option>';
  } else {
    const cats = catsOf(mon.type);
    if (!cats.some(c => c.id === mon.categoryId)) mon.categoryId = FALLBACK_CAT[mon.type];
    $('#eCat').innerHTML = cats.map(c =>
      `<option value="${esc(c.id)}" ${c.id === mon.categoryId ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('');
  }
}

function openEntryForm() {
  mon.formOpen = true;
  resetMoneyForm();
  renderMoneySheet();
  setTimeout(() => { const a = $('#eAmount'); if (a) a.focus(); }, 60);
}
function closeEntryForm() {
  mon.formOpen = false;
  mon.editId = null;
  resetMoneyForm();
  renderMoneySheet();
}
function cancelEntry() {
  if (entriesOn(mon.date).length) closeEntryForm();
  else closeSheet();
}

function startEntryEdit(id) {
  const e = state.entries.find(x => x.id === id);
  if (!e) return;
  mon.editId = id; mon.formOpen = true;
  mon.type = e.type; mon.amount = String(e.amount); mon.categoryId = e.categoryId; mon.memo = e.memo;
  mon.wasted = e.wasted === true;
  renderMoneySheet();
}

function saveEntry() {
  const amount = Math.round(Number($('#eAmount').value));
  if (!amount || amount < 1) { toast('금액을 적어 주세요.'); $('#eAmount').focus(); return; }
  const data = { date: mon.date, type: mon.type, amount, memo: $('#eMemo').value.trim().slice(0, 60) };
  if (mon.type === 'save') {
    data.savingId = $('#eSaving').value || null;
    if (!data.savingId) { toast('먼저 저축 통장을 만들어 주세요.'); return; }
  } else {
    data.categoryId = $('#eCat').value || FALLBACK_CAT[mon.type];
    if (mon.type === 'out') data.wasted = !!mon.wasted;
  }
  if (mon.editId) {
    const e = state.entries.find(x => x.id === mon.editId);
    // 수입↔지출↔저축으로 바꿨을 수 있으니 예전 종류의 값은 지우고 새로 넣어요
    if (e) { delete e.categoryId; delete e.savingId; delete e.wasted; Object.assign(e, data); }
    toast('수정했어요.');
  } else {
    state.entries.push({ id: uid(), ...data });
    toast(`${{ in: '수입', out: '지출', save: '저축' }[data.type]} ${won(amount)} 추가했어요.`);
  }
  save();
  closeEntryForm();
  renderAll();
}

/* 삭제 — 바로 지우고 5초 동안 되돌릴 수 있어요 */
function deleteEntry(id) {
  const at = state.entries.findIndex(e => e.id === id);
  if (at < 0) return;
  const back = { at, entry: { ...state.entries[at] } };
  state.entries.splice(at, 1);
  if (mon && mon.editId === id) { mon.editId = null; mon.formOpen = false; resetMoneyForm(); }
  save();
  renderMoneySheet();
  renderAll();
  toast('삭제했어요.', {
    label: '실행 취소', ms: 5000,
    fn: () => {
      if (state.entries.some(e => e.id === back.entry.id)) return;
      state.entries.splice(Math.min(back.at, state.entries.length), 0, back.entry);
      save(); renderMoneySheet(); renderAll();
      toast('되돌렸어요.');
    }
  });
}

/* 자동 기록(알바비·저축·고정 지출)은 지우는 게 아니라 "이번 달만 건너뛰기" */
const skipListOf = id => id.startsWith('save:') ? 'savingSkips' : id.startsWith('recur:') ? 'recurringSkips' : 'hiddenAuto';
function hideAuto(id) {
  const key = skipListOf(id);
  if (state[key].includes(id)) return;
  state[key].push(id);
  save(); renderMoneySheet(); renderAll();
  toast('이번 달은 건너뛰었어요.', {
    label: '실행 취소', ms: 5000,
    fn: () => {
      state[key] = state[key].filter(x => x !== id);
      save(); renderMoneySheet(); renderAll();
      toast('다시 보여요.');
    }
  });
}

/* 오늘의 메모는 적는 대로 저장 */
function saveDayMemo(text) {
  const t = text.slice(0, 500);
  if (t.trim()) state.dayMemos[mon.date] = t;
  else delete state.dayMemos[mon.date];
  save();
}

/* ============================================
   카테고리 관리
   ============================================ */
function catsSheetHTML() {
  const row = c => {
    const used = state.entries.filter(e => e.categoryId === c.id).length;
    const fixed = c.id === 'etc-out' || c.id === 'etc-in';
    return `<div class="day-row">
      <span class="cat-dot" style="background:${c.color}">${c.emoji}</span>
      <span class="dr-main"><b>${esc(c.name)}</b>${fixed ? '<span class="jbadge">기본</span>' : ''}
        <small>기록 ${used}개</small></span>
      <span class="dr-btns">
        <button type="button" class="mbtn small" data-action="edit-cat" data-id="${esc(c.id)}">수정</button>
        ${fixed ? '' : `<button type="button" class="mbtn small danger" data-action="del-cat" data-id="${esc(c.id)}">삭제</button>`}
      </span></div>`;
  };
  const group = (type, label) => `
    <div class="form-head">${label}</div>
    <div class="day-list">${catsOf(type).map(row).join('') || '<div class="day-empty">없어요.</div>'}</div>
    <button type="button" class="mbtn addbtn" data-action="add-cat" data-type="${type}">+ ${label} 카테고리 추가</button>`;
  return `
    <div class="sheet-head" id="sheetTitle">카테고리 관리</div>
    <div class="sheet-body">
      ${group('out', '지출')}
      ${group('in', '수입')}
      <p class="hint" style="margin-left:0">카테고리를 지우면 그 기록은 "기타"로 옮겨져요. 기본 "기타"는 지울 수 없어요.</p>
    </div>
    <div class="sheet-foot">
      <span class="spacer"></span>
      <button type="button" class="mbtn blue" data-action="close-sheet">닫기</button>
    </div>`;
}
function openCatsSheet() { openSheet('cats', catsSheetHTML()); }
function refreshCatsSheet() { if (sheetKind === 'cats') sheetEl.innerHTML = catsSheetHTML(); }

let catEdit = null;
function openCatSheet(id, type) {
  const c = id ? catById(id) : null;
  catEdit = { id: c ? c.id : null, type: c ? c.type : (type === 'in' ? 'in' : 'out'),
    emoji: c ? c.emoji : '✨', color: c ? c.color : nextTagColor() };
  openSheet('cat', `
    <div class="sheet-head" id="sheetTitle">${c ? '카테고리 수정' : '새 카테고리'}</div>
    <form class="sheet-body" id="catForm" autocomplete="off">
      <div class="frow"><label for="cName">이름</label>
        <input type="text" id="cName" maxlength="12" placeholder="예: 편의점" value="${c ? esc(c.name) : ''}"></div>
      <div class="frow top"><span class="lbl">그림</span>
        <div class="emojis" role="radiogroup" aria-label="이모지">
          ${CAT_EMOJI.map(e => `<button type="button" class="emo ${e === catEdit.emoji ? 'on' : ''}" data-action="pick-emoji" data-emoji="${e}" role="radio" aria-checked="${e === catEdit.emoji}">${e}</button>`).join('')}
        </div></div>
      <div class="frow top"><span class="lbl">색</span>
        <div class="swatches" role="radiogroup" aria-label="색">
          ${TAGS.map(t => `<button type="button" class="sw ${t.color === catEdit.color ? 'on' : ''}" style="background:${t.color}" data-action="pick-cat-color" data-color="${t.color}" role="radio" aria-checked="${t.color === catEdit.color}" title="${t.name}" aria-label="${t.name}"></button>`).join('')}
        </div></div>
    </form>
    <div class="sheet-foot">
      <span class="spacer"></span>
      <button type="button" class="mbtn" data-action="back-to-cats">취소</button>
      <button type="submit" class="mbtn blue" form="catForm">저장</button>
    </div>`);
  setTimeout(() => { const n = $('#cName'); if (n && window.innerWidth > 760) n.focus(); }, 320);
}

function submitCat() {
  const name = $('#cName').value.trim();
  if (!name) { toast('카테고리 이름을 적어 주세요.'); $('#cName').focus(); return; }
  if (catEdit.id) {
    Object.assign(catById(catEdit.id), { name: name.slice(0, 12), emoji: catEdit.emoji, color: safeColor(catEdit.color) });
  } else {
    state.categories.push({ id: uid(), name: name.slice(0, 12), emoji: catEdit.emoji, color: safeColor(catEdit.color), type: catEdit.type });
  }
  save();
  openCatsSheet();
  renderAll();
  toast(`"${name}" 저장했어요.`);
}

function deleteCat(id) {
  const c = catById(id);
  if (!c || c.id === 'etc-out' || c.id === 'etc-in') return;
  const used = state.entries.filter(e => e.categoryId === id).length;
  if (used && !confirm(`"${c.name}"을(를) 지울까요?\n이 카테고리의 기록 ${used}개는 "기타"로 옮겨져요.`)) return;
  const back = { cat: { ...c }, at: state.categories.indexOf(c), moved: state.entries.filter(e => e.categoryId === id).map(e => e.id) };
  state.categories = state.categories.filter(x => x.id !== id);
  state.entries.forEach(e => { if (e.categoryId === id) e.categoryId = FALLBACK_CAT[e.type]; });
  save(); refreshCatsSheet(); renderAll();
  toast(`"${c.name}" 지웠어요.${used ? ` 기록 ${used}개는 "기타"로 옮겼어요.` : ''}`, {
    label: '실행 취소', ms: 5000,
    fn: () => {
      if (catById(back.cat.id)) return;
      state.categories.splice(Math.min(back.at, state.categories.length), 0, back.cat);
      const ids = new Set(back.moved);
      state.entries.forEach(e => { if (ids.has(e.id)) e.categoryId = back.cat.id; });
      save(); refreshCatsSheet(); renderAll();
      toast('되돌렸어요.');
    }
  });
}

/* ============================================
   매달 고정 지출
   ============================================ */
function recurSheetHTML() {
  const rows = state.recurring.map(r => {
    const c = catSafe(r.categoryId, 'out');
    const term = [r.start ? `${r.start.replace('-', '.')}부터` : '', r.end ? `${r.end.replace('-', '.')}까지` : ''].filter(Boolean).join(' ');
    return `<div class="day-row">
      <span class="cat-dot" style="background:${c.color}">${c.emoji}</span>
      <span class="dr-main"><b>${esc(r.name)}</b>
        <span class="amt out">−${won(r.amount)}</span>
        <small>매달 ${r.day}일 · ${esc(c.name)}${term ? ` · ${term}` : ''}</small></span>
      <span class="dr-btns">
        <button type="button" class="mbtn small" data-action="edit-recur" data-id="${esc(r.id)}">수정</button>
        <button type="button" class="mbtn small danger" data-action="del-recur" data-id="${esc(r.id)}">삭제</button>
      </span></div>`;
  }).join('');
  return `
    <div class="sheet-head" id="sheetTitle">매달 고정 지출</div>
    <div class="sheet-body">
      <div class="day-list">${rows || '<div class="day-empty">아직 없어요. 통신비·구독료처럼 매달 나가는 돈을 넣어 두세요.</div>'}</div>
      <button type="button" class="mbtn addbtn" data-action="add-recur">+ 고정 지출 추가</button>
      <p class="hint" style="margin-left:0">정한 날짜마다 지출로 자동 기록돼요. 날짜 칸에서 "건너뛰기"로 그 달만 뺄 수 있어요.</p>
    </div>
    <div class="sheet-foot"><span class="spacer"></span>
      <button type="button" class="mbtn blue" data-action="close-sheet">닫기</button></div>`;
}
function openRecurSheet() { openSheet('recur', recurSheetHTML()); }
function refreshRecurSheet() { if (sheetKind === 'recur') sheetEl.innerHTML = recurSheetHTML(); }

let recurEdit = null;
function openRecurEditSheet(id) {
  const r = id ? state.recurring.find(x => x.id === id) : null;
  recurEdit = { id: r ? r.id : null };
  openSheet('recur1', `
    <div class="sheet-head" id="sheetTitle">${r ? '고정 지출 수정' : '새 고정 지출'}</div>
    <form class="sheet-body" id="recurForm" autocomplete="off">
      <div class="frow"><label for="rName">이름</label>
        <input type="text" id="rName" maxlength="20" placeholder="예: 통신비, 넷플릭스" value="${r ? esc(r.name) : ''}"></div>
      <div class="frow"><label for="rAmount">금액</label>
        <div class="fctl"><input type="number" id="rAmount" min="1" step="1" inputmode="numeric" style="width:130px;text-align:right"
          placeholder="0" value="${r ? r.amount : ''}"> 원</div></div>
      <div class="frow"><span class="lbl">날짜</span>
        <div class="fctl">매달 <input type="number" id="rDay" min="1" max="31" step="1" inputmode="numeric" style="width:62px;text-align:right"
          aria-label="날짜" value="${r ? r.day : 1}">일</div></div>
      <div class="frow"><label for="rCat">카테고리</label>
        <select id="rCat">${catsOf('out').map(c =>
          `<option value="${esc(c.id)}" ${r && r.categoryId === c.id ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></div>
      <div class="frow"><label for="rStart">시작</label>
        <input type="month" id="rStart" value="${r && r.start ? r.start : ''}"></div>
      <div class="frow"><label for="rEnd">끝</label>
        <input type="month" id="rEnd" value="${r && r.end ? r.end : ''}"></div>
      <p class="hint">시작·끝은 비워 두면 계속 나가는 걸로 봐요.</p>
    </form>
    <div class="sheet-foot"><span class="spacer"></span>
      <button type="button" class="mbtn" data-action="back-to-recur">취소</button>
      <button type="submit" class="mbtn blue" form="recurForm">저장</button></div>`);
  setTimeout(() => { const n = $('#rName'); if (n && window.innerWidth > 760) n.focus(); }, 320);
}

function submitRecur() {
  const name = $('#rName').value.trim();
  const amount = Math.round(Number($('#rAmount').value));
  if (!name) { toast('이름을 적어 주세요.'); $('#rName').focus(); return; }
  if (!amount || amount < 1) { toast('금액을 적어 주세요.'); $('#rAmount').focus(); return; }
  const MONTH_RE = /^\d{4}-\d{2}$/;
  const st = $('#rStart').value, en = $('#rEnd').value;
  const data = {
    name: name.slice(0, 20), amount,
    day: Math.min(31, Math.max(1, Math.round(Number($('#rDay').value)) || 1)),
    categoryId: $('#rCat').value || FALLBACK_CAT.out,
    start: MONTH_RE.test(st) ? st : null,
    end: MONTH_RE.test(en) ? en : null
  };
  if (data.start && data.end && data.end < data.start) { toast('끝이 시작보다 빨라요.'); return; }
  if (recurEdit.id) Object.assign(state.recurring.find(x => x.id === recurEdit.id), data);
  else state.recurring.push({ id: uid(), ...data });
  save(); openRecurSheet(); renderAll();
  toast(`"${name}" 저장했어요.`);
}

function deleteRecur(id) {
  const r = state.recurring.find(x => x.id === id); if (!r) return;
  const back = { at: state.recurring.indexOf(r), item: { ...r } };
  state.recurring = state.recurring.filter(x => x.id !== id);
  save(); refreshRecurSheet(); renderAll();
  toast(`"${r.name}" 지웠어요.`, {
    label: '실행 취소', ms: 5000,
    fn: () => {
      if (state.recurring.some(x => x.id === back.item.id)) return;
      state.recurring.splice(Math.min(back.at, state.recurring.length), 0, back.item);
      save(); refreshRecurSheet(); renderAll(); toast('되돌렸어요.');
    }
  });
}

/* ---------- 이번 달 예산 정하기 ---------- */
function setBudget() {
  const { amount } = budgetOf(ui.y, ui.m);
  const v = prompt(`${ui.m + 1}월 예산을 얼마로 할까요? (원)\n비워서 확인을 누르면 예산을 없애요.`, amount ? String(amount) : '');
  if (v === null) return;
  const key = monthKey(ui.y, ui.m);
  if (!v.trim()) { delete state.budgets[key]; save(); renderAll(); toast(`${ui.m + 1}월 예산을 없앴어요.`); return; }
  const n = Math.max(0, Math.round(Number(v.replace(/[^0-9.]/g, '')) || 0));
  if (!n) { toast('숫자로 적어 주세요.'); return; }
  state.budgets[key] = n;
  save(); renderAll();
  toast(`${ui.m + 1}월 예산을 ${won(n)}으로 정했어요.`);
}

/* ---------- 알바 관리 시트 ---------- */
/* 알바를 한곳에서 보고 바로 수정·삭제할 수 있는 창이에요. */
const shiftCount = jobId => state.shifts.filter(s => s.jobId === jobId).length;

function jobsSheetHTML() {
  const rows = state.jobs.map(j => {
    const n = shiftCount(j.id);
    return `<div class="day-row">
      <span class="dot" style="background:${j.color}"></span>
      <div class="dr-main">
        <b>${esc(j.name)}</b>${jobBadges(j)}
        <small>${won(j.wage)}/시 · 근무 기록 ${n}개</small>
      </div>
      <div class="dr-btns">
        <button type="button" class="mbtn small" data-action="edit-job" data-id="${esc(j.id)}">수정</button>
        <button type="button" class="mbtn small danger" data-action="del-job" data-id="${esc(j.id)}">삭제</button>
      </div></div>`;
  }).join('');
  return `
    <div class="sheet-head" id="sheetTitle">알바 관리</div>
    <div class="sheet-body">
      <div class="day-list">${rows || '<div class="day-empty">등록한 알바가 없어요.</div>'}</div>
      <p class="hint" style="margin-left:0">알바를 지우면 그 알바의 근무 기록도 함께 지워져요. 지운 뒤 5초 안에는 되돌릴 수 있어요.</p>
    </div>
    <div class="sheet-foot">
      <button type="button" class="mbtn" data-action="add-job">+ 새 알바 등록</button>
      <span class="spacer"></span>
      <button type="button" class="mbtn blue" data-action="close-sheet">닫기</button>
    </div>`;
}

function openJobsSheet() {
  if (!state.jobs.length) { openJobSheet(); return; }   // 하나도 없으면 바로 등록 화면
  openSheet('jobs', jobsSheetHTML());
}
/* 지우거나 되돌린 뒤 목록만 다시 그려요 (시트가 다시 내려오지 않게) */
function refreshJobsSheet() {
  if (sheetKind !== 'jobs') return;
  sheetEl.innerHTML = jobsSheetHTML();
}

/* ---------- 알바 등록·수정 시트 ---------- */
let jobEdit = null;

function openJobSheet(id) {
  const j = id ? jobById(id) : null;
  jobEdit = { id: j ? j.id : null, color: j ? j.color : nextTagColor() };
  const isTag = TAGS.some(t => t.color === jobEdit.color);
  openSheet('job', `
    <div class="sheet-head" id="sheetTitle">${j ? '알바 수정' : '새 알바 등록'}</div>
    <form class="sheet-body" id="jobForm" autocomplete="off">
      <div class="frow"><label for="jName">이름</label>
        <input type="text" id="jName" maxlength="20" placeholder="예: 카페알바" value="${j ? esc(j.name) : ''}"></div>
      <div class="frow"><label for="jWage">시급</label>
        <div class="fctl"><input type="number" id="jWage" min="1" step="1" inputmode="numeric" placeholder="10320" style="width:120px" value="${j ? j.wage : ''}"> 원</div></div>
      <div class="frow"><span class="lbl">태그</span>
        <div class="swatches" role="radiogroup" aria-label="태그 색">
          ${TAGS.map(t => `<button type="button" class="sw ${t.color === jobEdit.color ? 'on' : ''}" style="background:${t.color}" data-action="pick-color" data-color="${t.color}" role="radio" aria-checked="${t.color === jobEdit.color}" title="${t.name}" aria-label="${t.name}"></button>`).join('')}
          ${isTag ? '' : `<button type="button" class="sw on" style="background:${jobEdit.color}" data-action="pick-color" data-color="${jobEdit.color}" title="지금 색" aria-label="지금 색"></button>`}
        </div></div>
      <div class="frow top"><span class="lbl">주휴</span>
        <div class="col">
          <label class="check"><input type="checkbox" id="jBonus" ${j && j.weeklyBonus ? 'checked' : ''}> 주휴수당 별도 지급 (주 15시간 이상 시)</label>
          <span class="check-hint">체크 해제 = 시급에 주휴수당이 포함돼 있어서 따로 계산하지 않아요.</span>
        </div></div>
      <div class="frow top"><span class="lbl">공제</span>
        <div class="col">
          <div class="fctl">
            <label class="check"><input type="checkbox" id="jTax" ${j && j.tax ? 'checked' : ''}> 세금 공제</label>
            <input type="number" class="rate" id="jTaxRate" min="0" max="100" step="0.01" inputmode="decimal"
              aria-label="세금 공제율(%)" value="${j ? rateText(j.taxRate) : '3.3'}" ${j && j.tax ? '' : 'disabled'}>
            <span class="unit">%</span>
          </div>
          <div class="fctl">
            <label class="check"><input type="checkbox" id="jIns" ${j && j.insurance ? 'checked' : ''}> 4대보험 공제</label>
            <input type="number" class="rate" id="jInsRate" min="0" max="100" step="0.01" inputmode="decimal"
              aria-label="4대보험 공제율(%)" value="${j ? rateText(j.insuranceRate) : '10'}" ${j && j.insurance ? '' : 'disabled'}>
            <span class="unit">%</span>
          </div>
          <span class="check-hint">합계(기본급 + 주휴수당)에서 빼요. 둘 다 체크해도 돼요.</span>
        </div></div>
      <div class="frow"><span class="lbl">월급날</span>
        <div class="fctl">매달
          <input type="number" id="jPayday" min="1" max="31" step="1" inputmode="numeric" style="width:62px;text-align:right"
            aria-label="월급날" value="${j ? j.payday : 10}">일,
          <select id="jPayMonth" aria-label="어느 달 근무분">
            <option value="prev" ${!j || j.payMonth !== 'same' ? 'selected' : ''}>지난달 근무분</option>
            <option value="same" ${j && j.payMonth === 'same' ? 'selected' : ''}>이번달 근무분</option>
          </select>
        </div></div>
      <p class="hint">월급날에 실수령액이 가계부에 "알바비" 수입으로 자동으로 떠요. 그 달에 없는 날짜면 말일에 떠요.</p>
      <p class="hint">2026년 최저시급은 10,320원이에요.</p>
    </form>
    <div class="sheet-foot">
      ${j ? `<button type="button" class="mbtn plain" data-action="del-job" data-id="${esc(j.id)}">알바 삭제</button>` : ''}
      <span class="spacer"></span>
      <button type="button" class="mbtn" data-action="close-sheet">취소</button>
      <button type="submit" class="mbtn blue" form="jobForm">저장</button>
    </div>`);
  if (!j) setTimeout(() => { const n = $('#jName'); if (n && window.innerWidth > 760) n.focus(); }, 320);
}

function submitJob() {
  const name = $('#jName').value.trim();
  const wage = Math.round(Number($('#jWage').value));
  if (!name) { toast('알바 이름을 적어 주세요.'); $('#jName').focus(); return; }
  if (!wage || wage < 1) { toast('시급을 숫자로 적어 주세요.'); $('#jWage').focus(); return; }
  const color = safeColor(jobEdit.color);
  const weeklyBonus = $('#jBonus').checked;
  const tax = $('#jTax').checked;
  const insurance = $('#jIns').checked;
  const taxRate = safeRate($('#jTaxRate').value, 3.3);
  const insuranceRate = safeRate($('#jInsRate').value, 10);
  const payday = Math.min(31, Math.max(1, Math.round(Number($('#jPayday').value)) || 10));
  const payMonth = $('#jPayMonth').value === 'same' ? 'same' : 'prev';
  const ded = { tax, taxRate, insurance, insuranceRate, payday, payMonth };
  const first = state.jobs.length === 0;
  if (jobEdit.id && jobById(jobEdit.id)) {
    Object.assign(jobById(jobEdit.id), { name, wage, color, weeklyBonus, ...ded });
    toast(`"${name}" 수정했어요.`);
  } else {
    state.jobs.push({ id: uid(), name, wage, color, weeklyBonus, ...ded });
    if (first) { ui.view = 'calendar'; toast(`"${name}" 등록! 날짜를 눌러 근무를 기록해 보세요.`); }
    else toast(`"${name}" 등록했어요.`);
  }
  save(); closeSheet(); renderAll();
}

/* 알바 삭제 — 근무 기록이 없으면 바로, 있으면 물어보고. 둘 다 5초 안에 되돌릴 수 있어요. */
function removeJob(id) {
  const j = jobById(id); if (!j) return;
  const at = state.jobs.indexOf(j);                       // 되돌릴 때 순서까지 그대로
  const gone = state.shifts.filter(s => s.jobId === j.id);
  if (gone.length && !confirm(`"${j.name}"을(를) 삭제할까요?\n이 알바의 근무 기록 ${gone.length}개도 같이 지워져요.`)) return;

  const back = { job: { ...j }, at, shifts: gone.map(s => ({ ...s, breaks: s.breaks.map(b => ({ ...b })) })), filter: ui.filter };
  state.jobs.splice(at, 1);
  state.shifts = state.shifts.filter(s => s.jobId !== j.id);
  if (ui.filter === j.id) ui.filter = null;
  save();

  if (sheetKind === 'job') closeSheet();                  // 수정 시트에서 지웠을 때
  refreshJobsSheet();
  renderAll();
  toast(`"${j.name}" 삭제했어요.${gone.length ? ` (근무 기록 ${gone.length}개 포함)` : ''}`, {
    label: '실행 취소',
    ms: 5000,
    fn: () => {
      if (jobById(back.job.id)) return;                   // 이미 되돌아왔으면 그냥 둠
      state.jobs.splice(Math.min(back.at, state.jobs.length), 0, back.job);
      state.shifts = state.shifts.concat(back.shifts);
      ui.filter = back.filter;
      save(); refreshJobsSheet(); renderAll();
      toast(`"${back.job.name}" 되돌렸어요.`);
    }
  });
}

/* ============================================
   정산 이미지 저장 — 지금 화면 모드 색으로 그려요
   ============================================ */
const PAINT = {
  day: {
    sky: [[0, '#7fd8ec'], [.38, '#2b96c4'], [.72, '#0e5a8a'], [1, '#083b5e']],
    shadow: 'rgba(3,38,66,.32)', win: '#f4fbfe', border: '#cfe8f3',
    title: '#0d4f7c', sub: '#11557e', head: '#27566e', line: '#cde5ef',
    stripe: '#e9f6fb', strong: '#0b3a56', text: '#0b3a56', muted: '#4a7e99',
    total: '#0d4f7c', faint: '#7fa8bd'
  },
  night: {
    sky: [[0, '#17366b'], [.5, '#0b1b3a'], [1, '#050b1a']],
    shadow: 'rgba(0,0,0,.6)', win: '#0c1f40', border: '#1f3d6e',
    title: '#e4f0ff', sub: '#cfe3ff', head: '#6f8bb5', line: '#1a3563',
    stripe: 'rgba(124,247,255,.05)', strong: '#cfe3ff', text: '#cfe3ff', muted: '#5c7aa8',
    total: '#7cf7ff', faint: '#5c7aa8'
  }
};
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
async function shareImage() {
  if (!state.jobs.length) { toast('먼저 알바를 등록해 주세요.'); return; }
  try { if (document.fonts) await document.fonts.ready; } catch (e) { /* 무시 */ }
  const c = monthCalc(ui.y, ui.m);
  const F = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
  const W = 760, rowH = 40, dedH = 17, pad0 = 28, winX = 24, winY = 24;
  const dedLines = r => (r.job.tax ? 1 : 0) + (r.job.insurance ? 1 : 0) + (r.job.tax || r.job.insurance ? 1 : 0);
  const bodyH = c.jobs.reduce((a, r) => a + rowH + dedLines(r) * dedH, 0);
  const H = winY * 2 + 120 + 34 + bodyH + 76 + (c.deducted ? 26 : 0);
  const S = 2;
  const P = PAINT[resolvedTheme()];
  const cv = document.createElement('canvas');
  cv.width = W * S; cv.height = H * S;
  const ctx = cv.getContext('2d');
  ctx.scale(S, S);
  // 바깥: 바다
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  P.sky.forEach(([at, col]) => sky.addColorStop(at, col));
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // 창
  ctx.save();
  ctx.shadowColor = P.shadow; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  roundRect(ctx, winX, winY, W - winX * 2, H - winY * 2, 12); ctx.fillStyle = P.win; ctx.fill();
  ctx.restore();
  ctx.strokeStyle = P.border; ctx.lineWidth = 1; roundRect(ctx, winX + .5, winY + .5, W - winX * 2 - 1, H - winY * 2 - 1, 12); ctx.stroke();
  // 신호등
  [['#ff5f57', 0], ['#febc2e', 1], ['#28c840', 2]].forEach(([col, i]) => {
    ctx.beginPath(); ctx.arc(winX + 22 + i * 20, winY + 24, 6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  });
  const L = winX + pad0, R = W - winX - pad0;
  // 제목
  ctx.fillStyle = P.title; ctx.font = `700 19px ${F}`; ctx.textBaseline = 'alphabetic';
  const TITLE = '💸 HOW MUCH DID I EARN? 💸';
  ctx.fillText(TITLE, L, winY + 78);
  const tw = ctx.measureText(TITLE).width;
  ctx.fillStyle = P.muted; ctx.font = `500 13px ${F}`;
  ctx.fillText(`${ui.y}.${pad(ui.m + 1)}`, L + tw + 10, winY + 78);
  // 표 머리
  const cols = [{ t: '알바', x: L, a: 'left' }, { t: '근무시간', x: R - 330, a: 'right' }, { t: '기본급', x: R - 225, a: 'right' }, { t: '주휴수당', x: R - 115, a: 'right' }, { t: '합계', x: R, a: 'right' }];
  let y = winY + 120;
  ctx.font = `500 12px ${F}`; ctx.fillStyle = P.head;
  cols.forEach(col => { ctx.textAlign = col.a; ctx.fillText(col.t, col.x, y); });
  y += 10;
  ctx.fillStyle = P.line; ctx.fillRect(L - 8, y, R - L + 16, 1);
  // 행
  let top = y + 1;
  c.jobs.forEach((r, i) => {
    const hh = rowH + dedLines(r) * dedH;
    if (i % 2 === 1) { ctx.fillStyle = P.stripe; ctx.fillRect(L - 8, top, R - L + 16, hh); }
    const mid = top + rowH / 2 + 5;
    ctx.beginPath(); ctx.arc(L + 5, mid - 5, 5, 0, Math.PI * 2); ctx.fillStyle = r.job.color; ctx.fill();
    ctx.textAlign = 'left'; ctx.fillStyle = P.strong; ctx.font = `500 14px ${F}`;
    let name = r.job.name;
    while (ctx.measureText(name).width > R - 340 - (L + 18) - 10 && name.length > 1) name = name.slice(0, -1);
    ctx.fillText(name === r.job.name ? name : name + '…', L + 18, mid);
    ctx.textAlign = 'right'; ctx.fillStyle = P.text; ctx.font = `400 14px ${F}`;
    ctx.fillText(fmtH(r.minutes), cols[1].x, mid);
    ctx.fillText(won(r.base), cols[2].x, mid);
    if (r.bonus) ctx.fillText(won(r.holiday), cols[3].x, mid);
    else { ctx.fillStyle = P.muted; ctx.font = `400 13px ${F}`; ctx.fillText('시급 포함', cols[3].x, mid); }
    ctx.font = `700 14px ${F}`; ctx.fillStyle = P.strong;
    ctx.fillText(won(r.total), cols[4].x, mid);
    // 공제 줄
    let dy = mid + 15;
    const dedLine = (label, value, strong) => {
      ctx.textAlign = 'left'; ctx.font = `400 11.5px ${F}`; ctx.fillStyle = P.muted;
      ctx.fillText(label, L + 18, dy);
      ctx.textAlign = 'right';
      ctx.font = `${strong ? 600 : 400} 11.5px ${F}`; ctx.fillStyle = strong ? P.total : P.muted;
      ctx.fillText(value, cols[4].x, dy);
      dy += dedH;
    };
    if (r.job.tax) dedLine(`세금 (${rateText(r.job.taxRate)}%)`, minus(r.tax));
    if (r.job.insurance) dedLine(`4대보험 (${rateText(r.job.insuranceRate)}%)`, minus(r.ins));
    if (r.job.tax || r.job.insurance) dedLine('실수령액', won(r.net), true);
    top += hh;
  });
  y = top + 22;
  ctx.fillStyle = P.line; ctx.fillRect(L - 8, y - 14, R - L + 16, 1);
  // 큰 숫자는 실수령액, 세전·공제는 바로 아래 작게
  ctx.textAlign = 'left'; ctx.fillStyle = P.sub; ctx.font = `500 14px ${F}`;
  ctx.fillText(`${ui.m + 1}월 ${c.deducted ? '받을 돈' : '총 알바비'}`, L, y + 16);
  ctx.textAlign = 'right'; ctx.fillStyle = P.total; ctx.font = `700 26px ${F}`;
  ctx.fillText(won(c.deducted ? c.net : c.total), R, y + 20);
  if (c.deducted) {
    ctx.textAlign = 'right'; ctx.fillStyle = P.muted; ctx.font = `400 11.5px ${F}`;
    ctx.fillText(`세전 ${won(c.total)} · 공제 ${minus(c.tax + c.ins)}`, R, y + 42);
  }
  ctx.textAlign = 'left'; ctx.fillStyle = P.faint; ctx.font = `400 11px ${F}`;
  ctx.fillText(`근무 ${fmtH(c.minutes)} · 주휴 받은 주 ${c.paidWeeks}주 · ${TODAY.replace(/-/g, '.')} 기준`,
    L, y + (c.deducted ? 66 : 46));

  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if (!blob) { toast('이미지를 만들지 못했어요.'); return; }
  const fname = `earned-${ui.y}-${pad(ui.m + 1)}.png`;
  const file = new File([blob], fname, { type: 'image/png' });
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: `${ui.m + 1}월 알바비` }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast(`${fname} 저장했어요.`);
}

/* ============================================
   설정 메뉴 / 백업
   ============================================ */
const menuEl = $('#menu');
function toggleMenu(open) {
  const show = open ?? menuEl.hidden;
  menuEl.hidden = !show;
  if (show) renderStoreNote();
  syncPanelButtons();
}

/* 기록이 어디에 저장되는지 · 마지막 백업이 언제였는지 메뉴에 적어 둬요 */
function renderStoreNote() {
  const el = $('#storeNote');
  if (!el) return;
  const days = state.lastExport ? Math.floor((Date.now() - state.lastExport) / 86400000) : null;
  const last = days === null ? '아직 백업한 적 없어요'
    : days === 0 ? '오늘 백업했어요'
    : `마지막 백업 ${days}일 전`;
  let warn = '';
  if (!store.ok) warn = '<br><b class="bad">이 브라우저에는 저장이 안 돼요. 끄면 사라져요.</b>';
  else if (store.persisted === false) warn = '<br>저장 공간이 부족하면 브라우저가 지울 수 있어요.';
  el.innerHTML = `기록은 <b>이 브라우저에만</b> 저장돼요.<br>${last}.${warn}`;
}
function closeMenu() { if (!menuEl.hidden) toggleMenu(false); }

function exportData() {
  state.lastExport = Date.now();
  save();
  renderStoreNote();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wallet-backup-${TODAY}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('백업 파일을 저장했어요.');
}
/* 못 읽은 기록을 파일로 내려받아 두기 (나중에 손으로 고쳐 볼 수 있게) */
function downloadBroken() {
  if (!store.broken) { toast('내려받을 기록이 없어요.'); return; }
  const blob = new Blob([store.broken], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wallet-broken-${TODAY}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('내려받았어요. 이 파일은 지우지 말고 보관해 주세요.');
}

function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.jobs) || !Array.isArray(d.shifts)) throw new Error('bad');
      const next = normalize(d);
      if (!confirm(`알바 ${next.jobs.length}개, 근무 기록 ${next.shifts.length}개를 불러올까요?\n지금 기록은 이 파일 내용으로 바뀌어요.`)) return;
      state = next; ui.filter = null;
      store.locked = false; store.broken = null;      // 복구됐으니 다시 저장할 수 있어요
      save(); closeSheet(); renderAll();
      toast('불러왔어요.');
    } catch (e) {
      toast('알바비 계산기 백업 파일이 아닌 것 같아요.');
    }
  };
  r.readAsText(file);
}

/* ============================================
   사이드바 (모바일) / 검색
   ============================================ */
const win = $('#window');
function openSidebar() { win.classList.add('sb-open'); $('#scrim').hidden = false; syncPanelButtons(); }
function closeSidebar() { win.classList.remove('sb-open'); $('#scrim').hidden = true; syncPanelButtons(); }
const isNarrow = () => window.innerWidth <= 760;

/* ============================================
   달력 스와이프 (왼쪽 → 다음달 / 오른쪽 → 전달)
   ============================================ */
let swipe = null, clickGuard = 0;
/* 밀거나 길게 누른 직후에 따라오는 가짜 탭을 한 번 무시해요 */
const skipNextClick = () => { clickGuard = Date.now(); };
const canSwipeMonth = () =>
  sheetWrap.hidden &&
  (ui.app !== 'work' || (ui.view === 'calendar' && ui.mode === 'grid' && !!state.jobs.length));

scroller.addEventListener('touchstart', e => {
  clickGuard = 0;
  if (e.touches.length !== 1 || !canSwipeMonth()) { swipe = null; return; }
  const t = e.touches[0];
  swipe = { x: t.clientX, y: t.clientY, dx: 0, axis: null };
}, { passive: true });

scroller.addEventListener('touchmove', e => {
  if (!swipe || e.touches.length !== 1) { swipe = null; return; }
  const t = e.touches[0], dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
  // 가로·세로 중 먼저 움직인 쪽으로 정해요 (세로면 그냥 스크롤)
  if (!swipe.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) swipe.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (swipe.axis === 'x') swipe.dx = dx;
}, { passive: true });

scroller.addEventListener('touchend', e => {
  const t = swipe; swipe = null;
  if (!t || t.axis !== 'x') return;
  if (Math.abs(t.dx) > 10) {
    skipNextClick();                // 민 손가락이 날짜를 누른 것처럼 되지 않게
    if (e.cancelable) e.preventDefault();
  }
  if (Math.abs(t.dx) < 55 || !canSwipeMonth()) return;
  moveMonth(t.dx < 0 ? 1 : -1);
}, { passive: false });

scroller.addEventListener('touchcancel', () => { swipe = null; }, { passive: true });

/* ============================================
   사이드바 Tags 바로가기 — 길게 누르기(휴대폰) / 오른쪽 클릭(컴퓨터) → 알바 수정
   ============================================ */
const sbNav = $('#sbNav');
const tagOf = el => {
  const b = el && el.closest ? el.closest('[data-action=filter]') : null;
  return b && b.dataset.id ? b.dataset.id : null;    // "All Tags…"는 id가 없어서 제외
};
function editJobShortcut(id) {
  closePanels();
  openJobSheet(id);
}

let pressTimer = null;
const cancelPress = () => { clearTimeout(pressTimer); pressTimer = null; };
sbNav.addEventListener('touchstart', e => {
  cancelPress();
  const id = e.touches.length === 1 ? tagOf(e.target) : null;
  if (!id) return;
  pressTimer = setTimeout(() => {
    pressTimer = null;
    skipNextClick();                                  // 손 떼면서 태그가 눌리지 않게
    if (navigator.vibrate) navigator.vibrate(12);
    editJobShortcut(id);
  }, 500);
}, { passive: true });
['touchmove', 'touchend', 'touchcancel'].forEach(ev => sbNav.addEventListener(ev, cancelPress, { passive: true }));

document.addEventListener('contextmenu', e => {
  const id = tagOf(e.target);
  if (!id) return;
  e.preventDefault();
  editJobShortcut(id);
});

/* ============================================
   이벤트
   ============================================ */
/* 달이 바뀔 때 살짝 옆에서 넘어오게 */
function slideContent(dir) {
  scroller.classList.remove('slide-next', 'slide-prev');
  void scroller.offsetWidth;                                // 애니메이션 다시 시작
  scroller.classList.add(dir > 0 ? 'slide-next' : 'slide-prev');
}
scroller.addEventListener('animationend', () => scroller.classList.remove('slide-next', 'slide-prev'));

function moveMonth(delta) {
  const d = new Date(ui.y, ui.m + delta, 1);
  ui.y = d.getFullYear(); ui.m = d.getMonth();
  if (ymOpen) ymYear = ui.y;
  renderAll();
  slideContent(delta);
}
function goMonth(y, m) {
  const dir = (y * 12 + m) - (ui.y * 12 + ui.m);
  if (!dir) { closeYm(); return; }
  ui.y = y; ui.m = m;
  closeYm();
  renderAll();
  slideContent(dir);
}
function goView(v) {
  ui.app = 'work'; saveTab();
  ui.view = v;
  if (isNarrow()) closeSidebar();
  scroller.scrollTop = 0;
  renderAll();
}
function goApp(app) {
  if (ui.app === app) return;
  ui.app = ['money', 'save'].includes(app) ? app : 'work';
  saveTab();
  if (isNarrow()) closeSidebar();
  scroller.scrollTop = 0;
  renderAll();
}

document.addEventListener('click', e => {
  if (clickGuard) {   // 밀기·길게 누르기 직후에 생기는 가짜 탭은 한 번 넘겨요
    const fake = Date.now() - clickGuard < 500;
    clickGuard = 0;
    if (fake) return;
  }
  // 바깥을 누르면 메뉴 닫기
  if (!menuEl.hidden && !e.target.closest('.menu-anchor')) closeMenu();
  if (ymOpen && !e.target.closest('.ym-anchor')) closeYm();
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const id = t.dataset.id;
  switch (t.dataset.action) {
    /* 사이드바 */
    case 'view': goView(t.dataset.view); break;
    case 'go-app': goApp(t.dataset.app); break;
    case 'filter':
      ui.filter = id || null;
      goView('calendar');
      break;
    case 'toggle-sidebar':
      if (win.classList.contains('sb-open')) closeSidebar();
      else { closePanels(); openSidebar(); }
      break;
    case 'close-sidebar': closeSidebar(); break;
    /* 툴바 */
    case 'prev-month': moveMonth(-1); break;
    case 'next-month': moveMonth(1); break;
    case 'toggle-ym':
      if (ymOpen) closeYm();
      else { closePanels(); openYm(); }
      break;
    case 'ym-year': ymYear += Number(t.dataset.d); renderYmPicker(); break;
    case 'pick-ym': goMonth(Number(t.dataset.y), Number(t.dataset.m)); break;
    case 'go-today': goMonth(THIS_M.y, THIS_M.m); break;
    case 'toggle-mode':
      if (ui.view !== 'calendar') { ui.view = 'calendar'; ui.mode = 'list'; }
      else ui.mode = ui.mode === 'grid' ? 'list' : 'grid';
      renderAll();
      break;
    case 'mode-grid': ui.mode = 'grid'; renderAll(); break;
    case 'toggle-group':
      ui.group = !ui.group;
      if (ui.group) { ui.view = 'calendar'; ui.mode = 'list'; }
      renderAll();
      toast(ui.group ? '알바별로 묶어서 보여줘요.' : '묶어보기를 껐어요.');
      break;
    case 'share': shareImage(); break;
    case 'add-job': openJobSheet(); break;              // 본문·관리 창의 "알바 등록" 버튼: 항상 열기
    case 'manage-jobs': closePanels(); openJobsSheet(); break;
    case 'toggle-add-job':                                // 툴바 태그 아이콘: 알바 관리 열기 ↔ 닫기
      if (sheetKind === 'jobs' || (sheetKind === 'job' && jobEdit && !jobEdit.id)) closeSheet();
      else { closePanels(); openJobsSheet(); }
      break;
    case 'menu':
      if (!menuEl.hidden) closeMenu();
      else { closePanels(); toggleMenu(true); }
      break;
    case 'theme':
      setTheme(t.dataset.mode);   // 메뉴는 열어둬서 낮·밤을 바로 비교할 수 있게
      toast(themePref === 'auto' ? '화면 모드: 기기 설정 따라가기' : themePref === 'day' ? '화면 모드: 낮' : '화면 모드: 밤');
      break;
    case 'export': closeMenu(); exportData(); break;
    case 'import': closeMenu(); $('#importFile').click(); break;
    case 'download-broken': downloadBroken(); break;
    case 'start-over':
      if (!confirm('못 읽은 기록을 완전히 지우고 새로 시작할까요?\n되돌릴 수 없어요. 먼저 "못 읽은 기록 내려받기"를 해두는 걸 추천해요.')) return;
      try { localStorage.removeItem(STORE_KEY); localStorage.removeItem(BACKUP_KEY); } catch (e) { /* 무시 */ }
      store.locked = false; store.broken = null;
      state = defaultState(); ui.filter = null; ui.view = 'jobs';
      save(); renderAll();
      toast('새로 시작해요. 알바부터 등록해 주세요.');
      break;
    case 'reset-all':
      closeMenu();
      if (!confirm('알바와 근무 기록을 모두 지울까요?\n되돌릴 수 없어요. 먼저 백업 파일을 받아두는 걸 추천해요.')) return;
      state = defaultState(); ui.filter = null; ui.view = 'jobs';
      save(); closeSheet(); renderAll();
      toast('모두 지웠어요.');
      break;
    /* 목록 */
    case 'sort': {
      const k = t.dataset.key;
      ui.sort = ui.sort.key === k ? { key: k, dir: -ui.sort.dir } : { key: k, dir: k === 'amount' || k === 'time' ? -1 : 1 };
      renderContent();
      break;
    }
    case 'open-day': openDay(t.dataset.date); break;
    /* 가계부 */
    case 'open-money-day': openMoneyDay(t.dataset.date); break;
    case 'open-entry-form': openEntryForm(); break;
    case 'cancel-entry': cancelEntry(); break;
    case 'cancel-entry-edit': resetMoneyForm(); renderMoneySheet(); break;
    case 'entry-type': {
      const nt = ['in', 'save'].includes(t.dataset.type) ? t.dataset.type : 'out';
      if (nt === mon.type) break;
      mon.type = nt;
      if (nt === 'save') {
        const open = state.savings.filter(v => !v.closed);
        mon.savingId = (open[0] || state.savings[0] || {}).id || null;
      } else mon.categoryId = FALLBACK_CAT[nt];
      refreshMoneyForm();
      renderMonFoot();
      break;
    }
    case 'entry-waste': {
      mon.wasted = t.dataset.w === '1';
      refreshMoneyForm();
      break;
    }
    /* 목록에서 💸 바로 켜고 끄기 (수정 창을 열지 않고) */
    case 'toggle-wasted': {
      const e = state.entries.find(x => x.id === id);
      if (!e || e.type !== 'out') break;
      e.wasted = !e.wasted;
      if (mon && mon.editId === id) mon.wasted = e.wasted;
      save();
      renderMoneySheet();
      renderAll();
      toast(e.wasted ? '💸 안 써도 됐던 돈으로 표시했어요.' : '꼭 필요한 지출로 바꿨어요.');
      break;
    }
    case 'show-wasted': openWasteSheet(); break;
    case 'edit-entry': startEntryEdit(id); break;
    case 'del-entry': deleteEntry(id); break;
    case 'save-entry': saveEntry(); break;
    case 'hide-auto': hideAuto(id); break;
    /* 카테고리 */
    case 'set-budget': setBudget(); break;
    case 'manage-cats': closePanels(); openCatsSheet(); break;
    /* 고정 지출 */
    case 'manage-recur': closePanels(); openRecurSheet(); break;
    case 'add-recur': openRecurEditSheet(); break;
    case 'edit-recur': openRecurEditSheet(id); break;
    case 'del-recur': deleteRecur(id); break;
    case 'back-to-recur': openRecurSheet(); break;
    /* 저축 */
    case 'add-saving': closePanels(); openSavingSheet(); break;
    case 'edit-saving': openSavingSheet(id); break;
    case 'del-saving': deleteSaving(id); break;
    case 'toggle-closed': toggleClosed(id); break;
    case 'pick-saving-color':
      saveEdit.color = t.dataset.color;
      $$('.sw').forEach(b => { const on = b.dataset.color === saveEdit.color; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
      break;
    /* 그래프 — 누르면 금액 보여주기 */
    case 'chart-month': {
      const x = recentMonths(6)[Number(t.dataset.i)];
      const k = t.dataset.k;
      const name = { income: '수입', expense: '지출', saved: '저축' }[k];
      $('#chartInfo').textContent = `${x.y}년 ${x.label} ${name} ${won(x[k])}`;
      break;
    }
    case 'chart-cat': {
      const mm = monthMoney(ui.y, ui.m);
      const c = mm.cats[Number(t.dataset.i)];
      if (c) $('#chartInfo').textContent = `${c.cat.emoji} ${c.cat.name} ${won(c.sum)} · 지출의 ${Math.round(c.sum / mm.expense * 100)}%`;
      break;
    }
    case 'add-cat': openCatSheet(null, t.dataset.type); break;
    case 'edit-cat': openCatSheet(id); break;
    case 'del-cat': deleteCat(id); break;
    case 'back-to-cats': openCatsSheet(); break;
    case 'pick-emoji':
      catEdit.emoji = t.dataset.emoji;
      $$('.emo').forEach(b => { const on = b.dataset.emoji === catEdit.emoji; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
      break;
    case 'pick-cat-color':
      catEdit.color = t.dataset.color;
      $$('.sw').forEach(b => { const on = b.dataset.color === catEdit.color; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
      break;
    case 'open-shift': {
      const s = state.shifts.find(x => x.id === id);
      if (s) openDay(s.date, s.id);
      break;
    }
    /* 시트 */
    case 'close-sheet': closeSheet(); break;
    case 'edit-shift': startEdit(id); break;
    case 'del-shift': deleteShift(id); break;
    case 'open-shift-form': openShiftForm(); break;
    case 'cancel-form': cancelForm(); break;
    case 'cancel-edit': resetForm(); renderDaySheet(); break;
    case 'add-break': {
      const last = pop.breaks[pop.breaks.length - 1];
      const s = last && last.end ? toMin(last.end) + 240 : toMin('12:00');
      pop.breaks.push({ start: fromMin(s), end: fromMin(s + 60) });
      renderBreaks(); renderCalc();
      break;
    }
    case 'del-break': pop.breaks.splice(Number(t.dataset.i), 1); renderBreaks(); renderCalc(); break;
    case 'save-shift': saveShift(); break;
    case 'toggle-copy': pop.showCopy = !pop.showCopy; renderPicker(); break;
    case 'pick-day': {
      const k = t.dataset.date;
      pop.copy.has(k) ? pop.copy.delete(k) : pop.copy.add(k);
      renderPicker();
      break;
    }
    case 'pk-move': {
      const d = new Date(pop.py, pop.pm + Number(t.dataset.d), 1);
      pop.py = d.getFullYear(); pop.pm = d.getMonth();
      renderPicker();
      break;
    }
    case 'pk-weekday': {
      const wd = parseYmd(pop.date).getDay();
      const days = new Date(pop.py, pop.pm + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const dt = new Date(pop.py, pop.pm, d), k = keyOf(dt);
        if (dt.getDay() === wd && k !== pop.date) pop.copy.add(k);
      }
      renderPicker();
      break;
    }
    case 'pk-clear': pop.copy.clear(); renderPicker(); break;
    /* 알바 시트 */
    case 'edit-job': openJobSheet(id); break;
    case 'pick-color':
      jobEdit.color = t.dataset.color;
      $$('.sw').forEach(s => { const on = s.dataset.color === jobEdit.color; s.classList.toggle('on', on); s.setAttribute('aria-checked', String(on)); });
      break;
    case 'del-job': removeJob(id || (jobEdit && jobEdit.id)); break;
    case 'toast-do': { const fn = toastFn; hideToast(); if (fn) fn(); break; }
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (sheetKind === 'money' && mon) {
    if (t.id === 'eAmount') mon.amount = t.value;
    else if (t.id === 'eMemo') mon.memo = t.value;
    else if (t.id === 'eCat') mon.categoryId = t.value;
    else if (t.id === 'eSaving') mon.savingId = t.value;
    else if (t.id === 'dayMemo') saveDayMemo(t.value);
    return;
  }
  if (sheetKind === 'day' && pop) {
    if (t.id === 'fJob') pop.jobId = t.value;
    else if (t.id === 'fStart') pop.start = t.value;
    else if (t.id === 'fEnd') pop.end = t.value;
    else if (t.dataset.bi !== undefined) pop.breaks[Number(t.dataset.bi)][t.dataset.k] = t.value;
    else return;
    renderCalc();
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'importFile' && e.target.files[0]) { importData(e.target.files[0]); e.target.value = ''; }
  // 공제를 체크했을 때만 비율을 입력할 수 있게
  const pair = { jTax: 'jTaxRate', jIns: 'jInsRate' }[e.target.id];
  if (pair) {
    const box = $('#' + pair);
    box.disabled = !e.target.checked;
    if (e.target.checked) box.focus();
  }
});

document.addEventListener('submit', e => {
  if (e.target.id === 'jobForm') { e.preventDefault(); submitJob(); }
  if (e.target.id === 'catForm') { e.preventDefault(); submitCat(); }
  if (e.target.id === 'savingForm') { e.preventDefault(); submitSaving(); }
  if (e.target.id === 'recurForm') { e.preventDefault(); submitRecur(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!menuEl.hidden) { closeMenu(); return; }
    if (ymOpen) { closeYm(); $('#monthBtn').focus(); return; }
    if (!sheetWrap.hidden) { closeSheet(); return; }
    if (win.classList.contains('sb-open')) { closeSidebar(); return; }
  }
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('role') === 'button' && t.dataset.action) {
    e.preventDefault();
    t.click();
  }
});

let wasNarrow = isNarrow();
window.addEventListener('resize', () => {
  if (!isNarrow()) closeSidebar();
  if (isNarrow() !== wasNarrow) { wasNarrow = isNarrow(); if (ui.app !== 'work') renderContent(); }
});

/* 토스트 — action을 주면 누를 수 있는 버튼이 같이 떠요 ({label, fn, ms}) */
let toastTimer = null, toastFn = null;
function toast(msg, action) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>` +
    (action ? `<button type="button" class="toast-btn" data-action="toast-do">${esc(action.label)}</button>` : '');
  el.classList.toggle('has-btn', !!action);
  toastFn = action ? action.fn : null;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? (action.ms || 5000) : 2600);
}
function hideToast() {
  clearTimeout(toastTimer);
  const el = $('#toast');
  el.classList.remove('show', 'has-btn');
  toastFn = null;
}

/* ============================================
   시작
   ============================================ */
$$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
applyTheme();
if (!store.locked && !state.jobs.length) ui.view = 'jobs';
renderAll();
askPersist();

if (store.locked) {
  // 아무것도 덮어쓰지 않아요. 사용자가 복구 방법을 고를 때까지 기다려요
  setTimeout(() => toast('기록을 읽지 못했어요. 저장을 멈추고 기다릴게요.', { label: '기록 내려받기', ms: 8000, fn: downloadBroken }), 400);
} else if (store.recovered) {
  setTimeout(() => toast('기록을 사본에서 되살렸어요. 빠진 게 없는지 확인해 주세요.', { label: '백업 받기', ms: 8000, fn: exportData }), 400);
} else if (!store.ok) {
  setTimeout(() => toast('이 브라우저에는 기록을 저장할 수 없어요. 창을 닫으면 사라져요.', { label: '백업 받기', ms: 8000, fn: exportData }), 400);
} else {
  if (!state.jobs.length) setTimeout(() => openJobSheet(), 350);   // 첫 화면: 알바 등록
  // 기록이 쌓였는데 한동안 백업을 안 받았으면 한 번만 알려줘요
  const old = !state.lastExport || Date.now() - state.lastExport > NUDGE_DAYS * 86400000;
  if (state.shifts.length >= 5 && old) {
    setTimeout(() => toast('기록이 이 브라우저에만 있어요. 백업 파일을 받아두면 안전해요.', { label: '백업 받기', ms: 8000, fn: exportData }), 2500);
  }
}

/* PWA: 인터넷 없이도 열리게 service worker 등록 (http(s)에서만 동작) */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 실패해도 앱은 그대로 동작 */ });
  });
}
