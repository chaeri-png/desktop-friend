import { describe, it, expect } from 'vitest';
import { NAG_MESSAGES, GREET_MESSAGES, shouldNag, pickMessage, pickFrom } from '../src/shared/nagger.js';

const MIN = 60_000;

describe('nagger', () => {
  it('꺼져 있으면 절대 잔소리하지 않는다', () => {
    expect(shouldNag({ enabled: false, lastAt: 0, intervalMin: 1, now: 100 * MIN })).toBe(false);
  });

  it('간격이 지나야만 잔소리한다', () => {
    expect(shouldNag({ enabled: true, lastAt: 0, intervalMin: 45, now: 44 * MIN })).toBe(false);
    expect(shouldNag({ enabled: true, lastAt: 0, intervalMin: 45, now: 45 * MIN })).toBe(true);
  });

  it('pickMessage는 메시지 목록 안에서 고른다', () => {
    expect(NAG_MESSAGES.length).toBeGreaterThanOrEqual(5);
    expect(NAG_MESSAGES).toContain(pickMessage(() => 0));
    expect(NAG_MESSAGES).toContain(pickMessage(() => 0.999));
  });

  it('인사말도 목록 안에서 고른다', () => {
    expect(GREET_MESSAGES.length).toBeGreaterThanOrEqual(8);
    expect(GREET_MESSAGES).toContain(pickFrom(GREET_MESSAGES, () => 0));
    expect(GREET_MESSAGES).toContain(pickFrom(GREET_MESSAGES, () => 0.999));
  });
});
