export function makeItem(text, time = null, id = crypto.randomUUID()) {
  return { id, text, time, done: false, notified: false };
}

export function currentItem(items) {
  return items.find((i) => !i.done) ?? null;
}

export function completeCurrent(items) {
  const cur = currentItem(items);
  if (!cur) return items;
  return items.map((i) => (i.id === cur.id ? { ...i, done: true } : i));
}

function isPast(time, now) {
  const [h, m] = time.split(':').map(Number);
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  return now >= target;
}

export function dueAlerts(items, now) {
  return items.filter((i) => i.time && !i.done && !i.notified && isPast(i.time, now));
}

export function markNotified(items, ids) {
  return items.map((i) => (ids.includes(i.id) ? { ...i, notified: true } : i));
}
