// Dois modos: "local" (app instalado, com servidor na máquina) e "cloud" (no site, com os projetos do Code Maker).
export const cloud = import.meta.env.VITE_IDE_MODE === 'cloud';
export const IDE_DOWNLOAD = '/downloads/CodeSellersIDE-Setup.exe';
