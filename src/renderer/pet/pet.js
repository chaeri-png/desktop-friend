import { createGesture, down, move, up, tick } from '../../shared/gesture.js';

const sprite = document.getElementById('sprite');
const stage = document.getElementById('stage');
const statusEl = document.getElementById('status');
const bubble = document.getElementById('bubble');

let player = null; // { setAnimation, dispose }
let currentAnim = null;

// ---------- 2D 캐릭터 팩 플레이어 (하위 호환) ----------
function create2DPlayer(cfg, baseUrl) {
  let frameIdx = 0;
  let frameTimer = null;

  function play(name) {
    const anim = cfg.animations[name] ?? cfg.animations.idle;
    frameIdx = 0;
    clearInterval(frameTimer);
    const step = () => {
      sprite.src = `${baseUrl}/${anim.frames[frameIdx % anim.frames.length]}`;
      frameIdx += 1;
    };
    step();
    frameTimer = setInterval(step, anim.intervalMs);
  }

  // 2D는 기존 방식: 드래그 즉시 창 이동
  let down2 = null;
  let dragging = false;
  const onDown = (e) => {
    if (e.button !== 0) return;
    down2 = { x: e.screenX, y: e.screenY };
    dragging = false;
  };
  const onMove = (e) => {
    if (!down2) return;
    const dx = e.screenX - down2.x;
    const dy = e.screenY - down2.y;
    if (!dragging && Math.hypot(dx, dy) > 6) {
      dragging = true;
      window.api.send('drag-start');
    }
    if (dragging) {
      window.api.send('drag-move', { dx, dy });
      down2 = { x: e.screenX, y: e.screenY };
    }
  };
  let lastClickAt2 = 0;
  const onUp = () => {
    if (!down2) return;
    if (dragging) window.api.send('drag-end');
    else {
      const tNow = performance.now();
      if (tNow - lastClickAt2 < 450) {
        lastClickAt2 = 0;
        window.api.send('pet-dblclick');
      } else {
        lastClickAt2 = tNow;
        window.api.send('pet-click');
      }
    }
    down2 = null;
    dragging = false;
  };
  sprite.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  return {
    setAnimation: play,
    dispose() {
      clearInterval(frameTimer);
      sprite.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    },
  };
}

// ---------- 3D 플레이어 + 제스처 (드래그=회전, 길게 누르면 이동) ----------
// 캐릭터 폴더의 model.js를 동적으로 불러온다 (캐릭터 팩 = character.json + model.js)
async function create3DPlayer(baseUrl) {
  const { createModel } = await import(`${baseUrl}/model.js`);
  const bird = createModel(stage);

  let g = createGesture();
  let longTimer = null;
  const now = () => performance.now();

  const onDown = (e) => {
    if (e.button !== 0) return;
    g = down(g, now(), e.screenX, e.screenY);
    clearTimeout(longTimer);
    longTimer = setTimeout(() => {
      const r = tick(g, now());
      g = r.g;
      for (const a of r.actions) if (a.type === 'move-start') window.api.send('drag-start');
    }, 410);
  };
  const onMove = (e) => {
    const r = move(g, now(), e.screenX, e.screenY);
    g = r.g;
    for (const a of r.actions) {
      if (a.type === 'rotate') bird.rotateBy(a.dx, a.dy);
      else if (a.type === 'move') window.api.send('drag-move', { dx: a.dx, dy: a.dy });
    }
  };
  // 더블클릭은 직접 감지한다 — 로밍 중엔 창이 움직여서 OS의 더블클릭 판정(같은 위치 조건)이 실패함
  let lastClickAt = 0;
  const onUp = () => {
    clearTimeout(longTimer);
    const r = up(g, now());
    g = r.g;
    for (const a of r.actions) {
      if (a.type === 'click') {
        const tNow = now();
        if (tNow - lastClickAt < 450) {
          lastClickAt = 0;
          if (bird.isRotated()) bird.resetRotation();
          else window.api.send('pet-dblclick');
        } else {
          lastClickAt = tNow;
          window.api.send('pet-click');
        }
      } else if (a.type === 'move-end') window.api.send('drag-end');
      else if (a.type === 'rotate-end') bird.endRotate();
    }
  };
  stage.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  return {
    setAnimation: bird.setAnimation,
    rotateBy: bird.rotateBy,
    endRotate: bird.endRotate,
    isRotated: bird.isRotated,
    resetRotation: bird.resetRotation,
    dispose() {
      clearTimeout(longTimer);
      stage.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      bird.dispose();
    },
  };
}

// ---------- 공통 ----------
async function init() {
  if (player) {
    player.dispose();
    player = null;
  }
  currentAnim = null;
  const data = await window.api.invoke('get-character');
  const cfg = data.config;
  if (cfg.type === '3d') {
    sprite.hidden = true;
    stage.hidden = false;
    player = await create3DPlayer(data.baseUrl);
  } else {
    stage.hidden = true;
    sprite.hidden = false;
    player = create2DPlayer(cfg, data.baseUrl);
  }
  currentAnim = 'idle';
  player.setAnimation('idle');
}

window.api.on('view', (v) => {
  if (!player) return;
  if (v.animation !== currentAnim) {
    currentAnim = v.animation;
    player.setAnimation(v.animation);
  }
  statusEl.hidden = !v.status;
  statusEl.textContent = v.status ?? '';
});

let bubbleTimer = null;
window.api.on('say', ({ text, ms }) => {
  bubble.textContent = text;
  bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
});

window.api.on('character-changed', () => init());

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.api.send('pet-context');
});

init();

// 개발용: 메인이 debug-snaps를 보내면 정면/옆/뒷모습을 찍어 보낸다 (BAEPSAE_SNAP=1일 때만 옴)
window.api.on('debug-snaps', () => {
  const snap = (name) => {
    const cv = stage.querySelector('canvas');
    if (cv) window.api.send('debug-snap', { name, data: cv.toDataURL('image/png') });
  };
  snap('1-front');
  setTimeout(() => player?.rotateBy?.(79, 0), 200);
  setTimeout(() => snap('2-side'), 600);
  setTimeout(() => player?.rotateBy?.(79, 0), 800);
  setTimeout(() => snap('3-back'), 1200);
  setTimeout(() => { player?.endRotate?.(); player?.resetRotation?.(); }, 1400);
  setTimeout(() => player?.setAnimation?.('focus'), 3600);
  setTimeout(() => snap('4-focus'), 3800);
  setTimeout(() => player?.setAnimation?.('idle'), 3950);
});
