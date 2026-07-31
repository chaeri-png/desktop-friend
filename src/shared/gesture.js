// 펫 창 마우스 제스처 판별: 클릭 / 드래그(회전) / 길게 눌러 이동
// 순수 모듈 — 시간은 인자로 주입 (테스트 결정성)

export function createGesture({ longPressMs = 400, moveThreshold = 6 } = {}) {
  return {
    longPressMs,
    moveThreshold,
    held: false,
    mode: null, // null(판별 전) | 'rotate' | 'move'
    t0: 0,
    x0: 0,
    y0: 0,
    x: 0,
    y: 0,
  };
}

export function down(g, t, x, y) {
  return { ...g, held: true, mode: null, t0: t, x0: x, y0: y, x, y };
}

export function move(g, t, x, y) {
  if (!g.held) return { g, actions: [] };
  const dx = x - g.x;
  const dy = y - g.y;
  if (g.mode === 'rotate') return { g: { ...g, x, y }, actions: [{ type: 'rotate', dx, dy }] };
  if (g.mode === 'move') return { g: { ...g, x, y }, actions: [{ type: 'move', dx, dy }] };
  // 판별 전: 임계값을 넘으면 rotate 모드 진입
  if (Math.hypot(x - g.x0, y - g.y0) > g.moveThreshold) {
    return {
      g: { ...g, mode: 'rotate', x, y },
      actions: [{ type: 'rotate', dx: x - g.x0, dy: y - g.y0 }],
    };
  }
  return { g, actions: [] };
}

export function tick(g, t) {
  if (!g.held || g.mode !== null) return { g, actions: [] };
  if (t - g.t0 >= g.longPressMs) {
    return { g: { ...g, mode: 'move' }, actions: [{ type: 'move-start' }] };
  }
  return { g, actions: [] };
}

export function up(g, t) {
  if (!g.held) return { g, actions: [] };
  const done = { ...g, held: false, mode: null };
  if (g.mode === 'rotate') return { g: done, actions: [{ type: 'rotate-end' }] };
  if (g.mode === 'move') return { g: done, actions: [{ type: 'move-end' }] };
  return { g: done, actions: [{ type: 'click' }] };
}
