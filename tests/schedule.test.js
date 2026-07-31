import { describe, it, expect } from 'vitest';
import { makeItem, currentItem, completeCurrent, dueAlerts, markNotified } from '../src/shared/schedule.js';

const at = (h, m) => new Date(2026, 6, 31, h, m);

describe('schedule', () => {
  it('makeItem은 미완료·미통지 항목을 만든다', () => {
    const item = makeItem('제안서 쓰기', '14:00', 'id-1');
    expect(item).toEqual({ id: 'id-1', text: '제안서 쓰기', time: '14:00', done: false, notified: false });
    expect(makeItem('메일 정리').time).toBeNull();
  });

  it('currentItem은 순서상 첫 미완료 항목을 돌려준다', () => {
    const items = [
      { ...makeItem('a', null, '1'), done: true },
      makeItem('b', null, '2'),
      makeItem('c', null, '3'),
    ];
    expect(currentItem(items).id).toBe('2');
    expect(currentItem([])).toBeNull();
  });

  it('completeCurrent는 첫 미완료 항목만 done 처리한다', () => {
    const items = [makeItem('a', null, '1'), makeItem('b', null, '2')];
    const next = completeCurrent(items);
    expect(next[0].done).toBe(true);
    expect(next[1].done).toBe(false);
    expect(items[0].done).toBe(false); // 원본 불변
  });

  it('dueAlerts는 시각이 지난 시간 지정 항목만 골라낸다', () => {
    const items = [
      makeItem('회의', '14:00', '1'),
      makeItem('보고', '16:00', '2'),
      makeItem('순서 항목', null, '3'),
      { ...makeItem('이미 알림', '13:00', '4'), notified: true },
      { ...makeItem('이미 완료', '13:30', '5'), done: true },
    ];
    const due = dueAlerts(items, at(14, 30));
    expect(due.map((i) => i.id)).toEqual(['1']);
  });

  it('markNotified는 지정한 id들만 notified 처리한다', () => {
    const items = [makeItem('a', '09:00', '1'), makeItem('b', '10:00', '2')];
    const next = markNotified(items, ['1']);
    expect(next[0].notified).toBe(true);
    expect(next[1].notified).toBe(false);
  });
});
