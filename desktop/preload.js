// Ponte mínima e segura entre a página (sandboxed, sem Node) e o Electron:
// só expõe uma função pra pedir ao processo principal que abra uma URL no
// navegador padrão do Windows. Usada pelo login/cadastro (ver
// src/router/PublicRoute.tsx no site).

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('codeSellersDesktop', {
  openInBrowser: (url) => ipcRenderer.send('open-external', url),
})
