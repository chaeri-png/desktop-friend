import { describe, it, expect } from 'vitest';
import { createTimer, start, stop, tick, remainingMs, formatMs } from '../src/shared/timer.js';

const MIN = 60_000;

describe('timer', () => {
  it('기본값 25/5분, idle 상태로 생성된다', () => {
    const t = createTimer();
    expect(t.phase).toBe('idle');
    expect(t.running).toBe(false);
    expect(t.focusMs).toBe(25 * MIN);
    expect(t.restMs).toBe(5 * MIN);
  });

  it('start하면 focus 상태가 되고 남은 시간이 focusMs다', () => {
    const t = start(createTimer({ focusMin: 10, restMin: 2 }), 1000);
    expect(t.phase).toBe('focus');
    expect(t.running).toBe(true);
    expect(remainingMs(t, 1000)).toBe(10 * MIN);
  });

  it('시간이 남아 있으면 tick은 이벤트를 내지 않는다', () => {
    const t = start(createTimer(), 0);
    const { event } = tick(t, 5 * MIN);
    expect(event).toBeNull();
  });

  it('집중 시간이 끝나면 rest-started 이벤트와 함께 휴식으로 전환된다', () => {
    const t = start(createTimer({ focusMin: 25, restMin: 5 }), 0);
    const { timer: t2, event } = tick(t, 25 * MIN);
    expect(event).toBe('rest-started');
    expect(t2.phase).toBe('rest');
    expect(remainingMs(t2, 25 * MIN)).toBe(5 * MIN);
  });

  it('autoRepeat=true면 휴식이 끝날 때 focus-started로 다음 사이클을 시작한다', () => {
    let t = start(createTimer({ focusMin: 25, restMin: 5 }), 0);
    t = tick(t, 25 * MIN).timer;
    const { timer: t2, event } = tick(t, 30 * MIN);
    expect(event).toBe('focus-started');
    expect(t2.phase).toBe('focus');
  });

  it('autoRepeat=false면 휴식이 끝날 때 cycle-ended로 idle이 된다', () => {
    let t = start(createTimer({ focusMin: 25, restMin: 5, autoRepeat: false }), 0);
    t = tick(t, 25 * MIN).timer;
    const { timer: t2, event } = tick(t, 30 * MIN);
    expect(event).toBe('cycle-ended');
    expect(t2.phase).toBe('idle');
    expect(t2.running).toBe(false);
  });

  it('stop하면 idle로 돌아간다', () => {
    const t = stop(start(createTimer(), 0));
    expect(t.phase).toBe('idle');
    expect(t.running).toBe(false);
    expect(remainingMs(t, 999)).toBe(0);
  });

  it('formatMs는 MM:SS 문자열을 만든다', () => {
    expect(formatMs(25 * MIN)).toBe('25:00');
    expect(formatMs(90_000)).toBe('01:30');
    expect(formatMs(0)).toBe('00:00');
  });
});
