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

app.whenReady().then(() => {
  petWin = createPetWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
