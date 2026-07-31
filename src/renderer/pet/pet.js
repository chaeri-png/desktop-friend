const sprite = document.getElementById('sprite');
const statusEl = document.getElementById('status');

let cfg = null;
let baseUrl = '';
let currentAnim = null;
let frameIdx = 0;
let frameTimer = null;

function play(name) {
  const anim = cfg.animations[name] ?? cfg.animations.idle;
  currentAnim = name;
  frameIdx = 0;
  clearInterval(frameTimer);
  const step = () => {
    sprite.src = `${baseUrl}/${anim.frames[frameIdx % anim.frames.length]}`;
    frameIdx += 1;
  };
  step();
  frameTimer = setInterval(step, anim.intervalMs);
}

window.api.invoke('get-character').then((data) => {
  cfg = data.config;
  baseUrl = data.baseUrl;
  play('idle');
});

window.api.on('view', (v) => {
  if (!cfg) return;
  if (v.animation !== currentAnim) play(v.animation);
  statusEl.hidden = !v.status;
  statusEl.textContent = v.status ?? '';
});

const bubble = document.getElementById('bubble');
let bubbleTimer = null;

window.api.on('say', ({ text, ms }) => {
  bubble.textContent = text;
  bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
});

let down = null;
let dragging = false;

sprite.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  down = { x: e.screenX, y: e.screenY };
  dragging = false;
});

window.addEventListener('mousemove', (e) => {
  if (!down) return;
  const dx = e.screenX - down.x;
  const dy = e.screenY - down.y;
  if (!dragging && Math.hypot(dx, dy) > 6) {
    dragging = true;
    window.api.send('drag-start');
  }
  if (dragging) {
    window.api.send('drag-move', { dx, dy });
    down = { x: e.screenX, y: e.screenY };
  }
});

window.addEventListener('mouseup', () => {
  if (!down) return;
  if (dragging) window.api.send('drag-end');
  down = null;
  dragging = false;
});

sprite.addEventListener('click', () => {
  if (!dragging) window.api.send('pet-click');
});
sprite.addEventListener('dblclick', () => window.api.send('pet-dblclick'));
sprite.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.api.send('pet-context');
});
