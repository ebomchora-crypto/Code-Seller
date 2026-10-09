import { create } from 'zustand';
// Diálogos próprios: o Electron não tem window.prompt() e confirm() quebra o foco.
type Dialog =
  | { kind: 'input'; title: string; description?: string; value: string; confirmLabel: string; resolve: (value: string | null) => void }
  | { kind: 'confirm'; title: string; description?: string; confirmLabel: string; danger: boolean; resolve: (value: boolean) => void };
export const useDialogs = create<{ current: Dialog | null }>(() => ({ current: null }));
export function askInput(title: string, value = '', options: { description?: string; confirmLabel?: string } = {}) {
  return new Promise<string | null>(resolve => useDialogs.setState({ current: { kind: 'input', title, value, description: options.description, confirmLabel: options.confirmLabel || 'OK', resolve } }));
}
export function askConfirm(title: string, options: { description?: string; confirmLabel?: string; danger?: boolean } = {}) {
  return new Promise<boolean>(resolve => useDialogs.setState({ current: { kind: 'confirm', title, description: options.description, confirmLabel: options.confirmLabel || 'Confirmar', danger: options.danger === true, resolve } }));
}
