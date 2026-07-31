import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULTS, load, save, rolloverIfNewDay, restorePrevSchedule } from '../src/shared/store.js';

const tmpFile = () => path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pet-')), 'config.json');

describe('store', () => {
  it('파일이 없으면 기본값을 돌려준다', () => {
    const s = load(tmpFile());
    expect(s).toEqual(DEFAULTS);
    expect(s).not.toBe(DEFAULTS); // 복사본
  });

  it('저장 후 다시 읽으면 값이 유지되고, 없는 키는 기본값으로 채워진다', () => {
    const file = tmpFile();
    save(file, { ...DEFAULTS, focusMin: 50 });
    const s = load(file);
    expect(s.focusMin).toBe(50);
    expect(s.restMin).toBe(5);
  });

  it('깨진 JSON이면 기본값을 돌려준다', () => {
    const file = tmpFile();
    fs.writeFileSync(file, '{{{not json');
    expect(load(file)).toEqual(DEFAULTS);
  });

  it('날짜가 바뀌면 일과를 prevSchedule로 옮기고 비운다', () => {
    const s = {
      ...DEFAULTS,
      scheduleDate: '2026-07-30',
      schedule: [{ id: '1', text: 'a', time: null, done: true, notified: false }],
    };
    const next = rolloverIfNewDay(s, '2026-07-31');
    expect(next.schedule).toEqual([]);
    expect(next.prevSchedule.length).toBe(1);
    expect(next.scheduleDate).toBe('2026-07-31');
  });

  it('같은 날짜면 아무것도 바꾸지 않는다', () => {
    const s = { ...DEFAULTS, scheduleDate: '2026-07-31', schedule: [{ id: '1' }] };
    expect(rolloverIfNewDay(s, '2026-07-31')).toBe(s);
  });

  it('어제 일과 복원 시 미완료·미통지 상태로 새 id를 받는다', () => {
    const s = {
      ...DEFAULTS,
      prevSchedule: [{ id: 'old', text: 'a', time: '09:00', done: true, notified: true }],
    };
    let n = 0;
    const next = restorePrevSchedule(s, () => `new-${n++}`);
    expect(next.schedule).toEqual([{ id: 'new-0', text: 'a', time: '09:00', done: false, notified: false }]);
  });
});
