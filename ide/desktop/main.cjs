const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const { fork } = require('node:child_process');
const { join } = require('node:path');
const { mkdirSync, appendFileSync } = require('node:fs');
let backend, window, home, quitting = false;
app.setName('Code Sellers IDE');
const profile = join(app.getPath('appData'), 'Code Sellers IDE');
mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
  app.whenReady().then(async () => {
    const base = app.getAppPath();
    const data = app.isPackaged ? join(app.getPath('userData'), 'data') : join(base, '.code-makers');
    mkdirSync(data, { recursive: true });
    // Instalado: o próprio executável roda o servidor como Node (ELECTRON_RUN_AS_NODE), sem levar um Node à parte.
    const node = app.isPackaged ? process.execPath : process.env.CODE_MAKERS_NODE;
    if (!node) throw new Error('Use npm run desktop para iniciar o aplicativo.');
    backend = fork(join(base, 'server', 'desktop-server.mjs'), [], { execPath: node, cwd: base, env: { ...process.env, ELECTRON_RUN_AS_NODE: app.isPackaged ? '1' : undefined, CODE_MAKERS_DATA: data }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true });
    // Janela de escolher pasta: pedida pelo servidor local, aberta aqui com a janela nativa do Windows.
    backend.on('message', async message => {
      if (message?.type !== 'pick-folder') return;
      let path = '';
      try { const result = await dialog.showOpenDialog(window ?? undefined, { title: String(message.title || 'Escolher pasta'), properties: ['openDirectory', 'createDirectory'], buttonLabel: 'Selecionar pasta' }); path = result.canceled ? '' : result.filePaths[0] || ''; } catch { path = ''; }
      if (backend && backend.connected) backend.send({ type: 'picked', id: message.id, path });
    });
    backend.stderr.on('data', chunk => appendFileSync(join(data, 'desktop.log'), chunk));
    home = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('O servidor local não iniciou.')), 30000);
      backend.once('error', reject);
      backend.once('exit', code => { clearTimeout(timeout); reject(new Error(`Servidor encerrado (${code}).`)); });
      backend.on('message', message => { if (message?.type === 'ready') { clearTimeout(timeout); resolve(message.url); } });
    });
    window = new BrowserWindow({ width: 1440, height: 940, minWidth: 900, minHeight: 600, backgroundColor: '#1e1e1e', autoHideMenuBar: true, title: 'Code Sellers IDE', show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true } });
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.webContents.on('will-prevent-unload', event => {
      const choice = dialog.showMessageBoxSync(window, { type: 'question', title: 'Alterações não salvas', message: 'Ainda há alterações aguardando salvamento.', detail: 'Continue editando e aguarde o salvamento, ou saia descartando as alterações pendentes.', buttons: ['Continuar editando', 'Sair sem salvar'], defaultId: 0, cancelId: 0 });
      if (choice === 1) event.preventDefault();
    });
    const external = url => { try { if (['http:', 'https:'].includes(new URL(url).protocol)) shell.openExternal(url); } catch {} };
    window.webContents.setWindowOpenHandler(({ url }) => { external(url); return { action: 'deny' }; });
    window.webContents.on('will-navigate', (event, url) => { if (new URL(url).origin !== home) { event.preventDefault(); external(url); } });
    window.once('ready-to-show', () => window.show());
    window.on('closed', () => { window = null; });
    backend.on('exit', () => { if (!quitting) { dialog.showErrorBox('Servidor local encerrado', 'Feche e abra o Code Sellers IDE novamente.'); app.quit(); } });
    Menu.setApplicationMenu(Menu.buildFromTemplate([
      { label: 'Arquivo', submenu: [{ label: 'Projetos / Abrir pasta', accelerator: 'CmdOrCtrl+Shift+O', click: () => window.loadURL(home) }, { type: 'separator' }, { role: 'quit', label: 'Sair' }] },
      { label: 'Editar', submenu: [{ role: 'undo', label: 'Desfazer' }, { role: 'redo', label: 'Refazer' }, { type: 'separator' }, { role: 'cut', label: 'Recortar' }, { role: 'copy', label: 'Copiar' }, { role: 'paste', label: 'Colar' }, { role: 'selectAll', label: 'Selecionar tudo' }] },
      { label: 'Exibir', submenu: [{ role: 'reload', label: 'Recarregar' }, { role: 'toggleDevTools', label: 'Ferramentas de desenvolvimento' }, { role: 'resetZoom', label: 'Zoom padrão' }, { role: 'zoomIn', label: 'Ampliar' }, { role: 'zoomOut', label: 'Reduzir' }, { role: 'togglefullscreen', label: 'Tela cheia' }] },
    ]));
    await window.loadURL(home);
  }).catch(error => { dialog.showErrorBox('Não foi possível abrir o Code Sellers IDE', error.message); app.quit(); });
  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', event => {
    if (quitting || !backend || backend.exitCode !== null) return;
    event.preventDefault(); quitting = true;
    backend.once('exit', () => app.quit());
    if (backend.connected) backend.send({ type: 'shutdown' }); else backend.kill();
    setTimeout(() => { backend.kill(); app.quit(); }, 5000).unref();
  });
}
