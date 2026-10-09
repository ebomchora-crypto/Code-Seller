import { create } from 'zustand';
import { themes, themeNames, fontFamilies, type ThemeName } from './themes';
import { cloud } from './mode';
export type { ThemeName } from './themes';

export type Preferences = {
  fontSize: number; wordWrap: boolean; minimap: boolean; theme: ThemeName; tabSize: number;
  fontFamily: string; lineHeight: number; lineNumbers: 'on' | 'off' | 'relative'; cursorStyle: 'line' | 'block' | 'underline'; ligatures: boolean;
  accent: string; editorBg: string; bgIntensity: number; bgBlur: number; sidebarRight: boolean;
};
export const defaults: Preferences = {
  fontSize: 14, wordWrap: cloud, minimap: !cloud, theme: 'vs-dark', tabSize: 2, fontFamily: 'cascadia', lineHeight: 0, lineNumbers: 'on', cursorStyle: 'line', ligatures: true,
  accent: '', editorBg: '', bgIntensity: 25, bgBlur: 0, sidebarRight: false,
};
const hex = (value: unknown) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '';
const num = (value: unknown, min: number, max: number, fallback: number) => Number.isFinite(value) ? Math.min(max, Math.max(min, value as number)) : fallback;
function read(): Preferences {
  try {
    const item = JSON.parse(localStorage.getItem('cm-editor-settings') || '{}') || {};
    return {
      fontSize: num(item.fontSize, 10, 28, 14), wordWrap: item.wordWrap === undefined ? defaults.wordWrap : item.wordWrap === true, minimap: item.minimap === undefined ? defaults.minimap : item.minimap !== false,
      theme: themeNames.includes(item.theme) ? item.theme : 'vs-dark', tabSize: [2, 4, 8].includes(item.tabSize) ? item.tabSize : 2,
      fontFamily: item.fontFamily in fontFamilies ? item.fontFamily : 'cascadia', lineHeight: num(item.lineHeight, 0, 40, 0),
      lineNumbers: ['on', 'off', 'relative'].includes(item.lineNumbers) ? item.lineNumbers : 'on', cursorStyle: ['line', 'block', 'underline'].includes(item.cursorStyle) ? item.cursorStyle : 'line',
      ligatures: item.ligatures !== false, accent: hex(item.accent), editorBg: hex(item.editorBg), bgIntensity: num(item.bgIntensity, 5, 70, 25), bgBlur: num(item.bgBlur, 0, 20, 0),
      sidebarRight: item.sidebarRight === true,
    };
  } catch { return defaults; }
}
const IMAGE_KEY = 'cm-bg-image';
function readImage() { try { const value = localStorage.getItem(IMAGE_KEY) || ''; return /^data:image\/(png|jpe?g|webp|gif);base64,/.test(value) ? value : ''; } catch { return ''; } }

type Store = Preferences & { bgImage: string; update: (value: Partial<Preferences>) => void; setBgImage: (value: string) => void; reset: () => void };
export const usePreferences = create<Store>(set => ({
  ...read(), bgImage: readImage(),
  update: value => set(previous => { const next = { ...previous, ...value }; try { localStorage.setItem('cm-editor-settings', JSON.stringify(Object.fromEntries(Object.keys(defaults).map(key => [key, next[key as keyof Preferences]])))); } catch {} return next; }),
  setBgImage: value => { try { if (value) localStorage.setItem(IMAGE_KEY, value); else localStorage.removeItem(IMAGE_KEY); } catch { /* imagem grande demais para o armazenamento */ } set({ bgImage: value }); },
  reset: () => { try { localStorage.removeItem('cm-editor-settings'); localStorage.removeItem(IMAGE_KEY); } catch {} set({ ...defaults, bgImage: '' }); },
}));

// ---- Aparência aplicada ao documento (variáveis --vs-*) ----
const overridden = new Set<string>();
const SURFACES = ['--vs-editor', '--vs-sidebar', '--vs-panel', '--vs-tab-bar', '--vs-tab-inactive', '--vs-tab-active', '--vs-titlebar', '--vs-activitybar'];
function apply(state: Preferences & { bgImage: string }) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  overridden.forEach(name => root.style.removeProperty(name)); overridden.clear();
  const set = (name: string, value: string) => { root.style.setProperty(name, value); overridden.add(name); };
  const palette = themes[state.theme];
  root.dataset.theme = palette.base;
  root.dataset.palette = state.theme;
  Object.entries(palette.vars || {}).forEach(([name, value]) => set(name, value));
  if (state.accent) {
    ['--vs-statusbar', '--vs-activitybar-badge', '--vs-tab-accent', '--vs-focus', '--vs-btn-bg', '--vs-link', '--vs-statusbar-remote'].forEach(name => set(name, state.accent));
    set('--vs-btn-hover', `color-mix(in srgb, ${state.accent} 82%, white)`);
  }
  if (state.editorBg) { set('--vs-editor', state.editorBg); set('--vs-panel', state.editorBg); set('--vs-tab-active', state.editorBg); }
  const hasImage = Boolean(state.bgImage);
  root.classList.toggle('has-bg-image', hasImage);
  root.style.setProperty('--cm-bg-image', hasImage ? `url("${state.bgImage}")` : 'none');
  root.style.setProperty('--cm-bg-blur', `${state.bgBlur}px`);
  const base = getComputedStyle(root).getPropertyValue('--vs-editor').trim() || '#1e1e1e';
  set('--cm-base', base);
  if (hasImage) {
    const solid = 100 - state.bgIntensity;
    SURFACES.forEach(name => { const color = getComputedStyle(root).getPropertyValue(name).trim(); if (color) set(name, `color-mix(in srgb, ${color} ${solid}%, transparent)`); });
  }
}
export function themeColor(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
apply(usePreferences.getState());
usePreferences.subscribe(state => apply(state));
