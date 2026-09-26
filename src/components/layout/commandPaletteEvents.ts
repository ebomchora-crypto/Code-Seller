// Evento para abrir a busca rápida de qualquer lugar (ex.: botão do topo).
export const OPEN_COMMAND_PALETTE = 'code-sellers:open-command-palette'

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE))
}
