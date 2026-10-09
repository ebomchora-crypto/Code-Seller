// Envia um comando para o terminal integrado (usado por Executar, scripts e npm install).
export type TerminalRequest = { command: string; label: string };
export function runInTerminal(request: TerminalRequest) { window.dispatchEvent(new CustomEvent<TerminalRequest>('cm-terminal-run', { detail: request })); }
