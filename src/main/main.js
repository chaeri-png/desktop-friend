import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createPetWindow } from './windows.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHARACTERS_DIR = path.join(__dirname, '../../characters');

let petWin = null;
let characterName = 'baepsae';

function loadCharacter(name) {
  const dir = path.join(CHARACTERS_DIR, name);
  const config = JSON.parse(fs.readFileSync(path.join(dir, 'character.json'), 'utf8'));
  return { config, baseUrl: pathToFileURL(dir).href };
}

ipcMain.handle('get-character', () => loadCharacter(characterName));

export function say(text, ms = 4000) {
  petWin?.webContents.send('say', { text, ms });
}

ipcMain.on('drag-move', (_e, { dx, dy }) => {
  if (!petWin) return;
  const [x, y] = petWin.getPosition();
  petWin.setPosition(x + dx, y + dy);
});

ipcMain.on('pet-click', () => {
  say('안녕! 🐦', 2000);
});

app.whenReady().then(() => {
  petWin = createPetWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
