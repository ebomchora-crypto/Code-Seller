import { useMemo } from 'react';
import { monaco } from './monaco';
import { themes } from './themes';
import { usePreferences } from './preferences';

// Define (uma vez por combinação) o tema do Monaco que acompanha a paleta, o acento e o fundo escolhidos.
export function useMonacoTheme() {
  const { theme, accent, editorBg, bgImage } = usePreferences();
  return useMemo(() => {
    const palette = themes[theme];
    if (!palette.rules && !palette.colors && !accent && !editorBg && !bgImage) return palette.base;
    const id = `cm-${theme}-${accent.slice(1)}-${editorBg.slice(1)}-${bgImage ? 'img' : 'solid'}`;
    const colors: Record<string, string> = { ...(palette.colors || {}) };
    const bg = editorBg || palette.vars?.['--vs-editor'];
    if (bgImage) { colors['editor.background'] = '#00000000'; colors['minimap.background'] = '#00000000'; colors['editorGutter.background'] = '#00000000'; } else if (bg) colors['editor.background'] = bg;
    if (palette.vars?.['--vs-selection']) colors['editor.selectionBackground'] = palette.vars['--vs-selection'];
    if (accent) { colors['editorCursor.foreground'] = accent; colors['focusBorder'] = accent; }
    try { monaco.editor.defineTheme(id, { base: palette.base, inherit: true, rules: palette.rules || [], colors }); } catch { return palette.base; }
    return id;
  }, [theme, accent, editorBg, bgImage]);
}
