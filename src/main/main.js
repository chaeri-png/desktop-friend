import { app } from 'electron';
import { createPetWindow } from './windows.js';

let petWin = null;

app.whenReady().then(() => {
  petWin = createPetWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
