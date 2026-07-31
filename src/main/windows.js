import { BrowserWindow, screen } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PET_W = 170;
export const PET_H = 210;

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
  win.loadFile(path.join(__dirname, '../renderer/pet/pet.html'));
  return win;
}

export function createSettingsWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 680,
    title: '뱁새 데스크펫 설정',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs') },
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, '../renderer/settings/settings.html'));
  return win;
}
