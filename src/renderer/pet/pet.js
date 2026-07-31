import { createGesture, down, move, up, tick } from '../../shared/gesture.js';
import { createBird3D } from './bird3d.js';

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
  const onUp = () => {
    if (!down2) return;
    if (dragging) window.api.send('drag-end');
    else window.api.send('pet-click');
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
function create3DPlayer() {
  const bird = createBird3D(stage);

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
  const onUp = () => {
    clearTimeout(longTimer);
    const r = up(g, now());
    g = r.g;
    for (const a of r.actions) {
      if (a.type === 'click') window.api.send('pet-click');
      else if (a.type === 'move-end') window.api.send('drag-end');
      else if (a.type === 'rotate-end') bird.endRotate();
    }
  };
  stage.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  return {
    setAnimation: bird.setAnimation,
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
    player = create3DPlayer();
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

document.addEventListener('dblclick', () => window.api.send('pet-dblclick'));
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.api.send('pet-context');
});

init();
