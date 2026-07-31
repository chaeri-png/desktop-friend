import { describe, it, expect } from 'vitest';
import { createPet, send } from '../src/shared/stateMachine.js';

describe('stateMachine', () => {
  it('idle로 시작한다', () => {
    expect(createPet().state).toBe('idle');
  });

  it('타이머 이벤트로 focus/rest/idle을 오간다', () => {
    let p = send(createPet(), 'FOCUS_START');
    expect(p.state).toBe('focus');
    p = send(p, 'REST_START');
    expect(p.state).toBe('rest');
    p = send(p, 'TIMER_STOP');
    expect(p.state).toBe('idle');
  });

  it('드래그가 끝나면 이전 상태로 복귀한다', () => {
    let p = send(createPet(), 'FOCUS_START');
    p = send(p, 'DRAG_START');
    expect(p.state).toBe('drag');
    p = send(p, 'DRAG_END');
    expect(p.state).toBe('focus');
  });

  it('idle에서 클릭하면 react 후 idle로 돌아온다', () => {
    let p = send(createPet(), 'CLICK');
    expect(p.state).toBe('react');
    p = send(p, 'REACT_END');
    expect(p.state).toBe('idle');
  });

  it('focus 중 클릭은 무시된다', () => {
    const p = send(send(createPet(), 'FOCUS_START'), 'CLICK');
    expect(p.state).toBe('focus');
  });

  it('정의 안 된 이벤트는 상태를 바꾸지 않는다', () => {
    const p = send(createPet(), 'NOPE');
    expect(p.state).toBe('idle');
  });
});
