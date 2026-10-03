'use strict';
/* ============================================
   How much did I earn? — 알바비 계산기
   데이터는 localStorage에 저장돼요.
   ============================================ */

const STORE_KEY = 'seran-albailgi-v1';
const THEME_KEY = 'wallet-theme';          // 화면 모드만 따로 저장 (근무 기록과 별개)
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
  search: '<circle cx="10.5" cy="10.5" r="6.3"/><path d="M15.3 15.3L20 20"/>',
  sidebar: '<rect x="3" y="4.5" width="18" height="15" rx="2.6"/><path d="M9.5 4.5v15M5.5 8.5h1.6M5.5 11h1.6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.6"/><path d="M3.5 9.6h17M8 3v4M16 3v4"/>',
  briefcase: '<rect x="3.5" y="7" width="17" height="12.5" rx="2.6"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12.4h17"/>',
  wallet: '<path d="M16.5 5H6.6A2.6 2.6 0 0 0 4 7.6v9.8A2.6 2.6 0 0 0 6.6 20h11a2.4 2.4 0 0 0 2.4-2.4V9.4A2.4 2.4 0 0 0 17.6 7H4.3"/><path d="M20 11.2h-3.3a1.8 1.8 0 0 0 0 3.6H20"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="1.6"/><path d="M3.5 9h17M12 9v11"/><path d="M12 9C10.6 5.6 7 5.2 7 7.4 7 8.6 9.6 9 12 9zM12 9c1.4-3.4 5-3.8 5-1.6C17 8.6 14.4 9 12 9z"/>',
  cloud: '<path d="M7.2 18.5h9.9a4 4 0 0 0 .5-7.96A5.4 5.4 0 0 0 7.3 9.3a4.6 4.6 0 0 0-.1 9.2z"/>',
  clock: '<circle cx="12" cy="12" r="8.6"/><path d="M12 7.4V12l3 2"/>',
  tags: '<circle cx="9.3" cy="12" r="5.2"/><path d="M13.2 7.4a5.2 5.2 0 1 1 0 9.2"/>'
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
const safeColor = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : TAGS[0].color);
const TODAY = keyOf(new Date());
const THIS_M = (() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; })();

/* ============================================
   저장 / 불러오기
   ============================================ */
const defaultState = () => ({ version: 2, jobs: [], shifts: [], lastForm: null });

function normalize(d) {
  if (!d || typeof d !== 'object') return defaultState();
  const jobs = Array.isArray(d.jobs) ? d.jobs
    .filter(j => j && j.id && j.name)
    .map(j => ({
      id: String(j.id),
      name: String(j.name).slice(0, 20),
      wage: Math.max(0, Math.round(Number(j.wage) || 0)),
      color: safeColor(j.color),
      weeklyBonus: j.weeklyBonus === true   // 주휴수당 별도 지급 (없으면 해제 = 시급에 포함)
    })) : [];
  const ids = new Set(jobs.map(j => j.id));
  const shifts = Array.isArray(d.shifts) ? d.shifts
    .filter(s => s && s.id && ids.has(String(s.jobId)) &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.date) && TIME_RE.test(s.start) && TIME_RE.test(s.end))
    .map(s => ({
      id: String(s.id), jobId: String(s.jobId), date: s.date, start: s.start, end: s.end,
      breaks: Array.isArray(s.breaks)
        ? s.breaks.filter(b => b && TIME_RE.test(b.start) && TIME_RE.test(b.end)).map(b => ({ start: b.start, end: b.end }))
        : []
    })) : [];
  return {
    ...d,                       // 예전 버전에서 쓰던 값(메모 등)은 그대로 보관
    version: 2, jobs, shifts,
    lastForm: d.lastForm && TIME_RE.test(d.lastForm.start) ? d.lastForm : null
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? normalize(JSON.parse(raw)) : defaultState();
  } catch (e) {
    return defaultState();
  }
}

let saveWarned = false;
function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    if (!saveWarned) { toast('브라우저에 저장하지 못했어요. 시크릿 모드인지 확인해 주세요.'); saveWarned = true; }
  }
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

let state = load();
const ui = {
  view: 'calendar',      // calendar | jobs | pay | bonus
  mode: 'grid',          // grid(달력) | list(리스트)
  group: false,          // 알바별 묶어보기
  filter: null,          // 태그로 고른 알바 id
  search: '',
  searchOpen: false,
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
  let total = 0, totalMin = 0;

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
    total += base + holiday;
    totalMin += minutes;
    return {
      job, bonus: job.weeklyBonus, minutes, base, holiday, total: base + holiday, weeks: wk,
      holidayWeeks: wk.filter(w => w.ok).length,
      days: new Set(inMonth.map(s => s.date)).size,
      count: inMonth.length
    };
  });
  return { jobs, total, minutes: totalMin, paidWeeks: paidWeeks.size };
}

/* 달 마지막 주가 다음 달로 넘어가면 안내 */
function spillWeek(y, m) {
  const last = new Date(y, m + 1, 0);
  if (last.getDay() === 0) return null;
  const mon = new Date(y, m, last.getDate() - (last.getDay() + 6) % 7);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  return { mon, sun };
}

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

/* 사이드바 숫자: 100만 원부터는 '만' 단위로 짧게 */
const walletShort = n => n >= 1e6 ? `₩${Math.round(n / 1e4).toLocaleString('ko-KR')}만` : `₩${Math.round(n).toLocaleString('ko-KR')}`;

/* ---------- 사이드바 ---------- */
function renderSidebar() {
  const c = monthCalc(ui.y, ui.m);
  const searching = !!ui.search.trim();
  const tagActive = ui.filter && ui.view === 'calendar';
  const fav = [
    ['calendar', 'calendar', 'Calendar', '달력'],
    ['jobs', 'briefcase', 'Jobs', '알바 등록'],
    ['pay', 'wallet', 'Monthly Pay', '월별 정산'],
    ['bonus', 'gift', 'Weekly Bonus', '주휴 내역']
  ];
  const tags = state.jobs.map(j => `
    <button type="button" class="sb-item ${ui.filter === j.id ? 'on' : ''}" data-action="filter" data-id="${esc(j.id)}" title="${esc(j.name)}만 보기">
      <i class="tagdot" style="background:${j.color}"></i><span class="ell">${esc(j.name)}</span>${j.weeklyBonus ? '<span class="jbadge">주휴</span>' : ''}
    </button>`).join('');
  $('#sbNav').innerHTML = `
    <div class="sb-sec">Favorites</div>
    ${fav.map(([v, ic, label, ko]) => `
      <button type="button" class="sb-item ${ui.view === v && !tagActive && !searching ? 'on' : ''}" data-action="view" data-view="${v}" title="${ko}">
        ${icon(ic)}<span>${label}</span>
      </button>`).join('')}
    <div class="sb-sec">iCloud</div>
    <button type="button" class="sb-item" data-action="view" data-view="pay" title="${ui.m + 1}월 총 알바비">
      ${icon('cloud')}<span>This Month</span><span class="sb-num">${walletShort(c.total)}</span>
    </button>
    <button type="button" class="sb-item" data-action="view" data-view="bonus" title="${ui.m + 1}월 근무시간">
      ${icon('clock')}<span>Total Hours</span><span class="sb-num">${shortH(c.minutes)}</span>
    </button>
    <div class="sb-sec">Tags</div>
    ${tags || '<div class="sb-empty">알바를 등록하면 태그가 생겨요</div>'}
    <button type="button" class="sb-item ${!ui.filter && ui.view === 'calendar' && !searching ? '' : ''}" data-action="filter" data-id="" title="전체 보기">
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
  $('#search').classList.toggle('open', ui.searchOpen);
  $('.tb-tools').classList.toggle('searching', ui.searchOpen);
  syncPanelButtons();
}

/* 패널·메뉴를 여는 툴바 버튼: 열려 있으면 회색 배경(.on), 닫히면 배경 없음 */
function syncPanelButtons() {
  const set = (el, on) => { if (!el) return; el.classList.toggle('on', on); el.setAttribute('aria-expanded', String(on)); };
  set($('#tagBtn'), sheetKind === 'job' && !!jobEdit && !jobEdit.id);   // "새 알바 등록" 패널
  set($('#menuBtn'), !$('#menu').hidden);                              // ⋯ 메뉴
  set($('#searchBtn'), ui.searchOpen);                                 // 돋보기
  set($('#monthBtn'), ymOpen);                                         // 연도·월 고르기
  set($('#sbToggle'), $('#window').classList.contains('sb-open'));     // 모바일 사이드바
}

/* 툴바 버튼으로 새 패널을 열 때는 다른 패널·메뉴를 모두 닫아요 */
function closePanels() {
  closeSheet();
  closeMenu();
  closeYm();
  closeSidebar();
  if (ui.searchOpen) closeSearch();
}

/* ---------- 본문 ---------- */
function renderContent() {
  if (ui.search.trim()) renderSearch();
  else if (ui.view === 'jobs') renderJobs();
  else if (ui.view === 'pay') renderPay();
  else if (ui.view === 'bonus') renderBonus();
  else renderCalendar();
}

function setStatus(text) { $('#statusbar').textContent = text; }

function emptyJobs() {
  return `<div class="empty">
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
  setStatus(`${list.length}개 근무 · ${m + 1}월 총 ${won(calc.total)}`);
  if (!state.jobs.length) { content.innerHTML = emptyJobs(); return; }

  if (ui.mode === 'list') {
    content.innerHTML = `${filterBar()}
      ${list.length ? listTable(list) : `<div class="empty"><p>${m + 1}월에는 아직 근무 기록이 없어요.</p><button type="button" class="mbtn" data-action="mode-grid">달력에서 기록하기</button></div>`}`;
    return;
  }
  content.innerHTML = `${filterBar()}
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

/* Finder 목록 보기: 이름 / 날짜 / 시간 / 금액 */
function listTable(list, opts = {}) {
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
      body += `<tr class="grp"><td colspan="4"><span class="nm"><span class="dot" style="background:${j.color}"></span>${esc(j.name)}<span class="sub">${rs.length}개 · ${fmtH(min)} · ${won(sum)}${!opts.search && j.weeklyBonus ? ' (주휴 제외)' : ''}</span></span></td></tr>`;
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
  const rows = c.jobs.map(r => `<tr>
      <td data-label="알바"><span class="nm"><span class="dot" style="background:${r.job.color}"></span><span>${esc(r.job.name)}</span></span> <span class="sub">${won(r.job.wage)}/시</span></td>
      <td data-label="근무시간" class="r">${fmtH(r.minutes)}</td>
      <td data-label="기본급" class="r">${won(r.base)}</td>
      <td data-label="주휴수당" class="r">${r.bonus
        ? `<span>${won(r.holiday)}${r.holidayWeeks ? ` <span class="sub">(${r.holidayWeeks}주)</span>` : ''}</span>`
        : '<span class="incl">시급 포함</span>'}</td>
      <td data-label="합계" class="r strong">${won(r.total)}</td></tr>`).join('');
  return `<table class="ftable sum">
      <thead><tr><th>알바</th><th class="r">근무시간</th><th class="r">기본급</th><th class="r">주휴수당</th><th class="r">합계</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <div class="grand"><span>${ui.m + 1}월 총 알바비</span><b>${won(c.total)}</b></div>`;
}

/* Monthly Pay */
function renderPay() {
  const c = monthCalc(ui.y, ui.m);
  setStatus(`${ui.y}년 ${ui.m + 1}월 정산 · 총 ${won(c.total)}`);
  if (!state.jobs.length) { content.innerHTML = emptyJobs(); return; }
  const spill = spillWeek(ui.y, ui.m);
  content.innerHTML = `
    <div class="sec-title">Monthly Pay <small>${ui.y}년 ${ui.m + 1}월</small>
      <button type="button" class="mbtn small push" data-action="share">이미지로 저장</button></div>
    ${summaryTable(c)}
    <p class="note">기본급은 실제로 일한 날짜의 달에, 주휴수당은 그 주 일요일이 있는 달에 들어가요.${spill ? ` ${md(spill.mon)}~${md(spill.sun)} 주의 주휴수당은 ${spill.sun.getMonth() + 1}월 정산에 들어가요.` : ''}</p>`;
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
  content.innerHTML = `
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
      <td data-label="이름"><span class="nm"><span class="dot" style="background:${r.job.color}"></span><span>${esc(r.job.name)}</span>${r.bonus ? '<span class="jbadge">주휴</span>' : ''}</span></td>
      <td data-label="시급" class="r">${won(r.job.wage)}${r.bonus ? '' : ' <span class="sub">(주휴 포함)</span>'}</td>
      <td data-label="${ui.m + 1}월 근무" class="r">${r.days}일 · ${fmtH(r.minutes)}</td>
      <td data-label="${ui.m + 1}월 금액" class="r strong">${won(r.total)}</td></tr>`).join('');
  content.innerHTML = `
    <div class="sec-title">Jobs <small>눌러서 수정·삭제</small>
      <button type="button" class="mbtn small push" data-action="add-job">+ 알바 등록</button></div>
    <table class="ftable sum">
      <thead><tr><th>이름</th><th class="r">시급</th><th class="r">${ui.m + 1}월 근무</th><th class="r">${ui.m + 1}월 금액</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <p class="note">태그 색은 등록 순서대로 Red → Orange → Yellow → Green → Blue → Purple → Gray로 정해져요.</p>`;
}

/* 검색 */
function matches(s, terms) {
  const j = jobById(s.jobId), d = parseYmd(s.date);
  const hay = [j.name, s.date, s.date.replace(/-/g, '.'), `${d.getMonth() + 1}.${d.getDate()}`, md(d),
    `${d.getMonth() + 1}월`, `${d.getMonth() + 1}월 ${d.getDate()}일`, `${d.getDate()}일`,
    `${WD_SUN[d.getDay()]}요일`, s.start, s.end].join(' ').toLowerCase();
  return terms.every(t => hay.includes(t));
}
function renderSearch() {
  const q = ui.search.trim();
  const terms = q.toLowerCase().split(/\s+/);
  const list = state.shifts.filter(s => (!ui.filter || s.jobId === ui.filter) && matches(s, terms)).sort(byDateStart);
  setStatus(`검색 결과 ${list.length}개`);
  content.innerHTML = `
    <div class="sec-title">“${esc(q)}” 검색 결과 <small>${list.length}개 · 전체 기간</small></div>
    ${filterBar()}
    ${list.length ? listTable(list, { search: true }) : '<div class="empty"><p>찾는 근무가 없어요.<br><small>알바 이름, 날짜(10.5, 10월), 요일(월요일), 시간(09:00)으로 찾을 수 있어요.</small></p></div>'}`;
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
  sheetKind = null; pop = null; jobEdit = null;
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
  pop = { date, editId: null, jobId: null, start: '', end: '', breaks: [], copy: new Set(), showCopy: false, py: dt.getFullYear(), pm: dt.getMonth() };
  resetForm();
  openSheet('day', `
    <div class="sheet-head" id="sheetTitle">${longDate(date)}</div>
    <div class="sheet-body">
      <div class="day-list" id="dayList"></div>
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
    <div class="sheet-foot">
      <span class="spacer"></span>
      <button type="button" class="mbtn" data-action="close-sheet">취소</button>
      <button type="button" class="mbtn blue" data-action="save-shift">저장</button>
    </div>`);
  if (editId) startEdit(editId); else refreshForm();
  renderDayList();
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
  pop.jobId = s.jobId; pop.start = s.start; pop.end = s.end;
  pop.breaks = s.breaks.map(b => ({ ...b }));
  refreshForm();
  renderDayList();
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

  let msg = wasEdit ? '수정했어요.' : '저장했어요.';
  if (copied) msg += ` ${copied}일에 복사했어요.`;
  if (skipped) msg += ` (같은 근무가 있는 ${skipped}일은 건너뜀)`;
  toast(msg);
  closeSheet();
  renderAll();
}

function deleteShift(id) {
  if (!confirm('이 근무 기록을 삭제할까요?')) return;
  state.shifts = state.shifts.filter(s => s.id !== id);
  if (pop && pop.editId === id) { resetForm(); refreshForm(); }
  save();
  if (pop) renderDayList();
  renderAll();
  toast('삭제했어요.');
}

/* ---------- 알바 등록 시트 ---------- */
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
      <p class="hint">2026년 최저시급은 10,320원이에요.</p>
    </form>
    <div class="sheet-foot">
      ${j ? '<button type="button" class="mbtn plain" data-action="del-job">알바 삭제</button>' : ''}
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
  const first = state.jobs.length === 0;
  if (jobEdit.id && jobById(jobEdit.id)) {
    Object.assign(jobById(jobEdit.id), { name, wage, color, weeklyBonus });
    toast(`"${name}" 수정했어요.`);
  } else {
    state.jobs.push({ id: uid(), name, wage, color, weeklyBonus });
    if (first) { ui.view = 'calendar'; toast(`"${name}" 등록! 날짜를 눌러 근무를 기록해 보세요.`); }
    else toast(`"${name}" 등록했어요.`);
  }
  save(); closeSheet(); renderAll();
}

function deleteJob() {
  const j = jobById(jobEdit && jobEdit.id); if (!j) return;
  const n = state.shifts.filter(s => s.jobId === j.id).length;
  if (!confirm(`"${j.name}"을(를) 삭제할까요?${n ? `\n이 알바의 근무 기록 ${n}개도 함께 지워져요.` : ''}`)) return;
  state.jobs = state.jobs.filter(x => x.id !== j.id);
  state.shifts = state.shifts.filter(s => s.jobId !== j.id);
  if (ui.filter === j.id) ui.filter = null;
  save(); closeSheet(); renderAll();
  toast('삭제했어요.');
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
  const W = 760, rowH = 40, pad0 = 28, winX = 24, winY = 24;
  const H = winY * 2 + 120 + 34 + c.jobs.length * rowH + 76;
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
  c.jobs.forEach((r, i) => {
    const top = y + 1 + i * rowH;
    if (i % 2 === 1) { ctx.fillStyle = P.stripe; ctx.fillRect(L - 8, top, R - L + 16, rowH); }
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
  });
  y += 1 + c.jobs.length * rowH + 22;
  ctx.fillStyle = P.line; ctx.fillRect(L - 8, y - 14, R - L + 16, 1);
  ctx.textAlign = 'left'; ctx.fillStyle = P.sub; ctx.font = `500 14px ${F}`;
  ctx.fillText(`${ui.m + 1}월 총 알바비`, L, y + 16);
  ctx.textAlign = 'right'; ctx.fillStyle = P.total; ctx.font = `700 26px ${F}`;
  ctx.fillText(won(c.total), R, y + 20);
  ctx.textAlign = 'left'; ctx.fillStyle = P.faint; ctx.font = `400 11px ${F}`;
  ctx.fillText(`근무 ${fmtH(c.minutes)} · 주휴 받은 주 ${c.paidWeeks}주 · ${TODAY.replace(/-/g, '.')} 기준`, L, y + 46);

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
  syncPanelButtons();
}
function closeMenu() { if (!menuEl.hidden) toggleMenu(false); }

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `wallet-backup-${TODAY}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  toast('백업 파일을 저장했어요.');
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

function openSearch() {
  ui.searchOpen = true; renderToolbar();
  setTimeout(() => $('#searchInput').focus(), 30);
}
function closeSearch() {
  ui.searchOpen = false; ui.search = ''; $('#searchInput').value = '';
  renderAll();
}

/* ============================================
   달력 스와이프 (왼쪽 → 다음달 / 오른쪽 → 전달)
   ============================================ */
let swipe = null, swipeGuard = 0;
const canSwipeMonth = () =>
  ui.view === 'calendar' && ui.mode === 'grid' && !ui.search.trim() &&
  sheetWrap.hidden && !!state.jobs.length;

scroller.addEventListener('touchstart', e => {
  swipeGuard = 0;
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
    swipeGuard = Date.now();        // 민 손가락이 날짜를 누른 것처럼 되지 않게
    if (e.cancelable) e.preventDefault();
  }
  if (Math.abs(t.dx) < 55 || !canSwipeMonth()) return;
  moveMonth(t.dx < 0 ? 1 : -1);
}, { passive: false });

scroller.addEventListener('touchcancel', () => { swipe = null; }, { passive: true });

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
  ui.view = v;
  if (ui.search) { ui.search = ''; ui.searchOpen = false; $('#searchInput').value = ''; }
  if (isNarrow()) closeSidebar();
  scroller.scrollTop = 0;
  renderAll();
}

document.addEventListener('click', e => {
  if (swipeGuard) {   // 스와이프 직후에 생기는 가짜 탭은 한 번 넘겨요
    const fake = Date.now() - swipeGuard < 400;
    swipeGuard = 0;
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
      if (ui.view !== 'calendar' || ui.search) { ui.view = 'calendar'; ui.mode = 'list'; ui.search = ''; ui.searchOpen = false; $('#searchInput').value = ''; }
      else ui.mode = ui.mode === 'grid' ? 'list' : 'grid';
      renderAll();
      break;
    case 'mode-grid': ui.mode = 'grid'; renderAll(); break;
    case 'toggle-group':
      ui.group = !ui.group;
      if (ui.group && !ui.search) { ui.view = 'calendar'; ui.mode = 'list'; }
      renderAll();
      toast(ui.group ? '알바별로 묶어서 보여줘요.' : '묶어보기를 껐어요.');
      break;
    case 'share': shareImage(); break;
    case 'add-job': openJobSheet(); break;              // 본문 안의 "알바 등록" 버튼: 항상 열기
    case 'toggle-add-job':                                // 툴바 태그 아이콘: 열기 ↔ 닫기
      if (sheetKind === 'job' && jobEdit && !jobEdit.id) closeSheet();   // 취소와 똑같이 닫고 입력 내용은 버림
      else { closePanels(); openJobSheet(); }
      break;
    case 'menu':
      if (!menuEl.hidden) closeMenu();
      else { closePanels(); toggleMenu(true); }
      break;
    case 'search':
      if (ui.searchOpen) closeSearch();                   // 한 번 더 누르면 닫고 검색어 초기화
      else { closePanels(); openSearch(); }
      break;
    case 'theme':
      setTheme(t.dataset.mode);   // 메뉴는 열어둬서 낮·밤을 바로 비교할 수 있게
      toast(themePref === 'auto' ? '화면 모드: 기기 설정 따라가기' : themePref === 'day' ? '화면 모드: 낮' : '화면 모드: 밤');
      break;
    case 'export': closeMenu(); exportData(); break;
    case 'import': closeMenu(); $('#importFile').click(); break;
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
    case 'open-shift': {
      const s = state.shifts.find(x => x.id === id);
      if (s) openDay(s.date, s.id);
      break;
    }
    /* 시트 */
    case 'close-sheet': closeSheet(); break;
    case 'edit-shift': startEdit(id); break;
    case 'del-shift': deleteShift(id); break;
    case 'cancel-edit': resetForm(); refreshForm(); renderDayList(); break;
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
    case 'del-job': deleteJob(); break;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'searchInput') {
    ui.search = t.value;
    scroller.scrollTop = 0;
    renderSidebar(); renderContent();
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
});

document.addEventListener('submit', e => {
  if (e.target.id === 'jobForm') { e.preventDefault(); submitJob(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!menuEl.hidden) { closeMenu(); return; }
    if (ymOpen) { closeYm(); $('#monthBtn').focus(); return; }
    if (!sheetWrap.hidden) { closeSheet(); return; }
    if (win.classList.contains('sb-open')) { closeSidebar(); return; }
    if (ui.searchOpen) { closeSearch(); return; }
  }
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('role') === 'button' && t.dataset.action) {
    e.preventDefault();
    t.click();
  }
});

window.addEventListener('resize', () => { if (!isNarrow()) closeSidebar(); });

/* 토스트 */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ============================================
   시작
   ============================================ */
$$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
applyTheme();
if (!state.jobs.length) ui.view = 'jobs';
renderAll();
if (!state.jobs.length) setTimeout(() => openJobSheet(), 350);   // 첫 화면: 알바 등록

/* PWA: 인터넷 없이도 열리게 service worker 등록 (http(s)에서만 동작) */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* 실패해도 앱은 그대로 동작 */ });
  });
}
