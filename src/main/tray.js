import { Tray, Menu, app } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createTray({ onToggle, onSettings, onStartTimer, onStopTimer }) {
  const tray = new Tray(path.join(__dirname, '../../assets/tray.png'));
  tray.setToolTip('뱁새 데스크펫');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: '뱁새 숨기기/보이기', click: onToggle },
      { label: '설정 열기', click: onSettings },
      { type: 'separator' },
      { label: '타이머 시작', click: onStartTimer },
      { label: '타이머 정지', click: onStopTimer },
      { type: 'separator' },
      { label: '종료', click: () => app.quit() },
    ])
  );
  return tray;
}
