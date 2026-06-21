const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// ---- Лок интерфейса на 60 FPS ----
// У Electron/Chromium нет официального "setFrameRate" API, но компоновщик и так
// синхронизируется с вертикальной разверткой монитора (vsync), что на большинстве
// мониторов уже = 60 кадров/с. На мониторах с разверткой 90/120/144 Гц Chromium
// рендерил бы быстрее, поэтому явно ограничиваем кадры через ключ командной строки —
// это снижает нагрузку на GPU/CPU. Если конкретная сборка Chromium этот ключ
// проигнорирует, vsync всё равно не даёт частоте улететь намного выше реальной
// разверстки экрана — жёсткой гарантии "ровно 60" тут быть не может, это особенность
// платформы, а не баг приложения.
app.commandLine.appendSwitch('limit-fps', '60');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: '#0b0708',
    autoHideMenuBar: true,
    title: 'BLOODBERSS',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: true
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Ссылки вида target="_blank" (например, на Telegram) открываем в обычном
  // браузере системы, а не внутри окна приложения.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // На случай обычной навигации (без target=_blank) — тоже уводим во внешний браузер,
  // а само окно приложения никуда не отпускаем.
  win.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) return; // это сама страница приложения — ок
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
