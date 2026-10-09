// Preferências de layout do editor (painéis abertos e tamanhos), guardadas no
// navegador. Mesma chave de antes: valores que faltam usam o padrão.
const KEY = 'cm-layout';
export type Layout = {
  sidebar?: boolean; preview?: boolean; chat?: boolean;
  sidebarWidth?: number; panelHeight?: number; previewWidth?: number; chatWidth?: number;
};
export function readLayout(): Layout {
  try { const data = JSON.parse(localStorage.getItem(KEY) || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; }
}
export function patchLayout(patch: Layout) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readLayout(), ...patch })); } catch { /* A preferência de layout é opcional. */ }
}
export function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
/** Largura/altura guardada, ou o padrão quando não há ou está fora do limite. */
export function savedSize(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, min, max) : fallback;
}
