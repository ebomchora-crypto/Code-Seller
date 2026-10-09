import { useState, type ReactNode } from 'react';
import { X, Palette, Code2, LayoutPanelLeft, Keyboard, Sparkles, Trash2, ImagePlus, RotateCcw } from 'lucide-react';
import { usePreferences } from '../lib/preferences';
import { themes, themeNames, accents, fontFamilies, type ThemeName } from '../lib/themes';
import { useUi } from '../lib/ui';
import { askConfirm } from '../lib/dialogs';
import AiSettings from './AiSettings';
import { cloud } from '../lib/mode';

const shortcuts: [string, string][] = [['Abrir arquivo', 'Ctrl+P'], ['Paleta de comandos', 'Ctrl+Shift+P'], ['Novo arquivo', 'Ctrl+N'], ['Salvar', 'Ctrl+S'], ['Buscar no projeto', 'Ctrl+Shift+F'], ['Explorador', 'Ctrl+Shift+E'], ['Controle de código', 'Ctrl+Shift+G'], ['Executar', 'Ctrl+Shift+D'], ['Problemas', 'Ctrl+Shift+M'], ['Alternar terminal', 'Ctrl+`'], ['Alternar barra lateral', 'Ctrl+B'], ['Assistente de IA', 'Ctrl+Alt+I'], ['Configurações', 'Ctrl+,'], ['Fechar aba', 'Ctrl+W'], ['Renomear arquivo', 'F2'], ['Quebra de linha', 'Alt+Z']];
function Row({ title, help, children }: { title: string; help?: string; children: ReactNode }) {
  return <div className="settings-row border-b" style={{ borderColor: 'var(--vs-border-soft)' }}><span className="settings-title">{title}</span>{help && <span className="settings-help">{help}</span>}{children}</div>;
}
async function loadImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}
const allTabs = [{ id: 'appearance', label: 'Aparência', Icon: Palette }, { id: 'editor', label: 'Editor', Icon: Code2 }, { id: 'layout', label: 'Interface', Icon: LayoutPanelLeft }, { id: 'ai', label: 'Assistente de IA', Icon: Sparkles }, { id: 'keys', label: 'Atalhos', Icon: Keyboard }];
const tabs = allTabs.filter(item => !cloud || item.id !== 'ai');

export function SettingsDialog() {
  const open = useUi(state => state.settings); const tab = useUi(state => state.settingsTab);
  const preferences = usePreferences();
  const [error, setError] = useState('');
  if (!open) return null;
  const close = () => useUi.getState().set({ settings: false });
  async function chooseImage(file?: File) {
    if (!file) return; setError('');
    try { const data = await loadImage(file); preferences.setBgImage(data); if (usePreferences.getState().bgImage !== data) setError('Imagem grande demais para guardar. Tente uma menor.'); } catch { setError('Não foi possível ler essa imagem.'); }
  }
  const select = (label: string, value: string | number, onChange: (value: string) => void, options: [string, string][]) => <select aria-label={label} className="field w-full max-w-xs" value={value} onChange={e => onChange(e.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>;
  const check = (label: string, value: boolean, onChange: (value: boolean) => void) => <label className="flex gap-2 items-center"><input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />{label}</label>;
  return <div className="fixed inset-0 z-[85] flex items-center justify-center p-5" style={{ background: '#00000080' }} onMouseDown={close}>
    <section role="dialog" aria-modal="true" aria-label="Configurações" className="menu-pop w-full max-w-4xl h-[82vh] border flex flex-col" style={{ background: 'var(--vs-editor)', borderColor: 'var(--vs-menu-border)', boxShadow: 'var(--vs-shadow)' }} onMouseDown={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') close(); }}>
      <header className="h-[38px] shrink-0 px-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--vs-border-soft)' }}><h2 className="text-[13px] font-semibold text-vs-strong">Configurações</h2>
        <div className="flex items-center gap-1"><button className="btn-secondary !min-h-[22px] !py-0 text-xs" onClick={() => void askConfirm('Restaurar configurações?', { description: 'Tema, cores, imagem de fundo e opções do editor voltam ao padrão.', confirmLabel: 'Restaurar' }).then(ok => { if (ok) preferences.reset(); })}><RotateCcw size={13} /> Restaurar padrões</button><button className="icon-btn" aria-label="Fechar configurações" onClick={close}><X size={16} /></button></div></header>
      <div className="flex flex-1 min-h-0">
        <nav className="w-52 shrink-0 border-r py-2 bg-vs-sidebar" style={{ borderColor: 'var(--vs-border-soft)' }} aria-label="Categorias">{tabs.map(({ id, label, Icon }) => <button key={id} className="list-row px-4 !h-[28px]" data-active={tab === id} onClick={() => useUi.getState().set({ settingsTab: id })}><Icon size={15} className="shrink-0" />{label}</button>)}</nav>
        <div className="flex-1 overflow-auto px-8 py-4 text-[13px]">
          {tab === 'appearance' && <>
            <Row title="Tema de cores" help="Muda a interface inteira, o editor e o terminal.">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">{themeNames.map((name: ThemeName) => <button key={name} aria-pressed={preferences.theme === name} className="text-left border p-2 rounded-sm" style={{ borderColor: preferences.theme === name ? 'var(--vs-focus)' : 'var(--vs-border)', outline: preferences.theme === name ? '1px solid var(--vs-focus)' : 'none' }} onClick={() => preferences.update({ theme: name })}>
                <span className="flex h-8 mb-1.5 rounded-sm overflow-hidden border" style={{ borderColor: 'var(--vs-border)' }}>{themes[name].swatch.map((color, index) => <span key={index} className="flex-1" style={{ background: color }} />)}</span><span>{themes[name].label}</span></button>)}</div></Row>
            <Row title="Cor de destaque" help="Barra de status, botões, foco e abas. Deixe em “Padrão” para usar a cor do tema.">
              <div className="flex flex-wrap items-center gap-2"><button className="btn-secondary !min-h-[24px] !py-0 text-xs" aria-pressed={!preferences.accent} onClick={() => preferences.update({ accent: '' })}>Padrão</button>
                {accents.map(color => <button key={color} aria-label={`Cor ${color}`} aria-pressed={preferences.accent === color} className="w-6 h-6 rounded-full border" style={{ background: color, borderColor: preferences.accent === color ? 'var(--vs-fg-strong)' : 'var(--vs-border)', outline: preferences.accent === color ? '2px solid var(--vs-fg-strong)' : 'none', outlineOffset: 1 }} onClick={() => preferences.update({ accent: color })} />)}
                <input type="color" aria-label="Cor de destaque personalizada" className="w-8 h-6 p-0 border-0 bg-transparent" value={preferences.accent || '#007acc'} onChange={e => preferences.update({ accent: e.target.value })} /></div></Row>
            <Row title="Cor de fundo do editor" help="Substitui o fundo do editor, das abas e do painel inferior.">
              <div className="flex items-center gap-2"><input type="color" aria-label="Cor de fundo do editor" className="w-10 h-7 p-0 border-0 bg-transparent" value={preferences.editorBg || '#1e1e1e'} onChange={e => preferences.update({ editorBg: e.target.value })} /><button className="btn-secondary !min-h-[24px] !py-0 text-xs" disabled={!preferences.editorBg} onClick={() => preferences.update({ editorBg: '' })}>Usar a do tema</button></div></Row>
            <Row title="Imagem de fundo" help="Escolha uma imagem do seu computador. Ela fica salva só aqui, neste aparelho.">
              <div className="flex flex-wrap items-center gap-2"><label className="btn-secondary cursor-pointer"><ImagePlus size={14} /> Escolher imagem…<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e => { void chooseImage(e.target.files?.[0]); e.target.value = ''; }} /></label>
                {preferences.bgImage && <button className="btn-secondary" onClick={() => preferences.setBgImage('')}><Trash2 size={14} /> Remover</button>}</div>
              {preferences.bgImage && <div className="mt-3 space-y-3 max-w-xs"><img alt="Pré-visualização do fundo" src={preferences.bgImage} className="h-20 w-full object-cover border" style={{ borderColor: 'var(--vs-border)' }} />
                <label className="block text-xs text-vs-muted">Visibilidade da imagem: {preferences.bgIntensity}%<input type="range" min={5} max={70} className="w-full" value={preferences.bgIntensity} onChange={e => preferences.update({ bgIntensity: Number(e.target.value) })} /></label>
                <label className="block text-xs text-vs-muted">Desfoque: {preferences.bgBlur}px<input type="range" min={0} max={20} className="w-full" value={preferences.bgBlur} onChange={e => preferences.update({ bgBlur: Number(e.target.value) })} /></label></div>}
              {error && <p className="error-banner mt-2" role="alert">{error}</p>}</Row>
          </>}
          {tab === 'editor' && <>
            <Row title="Fonte do editor">{select('Fonte do editor', preferences.fontFamily, value => preferences.update({ fontFamily: value }), Object.entries(fontFamilies).map(([key, value]) => [key, value.label]))}</Row>
            <Row title="Tamanho da fonte" help="Em pixels, entre 10 e 28."><input className="field w-32" type="number" min={10} max={28} value={preferences.fontSize} onChange={e => preferences.update({ fontSize: Math.min(28, Math.max(10, Number(e.target.value) || 14)) })} /></Row>
            <Row title="Altura da linha" help="0 usa o valor automático."><input className="field w-32" type="number" min={0} max={40} value={preferences.lineHeight} onChange={e => preferences.update({ lineHeight: Math.min(40, Math.max(0, Number(e.target.value) || 0)) })} /></Row>
            <Row title="Tamanho da tabulação">{select('Tamanho da tabulação', preferences.tabSize, value => preferences.update({ tabSize: Number(value) }), [['2', '2 espaços'], ['4', '4 espaços'], ['8', '8 espaços']])}</Row>
            <Row title="Números de linha">{select('Números de linha', preferences.lineNumbers, value => preferences.update({ lineNumbers: value as typeof preferences.lineNumbers }), [['on', 'Ligados'], ['relative', 'Relativos'], ['off', 'Desligados']])}</Row>
            <Row title="Estilo do cursor">{select('Estilo do cursor', preferences.cursorStyle, value => preferences.update({ cursorStyle: value as typeof preferences.cursorStyle }), [['line', 'Linha'], ['block', 'Bloco'], ['underline', 'Sublinhado']])}</Row>
            <Row title="Opções">{<div className="space-y-2">{check('Quebrar linhas longas', preferences.wordWrap, value => preferences.update({ wordWrap: value }))}{check('Mostrar minimapa', preferences.minimap, value => preferences.update({ minimap: value }))}{check('Ligaduras da fonte (=>, !==)', preferences.ligatures, value => preferences.update({ ligatures: value }))}</div>}</Row>
          </>}
          {tab === 'layout' && <>
            <Row title="Posição da barra lateral" help="Move o explorador e a barra de atividades para o outro lado.">{select('Posição da barra lateral', preferences.sidebarRight ? 'right' : 'left', value => preferences.update({ sidebarRight: value === 'right' }), [['left', 'Esquerda'], ['right', 'Direita']])}</Row>
            <p className="text-xs text-vs-dim pt-3">Os tamanhos dos painéis são guardados quando você arrasta as divisórias. Ctrl+B mostra ou esconde a barra lateral.</p>
          </>}
          {tab === 'ai' && <Row title="Modelo de IA" help="Endereço, modelo e chave do assistente. A chave fica salva só neste computador."><AiSettings open changed={() => undefined} /></Row>}
          {tab === 'keys' && <table className="w-full max-w-lg"><tbody>{shortcuts.map(([label, key]) => <tr key={label} className="border-b" style={{ borderColor: 'var(--vs-border-soft)' }}><td className="py-1.5 text-vs-muted">{label}</td><td className="py-1.5 text-right"><span className="kbd">{key}</span></td></tr>)}</tbody></table>}
        </div>
      </div>
    </section></div>;
}
