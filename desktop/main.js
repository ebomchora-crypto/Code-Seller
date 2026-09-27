// Code Sellers para Windows — só um app nativo em volta do site de verdade.
//
// Não existe banco local (sem SQLite): a janela carrega direto a tela de
// login de https://codesellers.vercel.app (sem passar pela landing page),
// então login, sessão e todos os dados continuam vindo do Supabase,
// exatamente como na web. O Electron guarda a sessão (localStorage) na
// pasta do usuário, então quem já entrou uma vez continua conectado ao
// abrir o app de novo — a própria tela de login redireciona pro painel.
//
// Login acontece no navegador, não dentro do app: a tela de login detecta
// que está rodando aqui dentro (via preload.js) e abre o navegador padrão
// em vez de mostrar o formulário. Depois que a pessoa entra, o site manda
// o app de volta pra frente já conectado através do protocolo próprio
// codesellers:// (registrado pelo instalador), carregando os tokens da
// sessão pra dentro da janela.

const { app, BrowserWindow, shell, session, ipcMain } = require('electron')
const path = require('node:path')

const APP_URL = process.env.CODE_SELLERS_URL || 'https://codesellers.vercel.app/login'
const APP_ORIGIN = new URL(APP_URL).origin
const CUSTOM_SCHEME = 'codesellers'

// Domínios que fazem parte do fluxo de login (Google OAuth) e do próprio
// Supabase: a janela pode navegar até eles sem sair do app.
const ALLOWED_NAVIGATION_HOSTS = [
  new URL(APP_URL).host,
  'accounts.google.com',
  'accounts.youtube.com',
  'myaccount.google.com',
]

function isAllowedNavigation(url) {
  try {
    const { host, protocol } = new URL(url)
    if (protocol !== 'https:') return false
    return ALLOWED_NAVIGATION_HOSTS.some((allowed) => host === allowed || host.endsWith('.supabase.co'))
  } catch {
    return false
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 640,
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

  win.loadURL(APP_URL)

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
  // seguir dentro do app ou para o login do Google/Supabase. O resto abre no
  // navegador padrão em vez de "sequestrar" a janela do app.
  win.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin === APP_ORIGIN) return
    if (isAllowedNavigation(url)) return
    event.preventDefault()
    shell.openExternal(url)
  })

  return win
}

function extractCallbackUrl(argv) {
  return argv.find((arg) => arg.startsWith(`${CUSTOM_SCHEME}://`))
}

// Recebe codesellers://auth-callback?access_token=...&refresh_token=...
// (mandado pelo site depois do login no navegador) e aplica a sessão dentro
// da janela do app, que passa a carregar o painel já conectado.
async function handleAuthCallback(rawUrl) {
  let accessToken = null
  let refreshToken = null
  try {
    const parsed = new URL(rawUrl)
    accessToken = parsed.searchParams.get('access_token')
    refreshToken = parsed.searchParams.get('refresh_token')
  } catch {
    return
  }
  if (!accessToken || !refreshToken) return

  const win = BrowserWindow.getAllWindows()[0] ?? createWindow()
  await win.loadURL(`${APP_ORIGIN}/`)
  // window.__codeSellersSetSession vem do bundle da própria página — espera
  // alguns instantes caso a janela ainda esteja terminando de carregar.
  await win.webContents.executeJavaScript(`
    (function tryApply(attempts) {
      if (window.__codeSellersSetSession) {
        window.__codeSellersSetSession(${JSON.stringify({ access_token: accessToken, refresh_token: refreshToken })})
      } else if (attempts > 0) {
        setTimeout(function () { tryApply(attempts - 1) }, 200)
      }
    })(25)
  `)
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
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
    const callbackUrl = extractCallbackUrl(argv)
    if (callbackUrl) void handleAuthCallback(callbackUrl)
  })

  // macOS entrega o protocolo por esse evento (irrelevante pro build de
  // Windows, mas inofensivo manter — o app é o mesmo código em qualquer SO).
  app.on('open-url', (event, url) => {
    event.preventDefault()
    void handleAuthCallback(url)
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

    createWindow()

    // App aberto do zero clicando num link codesellers:// (não uma segunda
    // instância): a URL vem nos argumentos de linha de comando.
    const initialCallbackUrl = extractCallbackUrl(process.argv)
    if (initialCallbackUrl) void handleAuthCallback(initialCallbackUrl)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
