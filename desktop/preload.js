// Ponte mínima e segura entre a página (sandboxed, sem Node) e o Electron.
// O site é carregado ao vivo, então ele confere se cada função existe antes
// de usar — versões antigas do app expõem menos coisas.

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('codeSellersDesktop', {
  // Login/cadastro no navegador padrão (ver src/router/PublicRoute.tsx).
  openInBrowser: (url) => ipcRenderer.send('open-external', url),

  // Aviso do próprio Windows. `path` é a tela do app aberta ao clicar.
  notify: (notification) => ipcRenderer.send('notify', notification),

  // Número no ícone da barra de tarefas (0 apaga). `imageDataUrl` é o
  // desenho do número, feito pela página.
  setTaskbarBadge: (count, imageDataUrl) => ipcRenderer.send('set-badge', { count, imageDataUrl }),

  // "Abrir quando o Windows iniciar".
  getOpenAtLogin: () => ipcRenderer.invoke('get-open-at-login'),
  setOpenAtLogin: (enabled) => ipcRenderer.invoke('set-open-at-login', enabled),

  // Clique num aviso do Windows → a página navega para a tela certa.
  onNavigate: (callback) => {
    const listener = (_event, path) => callback(path)
    ipcRenderer.on('navigate', listener)
    return () => ipcRenderer.removeListener('navigate', listener)
  },
})
