'use strict';
/* ============================================
   바닷속 수족관 — 산호초 위로 물고기가 헤엄쳐요
   그림: assets/ocean/ (source.gif에서 잘라내 2배로 다듬은 것)
   - reef.webp            산호초·돌·모래 바닥 (고정)
   - fish-이름.webp        물고기 한 마리씩 (투명 배경)
   움직임은 transform만 써서 부드럽고 배터리를 덜 써요.
   ============================================ */
(function () {
  const sea = document.getElementById('sea');
  if (!sea) return;

  /* 이름, 가까이 있을 때 화면 크기(px), 그림 속 머리 방향, 휴대폰에서도 보일지 */
  const FISH = [
    { n: 'tang',       w: 116, face: 'left',  phone: true },
    { n: 'goldfish',   w: 70,  face: 'right', phone: true },
    { n: 'betta',      w: 54,  face: 'left',  phone: true },
    { n: 'yellowtang', w: 52,  face: 'right', phone: true },
    { n: 'idol',       w: 40,  face: 'left',  phone: true },
    { n: 'orange',     w: 40,  face: 'right' },
    { n: 'butterfly',  w: 20,  face: 'left'  },
    { n: 'orange',     w: 32,  face: 'right' },
    { n: 'butterfly',  w: 17,  face: 'left'  }
  ];
  const DEPTH = [1, 0.82, 0.62];               // 가까움 · 중간 · 멂 (멀수록 작고 느리고 흐릿)
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = () => window.innerWidth <= 760;
  const rand = (a, b) => a + Math.random() * (b - a);
  let fish = [];

  function build() {
    fish.forEach(F => F.anim && F.anim.cancel());
    sea.querySelectorAll('.fish').forEach(el => el.remove());
    fish = [];
    const phone = narrow();
    (phone ? FISH.filter(f => f.phone) : FISH).forEach((f, i) => {
      const depth = DEPTH[i % 3];
      const el = document.createElement('div');
      el.className = 'fish' + (depth < 0.7 ? ' far' : '');
      const bob = document.createElement('div');
      bob.className = 'bob';
      bob.style.setProperty('--bob', rand(2.2, 3.4).toFixed(2) + 's');
      bob.style.animationDelay = (-rand(0, 3)).toFixed(2) + 's';
      const img = new Image();
      img.src = `assets/ocean/fish-${f.n}.webp`;
      img.alt = '';
      img.decoding = 'async';
      img.draggable = false;
      img.style.width = Math.round(f.w * depth * (phone ? 0.85 : 1)) + 'px';
      bob.appendChild(img);
      el.appendChild(bob);
      sea.appendChild(el);
      fish.push({ el, img, face: f.face, depth, dir: Math.random() < 0.5 ? 1 : -1, first: true, y: null, anim: null });
    });
    fish.forEach(swim);
  }

  /* 한 번에 화면을 가로질러 헤엄치고, 나가면 방향을 바꿔 다시 들어와요 */
  function swim(F) {
    const W = sea.clientWidth, H = sea.clientHeight;
    if (!W || !H) { setTimeout(() => swim(F), 500); return; }
    const w = F.img.offsetWidth || 60, h = F.img.offsetHeight || w * 0.6;
    const yMin = H * 0.26, yMax = Math.max(yMin + 10, H * 0.9 - h);
    const y0 = F.y == null ? rand(yMin, yMax) : Math.min(yMax, Math.max(yMin, F.y));
    const y1 = Math.min(yMax, Math.max(yMin, y0 + rand(-H * 0.12, H * 0.12)));
    const out = -w - 30, end = W + 30;
    const x0 = F.first ? rand(0, Math.max(1, W - w)) : (F.dir > 0 ? out : end);
    const x1 = F.dir > 0 ? end : out;
    // 오른쪽으로 갈 때는 머리가 오른쪽을 보게 좌우 반전
    F.el.classList.toggle('flip', (F.dir > 0) !== (F.face === 'right'));
    F.y = y1;

    if (reduce.matches) {                       // 움직임 줄이기: 멈춘 그림으로
      F.el.style.transform = `translate(${x0}px,${y0}px)`;
      F.first = false;
      return;
    }
    const speed = rand(24, 44) * F.depth * (narrow() ? 0.8 : 1);   // px/초
    F.anim = F.el.animate(
      [{ transform: `translate(${x0}px,${y0}px)` }, { transform: `translate(${x1}px,${y1}px)` }],
      { duration: Math.abs(x1 - x0) / speed * 1000, easing: 'linear', fill: 'forwards', delay: F.first ? 0 : rand(400, 4000) }
    );
    F.first = false;
    if (document.hidden) F.anim.pause();
    F.anim.onfinish = () => { F.dir = -F.dir; swim(F); };
  }

  /* 탭이 안 보일 때는 멈춰서 배터리 아끼기 */
  document.addEventListener('visibilitychange', () => {
    sea.classList.toggle('paused', document.hidden);
    fish.forEach(F => { if (F.anim) document.hidden ? F.anim.pause() : F.anim.play(); });
  });

  /* 휴대폰 ↔ 컴퓨터 크기가 바뀌면 물고기 수를 다시 맞춰요 */
  let wasNarrow = narrow();
  window.addEventListener('resize', () => {
    if (narrow() !== wasNarrow) { wasNarrow = narrow(); build(); }
  });
  if (reduce.addEventListener) reduce.addEventListener('change', build);

  sea.classList.toggle('still', reduce.matches);
  if (reduce.addEventListener) reduce.addEventListener('change', () => sea.classList.toggle('still', reduce.matches));
  build();
})();
