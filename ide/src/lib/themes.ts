// Temas de cores. Os três primeiros vivem em index.css (data-theme); os demais sobrescrevem
// as variáveis --vs-* do Dark+ e trazem as regras de cor do Monaco.
export type ThemeName = 'code-sellers' | 'code-sellers-light' | 'vs-dark' | 'vs' | 'hc-black' | 'monokai' | 'dracula' | 'nord' | 'solarized-dark';
export type MonacoRules = { token: string; foreground: string; fontStyle?: string }[];
type Palette = { label: string; base: 'vs-dark' | 'vs' | 'hc-black'; vars?: Record<string, string>; rules?: MonacoRules; colors?: Record<string, string>; swatch: [string, string, string] };

const UI = "Inter, 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', sans-serif";
// Paleta do Code Sellers (roxo sobre fundo quase preto), a mesma do site e do painel.
const sellersDark: Record<string, string> = {
  '--vs-font': UI, '--vs-editor': '#0d0a14', '--vs-panel': '#0d0a14', '--vs-tab-active': '#0d0a14', '--vs-sidebar': '#0a0710', '--vs-tab-bar': '#08060d', '--vs-tab-inactive': '#120f1a',
  '--vs-titlebar': '#08060d', '--vs-titlebar-fg': '#aba5b8', '--vs-activitybar': '#08060d', '--vs-activitybar-fg': '#f6f4fa', '--vs-activitybar-fg-dim': '#736c85', '--vs-activitybar-badge': '#8b5cf6',
  '--vs-fg': '#d9d4e6', '--vs-fg-muted': '#aba5b8', '--vs-fg-dim': '#736c85', '--vs-fg-strong': '#f6f4fa', '--vs-sidebar-header': '#aba5b8',
  '--vs-border': '#2a2238', '--vs-border-soft': '#1a1624', '--vs-tab-inactive-fg': '#aba5b8', '--vs-tab-accent': '#a78bfa', '--vs-tab-active-fg': '#f6f4fa',
  '--vs-statusbar': '#6d28d9', '--vs-statusbar-fg': '#ffffff', '--vs-statusbar-remote': '#8b5cf6', '--vs-statusbar-hover': '#ffffff26',
  '--vs-list-hover': '#181421', '--vs-list-active': '#241a3d', '--vs-list-focus': '#3b2a6b', '--vs-list-focus-fg': '#ffffff', '--vs-toolbar-hover': '#8b5cf626', '--vs-selection': '#5b3fb066',
  '--vs-input-bg': '#120f1a', '--vs-input-border': '#2a2238', '--vs-input-fg': '#f6f4fa', '--vs-focus': '#a78bfa',
  '--vs-btn-bg': '#7c3aed', '--vs-btn-hover': '#8b5cf6', '--vs-btn-fg': '#ffffff', '--vs-btn2-bg': '#1a1624', '--vs-btn2-hover': '#241e31', '--vs-btn2-fg': '#e9e6f0',
  '--vs-link': '#b79cff', '--vs-badge-bg': '#2a2238', '--vs-badge-fg': '#e9e6f0', '--vs-menu-bg': '#120f1a', '--vs-menu-border': '#2a2238', '--vs-menu-hover': '#2b1f4d', '--vs-quick-bg': '#120f1a',
  '--vs-shadow': '0 16px 48px -12px #000000cc', '--vs-scroll': '#8b5cf633', '--vs-scroll-hover': '#8b5cf666', '--vs-scroll-active': '#a78bfa88',
  '--vs-git-modified': '#e2c08d', '--vs-git-added': '#6ee7b7', '--vs-diff-add': '#34d3991f', '--vs-diff-del': '#f871711f',
};
const sellersLight: Record<string, string> = {
  '--vs-font': UI, '--vs-editor': '#ffffff', '--vs-panel': '#fbfafd', '--vs-tab-active': '#ffffff', '--vs-sidebar': '#f5f3fa', '--vs-tab-bar': '#efedf3', '--vs-tab-inactive': '#e9e5f1',
  '--vs-titlebar': '#efedf3', '--vs-titlebar-fg': '#52525b', '--vs-activitybar': '#efedf3', '--vs-activitybar-fg': '#2b1760', '--vs-activitybar-fg-dim': '#8a82a0', '--vs-activitybar-badge': '#7c3aed',
  '--vs-fg': '#2f2a3c', '--vs-fg-muted': '#52525b', '--vs-fg-dim': '#8a82a0', '--vs-fg-strong': '#0a0a0c', '--vs-sidebar-header': '#6b6480',
  '--vs-border': '#ddd7ea', '--vs-border-soft': '#e8e4f0', '--vs-tab-inactive-fg': '#52525b', '--vs-tab-accent': '#7c3aed', '--vs-tab-active-fg': '#0a0a0c',
  '--vs-statusbar': '#7c3aed', '--vs-statusbar-fg': '#ffffff', '--vs-statusbar-remote': '#5b21b6', '--vs-statusbar-hover': '#ffffff26',
  '--vs-list-hover': '#ece8f5', '--vs-list-active': '#e4dcf7', '--vs-list-focus': '#7c3aed', '--vs-list-focus-fg': '#ffffff', '--vs-toolbar-hover': '#7c3aed1a', '--vs-selection': '#c9b6f566',
  '--vs-input-bg': '#ffffff', '--vs-input-border': '#d6cfe6', '--vs-input-fg': '#0a0a0c', '--vs-focus': '#7c3aed',
  '--vs-btn-bg': '#7c3aed', '--vs-btn-hover': '#6d28d9', '--vs-btn-fg': '#ffffff', '--vs-btn2-bg': '#e9e5f1', '--vs-btn2-hover': '#ddd7ea', '--vs-btn2-fg': '#2f2a3c',
  '--vs-link': '#6d28d9', '--vs-badge-bg': '#e4dcf7', '--vs-badge-fg': '#4c1d95', '--vs-menu-bg': '#ffffff', '--vs-menu-border': '#ddd7ea', '--vs-menu-hover': '#ece8f5', '--vs-quick-bg': '#ffffff',
  '--vs-shadow': '0 16px 48px -12px #2b176033', '--vs-scroll': '#7c3aed33', '--vs-scroll-hover': '#7c3aed66', '--vs-scroll-active': '#7c3aed99',
};
export const themes: Record<ThemeName, Palette> = {
  'code-sellers': {
    label: 'Code Sellers (escuro)', base: 'vs-dark', swatch: ['#0d0a14', '#08060d', '#7c3aed'], vars: sellersDark,
    colors: { 'editor.background': '#0d0a14', 'editor.lineHighlightBackground': '#181421', 'editorLineNumber.foreground': '#4d4660', 'editorLineNumber.activeForeground': '#b79cff', 'editorCursor.foreground': '#a78bfa', 'editor.selectionBackground': '#5b3fb066', 'editorIndentGuide.background1': '#1f1930', 'editorIndentGuide.activeBackground1': '#3b2a6b', 'editorWidget.background': '#120f1a', 'editorSuggestWidget.background': '#120f1a', 'editorSuggestWidget.selectedBackground': '#2b1f4d', 'minimap.background': '#0d0a14', 'scrollbarSlider.background': '#8b5cf633', 'scrollbarSlider.hoverBackground': '#8b5cf666' },
    rules: [{ token: 'comment', foreground: '6f6785', fontStyle: 'italic' }, { token: 'keyword', foreground: 'c4a1ff' }, { token: 'string', foreground: '86efac' }, { token: 'number', foreground: 'fbbf77' }, { token: 'type', foreground: '7dd3fc' }, { token: 'identifier', foreground: 'e9e6f0' }, { token: 'tag', foreground: 'f0abfc' }, { token: 'attribute.name', foreground: 'b79cff' }, { token: 'attribute.value', foreground: '86efac' }, { token: 'delimiter', foreground: '9a92b0' }, { token: 'regexp', foreground: 'fda4af' }],
  },
  'code-sellers-light': {
    label: 'Code Sellers (claro)', base: 'vs', swatch: ['#ffffff', '#efedf3', '#7c3aed'], vars: sellersLight,
    colors: { 'editor.background': '#ffffff', 'editor.lineHighlightBackground': '#f5f3fa', 'editorLineNumber.foreground': '#b5acc8', 'editorLineNumber.activeForeground': '#6d28d9', 'editorCursor.foreground': '#7c3aed', 'editor.selectionBackground': '#c9b6f566', 'editorWidget.background': '#ffffff' },
    rules: [{ token: 'comment', foreground: '8a82a0', fontStyle: 'italic' }, { token: 'keyword', foreground: '7c3aed' }, { token: 'string', foreground: '15803d' }, { token: 'number', foreground: 'c2410c' }, { token: 'type', foreground: '0369a1' }, { token: 'tag', foreground: 'a21caf' }, { token: 'attribute.name', foreground: '6d28d9' }, { token: 'attribute.value', foreground: '15803d' }],
  },
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
export const accents = ['#7c3aed', '#007acc', '#0e9f6e', '#e5484d', '#f5a524', '#a855f7', '#ec4899', '#14b8a6', '#64748b'];
export const fontFamilies: Record<string, { label: string; stack: string }> = {
  cascadia: { label: 'Cascadia Code', stack: "'Cascadia Code', 'Cascadia Mono', Consolas, 'Courier New', monospace" },
  consolas: { label: 'Consolas', stack: "Consolas, 'Courier New', monospace" },
  jetbrains: { label: 'JetBrains Mono', stack: "'JetBrains Mono', 'Cascadia Code', Consolas, monospace" },
  fira: { label: 'Fira Code', stack: "'Fira Code', 'Cascadia Code', Consolas, monospace" },
  mono: { label: 'Monoespaçada do sistema', stack: "ui-monospace, 'SF Mono', Menlo, monospace" },
};
