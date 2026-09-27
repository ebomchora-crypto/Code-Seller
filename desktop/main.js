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

const { app, BrowserWindow, shell, session, ipcMain } = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('node:path')

const APP_URL = process.env.CODE_SELLERS_URL || 'https://codesellers.vercel.app/login'
const APP_ORIGIN = new URL(APP_URL).origin
const CUSTOM_SCHEME = 'codesellers'

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
// quando o conteúdo já estiver pronto, pra não piscar em branco.
function createWindow() {
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
    win.maximize()
    win.show()
  })

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
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  // macOS entrega o protocolo por esse evento (irrelevante pro build de
  // Windows, mas inofensivo manter — o app é o mesmo código em qualquer SO).
  app.on('open-url', (event, url) => {
    event.preventDefault()
    const win = BrowserWindow.getAllWindows()[0] ?? createWindow()
    void applySessionToWindow(win, url)
  })

  app.whenReady().then(() => {
    app.setAsDefaultProtocolClient(CUSTOM_SCHEME)

    // A tela de login roda sandboxed (sem Node): pede pro processo principal
    // abrir o link no navegador padrão em vez de chamar shell.* direto.
    ipcMain.on('open-external', (_event, url) => {
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

    const win = createWindow()
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
