const MIN = 60_000;

export function createTimer({ focusMin = 25, restMin = 5, autoRepeat = true } = {}) {
  return {
    phase: 'idle',
    running: false,
    focusMs: focusMin * MIN,
    restMs: restMin * MIN,
    autoRepeat,
    endsAt: null,
  };
}

export function start(timer, nowMs) {
  return { ...timer, phase: 'focus', running: true, endsAt: nowMs + timer.focusMs };
}

export function stop(timer) {
  return { ...timer, phase: 'idle', running: false, endsAt: null };
}

export function tick(timer, nowMs) {
  if (!timer.running || nowMs < timer.endsAt) return { timer, event: null };
  if (timer.phase === 'focus') {
    return {
      timer: { ...timer, phase: 'rest', endsAt: timer.endsAt + timer.restMs },
      event: 'rest-started',
    };
  }
  if (timer.autoRepeat) {
    return {
      timer: { ...timer, phase: 'focus', endsAt: timer.endsAt + timer.focusMs },
      event: 'focus-started',
    };
  }
  return { timer: stop(timer), event: 'cycle-ended' };
}

export function remainingMs(timer, nowMs) {
  return timer.running ? Math.max(0, timer.endsAt - nowMs) : 0;
}

export function formatMs(ms) {
  const totalSec = Math.round(ms / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
