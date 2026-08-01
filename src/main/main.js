import { app, ipcMain, screen, Notification, Menu, protocol, net } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPetWindow, createSettingsWindow, PET_W, PET_H } from './windows.js';
import * as T from '../shared/timer.js';
import * as SM from '../shared/stateMachine.js';
import * as ST from '../shared/store.js';
import * as SC from '../shared/schedule.js';
import { shouldNag, pickMessage, pickFrom, linesForHour, GREET_MESSAGES } from '../shared/nagger.js';
import { createTray } from './tray.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.normalize(path.join(__dirname, '../..'));
const CHARACTERS_DIR = path.join(ROOT, 'characters');

// file://에서는 외부 ES 모듈이 CORS로 차단되므로 앱 전용 프로토콜로 파일을 서빙한다
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);
const CONFIG_FILE = () => path.join(app.getPath('userData'), 'config.json');
const todayStr = () => new Date().toISOString().slice(0, 10);

let petWin = null;
const state = {
  store: null,
  timer: null,
  pet: SM.createPet(),
  lastNagAt: Date.now(),
  idleFunUntil: 0,
};

// ---------- 캐릭터 ----------
function loadCharacter(name) {
  const dir = path.join(CHARACTERS_DIR, name);
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'character.json'), 'utf8'));
  return { config, baseUrl: `app://root/characters/${name}` };
}

// 현재 캐릭터의 이름·이모지·전용 대사 (말풍선 문구용)
function charInfo() {
  try {
    const { config } = loadCharacter(state.store.character);
    return {
      name: config.displayName ?? '펫',
      emoji: config.emoji ?? '✨',
      lines: config.lines ?? [],
    };
  } catch {
    return { name: '펫', emoji: '✨', lines: [] };
  }
}
ipcMain.handle('get-character', () => loadCharacter(state.store.character));

// 개발용: BAEPSAE_SNAP=1 로 실행하면 펫 창이 정면/옆/뒷모습 스냅샷을 프로젝트 루트에 저장
const SNAP_MODE = !!process.env.BAEPSAE_SNAP && !app.isPackaged;
ipcMain.on('debug-snap', (_e, { name, data }) => {
  if (!SNAP_MODE) return;
  const safe = String(name).replace(/[^\w-]/g, '');
  fs.writeFileSync(path.join(ROOT, `debug-${safe}.png`), Buffer.from(data.split(',')[1], 'base64'));
});

// ---------- 말풍선·알림 ----------
export function say(text, ms = 4000, thought = false) {
  petWin?.webContents.send('say', { text, ms, thought });
}
function notify(title, body) {
  new Notification({ title, body }).show();
}

// ---------- 로밍 (휴식 중 떠다니기) ----------
let roamTimer = null;
let homePos = null;
let roamRecalled = false; // 휴식 중 더블클릭으로 불러들인 상태 (이번 휴식엔 다시 안 날아다님)

function randomTarget() {
  const { workArea } = screen.getPrimaryDisplay();
  return {
    x: workArea.x + Math.floor(Math.random() * (workArea.width - PET_W)),
    y: workArea.y + Math.floor(Math.random() * (workArea.height - PET_H)),
  };
}

function startRoaming() {
  stopRoaming(false);
  homePos = petWin.getPosition();
  let target = randomTarget();
  roamTimer = setInterval(() => {
    const [x, y] = petWin.getPosition();
    const dx = target.x - x;
    const dy = target.y - y;
    const dist = Math.hypot(dx, dy);
    if (dist < 5) { target = randomTarget(); return; }
    petWin.setPosition(Math.round(x + (dx / dist) * 3), Math.round(y + (dy / dist) * 3));
  }, 16);
}

function stopRoaming(goHome = true) {
  clearInterval(roamTimer);
  roamTimer = null;
  if (goHome && homePos) petWin.setPosition(homePos[0], homePos[1]);
  homePos = null;
}

// ---------- 뷰모델 ----------
function animationFor(petState, now) {
  if (now < cheerUntil) return 'cheer';
  if (petState === 'idle') return now < state.idleFunUntil ? 'idleFun' : 'idle';
  return petState; // focus | rest | drag | react → 동명의 애니메이션
}

function statusFor(now) {
  const cur = SC.currentItem(state.store.schedule);
  const timerPart =
    state.timer.phase === 'focus' ? `집중 중 · ${T.formatMs(T.remainingMs(state.timer, now))}` :
    state.timer.phase === 'rest' ? `휴식 중 · ${T.formatMs(T.remainingMs(state.timer, now))}` :
    null;
  if (cur && timerPart) return `${cur.text} · ${timerPart}`;
  if (timerPart) return timerPart;
  if (cur) return `지금: ${cur.text}`;
  return null;
}

function pushView() {
  const now = Date.now();
  petWin?.webContents.send('view', {
    animation: animationFor(state.pet.state, now),
    status: statusFor(now),
  });
}

// ---------- 타이머 제어 ----------
function startTimer() {
  state.timer = T.start(state.timer, Date.now());
  state.pet = SM.send(state.pet, 'FOCUS_START');
  stopRoaming();
  say('집중 시작! 파이팅 🔥', 3000);
  pushView();
}

function stopTimer() {
  state.timer = T.stop(state.timer);
  state.pet = SM.send(state.pet, 'TIMER_STOP');
  stopRoaming();
  pushView();
}

ipcMain.on('start-timer', startTimer);
ipcMain.on('stop-timer', stopTimer);

// ---------- 스토어 ----------
ipcMain.handle('get-store', () => state.store);
ipcMain.handle('set-store', (_e, partial) => {
  applyStore(partial);
  return state.store;
});

function applyStore(partial) {
  state.store = { ...state.store, ...partial };
  ST.save(CONFIG_FILE(), state.store);
  state.timer = {
    ...state.timer,
    focusMs: state.store.focusMin * 60_000,
    restMs: state.store.restMin * 60_000,
    autoRepeat: state.store.autoRepeat,
  };
  if (partial.character) petWin?.webContents.send('character-changed', null);
  if ('autoStart' in partial) app.setLoginItemSettings({ openAtLogin: state.store.autoStart });
}

// ---------- 클릭/드래그 ----------
let settingsWin = null;

function openSettings() {
  if (settingsWin && !settingsWin.isDestroyed()) { settingsWin.focus(); return; }
  settingsWin = createSettingsWindow();
}

ipcMain.handle('list-characters', () =>
  fs.readdirSync(CHARACTERS_DIR).map((name) => {
    const cfg = JSON.parse(fs.readFileSync(path.join(CHARACTERS_DIR, name, 'character.json'), 'utf8'));
    return { name, displayName: cfg.displayName };
  })
);

ipcMain.on('pet-context', () => {
  Menu.buildFromTemplate([
    { label: '설정 열기', click: openSettings },
    { type: 'separator' },
    { label: '타이머 시작', click: startTimer },
    { label: '타이머 정지', click: stopTimer },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]).popup({ window: petWin });
});

ipcMain.on('drag-move', (_e, { dx, dy }) => {
  if (!petWin) return;
  const [x, y] = petWin.getPosition();
  petWin.setPosition(x + dx, y + dy);
});
ipcMain.on('drag-start', () => {
  stopRoaming(false);
  state.pet = SM.send(state.pet, 'DRAG_START');
  pushView();
});
ipcMain.on('drag-end', () => {
  state.pet = SM.send(state.pet, 'DRAG_END');
  if (state.pet.state === 'rest' && !roamRecalled) startRoaming();
  pushView();
});
ipcMain.on('pet-click', () => {
  if (state.pet.state !== 'idle') return;
  state.pet = SM.send(state.pet, 'CLICK');
  const info = charInfo();
  // 캐릭터 전용 대사(공통 + 현재 시간대)가 있으면 그걸, 없으면 공용 인사말
  const pool = linesForHour(info.lines, new Date().getHours());
  let line = pickFrom(pool.length ? pool : GREET_MESSAGES);
  // "t:" 로 시작하는 대사는 말풍선 대신 생각 풍선(혼잣말)
  const thought = line.startsWith('t:');
  if (thought) line = line.slice(2);
  say(line.replaceAll('{name}', info.name).replaceAll('{emoji}', info.emoji), 3500, thought);
  pushView();
  setTimeout(() => {
    state.pet = SM.send(state.pet, 'REACT_END');
    pushView();
  }, 1200);
});

let cheerUntil = 0;

ipcMain.on('pet-dblclick', () => {
  // 휴식 로밍 중이면 더블클릭 = 제자리 복귀
  if (roamTimer) {
    stopRoaming();
    roamRecalled = true;
    say('네~ 제자리로 갈게요!', 3000);
    pushView();
    return;
  }
  const cur = SC.currentItem(state.store.schedule);
  if (!cur) return;
  applyStore({ schedule: SC.completeCurrent(state.store.schedule) });
  cheerUntil = Date.now() + 2500;
  const next = SC.currentItem(state.store.schedule);
  say(next ? `"${cur.text}" 완료! 🎉 다음은 "${next.text}"!` : `"${cur.text}" 완료! 오늘 일과 끝 🎉`, 5000);
  pushView();
});

ipcMain.on('restore-prev-schedule', () => {
  applyStore(ST.restorePrevSchedule(state.store));
  say('어제 일과를 불러왔어요!', 3000);
  pushView();
});

// ---------- 1초 tick ----------
function tick() {
  const now = Date.now();
  const { timer, event } = T.tick(state.timer, now);
  state.timer = timer;

  if (event === 'rest-started') {
    state.pet = SM.send(state.pet, 'REST_START');
    notify('휴식 시간!', '잘했어요. 잠깐 쉬어가요 🎉');
    say('야호! 쉬는 시간이다~ 🎉', 5000);
    cheerUntil = now + 3000; // 폴짝폴짝 환호 후 춤으로
    roamRecalled = false; // 새 휴식이니 다시 신나게
    startRoaming();
  } else if (event === 'focus-started') {
    state.pet = SM.send(state.pet, 'FOCUS_START');
    notify('집중 시간!', '다시 집중해 볼까요? 🔥');
    say('다시 집중! 🔥', 4000);
    stopRoaming();
  } else if (event === 'cycle-ended') {
    state.pet = SM.send(state.pet, 'TIMER_STOP');
    notify('사이클 완료', '뽀모도로 한 사이클이 끝났어요!');
    say('야호! 다 끝났어요~ 또 할까요? 🎉', 5000);
    cheerUntil = now + 3000;
    stopRoaming();
  }

  // 유휴 랜덤 모션: idle일 때 낮은 확률로 3초간 idleFun 재생
  if (state.pet.state === 'idle' && now >= state.idleFunUntil && Math.random() < 0.02) {
    state.idleFunUntil = now + 3000;
  }

  // 정시 알림 (시간 지정 일과)
  const due = SC.dueAlerts(state.store.schedule, new Date());
  if (due.length) {
    for (const item of due) {
      notify('일정 알림', `${item.time} — ${item.text}`);
      say(`${item.time}이에요! "${item.text}" 시간~ ⏰`, 6000);
    }
    applyStore({ schedule: SC.markNotified(state.store.schedule, due.map((i) => i.id)) });
  }

  // 잔소리
  if (
    state.pet.state !== 'focus' &&
    shouldNag({
      enabled: state.store.nagEnabled,
      lastAt: state.lastNagAt,
      intervalMin: state.store.nagIntervalMin,
      now,
    })
  ) {
    state.lastNagAt = now;
    const info = charInfo();
    say(pickMessage().replaceAll('{name}', info.name).replaceAll('{emoji}', info.emoji), 5000);
  }

  pushView();
}

// ---------- 시작 ----------
app.whenReady().then(() => {
  protocol.handle('app', async (req) => {
    const { pathname } = new URL(req.url);
    const filePath = path.normalize(path.join(ROOT, decodeURIComponent(pathname)));
    if (!filePath.startsWith(ROOT)) return new Response('forbidden', { status: 403 });
    const res = await net.fetch(pathToFileURL(filePath).href);
    const headers = new Headers(res.headers);
    headers.set('cache-control', 'no-store'); // 예전 파일이 캐시로 남지 않게
    return new Response(res.body, { status: res.status, headers });
  });
  state.store = ST.rolloverIfNewDay(ST.load(CONFIG_FILE()), todayStr());
  ST.save(CONFIG_FILE(), state.store);
  state.timer = T.createTimer({
    focusMin: state.store.focusMin,
    restMin: state.store.restMin,
    autoRepeat: state.store.autoRepeat,
  });
  petWin = createPetWindow();
  if (SNAP_MODE) setTimeout(() => petWin.webContents.send('debug-snaps'), 3300);
  setInterval(tick, 1000);
  createTray({
    onToggle: () => (petWin.isVisible() ? petWin.hide() : petWin.show()),
    onSettings: openSettings,
    onStartTimer: startTimer,
    onStopTimer: stopTimer,
  });
});

app.on('window-all-closed', () => {
  // 펫 창이 살아 있는 동안은 종료하지 않는다 (트레이 상주 앱)
  if (!petWin || petWin.isDestroyed()) app.quit();
});
