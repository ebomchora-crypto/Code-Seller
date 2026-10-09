// Temas de cores. Os três primeiros vivem em index.css (data-theme); os demais sobrescrevem
// as variáveis --vs-* do Dark+ e trazem as regras de cor do Monaco.
export type ThemeName = 'vs-dark' | 'vs' | 'hc-black' | 'monokai' | 'dracula' | 'nord' | 'solarized-dark';
export type MonacoRules = { token: string; foreground: string; fontStyle?: string }[];
type Palette = { label: string; base: 'vs-dark' | 'vs' | 'hc-black'; vars?: Record<string, string>; rules?: MonacoRules; swatch: [string, string, string] };

export const themes: Record<ThemeName, Palette> = {
  'vs-dark': { label: 'Escuro (Dark+)', base: 'vs-dark', swatch: ['#1e1e1e', '#252526', '#007acc'] },
  vs: { label: 'Claro (Light+)', base: 'vs', swatch: ['#ffffff', '#f3f3f3', '#007acc'] },
  'hc-black': { label: 'Alto contraste', base: 'hc-black', swatch: ['#000000', '#000000', '#f38518'] },
  monokai: {
    label: 'Monokai', base: 'vs-dark', swatch: ['#272822', '#1e1f1c', '#a6e22e'],
    vars: { '--vs-editor': '#272822', '--vs-panel': '#272822', '--vs-tab-active': '#272822', '--vs-sidebar': '#1e1f1c', '--vs-tab-bar': '#1e1f1c', '--vs-tab-inactive': '#34352f', '--vs-titlebar': '#1e1f1c', '--vs-activitybar': '#1e1f1c', '--vs-activitybar-fg-dim': '#8a8a7a', '--vs-statusbar': '#414339', '--vs-statusbar-remote': '#a6e22e', '--vs-border': '#3b3c35', '--vs-border-soft': '#34352f', '--vs-list-active': '#414339', '--vs-list-focus': '#575a48', '--vs-list-hover': '#32332c', '--vs-tab-accent': '#a6e22e', '--vs-input-bg': '#3b3c35', '--vs-quick-bg': '#1e1f1c', '--vs-menu-bg': '#1e1f1c', '--vs-selection': '#49483e', '--vs-btn-bg': '#4d7c0f', '--vs-btn-hover': '#5d9710', '--vs-focus': '#a6e22e' },
    rules: [{ token: 'comment', foreground: '88846f' }, { token: 'keyword', foreground: 'f92672' }, { token: 'string', foreground: 'e6db74' }, { token: 'number', foreground: 'ae81ff' }, { token: 'type', foreground: '66d9ef' }, { token: 'identifier', foreground: 'f8f8f2' }, { token: 'tag', foreground: 'f92672' }, { token: 'attribute.name', foreground: 'a6e22e' }, { token: 'delimiter', foreground: 'f8f8f2' }],
  },
  dracula: {
    label: 'Dracula', base: 'vs-dark', swatch: ['#282a36', '#21222c', '#bd93f9'],
    vars: { '--vs-editor': '#282a36', '--vs-panel': '#282a36', '--vs-tab-active': '#282a36', '--vs-sidebar': '#21222c', '--vs-tab-bar': '#21222c', '--vs-tab-inactive': '#343746', '--vs-titlebar': '#21222c', '--vs-activitybar': '#343746', '--vs-activitybar-fg-dim': '#7b7f9e', '--vs-statusbar': '#6272a4', '--vs-statusbar-remote': '#bd93f9', '--vs-border': '#44475a', '--vs-border-soft': '#343746', '--vs-list-active': '#44475a', '--vs-list-focus': '#6272a4', '--vs-list-hover': '#343746', '--vs-tab-accent': '#ff79c6', '--vs-input-bg': '#343746', '--vs-quick-bg': '#21222c', '--vs-menu-bg': '#21222c', '--vs-selection': '#44475a', '--vs-btn-bg': '#6d4fc4', '--vs-btn-hover': '#8466d9', '--vs-focus': '#bd93f9', '--vs-link': '#8be9fd' },
    rules: [{ token: 'comment', foreground: '6272a4' }, { token: 'keyword', foreground: 'ff79c6' }, { token: 'string', foreground: 'f1fa8c' }, { token: 'number', foreground: 'bd93f9' }, { token: 'type', foreground: '8be9fd' }, { token: 'identifier', foreground: 'f8f8f2' }, { token: 'tag', foreground: 'ff79c6' }, { token: 'attribute.name', foreground: '50fa7b' }, { token: 'delimiter', foreground: 'f8f8f2' }],
  },
  nord: {
    label: 'Nord', base: 'vs-dark', swatch: ['#2e3440', '#3b4252', '#5e81ac'],
    vars: { '--vs-editor': '#2e3440', '--vs-panel': '#2e3440', '--vs-tab-active': '#2e3440', '--vs-sidebar': '#3b4252', '--vs-tab-bar': '#3b4252', '--vs-tab-inactive': '#353b49', '--vs-titlebar': '#3b4252', '--vs-activitybar': '#2e3440', '--vs-activitybar-fg-dim': '#7b88a1', '--vs-statusbar': '#5e81ac', '--vs-statusbar-remote': '#4c566a', '--vs-border': '#434c5e', '--vs-border-soft': '#3b4252', '--vs-list-active': '#434c5e', '--vs-list-focus': '#4c566a', '--vs-list-hover': '#3b4252', '--vs-tab-accent': '#88c0d0', '--vs-input-bg': '#434c5e', '--vs-quick-bg': '#3b4252', '--vs-menu-bg': '#3b4252', '--vs-selection': '#434c5e', '--vs-btn-bg': '#5e81ac', '--vs-btn-hover': '#81a1c1', '--vs-focus': '#88c0d0', '--vs-link': '#88c0d0' },
    rules: [{ token: 'comment', foreground: '616e88' }, { token: 'keyword', foreground: '81a1c1' }, { token: 'string', foreground: 'a3be8c' }, { token: 'number', foreground: 'b48ead' }, { token: 'type', foreground: '8fbcbb' }, { token: 'identifier', foreground: 'd8dee9' }, { token: 'tag', foreground: '81a1c1' }, { token: 'attribute.name', foreground: '8fbcbb' }, { token: 'delimiter', foreground: 'eceff4' }],
  },
  'solarized-dark': {
    label: 'Solarized Dark', base: 'vs-dark', swatch: ['#002b36', '#00212b', '#268bd2'],
    vars: { '--vs-editor': '#002b36', '--vs-panel': '#002b36', '--vs-tab-active': '#002b36', '--vs-sidebar': '#00212b', '--vs-tab-bar': '#00212b', '--vs-tab-inactive': '#003440', '--vs-titlebar': '#00212b', '--vs-activitybar': '#003440', '--vs-activitybar-fg-dim': '#6c8b93', '--vs-statusbar': '#268bd2', '--vs-statusbar-remote': '#2aa198', '--vs-border': '#07424f', '--vs-border-soft': '#003440', '--vs-list-active': '#07424f', '--vs-list-focus': '#0a5a6e', '--vs-list-hover': '#003440', '--vs-tab-accent': '#268bd2', '--vs-input-bg': '#003440', '--vs-quick-bg': '#00212b', '--vs-menu-bg': '#00212b', '--vs-selection': '#073642', '--vs-btn-bg': '#268bd2', '--vs-btn-hover': '#3c9ce0', '--vs-focus': '#268bd2', '--vs-fg': '#93a1a1', '--vs-fg-muted': '#839496', '--vs-link': '#2aa198' },
    rules: [{ token: 'comment', foreground: '586e75' }, { token: 'keyword', foreground: '859900' }, { token: 'string', foreground: '2aa198' }, { token: 'number', foreground: 'd33682' }, { token: 'type', foreground: 'b58900' }, { token: 'identifier', foreground: '93a1a1' }, { token: 'tag', foreground: '268bd2' }, { token: 'attribute.name', foreground: '93a1a1' }, { token: 'delimiter', foreground: '93a1a1' }],
  },
};
export const themeNames = Object.keys(themes) as ThemeName[];
export const accents = ['#007acc', '#0e9f6e', '#e5484d', '#f5a524', '#a855f7', '#ec4899', '#14b8a6', '#64748b'];
export const fontFamilies: Record<string, { label: string; stack: string }> = {
  cascadia: { label: 'Cascadia Code', stack: "'Cascadia Code', 'Cascadia Mono', Consolas, 'Courier New', monospace" },
  consolas: { label: 'Consolas', stack: "Consolas, 'Courier New', monospace" },
  jetbrains: { label: 'JetBrains Mono', stack: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace" },
  fira: { label: 'Fira Code', stack: "'Fira Code', 'Cascadia Code', Consolas, monospace" },
  mono: { label: 'Monoespaçada do sistema', stack: "ui-monospace, 'SF Mono', Menlo, monospace" },
};
