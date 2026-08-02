import { BrowserWindow, screen, app } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PET_W = 180;
export const PET_H = 240;

export function createPetWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    width: PET_W,
    height: PET_H,
    x: workArea.x + workArea.width - PET_W - 24,
    y: workArea.y + workArea.height - PET_H - 24,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') },
  });
  win.loadURL('app://root/src/renderer/pet/pet.html');
  // 개발 중에만: 펫 창 콘솔 메시지를 터미널로 전달 (렌더러 오류 확인용)
  if (!app.isPackaged) {
    win.webContents.on('console-message', (_e, _level, message) => {
      console.log('[pet]', message);
    });
  }
  return win;
}

export function createSettingsWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 680,
    title: 'Desktop friend 설정',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') },
  });
  win.setMenuBarVisibility(false);
  win.loadURL('app://root/src/renderer/settings/settings.html');
  return win;
}
