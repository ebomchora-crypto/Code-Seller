// Code Sellers para Windows — só um app nativo em volta do site de verdade.
//
// Não existe banco local (sem SQLite): a janela carrega direto
// https://codesellers.vercel.app, então login, sessão e todos os dados
// continuam vindo do Supabase, exatamente como na web. O Electron guarda
// a sessão (localStorage) na pasta do usuário, então quem já entrou uma
// vez continua conectado ao abrir o app de novo — igual um navegador.

const { app, BrowserWindow, shell, session } = require('electron')
const path = require('node:path')

const APP_URL = process.env.CODE_SELLERS_URL || 'https://codesellers.vercel.app'
const APP_ORIGIN = new URL(APP_URL).origin

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

app.whenReady().then(() => {
  // Permite notificação nativa (avisos do CRM), nega o resto por padrão.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'notifications')
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
