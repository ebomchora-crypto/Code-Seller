import type { MenuItem } from '../components/ContextMenu';
import type { MenuGroups } from '../components/TitleBar';
import { runEditorAction } from './editorRef';
import { themes, themeNames } from './themes';
import { usePreferences } from './preferences';
import { useUi } from './ui';
import { cloud, IDE_DOWNLOAD } from './mode';

export type MenuContext = {
  lazy?: boolean; hasProject: boolean; active: string | null; previewable: boolean; recents: { id: string; name: string }[];
  actions: {
    newFile: () => void; newProject: () => void; openFolder: () => void; openByPath: () => void; importCopy: () => void; importZip: () => void; openRecent: (id: string) => void;
    save: () => void; closeTab: () => void; closeFolder: () => void; exportZip: () => void; quickOpen: () => void; commands: () => void;
    view: (name: 'files' | 'search' | 'git' | 'run') => void; problems: () => void; terminal: () => void; sidebar: () => void; preview: () => void; chat: () => void;
    runFile: () => void; history: () => void; renameFile: () => void; deleteFile: () => void;
  };
};
const sep: MenuItem = { separator: true };
export function buildMenus({ lazy = false, hasProject, active, previewable, recents, actions }: MenuContext): MenuGroups {
  const prefs = usePreferences.getState();
  const editor = (label: string, id: string, shortcut?: string): MenuItem => ({ label, shortcut, disabled: !active, action: () => runEditorAction(id) });
  const menus: MenuGroups = {
    Arquivo: [
      { label: 'Novo arquivo…', shortcut: 'Ctrl+N', disabled: !hasProject, action: actions.newFile },
      { label: 'Novo projeto…', action: actions.newProject }, sep,
      { label: 'Abrir pasta…', shortcut: 'Ctrl+O', action: actions.openFolder },
      { label: 'Abrir por caminho…', action: actions.openByPath },
      { label: 'Abrir recente', disabled: !recents.length, submenu: recents.slice(0, 10).map(item => ({ label: item.name, action: () => actions.openRecent(item.id) })) },
      { label: 'Importar cópia de pasta…', action: actions.importCopy }, { label: 'Importar ZIP…', action: actions.importZip }, sep,
      { label: 'Salvar', shortcut: 'Ctrl+S', disabled: !hasProject, action: actions.save },
      { label: 'Exportar como ZIP', disabled: !hasProject, action: actions.exportZip }, sep,
      { label: 'Preferências', submenu: [{ label: 'Configurações', shortcut: 'Ctrl+,', action: () => useUi.getState().set({ settings: true, settingsTab: 'appearance' }) }, { label: 'Atalhos de teclado', action: () => useUi.getState().set({ settings: true, settingsTab: 'keys' }) }, { label: 'Tema de cores', submenu: themeNames.map(name => ({ label: themes[name].label, checked: prefs.theme === name, action: () => usePreferences.getState().update({ theme: name }) })) }] }, sep,
      { label: 'Fechar editor', shortcut: 'Ctrl+W', disabled: !active, action: actions.closeTab },
      { label: 'Fechar pasta', disabled: !hasProject, action: actions.closeFolder },
    ],
    Editar: [
      editor('Desfazer', 'undo', 'Ctrl+Z'), editor('Refazer', 'redo', 'Ctrl+Y'), sep,
      editor('Recortar', 'cut', 'Ctrl+X'), editor('Copiar', 'copy', 'Ctrl+C'), editor('Colar', 'paste', 'Ctrl+V'), sep,
      editor('Localizar', 'actions.find', 'Ctrl+F'), editor('Substituir', 'editor.action.startFindReplace', 'Ctrl+H'), sep,
      { label: 'Localizar nos arquivos', shortcut: 'Ctrl+Shift+F', disabled: !hasProject, action: () => actions.view('search') }, sep,
      editor('Alternar comentário de linha', 'editor.action.commentLine', 'Ctrl+/'), editor('Alternar comentário de bloco', 'editor.action.blockComment', 'Shift+Alt+A'),
      editor('Formatar documento', 'editor.action.formatDocument', 'Shift+Alt+F'), sep,
      { label: 'Renomear arquivo…', shortcut: 'F2', disabled: !active, action: actions.renameFile }, { label: 'Excluir arquivo', disabled: !active, action: actions.deleteFile },
    ],
    'Seleção': [
      editor('Selecionar tudo', 'editor.action.selectAll', 'Ctrl+A'), editor('Expandir seleção', 'editor.action.smartSelect.expand', 'Shift+Alt+→'), editor('Reduzir seleção', 'editor.action.smartSelect.shrink', 'Shift+Alt+←'), sep,
      editor('Copiar linha acima', 'editor.action.copyLinesUpAction', 'Shift+Alt+↑'), editor('Copiar linha abaixo', 'editor.action.copyLinesDownAction', 'Shift+Alt+↓'),
      editor('Mover linha para cima', 'editor.action.moveLinesUpAction', 'Alt+↑'), editor('Mover linha para baixo', 'editor.action.moveLinesDownAction', 'Alt+↓'), editor('Duplicar seleção', 'editor.action.duplicateSelection'), sep,
      editor('Adicionar cursor acima', 'editor.action.insertCursorAbove', 'Ctrl+Alt+↑'), editor('Adicionar cursor abaixo', 'editor.action.insertCursorBelow', 'Ctrl+Alt+↓'),
      editor('Adicionar cursores ao fim das linhas', 'editor.action.insertCursorAtEndOfEachLineSelected', 'Shift+Alt+I'), editor('Adicionar próxima ocorrência', 'editor.action.addSelectionToNextFindMatch', 'Ctrl+D'),
      editor('Adicionar ocorrência anterior', 'editor.action.addSelectionToPreviousFindMatch'), editor('Selecionar todas as ocorrências', 'editor.action.selectHighlights', 'Ctrl+Shift+L'),
    ],
    Ver: [
      { label: 'Paleta de comandos…', shortcut: 'Ctrl+Shift+P', action: actions.commands }, sep,
      { label: 'Explorador', shortcut: 'Ctrl+Shift+E', action: () => actions.view('files') },
      { label: 'Pesquisar', shortcut: 'Ctrl+Shift+F', disabled: !hasProject, action: () => actions.view('search') },
      { label: 'Controle de código', shortcut: 'Ctrl+Shift+G', disabled: !hasProject, action: () => actions.view('git') },
      { label: 'Executar', shortcut: 'Ctrl+Shift+D', disabled: !hasProject, action: () => actions.view('run') }, sep,
      { label: 'Assistente de IA', shortcut: 'Ctrl+Alt+I', disabled: !hasProject, action: actions.chat },
      { label: 'Preview', disabled: !previewable, action: actions.preview }, sep,
      { label: 'Problemas', shortcut: 'Ctrl+Shift+M', disabled: !hasProject, action: actions.problems },
      { label: 'Terminal', shortcut: 'Ctrl+`', disabled: !hasProject, action: actions.terminal }, sep,
      { label: 'Aparência', submenu: [{ label: 'Barra lateral', shortcut: 'Ctrl+B', action: actions.sidebar }, { label: 'Barra lateral à direita', checked: prefs.sidebarRight, action: () => usePreferences.getState().update({ sidebarRight: !prefs.sidebarRight }) }, { label: 'Minimapa', checked: prefs.minimap, action: () => usePreferences.getState().update({ minimap: !prefs.minimap }) }] },
      { label: 'Quebra de linha', shortcut: 'Alt+Z', checked: prefs.wordWrap, action: () => usePreferences.getState().update({ wordWrap: !prefs.wordWrap }) },
    ],
    Ir: [
      { label: 'Ir para arquivo…', shortcut: 'Ctrl+P', disabled: !hasProject, action: actions.quickOpen }, sep,
      editor('Ir para símbolo no editor…', 'editor.action.quickOutline', 'Ctrl+Shift+O'), editor('Ir para definição', 'editor.action.revealDefinition', 'F12'), editor('Ir para declaração', 'editor.action.revealDeclaration'),
      editor('Ir para definição de tipo', 'editor.action.goToTypeDefinition'), editor('Ir para implementações', 'editor.action.goToImplementation', 'Ctrl+F12'), editor('Ir para referências', 'editor.action.goToReferences', 'Shift+F12'), sep,
      editor('Ir para linha/coluna…', 'editor.action.gotoLine', 'Ctrl+G'), editor('Ir para colchete', 'editor.action.jumpToBracket', 'Ctrl+Shift+\\'), sep,
      editor('Próximo problema', 'editor.action.marker.next', 'F8'), editor('Problema anterior', 'editor.action.marker.prev', 'Shift+F8'),
    ],
    Executar: [
      { label: 'Executar arquivo atual', disabled: !active, action: actions.runFile },
      { label: 'Abrir painel Executar', shortcut: 'Ctrl+Shift+D', disabled: !hasProject, action: () => actions.view('run') },
    ],
    Terminal: [{ label: 'Abrir ou fechar terminal', shortcut: 'Ctrl+`', disabled: !hasProject, action: actions.terminal }, { label: 'Problemas', disabled: !hasProject, action: actions.problems }],
    Ajuda: [{ label: 'Atalhos de teclado', action: () => useUi.getState().set({ settings: true, settingsTab: 'keys' }) }, { label: lazy ? 'Versões anteriores do arquivo' : 'Histórico de versões', disabled: !hasProject, action: actions.history }, { label: 'Configurar assistente de IA', action: () => useUi.getState().set({ settings: true, settingsTab: 'ai' }) }],
  };
  if (lazy) {
    // Pasta aberta do computador: sem ZIP nem preview; as versões anteriores vêm das cópias de segurança de cada salvamento.
    const hide = new Set(['Exportar como ZIP', 'Preview']);
    const clean = (items: MenuItem[]): MenuItem[] => items.filter(item => !('label' in item) || !hide.has(item.label)).map(item => 'submenu' in item && item.submenu ? { ...item, submenu: clean(item.submenu) } : item);
    return Object.fromEntries(Object.entries(menus).map(([name, items]) => [name, clean(items)]));
  }
  if (!cloud) return menus;
  // No site: sem terminal, Git, pastas locais nem execução; o projeto vem do Code Maker.
  const hide = new Set(['Abrir pasta…', 'Abrir por caminho…', 'Importar cópia de pasta…', 'Importar ZIP…', 'Abrir recente', 'Novo projeto…']);
  const arquivo = (menus.Arquivo as MenuItem[]).filter(item => 'separator' in item && item.separator ? true : !hide.has((item as { label: string }).label));
  const { Executar: _run, Terminal: _terminal, ...rest } = menus; void _run; void _terminal;
  return { ...rest, Arquivo: [{ label: 'Novo site no Code Maker…', action: actions.newProject }, { label: 'Voltar ao Code Maker', action: () => { location.href = '/code-maker'; } }, sep, ...arquivo.filter((item, index, list) => !('separator' in item && item.separator && 'separator' in (list[index - 1] ?? {}))), sep, { label: 'Baixar a IDE para Windows', action: () => { location.href = IDE_DOWNLOAD; } }] };
}
