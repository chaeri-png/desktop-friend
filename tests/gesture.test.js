import { describe, it, expect } from 'vitest';
import { createGesture, down, move, up, tick } from '../src/shared/gesture.js';

// 기본값: longPressMs=400, moveThreshold=6
const g0 = () => createGesture();

describe('gesture', () => {
  it('짧게 눌렀다 떼면 click', () => {
    let g = down(g0(), 0, 100, 100);
    const { actions } = up(g, 100);
    expect(actions).toEqual([{ type: 'click' }]);
  });

  it('임계값 이하로 흔들린 뒤 떼도 click (손떨림 허용)', () => {
    let g = down(g0(), 0, 100, 100);
    let r = move(g, 50, 103, 102);
    expect(r.actions).toEqual([]);
    const { actions } = up(r.g, 100);
    expect(actions).toEqual([{ type: 'click' }]);
  });

  it('길게 누르기 전에 크게 움직이면 rotate 모드', () => {
    let g = down(g0(), 0, 100, 100);
    let r = move(g, 100, 120, 105);
    expect(r.actions).toEqual([{ type: 'rotate', dx: 20, dy: 5 }]);
    r = move(r.g, 120, 130, 110);
    expect(r.actions).toEqual([{ type: 'rotate', dx: 10, dy: 5 }]);
    const { actions } = up(r.g, 200);
    expect(actions).toEqual([{ type: 'rotate-end' }]);
  });

  it('가만히 400ms 누르고 있으면 tick이 move-start를 낸다', () => {
    let g = down(g0(), 0, 100, 100);
    let r = tick(g, 399);
    expect(r.actions).toEqual([]);
    r = tick(r.g, 400);
    expect(r.actions).toEqual([{ type: 'move-start' }]);
    // 이후 움직임은 move
    r = move(r.g, 450, 110, 90);
    expect(r.actions).toEqual([{ type: 'move', dx: 10, dy: -10 }]);
    const { actions } = up(r.g, 500);
    expect(actions).toEqual([{ type: 'move-end' }]);
  });

  it('이미 rotate 모드면 tick이 move-start를 내지 않는다', () => {
    let g = down(g0(), 0, 100, 100);
    let r = move(g, 100, 120, 100);
    r = tick(r.g, 500);
    expect(r.actions).toEqual([]);
  });

  it('move-start 후 click은 발생하지 않는다', () => {
    let g = down(g0(), 0, 100, 100);
    let r = tick(g, 400);
    const { actions } = up(r.g, 450);
    expect(actions).toEqual([{ type: 'move-end' }]);
  });

  it('누르지 않은 상태의 move/up/tick은 아무것도 하지 않는다', () => {
    expect(move(g0(), 10, 5, 5).actions).toEqual([]);
    expect(up(g0(), 10).actions).toEqual([]);
    expect(tick(g0(), 1000).actions).toEqual([]);
  });
});
