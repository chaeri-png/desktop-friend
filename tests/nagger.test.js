import { describe, it, expect } from 'vitest';
import {
  NAG_MESSAGES,
  GREET_MESSAGES,
  shouldNag,
  pickMessage,
  pickFrom,
  bucketForHour,
  linesForHour,
} from '../src/shared/nagger.js';

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

  it('시간을 시간대로 나눈다', () => {
    expect(bucketForHour(7)).toBe('morning');
    expect(bucketForHour(12)).toBe('lunch');
    expect(bucketForHour(15)).toBe('afternoon');
    expect(bucketForHour(19)).toBe('evening');
    expect(bucketForHour(23)).toBe('night');
    expect(bucketForHour(2)).toBe('night');
  });

  it('linesForHour는 공통 대사 + 현재 시간대 대사를 합친다', () => {
    const lines = { any: ['a'], lunch: ['점심'], night: ['밤'] };
    expect(linesForHour(lines, 12)).toEqual(['a', '점심']);
    expect(linesForHour(lines, 23)).toEqual(['a', '밤']);
    expect(linesForHour(lines, 15)).toEqual(['a']); // 오후 대사가 없으면 공통만
    expect(linesForHour(['x', 'y'], 12)).toEqual(['x', 'y']); // 배열이면 그대로 (하위 호환)
    expect(linesForHour(null, 12)).toEqual([]);
  });
});
