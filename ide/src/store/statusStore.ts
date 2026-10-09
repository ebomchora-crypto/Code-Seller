import { create } from 'zustand';
// Informações da barra de status que vêm do editor ativo (cursor, seleção).
export const useStatus = create<{ line: number; column: number; selected: number; set: (value: { line: number; column: number; selected: number }) => void }>(set => ({
  line: 1, column: 1, selected: 0, set: value => set(value),
}));
