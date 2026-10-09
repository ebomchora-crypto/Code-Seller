import { create } from 'zustand';
// Diálogos globais que podem ser abertos de qualquer tela (menus, atalhos, barra de atividades).
export const useUi = create<{ newProject: boolean; settings: boolean; settingsTab: string; set: (value: Partial<{ newProject: boolean; settings: boolean; settingsTab: string }>) => void }>(set => ({
  newProject: false, settings: false, settingsTab: 'appearance', set: value => set(value),
}));
