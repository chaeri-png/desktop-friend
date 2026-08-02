import fs from 'node:fs';
import path from 'node:path';

export const DEFAULTS = {
  focusMin: 25,
  restMin: 5,
  autoRepeat: true,
  nagEnabled: true,
  nagIntervalMin: 45,
  character: 'baepsae',
  accessories: {},
  autoStart: false,
  scheduleDate: null,
  schedule: [],
  prevSchedule: [],
};

export function load(filePath) {
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { ...structuredClone(DEFAULTS), ...raw };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function save(filePath, store) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

export function rolloverIfNewDay(store, todayStr) {
  if (store.scheduleDate === todayStr) return store;
  return {
    ...store,
    prevSchedule: store.schedule.length ? store.schedule : store.prevSchedule,
    schedule: [],
    scheduleDate: todayStr,
  };
}

export function restorePrevSchedule(store, makeId = () => crypto.randomUUID()) {
  return {
    ...store,
    schedule: store.prevSchedule.map((i) => ({ ...i, id: makeId(), done: false, notified: false })),
  };
}
