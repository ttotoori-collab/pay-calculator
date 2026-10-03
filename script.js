'use strict';
/* ============================================
   세란의 알바일기 — 알바비 계산기
   데이터는 localStorage에 저장돼요.
   ============================================ */

const STORE_KEY = 'seran-albailgi-v1';
const START = { y: 2026, m: 9 };            // 기본 화면: 2026년 10월 (월은 0부터)
const PALETTE = ['#f4a7c0', '#8ccbee', '#ffd16b', '#a6d9a0', '#c6b0ee', '#ffb489', '#7fd3c4', '#ef9f9f'];
const EMOJIS = ['🐰', '🐻', '🐱', '🐥', '🍓', '☕', '🌷', '⭐', '🍙', '🎀'];
const WD_MON = ['월', '화', '수', '목', '금', '토', '일'];   // 월요일 시작 (주휴 기준과 같게)
const WD_SUN = ['일', '월', '화', '수', '목', '금', '토'];   // Date.getDay() 순서
const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/* ---------- 작은 도우미 ---------- */
const $ = (s, r = document) => r.querySelector(s);
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
const dotDate = key => key.replace(/-/g, '.');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const TIME_RE = /^\d{2}:\d{2}$/;
const safeColor = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : PALETTE[0]);
const TODAY = keyOf(new Date());

/* ============================================
   저장 / 불러오기
   ============================================ */
const defaultState = () => ({
  version: 1,
  jobs: [],      // { id, name, wage, color }
  shifts: [],    // { id, jobId, date:'YYYY-MM-DD', start:'HH:MM', end:'HH:MM', breaks:[{start,end}] }
  profile: { nick: '세란', intro: '오늘도 열심히 알바 중 ☕', emoji: '🐰' },
  memo: { text: '', savedAt: null },
  lastForm: null,
  visits: { total: 0, today: 0, date: '' }
});

function normalize(d) {
  const base = defaultState();
  if (!d || typeof d !== 'object') return base;
  const jobs = Array.isArray(d.jobs) ? d.jobs
    .filter(j => j && j.id && j.name)
    .map(j => ({
      id: String(j.id),
      name: String(j.name).slice(0, 20),
      wage: Math.max(0, Math.round(Number(j.wage) || 0)),
      color: safeColor(j.color)
    })) : [];
  const jobIds = new Set(jobs.map(j => j.id));
  const shifts = Array.isArray(d.shifts) ? d.shifts
    .filter(s => s && s.id && jobIds.has(String(s.jobId)) &&
      /^\d{4}-\d{2}-\d{2}$/.test(s.date) && TIME_RE.test(s.start) && TIME_RE.test(s.end))
    .map(s => ({
      id: String(s.id), jobId: String(s.jobId), date: s.date, start: s.start, end: s.end,
      breaks: Array.isArray(s.breaks)
        ? s.breaks.filter(b => b && TIME_RE.test(b.start) && TIME_RE.test(b.end)).map(b => ({ start: b.start, end: b.end }))
        : []
    })) : [];
  return {
    ...base,
    jobs, shifts,
    profile: { ...base.profile, ...(d.profile || {}) },
    memo: { ...base.memo, ...(d.memo || {}) },
    lastForm: d.lastForm && TIME_RE.test(d.lastForm.start) ? d.lastForm : null,
    visits: { ...base.visits, ...(d.visits || {}) }
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

let state = load();
const ui = {
  tab: 'calendar',
  y: START.y, m: START.m,
  filter: null,          // 카테고리에서 고른 알바 id
  listOpen: false,       // 목록열기
  editJobId: null,       // job 탭에서 수정 중인 알바
  jobColor: null,
  pendingEmoji: null
};

/* 방문자 카운터 (이 브라우저 기준) */
(function countVisit() {
  const v = state.visits;
  if (v.date !== TODAY) { v.date = TODAY; v.today = 0; }
  v.today++; v.total++;
  save();
})();

/* ============================================
   계산
   ============================================ */
const jobById = id => state.jobs.find(j => j.id === id);
const byDateStart = (a, b) => a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date);
const shiftsOn = (date, jobId) =>
  state.shifts.filter(s => s.date === date && (!jobId || s.jobId === jobId)).sort(byDateStart);

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
      const h = holidayFor(wmin, job.wage);
      if (h.ok) paidWeeks.add(w.monK);
      return { ...w, minutes: wmin, ...h };
    });
    const holiday = wk.reduce((a, w) => a + w.pay, 0);
    total += base + holiday;
    totalMin += minutes;
    return {
      job, minutes, base, holiday, total: base + holiday, weeks: wk,
      holidayWeeks: wk.filter(w => w.ok).length,
      days: new Set(inMonth.map(s => s.date)).size
    };
  });

  return {
    jobs, total, minutes: totalMin, paidWeeks: paidWeeks.size,
    days: new Set(state.shifts.filter(s => s.date.startsWith(pre)).map(s => s.date)).size
  };
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
   화면 그리기
   ============================================ */
const content = $('#content');

function renderAll() {
  renderTabs();
  renderProfile();
  renderCategory();
  renderActivity();
  renderMini();
  renderView();
}

function renderTabs() {
  document.querySelectorAll('.tabs [data-tab]').forEach(b => {
    b.classList.toggle('on', b.dataset.tab === ui.tab);
    if (b.dataset.tab === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
}

function renderView() {
  if (ui.tab === 'pay') renderPayView();
  else if (ui.tab === 'job') renderJobView();
  else if (ui.tab === 'memo') renderMemoView();
  else renderCalendarView();
}

/* ---------- 왼쪽: 프로필 ---------- */
function renderProfile() {
  const p = state.profile, v = state.visits;
  $('#profileBox').innerHTML = `
    <div class="box-title">profile</div>
    <div class="pf">
      <div class="pf-img" aria-hidden="true">${esc(p.emoji)}</div>
      <div class="pf-nick"><b>${esc(p.nick)}</b> <button type="button" class="badge" data-action="edit-profile">EDIT</button></div>
      <p class="pf-intro">${esc(p.intro)}</p>
      <div class="pf-visit">TODAY <b>${v.today}</b> · TOTAL <b>${v.total}</b></div>
    </div>`;
}

/* ---------- 왼쪽: 카테고리 ---------- */
function renderCategory() {
  const pre = `${ui.y}-${pad(ui.m + 1)}`;
  const daysOf = id => new Set(state.shifts.filter(s => s.date.startsWith(pre) && (!id || s.jobId === id)).map(s => s.date)).size;
  const items = state.jobs.map(j => `
    <li><button type="button" class="${ui.filter === j.id ? 'on' : ''}" data-action="filter" data-id="${esc(j.id)}">
      <i class="sq" style="background:${j.color}"></i>${esc(j.name)} <span>(${daysOf(j.id)})</span>
    </button></li>`).join('');
  $('#categoryBox').innerHTML = `
    <div class="box-title">category</div>
    <ul class="cat">
      <li><button type="button" class="all ${!ui.filter ? 'on' : ''}" data-action="filter" data-id="">전체보기 <span>(${daysOf(null)})</span></button></li>
      ${items}
    </ul>
    ${state.jobs.length ? '' : '<div class="cat-add"><button type="button" class="linkbtn" data-tab="job">+ 알바 등록하기</button></div>'}`;
}

/* ---------- 오른쪽: activity ---------- */
function renderActivity() {
  const c = monthCalc(ui.y, ui.m);
  $('#activityBox').innerHTML = `
    <div class="box-title">activity <small>${ui.y}.${pad(ui.m + 1)}</small></div>
    <ul class="act">
      <li>이번 달 근무 <b>${fmtH(c.minutes)}</b></li>
      <li>근무한 날 <b>${c.days}</b>일</li>
      <li>주휴 받은 주 <b>${c.paidWeeks}</b>주</li>
      <li>총 알바비 <b>${won(c.total)}</b></li>
    </ul>`;
}

/* ---------- 오른쪽: 미니 달력 ---------- */
function renderMini() {
  const y = ui.y, m = ui.m;
  const first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const worked = new Set(state.shifts.map(s => s.date));
  let g = WD_MON.map((w, i) => `<span class="mw ${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${w}</span>`).join('');
  for (let i = 0; i < offset; i++) g += '<span></span>';
  for (let d = 1; d <= days; d++) {
    const key = ymd(y, m, d), wd = (offset + d - 1) % 7;
    const cls = ['md', wd === 5 ? 'sat' : '', wd === 6 ? 'sun' : '', worked.has(key) ? 'worked' : '', key === TODAY ? 'today' : ''].join(' ');
    g += `<button type="button" class="${cls}" data-action="open-day" data-date="${key}" aria-label="${m + 1}월 ${d}일">${d}</button>`;
  }
  $('#miniBox').innerHTML = `
    <div class="mini">
      <div class="mini-head">
        <button type="button" class="mnav" data-action="prev-month" aria-label="이전 달">◀</button>
        <b>${y}.${pad(m + 1)}</b>
        <button type="button" class="mnav" data-action="next-month" aria-label="다음 달">▶</button>
        <button type="button" class="linkbtn" data-action="month-view">월별보기</button>
      </div>
      <div class="mini-grid">${g}</div>
    </div>`;
}

/* ---------- 가운데: calendar 탭 ---------- */
function renderCalendarView() {
  const y = ui.y, m = ui.m, pre = `${y}-${pad(m + 1)}`;
  const fj = ui.filter ? jobById(ui.filter) : null;
  const list = state.shifts
    .filter(s => s.date.startsWith(pre) && (!ui.filter || s.jobId === ui.filter))
    .sort(byDateStart);

  content.innerHTML = `
    <div class="box postbar">
      <span><b>${y}.${pad(m + 1)}</b> 근무기록 <em>${list.length}</em>개의 글${fj ? ` · <span class="pb-cat">${esc(fj.name)}</span>` : ''}</span>
      <button type="button" class="linkbtn" data-action="toggle-list">${ui.listOpen ? '목록닫기' : '목록열기'}</button>
    </div>
    ${ui.listOpen ? postListHtml(list) : ''}
    <article class="box post">
      <div class="post-head">
        <button type="button" class="navbtn" data-action="prev-month" aria-label="이전 달">◀</button>
        <h2 class="post-title">${MONTH_EN[m]} ${y}</h2>
        <button type="button" class="navbtn" data-action="next-month" aria-label="다음 달">▶</button>
      </div>
      <div class="post-meta">
        카테고리 <b>${fj ? esc(fj.name) : '전체보기'}</b> · 날짜를 누르면 근무를 기록할 수 있어요
        ${fj ? ' · <button type="button" class="linkbtn" data-action="filter" data-id="">전체보기</button>' : ''}
      </div>
      ${state.jobs.length ? '' : `<p class="empty-note">아직 등록한 알바가 없어요. <button type="button" class="linkbtn" data-tab="job">job 탭</button>에서 먼저 알바를 등록해 주세요 ✿</p>`}
      ${calendarHtml(y, m)}
    </article>
    <section class="box">
      <div class="box-title">monthly summary <small>· ${m + 1}월 알바비</small></div>
      <div class="sum-wrap">${summaryHtml(y, m)}</div>
    </section>`;
}

function postListHtml(list) {
  if (!list.length) return '<div class="box postlist"><p class="empty-note">이 달의 근무기록이 없어요.</p></div>';
  const rows = list.map(s => {
    const j = jobById(s.jobId);
    const dt = parseYmd(s.date);
    return `<tr role="button" tabindex="0" data-action="open-shift" data-id="${esc(s.id)}">
      <td>${md(dt)} (${WD_SUN[dt.getDay()]})</td>
      <td><span class="sq" style="background:${j.color}"></span>${esc(j.name)}</td>
      <td>${s.start}~${s.end}</td>
      <td>${fmtH(netMinutes(s))}</td></tr>`;
  }).join('');
  return `<div class="box postlist"><table class="plist">
    <thead><tr><th>날짜</th><th>알바</th><th>시간</th><th>근무</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function calendarHtml(y, m) {
  const first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  let h = '<div class="cal">';
  WD_MON.forEach((w, i) => { h += `<div class="cal-wd ${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${w}</div>`; });
  for (let i = 0; i < offset; i++) h += '<div class="cal-cell blank"></div>';
  for (let d = 1; d <= days; d++) {
    const key = ymd(y, m, d), wd = (offset + d - 1) % 7;
    const ss = shiftsOn(key, ui.filter);
    const cls = ['cal-cell', 'day', wd === 5 ? 'sat' : '', wd === 6 ? 'sun' : '', key === TODAY ? 'today' : ''].join(' ');
    h += `<div class="${cls}" role="button" tabindex="0" data-action="open-day" data-date="${key}"
      aria-label="${m + 1}월 ${d}일${ss.length ? `, 근무 ${ss.length}개` : ''}">
      <span class="dnum">${d}</span>${ss.map(chipHtml).join('')}</div>`;
  }
  const trail = (7 - (offset + days) % 7) % 7;
  for (let i = 0; i < trail; i++) h += '<div class="cal-cell blank"></div>';
  return h + '</div>';
}

function chipHtml(s) {
  const j = jobById(s.jobId);
  if (!j) return '';
  const min = netMinutes(s);
  return `<span class="chip" style="--c:${j.color}" title="${esc(j.name)} ${s.start}~${s.end} (${fmtH(min)})">
    <span class="chip-top"><span class="chip-name">${esc(j.name)}</span><span class="chip-h">${shortH(min)}</span></span>
    <span class="chip-t">${s.start}~${s.end}</span></span>`;
}

function summaryHtml(y, m) {
  if (!state.jobs.length) return '<p class="empty-note">등록된 알바가 없어요.</p>';
  const c = monthCalc(y, m);
  const rows = c.jobs.map(r => `<tr>
      <td data-label="알바"><span class="sq" style="background:${r.job.color}"></span>${esc(r.job.name)} <small>${won(r.job.wage)}/시</small></td>
      <td data-label="총 근무시간">${fmtH(r.minutes)}</td>
      <td data-label="기본급">${won(r.base)}</td>
      <td data-label="주휴수당"><span>${won(r.holiday)}${r.holidayWeeks ? ` <small>(${r.holidayWeeks}주)</small>` : ''}</span></td>
      <td data-label="합계" class="sum">${won(r.total)}</td></tr>`).join('');
  return `<table class="sum-table">
      <thead><tr><th>알바</th><th>총 근무시간</th><th>기본급</th><th>주휴수당</th><th>합계</th></tr></thead>
      <tbody>${rows}</tbody></table>
    <div class="grand">♥ ${m + 1}월 총 알바비 <b>${won(c.total)}</b></div>`;
}

/* ---------- 가운데: pay 탭 ---------- */
function renderPayView() {
  const y = ui.y, m = ui.m;
  const c = monthCalc(y, m);
  const spill = spillWeek(y, m);
  const jobBoxes = c.jobs.map(r => {
    const rows = r.weeks.map((w, i) => `<tr>
        <td data-label="주">${i + 1}주 <small>${md(w.mon)}(월)~${md(w.sun)}(일)</small></td>
        <td data-label="근무시간">${fmtH(w.minutes)}</td>
        <td data-label="주휴시간" class="${w.ok ? 'ok' : 'no'}">${w.ok ? fmtH(w.hours * 60) : '15시간 미만'}</td>
        <td data-label="주휴수당" class="sum">${won(w.pay)}</td></tr>`).join('');
    return `<section class="box">
      <div class="box-title"><span class="sq" style="background:${r.job.color}"></span>${esc(r.job.name)} <small>· 시급 ${won(r.job.wage)}</small></div>
      <div class="sum-wrap">
        <table class="sum-table week-table">
          <thead><tr><th>주 (월~일)</th><th>근무시간</th><th>주휴시간</th><th>주휴수당</th></tr></thead>
          <tbody>${rows}</tbody></table>
        <p class="pay-line">기본급 ${won(r.base)} + 주휴수당 ${won(r.holiday)} = <b>${won(r.total)}</b></p>
      </div></section>`;
  }).join('');

  content.innerHTML = `
    <article class="box post">
      <div class="post-head">
        <button type="button" class="navbtn" data-action="prev-month" aria-label="이전 달">◀</button>
        <h2 class="post-title">pay · ${MONTH_EN[m]} ${y}</h2>
        <button type="button" class="navbtn" data-action="next-month" aria-label="다음 달">▶</button>
      </div>
      <div class="post-meta">${y}년 ${m + 1}월 정산 · 알바별 주휴수당은 아래에서 주마다 볼 수 있어요</div>
      ${summaryHtml(y, m)}
      ${spill ? `<p class="next-note">※ ${md(spill.mon)}~${md(spill.sun)} 주는 일요일이 ${spill.sun.getMonth() + 1}월이라 주휴수당이 ${spill.sun.getMonth() + 1}월 정산에 들어가요.</p>` : ''}
    </article>
    ${jobBoxes}
    <section class="box">
      <div class="box-title">계산 방법</div>
      <ul class="rule">
        <li>한 주는 월요일~일요일, 알바별로 따로 계산해요.</li>
        <li>한 주 순수 근무시간이 15시간 이상이면 주휴수당이 생겨요.</li>
        <li>주휴시간 = (주 근무시간 ÷ 40) × 8, 최대 8시간 · 주휴수당 = 주휴시간 × 시급</li>
        <li>주 40시간 이하라면 그 주 급여의 20%와 같아요.</li>
        <li>달을 걸치는 주의 주휴수당은 일요일이 있는 달에, 기본급은 실제 근무한 날짜의 달에 들어가요.</li>
        <li>시급을 바꾸면 지난 기록도 새 시급으로 다시 계산돼요.</li>
      </ul>
    </section>`;
}

/* ---------- 가운데: job 탭 ---------- */
function nextColor() {
  const used = new Set(state.jobs.map(j => j.color));
  return PALETTE.find(c => !used.has(c)) || PALETTE[state.jobs.length % PALETTE.length];
}

function renderJobView() {
  const editing = ui.editJobId ? jobById(ui.editJobId) : null;
  if (!editing) ui.editJobId = null;
  if (!ui.jobColor) ui.jobColor = editing ? editing.color : nextColor();
  const pre = `${ui.y}-${pad(ui.m + 1)}`;
  const list = state.jobs.map(j => {
    const all = state.shifts.filter(s => s.jobId === j.id);
    const days = new Set(all.filter(s => s.date.startsWith(pre)).map(s => s.date)).size;
    return `<li>
      <span class="sq" style="background:${j.color}"></span>
      <span class="jname">${esc(j.name)}</span>
      <span class="jmeta">시급 ${won(j.wage)} · ${ui.m + 1}월 ${days}일 · 전체 기록 ${all.length}개</span>
      <span class="jbtns">
        <button type="button" class="btn small" data-action="edit-job" data-id="${esc(j.id)}">수정</button>
        <button type="button" class="btn small danger" data-action="del-job" data-id="${esc(j.id)}">삭제</button>
      </span></li>`;
  }).join('');

  content.innerHTML = `
    <section class="box">
      <div class="box-title">job <small>· ${editing ? '알바 수정' : '알바 등록'}</small></div>
      <form class="job-form" id="jobForm" autocomplete="off">
        ${!state.jobs.length ? '<p class="empty-note" style="margin-top:0">반가워요! 먼저 하고 있는 알바를 등록해 주세요 ✿<br>등록하면 달력에서 근무를 기록할 수 있어요.</p>' : ''}
        <div class="frow"><label for="jName">이름</label>
          <input type="text" id="jName" maxlength="20" placeholder="예: 카페알바" value="${editing ? esc(editing.name) : ''}" required></div>
        <div class="frow"><label for="jWage">시급</label>
          <input type="number" id="jWage" min="1" step="1" inputmode="numeric" placeholder="10320" style="width:110px" value="${editing ? editing.wage : ''}" required> 원</div>
        <div class="frow"><span class="lbl">색상</span>
          <div class="swatches">
            ${PALETTE.map(c => `<button type="button" class="sw ${c === ui.jobColor ? 'on' : ''}" style="background:${c}" data-action="pick-color" data-color="${c}" aria-label="색상 ${c}"></button>`).join('')}
            <input type="color" id="jColor" value="${ui.jobColor}" aria-label="직접 고르기">
          </div></div>
        <div class="pop-actions" style="justify-content:flex-start">
          <button type="submit" class="btn pri">${editing ? '수정하기' : '등록하기'}</button>
          ${editing ? '<button type="button" class="btn" data-action="cancel-job">취소</button>' : ''}
        </div>
        <p class="hint">참고: 2026년 최저시급은 10,320원이에요.</p>
      </form>
    </section>
    <section class="box">
      <div class="box-title">등록한 알바 <small>(${state.jobs.length})</small></div>
      ${state.jobs.length ? `<ul class="job-list">${list}</ul>` : '<div class="box-body muted">아직 없어요.</div>'}
    </section>`;
}

function submitJob() {
  const name = $('#jName').value.trim();
  const wage = Math.round(Number($('#jWage').value));
  if (!name) { toast('알바 이름을 적어 주세요.'); $('#jName').focus(); return; }
  if (!wage || wage < 1) { toast('시급을 숫자로 적어 주세요.'); $('#jWage').focus(); return; }
  const color = safeColor(ui.jobColor);
  const first = state.jobs.length === 0;
  if (ui.editJobId && jobById(ui.editJobId)) {
    Object.assign(jobById(ui.editJobId), { name, wage, color });
    toast(`"${name}" 수정했어요.`);
  } else {
    state.jobs.push({ id: uid(), name, wage, color });
    toast(first ? `"${name}" 등록! 이제 calendar에서 근무를 기록해 보세요 ✿` : `"${name}" 등록했어요.`);
  }
  ui.editJobId = null; ui.jobColor = null;
  save(); renderAll();
}

function deleteJob(id) {
  const j = jobById(id); if (!j) return;
  const n = state.shifts.filter(s => s.jobId === id).length;
  if (!confirm(`"${j.name}"을(를) 삭제할까요?${n ? `\n이 알바의 근무기록 ${n}개도 함께 지워져요.` : ''}`)) return;
  state.jobs = state.jobs.filter(x => x.id !== id);
  state.shifts = state.shifts.filter(s => s.jobId !== id);
  if (ui.filter === id) ui.filter = null;
  if (ui.editJobId === id) { ui.editJobId = null; ui.jobColor = null; }
  save(); renderAll();
  toast('삭제했어요.');
}

/* ---------- 가운데: memo 탭 ---------- */
function stampText(t) {
  if (!t) return '아직 저장한 적 없어요';
  const d = new Date(t);
  return `마지막 저장 ${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function renderMemoView() {
  content.innerHTML = `
    <section class="box">
      <div class="box-title">memo <small>· 적으면 자동으로 저장돼요</small></div>
      <div class="memo">
        <textarea id="memoText" rows="12" placeholder="사장님 연락처, 다음 달 스케줄, 월급날 메모…">${esc(state.memo.text)}</textarea>
        <div class="memo-status" id="memoStatus">${stampText(state.memo.savedAt)}</div>
      </div>
    </section>`;
}

/* ============================================
   팝업창
   ============================================ */
const modal = $('#modal');
let modalKind = null;

function openModal(kind, title, html) {
  modalKind = kind;
  $('#popTitle').textContent = title;
  $('#popBody').innerHTML = html;
  modal.hidden = false;
  modal.scrollTop = 0;
  document.body.classList.add('noscroll');
  $('.popup').focus();
}
function closeModal() {
  modal.hidden = true;
  modalKind = null;
  pop = null;
  document.body.classList.remove('noscroll');
}

/* ---------- 날짜 근무 입력 창 ---------- */
let pop = null;

function openDay(date, editId) {
  const dt = parseYmd(date);
  const title = `${dotDate(date)} (${WD_SUN[dt.getDay()]}) 근무기록`;
  if (!state.jobs.length) {
    openModal('info', title, `
      <p class="pop-text">먼저 알바를 등록해야 근무를 기록할 수 있어요.</p>
      <div class="pop-actions"><button type="button" class="btn pri" data-tab="job">알바 등록하러 가기</button></div>`);
    return;
  }
  pop = { date, editId: null, jobId: null, start: '', end: '', breaks: [], copy: new Set(), showCopy: false, py: dt.getFullYear(), pm: dt.getMonth() };
  resetForm();
  openModal('day', title, `
    <div class="pop-sec">
      <div class="pop-sub">이 날의 근무</div>
      <ul class="day-list" id="dayList"></ul>
    </div>
    <div class="pop-sec">
      <div class="pop-sub" id="formTitle"></div>
      <div class="frow"><label for="fJob">알바</label><select id="fJob">
        ${state.jobs.map(j => `<option value="${esc(j.id)}">${esc(j.name)} (${won(j.wage)})</option>`).join('')}
      </select></div>
      <div class="frow"><label for="fStart">근무</label>
        <input type="time" id="fStart" aria-label="시작 시간"> ~ <input type="time" id="fEnd" aria-label="종료 시간"></div>
      <div class="frow top"><span class="lbl">휴게</span>
        <div class="breaks"><div id="breakList" class="breaks"></div>
          <button type="button" class="btn small" data-action="add-break">+ 휴게시간 추가</button></div></div>
      <div class="calc" id="calc"></div>
      <div class="copy">
        <button type="button" class="linkbtn" data-action="toggle-copy" id="copyToggle"></button>
        <div class="picker" id="picker" hidden></div>
      </div>
      <div class="pop-actions">
        <button type="button" class="btn" data-action="cancel-edit" id="cancelEdit" hidden>수정 취소</button>
        <button type="button" class="btn pri" data-action="save-shift">저장</button>
      </div>
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
  const ft = $('#formTitle');
  ft.textContent = editing ? '✎ 근무 수정 중' : '✎ 새 근무 쓰기';
  ft.classList.toggle('editing', editing);
  $('#cancelEdit').hidden = !editing;
  renderBreaks(); renderCalc(); renderPicker();
}

function renderDayList() {
  const ss = shiftsOn(pop.date);
  $('#dayList').innerHTML = ss.length ? ss.map(s => {
    const j = jobById(s.jobId);
    const br = s.breaks.length ? `휴게 ${s.breaks.map(b => `${b.start}~${b.end}`).join(', ')}` : '휴게 없음';
    return `<li class="${s.id === pop.editId ? 'editing' : ''}">
      <span class="sq" style="background:${j.color}"></span>
      <span class="dl-main"><b>${esc(j.name)}</b> ${s.start}~${s.end} · ${fmtH(netMinutes(s))}<small>${br}</small></span>
      <span class="dl-btns">
        <button type="button" class="btn small" data-action="edit-shift" data-id="${esc(s.id)}">수정</button>
        <button type="button" class="btn small danger" data-action="del-shift" data-id="${esc(s.id)}">삭제</button>
      </span></li>`;
  }).join('') : '<li class="muted">아직 기록이 없어요.</li>';
}

function renderBreaks() {
  $('#breakList').innerHTML = pop.breaks.length ? pop.breaks.map((b, i) => `
    <div class="brow">
      <input type="time" data-bi="${i}" data-k="start" value="${b.start}" aria-label="휴게 ${i + 1} 시작"> ~
      <input type="time" data-bi="${i}" data-k="end" value="${b.end}" aria-label="휴게 ${i + 1} 종료">
      <button type="button" class="xbtn" data-action="del-break" data-i="${i}" aria-label="휴게 ${i + 1} 지우기">×</button>
    </div>`).join('') : '<span class="muted">휴게 없음</span>';
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
    if (j) h += ` · 예상 기본급 <b>${won(a.minutes / 60 * j.wage)}</b>`;
    if (a.overnight) h += ' <small>(다음 날 새벽까지)</small>';
  }
  a.errors.forEach(e => { h += `<span class="err">! ${e}</span>`; });
  a.warns.forEach(w => { h += `<span class="warn">※ ${w}</span>`; });
  $('#calc').innerHTML = h;
}

/* 반복 입력용 간이 달력 */
function renderPicker() {
  const el = $('#picker');
  $('#copyToggle').textContent = (pop.showCopy ? '▾' : '▸') + ' 다른 날짜에도 같은 근무 복사하기' + (pop.copy.size ? ` (${pop.copy.size}일)` : '');
  el.hidden = !pop.showCopy;
  if (!pop.showCopy) return;
  const y = pop.py, m = pop.pm;
  const baseDt = parseYmd(pop.date);
  const baseWd = baseDt.getDay();
  const first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const worked = new Set(state.shifts.map(s => s.date));
  let g = WD_MON.map((w, i) => `<span class="pw ${i === 5 ? 'sat' : i === 6 ? 'sun' : ''}">${w}</span>`).join('');
  for (let i = 0; i < offset; i++) g += '<span></span>';
  for (let d = 1; d <= days; d++) {
    const key = ymd(y, m, d), wd = (offset + d - 1) % 7;
    const isBase = key === pop.date;
    const cls = ['pk-day', wd === 5 ? 'sat' : '', wd === 6 ? 'sun' : '', worked.has(key) ? 'has' : '',
      pop.copy.has(key) ? 'picked' : '', isBase ? 'base' : ''].join(' ');
    g += `<button type="button" class="${cls}" ${isBase ? 'disabled title="기준 날짜"' : `data-action="pick-day" data-date="${key}"`}
      aria-pressed="${pop.copy.has(key)}" aria-label="${m + 1}월 ${d}일">${d}</button>`;
  }
  const picked = [...pop.copy].sort();
  el.innerHTML = `
    <div class="pk-head">
      <button type="button" class="navbtn" data-action="pk-prev" aria-label="이전 달">◀</button>
      <b>${y}.${pad(m + 1)}</b>
      <button type="button" class="navbtn" data-action="pk-next" aria-label="다음 달">▶</button>
    </div>
    <div class="pk-grid">${g}</div>
    <div class="pk-btns">
      <button type="button" class="btn small" data-action="pk-weekday">이번 달 ${WD_SUN[baseWd]}요일 전체 선택</button>
      <button type="button" class="btn small" data-action="pk-clear">선택 해제</button>
    </div>
    <div class="pk-info">${picked.length
      ? `선택한 날짜 <b>${picked.length}</b>개: ${picked.map(k => md(parseYmd(k))).join(', ')}`
      : '복사할 날짜를 눌러서 골라 주세요. (분홍 점 = 이미 근무가 있는 날)'}</div>`;
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
  if (skipped) msg += ` (같은 근무가 이미 있는 ${skipped}일은 건너뛰었어요)`;
  toast(msg);

  pop.copy.clear(); pop.showCopy = false;
  resetForm(); refreshForm(); renderDayList();
  renderAll();
}

function deleteShift(id) {
  if (!confirm('이 근무기록을 삭제할까요?')) return;
  state.shifts = state.shifts.filter(s => s.id !== id);
  if (pop && pop.editId === id) { resetForm(); refreshForm(); }
  save();
  if (pop) renderDayList();
  renderAll();
  toast('삭제했어요.');
}

/* ---------- 설정(프로필) 창 ---------- */
function openProfile() {
  const p = state.profile;
  ui.pendingEmoji = p.emoji;
  openModal('profile', '블로그 설정', `
    <div class="frow"><label for="pNick">닉네임</label><input type="text" id="pNick" maxlength="12" value="${esc(p.nick)}" style="flex:1;min-width:0"></div>
    <div class="frow"><label for="pIntro">소개</label><input type="text" id="pIntro" maxlength="40" value="${esc(p.intro)}" style="flex:1;min-width:0"></div>
    <div class="frow top"><span class="lbl">사진</span>
      <div class="emoji-row">${EMOJIS.map(e => `<button type="button" class="${e === p.emoji ? 'on' : ''}" data-action="pick-emoji" data-emoji="${e}">${e}</button>`).join('')}</div></div>
    <div class="pop-actions">
      <button type="button" class="btn" data-action="close-modal">취소</button>
      <button type="button" class="btn pri" data-action="save-profile">저장</button>
    </div>`);
}

/* ---------- 백업 창 ---------- */
function openBackup() {
  openModal('backup', '백업', `
    <p class="pop-text">기록은 이 브라우저에만 저장돼요. 휴대폰↔컴퓨터로 옮기거나 혹시 모를 때를 위해 파일로 백업해 두세요.</p>
    <div class="frow"><span class="lbl">저장</span><button type="button" class="btn pri" data-action="export">백업 파일 받기 (.json)</button></div>
    <div class="frow"><label for="importFile">불러오기</label><input type="file" id="importFile" accept=".json,application/json" style="font-size:11px;max-width:100%"></div>
    <hr class="pop-hr">
    <div class="frow"><span class="lbl">초기화</span><button type="button" class="btn danger" data-action="reset-all">모든 기록 지우기</button></div>`);
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `albailgi-backup-${TODAY}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('백업 파일을 저장했어요.');
}

function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.jobs) || !Array.isArray(d.shifts)) throw new Error('bad');
      const next = normalize(d);
      if (!confirm(`알바 ${next.jobs.length}개, 근무기록 ${next.shifts.length}개를 불러올까요?\n지금 기록은 이 파일 내용으로 바뀌어요.`)) return;
      next.visits = state.visits;
      state = next;
      ui.filter = null; ui.editJobId = null; ui.jobColor = null;
      save(); closeModal(); renderAll();
      toast('불러왔어요.');
    } catch (e) {
      toast('알바일기 백업 파일이 아닌 것 같아요.');
    }
  };
  r.readAsText(file);
}

/* ============================================
   이벤트
   ============================================ */
function setTab(tab) {
  ui.tab = tab;
  if (tab !== 'job') { ui.editJobId = null; ui.jobColor = null; }
  renderAll();
}
function moveMonth(delta) {
  const d = new Date(ui.y, ui.m + delta, 1);
  ui.y = d.getFullYear(); ui.m = d.getMonth();
  renderAll();
}
function scrollToContent() {
  if (window.innerWidth <= 820) content.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-action],[data-tab]');
  if (!t) return;
  if (t.dataset.tab) {
    if (!modal.hidden) closeModal();
    setTab(t.dataset.tab);
    return;
  }
  const id = t.dataset.id;
  switch (t.dataset.action) {
    case 'home':
      if (!modal.hidden) closeModal();
      ui.y = START.y; ui.m = START.m; ui.filter = null; ui.listOpen = false;
      setTab('calendar'); window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    case 'settings': case 'edit-profile': openProfile(); break;
    case 'backup': openBackup(); break;
    case 'close-modal': closeModal(); break;
    case 'prev-month': moveMonth(-1); break;
    case 'next-month': moveMonth(1); break;
    case 'month-view': setTab('calendar'); scrollToContent(); break;
    case 'toggle-list': ui.listOpen = !ui.listOpen; renderView(); break;
    case 'filter':
      ui.filter = id || null;
      ui.tab = 'calendar';
      renderAll(); scrollToContent();
      break;
    case 'open-day': openDay(t.dataset.date); break;
    case 'open-shift': {
      const s = state.shifts.find(x => x.id === id);
      if (s) openDay(s.date, s.id);
      break;
    }
    /* 근무 입력 창 */
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
    case 'pk-prev': case 'pk-next': {
      const d = new Date(pop.py, pop.pm + (t.dataset.action === 'pk-next' ? 1 : -1), 1);
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
    /* job 탭 */
    case 'pick-color':
      ui.jobColor = t.dataset.color;
      document.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', s.dataset.color === ui.jobColor));
      $('#jColor').value = ui.jobColor;
      break;
    case 'edit-job': ui.editJobId = id; ui.jobColor = jobById(id)?.color || null; renderJobView(); content.scrollIntoView({ block: 'start' }); break;
    case 'cancel-job': ui.editJobId = null; ui.jobColor = null; renderJobView(); break;
    case 'del-job': deleteJob(id); break;
    /* 설정 / 백업 */
    case 'pick-emoji':
      ui.pendingEmoji = t.dataset.emoji;
      document.querySelectorAll('.emoji-row button').forEach(b => b.classList.toggle('on', b.dataset.emoji === ui.pendingEmoji));
      break;
    case 'save-profile':
      state.profile = {
        nick: $('#pNick').value.trim() || '세란',
        intro: $('#pIntro').value.trim(),
        emoji: ui.pendingEmoji || state.profile.emoji
      };
      save(); closeModal(); renderProfile(); toast('설정을 저장했어요.');
      break;
    case 'export': exportData(); break;
    case 'reset-all':
      if (!confirm('알바와 근무기록, 메모를 모두 지울까요?\n되돌릴 수 없어요. 먼저 백업 파일을 받아두는 걸 추천해요.')) return;
      state = { ...defaultState(), visits: state.visits };
      ui.filter = null; ui.editJobId = null; ui.jobColor = null;
      save(); closeModal(); ui.tab = 'job'; renderAll();
      toast('모두 지웠어요.');
      break;
  }
});

let memoTimer = null;
document.addEventListener('input', e => {
  const t = e.target;
  if (modalKind === 'day' && pop) {
    if (t.id === 'fJob') pop.jobId = t.value;
    else if (t.id === 'fStart') pop.start = t.value;
    else if (t.id === 'fEnd') pop.end = t.value;
    else if (t.dataset.bi !== undefined) pop.breaks[Number(t.dataset.bi)][t.dataset.k] = t.value;
    else return;
    renderCalc();
    return;
  }
  if (t.id === 'memoText') {
    state.memo.text = t.value;
    clearTimeout(memoTimer);
    memoTimer = setTimeout(() => {
      state.memo.savedAt = Date.now(); save();
      const st = $('#memoStatus'); if (st) st.textContent = stampText(state.memo.savedAt);
    }, 400);
  }
  if (t.id === 'jColor') {
    ui.jobColor = t.value;
    document.querySelectorAll('.sw').forEach(s => s.classList.toggle('on', s.dataset.color === ui.jobColor));
  }
});

document.addEventListener('change', e => {
  if (e.target.id === 'importFile' && e.target.files[0]) importData(e.target.files[0]);
});

document.addEventListener('submit', e => {
  if (e.target.id === 'jobForm') { e.preventDefault(); submitJob(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !modal.hidden) { closeModal(); return; }
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t.getAttribute && t.getAttribute('role') === 'button' && t.dataset.action) {
    e.preventDefault();
    t.click();
  }
});

/* 토스트 */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* 시작: 알바가 없으면 등록 화면부터 */
ui.tab = state.jobs.length ? 'calendar' : 'job';
renderAll();
