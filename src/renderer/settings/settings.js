const $ = (id) => document.getElementById(id);
let store = null;

const FIELDS = ['focusMin', 'restMin', 'autoRepeat', 'nagEnabled', 'nagIntervalMin', 'autoStart'];

function readField(id) {
  const el = $(id);
  return el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value;
}

function writeField(id, value) {
  const el = $(id);
  if (el.type === 'checkbox') el.checked = value;
  else el.value = value;
}

async function set(partial) {
  store = await window.api.invoke('set-store', partial);
  render();
}

function render() {
  FIELDS.forEach((f) => writeField(f, store[f]));
  $('character').value = store.character;

  const ul = $('scheduleList');
  ul.innerHTML = '';
  for (const item of store.schedule) {
    const li = document.createElement('li');
    if (item.done) li.className = 'done';
    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = item.time ?? '—';
    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = item.text;
    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '삭제';
    del.onclick = () => set({ schedule: store.schedule.filter((i) => i.id !== item.id) });
    li.append(time, text, del);
    ul.append(li);
  }
}

FIELDS.forEach((f) => {
  $(f).addEventListener('change', () => set({ [f]: readField(f) }));
});

$('character').addEventListener('change', () => set({ character: $('character').value }));

$('addItem').onclick = () => {
  const text = $('newText').value.trim();
  if (!text) return;
  const time = $('newTime').value || null;
  const item = { id: crypto.randomUUID(), text, time, done: false, notified: false };
  set({ schedule: [...store.schedule, item] });
  $('newText').value = '';
  $('newTime').value = '';
};

$('restorePrev').onclick = async () => {
  window.api.send('restore-prev-schedule');
  store = await window.api.invoke('get-store');
  render();
};

$('startTimer').onclick = () => window.api.send('start-timer');
$('stopTimer').onclick = () => window.api.send('stop-timer');

(async () => {
  const chars = await window.api.invoke('list-characters');
  for (const c of chars) {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.displayName;
    $('character').append(opt);
  }
  store = await window.api.invoke('get-store');
  render();
})();
