// Code Sellers para Windows — só um app nativo em volta do site de verdade.
//
// Sem banco local: a janela carrega direto a tela de login do site (sem
// passar pela landing pública), então login, sessão e todos os dados
// continuam vindo do mesmo lugar de sempre — igual na web. O Electron
// guarda a sessão na pasta do usuário, então quem já entrou uma vez
// continua conectado ao abrir o app de novo.
//
// Login acontece no navegador, não dentro do app: a tela de login detecta
// que está rodando aqui dentro (via preload.js) e abre o navegador padrão
// em vez de mostrar o formulário. Depois que a pessoa entra, o site manda
// o app de volta pra frente através do protocolo próprio codesellers://
// (registrado pelo instalador) com um código de uso único, que o app troca
// por uma sessão só dele.
//
// Recursos de app de verdade (a página pede via preload.js; só funciona se a
// chamada vier do próprio site): aviso do Windows quando uma tarefa vence,
// número de tarefas atrasadas no ícone da barra de tarefas e a opção de
// abrir junto com o Windows (nesse caso o app já começa minimizado).

const { app, BrowserWindow, Notification, nativeImage, shell, session, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('node:path')

const APP_URL = process.env.CODE_SELLERS_URL || 'https://codesellers.vercel.app/login'
const APP_ORIGIN = new URL(APP_URL).origin
const CUSTOM_SCHEME = 'codesellers'
const APP_ID = 'com.codesellers.desktop'
// Argumento usado quando o próprio Windows abre o app ao ligar o computador.
const HIDDEN_START_ARG = '--iniciar-minimizado'

// Domínios que fazem parte do fluxo de login (Google OAuth): a janela pode
// navegar até eles sem sair do app.
const ALLOWED_NAVIGATION_HOSTS = [new URL(APP_URL).host, 'accounts.google.com', 'accounts.youtube.com', 'myaccount.google.com']

function isAllowedNavigation(url) {
  try {
    const { host, protocol } = new URL(url)
    if (protocol !== 'https:') return false
    return ALLOWED_NAVIGATION_HOSTS.some((allowed) => host === allowed || host.endsWith('.supabase.co'))
  } catch {
    return false
  }
}

// Cria a janela sempre maximizada (ocupando a tela toda) e só a mostra
// quando o conteúdo já estiver pronto, pra não piscar em branco. Aberto pelo
// Windows ao ligar o computador, começa minimizado na barra de tarefas e
// maximiza quando a pessoa clicar nele.
function createWindow({ startHidden = false } = {}) {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b0812',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.once('ready-to-show', () => {
    if (startHidden) {
      win.once('restore', () => win.maximize())
      win.minimize()
      return
    }
    win.maximize()
    win.show()
  })

  // Piscou na barra de tarefas por causa de um aviso: para ao abrir a janela.
  win.on('focus', () => win.flashFrame(false))

  // Links abertos com target="_blank": impressão/recibo (about:blank, a própria
  // tela escreve o conteúdo) ficam no app; qualquer outro domínio (WhatsApp,
  // etc.) abre no navegador padrão do Windows.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank') return { action: 'allow' }
    try {
      const { origin } = new URL(url)
      if (origin === APP_ORIGIN) return { action: 'allow' }
    } catch {
      // URL inválida: cai no comportamento padrão abaixo.
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Navegação da própria janela (troca de página, não link novo): só permite
  // seguir dentro do app ou para o login do Google. O resto abre no
  // navegador padrão em vez de "sequestrar" a janela do app.
  win.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin === APP_ORIGIN) return
    if (isAllowedNavigation(url)) return
    event.preventDefault()
    shell.openExternal(url)
  })

  return win
}

// Atualização automática da "casca" do app (telas e funções já vêm do site,
// então só isto aqui precisa de versão nova). Confere ao abrir e a cada 6h
// em /downloads/latest.yml, baixa em segundo plano e instala ao fechar.
// A versão portátil não se atualiza (não tem instalador pra substituir).
const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

function setupAutoUpdate() {
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) return
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('error', (error) => console.error('auto-update', error?.message ?? error))
  const check = () => autoUpdater.checkForUpdates().catch(() => undefined)
  check()
  setInterval(check, UPDATE_CHECK_INTERVAL_MS)
}

// Só aceita pedidos (avisos, contador, iniciar com o Windows) vindos de uma
// página do próprio site — nunca de outra página que a janela esteja exibindo.
function fromApp(event) {
  try {
    return new URL(event.senderFrame?.url ?? '').origin === APP_ORIGIN
  } catch {
    return false
  }
}

function focusWindow(win) {
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

// Guarda os avisos abertos: sem essa referência o Electron pode descartar o
// objeto antes do clique, e aí clicar no aviso não abriria o app.
const activeNotifications = new Set()

function showNotification({ title, body, target }) {
  if (!Notification.isSupported()) return
  const notification = new Notification({ title, body })
  activeNotifications.add(notification)
  const release = () => activeNotifications.delete(notification)
  notification.on('click', () => {
    release()
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    focusWindow(win)
    if (target) win.webContents.send('navigate', target)
  })
  notification.on('close', release)
  notification.on('failed', release)
  notification.show()

  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isFocused()) win.flashFrame(true)
}

function badgeDescription(count) {
  return `${count} ${count === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`
}

// "Abrir quando o Windows iniciar". Na versão portátil, o executável de
// verdade é o .exe original (o que roda é uma cópia temporária).
function loginItemOptions() {
  return { path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath, args: [HIDDEN_START_ARG] }
}

function canOpenAtLogin() {
  return app.isPackaged && (process.platform === 'win32' || process.platform === 'darwin')
}

function registerDesktopFeatures() {
  ipcMain.on('notify', (event, payload) => {
    if (!fromApp(event) || !payload || typeof payload.title !== 'string') return
    const target = typeof payload.path === 'string' && payload.path.startsWith('/') ? payload.path.slice(0, 300) : null
    showNotification({
      title: payload.title.slice(0, 120),
      body: typeof payload.body === 'string' ? payload.body.slice(0, 240) : '',
      target,
    })
  })

  ipcMain.on('set-badge', (event, payload) => {
    if (!fromApp(event)) return
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const count = Math.max(0, Math.floor(Number(payload?.count) || 0))
    if (process.platform === 'win32') {
      const dataUrl = typeof payload?.imageDataUrl === 'string' ? payload.imageDataUrl : ''
      if (count > 0 && dataUrl.startsWith('data:image/png;base64,')) {
        win.setOverlayIcon(nativeImage.createFromDataURL(dataUrl), badgeDescription(count))
      } else {
        win.setOverlayIcon(null, '')
      }
    } else {
      app.setBadgeCount(count)
    }
  })

  ipcMain.handle('get-open-at-login', (event) => {
    if (!fromApp(event) || !canOpenAtLogin()) return false
    return app.getLoginItemSettings(loginItemOptions()).openAtLogin
  })

  ipcMain.handle('set-open-at-login', (event, enabled) => {
    if (!fromApp(event) || !canOpenAtLogin()) return false
    app.setLoginItemSettings({ openAtLogin: Boolean(enabled), ...loginItemOptions() })
    return app.getLoginItemSettings(loginItemOptions()).openAtLogin
  })
}

function extractCallbackUrl(argv) {
  return argv.find((arg) => arg.startsWith(`${CUSTOM_SCHEME}://`))
}

// Recebe codesellers://auth-callback?token_hash=... (código de uso único
// mandado pelo site depois do login no navegador) e troca por uma sessão
// própria do app — separada da do navegador, então sair num não derruba o
// outro. A janela passa a carregar o painel já conectado.
async function applySessionToWindow(win, rawUrl) {
  let tokenHash = null
  try {
    tokenHash = new URL(rawUrl).searchParams.get('token_hash')
  } catch {
    return
  }
  if (!tokenHash) return

  await win.loadURL(APP_URL)
  // window.__codeSellersVerifyHandoff vem do bundle da própria página — espera
  // alguns instantes caso a janela ainda esteja terminando de carregar.
  await win.webContents.executeJavaScript(`
    (function tryApply(attempts) {
      if (window.__codeSellersVerifyHandoff) {
        window.__codeSellersVerifyHandoff(${JSON.stringify(tokenHash)})
      } else if (attempts > 0) {
        setTimeout(function () { tryApply(attempts - 1) }, 200)
      }
    })(25)
  `)
  win.maximize()
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
}

// Só uma instância do app: quando o navegador reabre o app pelo protocolo
// (codesellers://), o Windows lança uma segunda instância — essa trava
// redireciona a URL pra instância já aberta em vez de abrir uma janela nova.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return
    const callbackUrl = extractCallbackUrl(argv)
    if (callbackUrl) {
      void applySessionToWindow(win, callbackUrl)
    } else {
      focusWindow(win)
    }
  })

  // macOS entrega o protocolo por esse evento (irrelevante pro build de
  // Windows, mas inofensivo manter — o app é o mesmo código em qualquer SO).
  app.on('open-url', (event, url) => {
    event.preventDefault()
    const win = BrowserWindow.getAllWindows()[0] ?? createWindow()
    void applySessionToWindow(win, url)
  })

  // Sem isso os avisos do Windows não aparecem (o Windows liga o aviso ao
  // atalho do app criado pelo instalador, que usa este mesmo ID).
  if (process.platform === 'win32') app.setAppUserModelId(APP_ID)

  app.whenReady().then(() => {
    app.setAsDefaultProtocolClient(CUSTOM_SCHEME)
    registerDesktopFeatures()

    // A tela de login roda sandboxed (sem Node): pede pro processo principal
    // abrir o link no navegador padrão em vez de chamar shell.* direto.
    ipcMain.on('open-external', (event, url) => {
      if (!fromApp(event)) return
      try {
        if (['http:', 'https:'].includes(new URL(url).protocol)) shell.openExternal(url)
      } catch {
        // URL inválida: ignora.
      }
    })

    // Permite notificação nativa (avisos do CRM), nega o resto por padrão.
    session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
      callback(permission === 'notifications')
    })

    const win = createWindow({ startHidden: process.argv.includes(HIDDEN_START_ARG) })
    setupAutoUpdate()

    // App aberto do zero clicando num link codesellers:// (não uma segunda
    // instância): a URL vem nos argumentos de linha de comando. Nesse caso
    // NUNCA carrega a tela de login primeiro — senão ela abriria o
    // navegador de novo antes da sessão ser aplicada.
    const initialCallbackUrl = extractCallbackUrl(process.argv)
    if (initialCallbackUrl) {
      void applySessionToWindow(win, initialCallbackUrl)
    } else {
      win.loadURL(APP_URL)
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow().loadURL(APP_URL)
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
