const TRANSITIONS = {
  idle: { FOCUS_START: 'focus', REST_START: 'rest', DRAG_START: 'drag', CLICK: 'react' },
  focus: { TIMER_STOP: 'idle', REST_START: 'rest', DRAG_START: 'drag' },
  rest: { TIMER_STOP: 'idle', FOCUS_START: 'focus', DRAG_START: 'drag' },
  drag: { DRAG_END: '@prev' },
  react: { REACT_END: '@prev', DRAG_START: 'drag' },
};

export function createPet() {
  return { state: 'idle', prev: 'idle' };
}

export function send(pet, event) {
  const next = TRANSITIONS[pet.state]?.[event];
  if (!next) return pet;
  if (next === '@prev') return { state: pet.prev, prev: pet.prev };
  const isOverlay = next === 'drag' || next === 'react';
  return { state: next, prev: isOverlay ? pet.state : next };
}
