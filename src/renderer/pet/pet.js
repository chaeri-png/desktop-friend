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
