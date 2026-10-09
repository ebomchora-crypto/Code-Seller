import MonacoEditor from '@monaco-editor/react';
import { monaco, languageForPath } from '../lib/monaco';
import { useEffect, useRef } from 'react';
import { flattenFiles, useEditorStore } from '../store/editorStore';
import { usePreferences } from '../lib/preferences';
import { useMonacoTheme } from '../lib/monacoTheme';
import { fontFamilies } from '../lib/themes';
import { useStatus } from '../store/statusStore';
import { setActiveEditor } from '../lib/editorRef';
import { Code2 } from 'lucide-react';
import { cloud } from '../lib/mode';
import { useIsMobile } from '../lib/useIsMobile';

const shortcuts: [string, string][] = [['Abrir arquivo', 'Ctrl+P'], ['Mostrar todos os comandos', 'Ctrl+Shift+P'], ['Buscar no projeto', 'Ctrl+Shift+F'], ['Alternar terminal', 'Ctrl+`'], ['Abrir configurações', 'Ctrl+,']];
export function Watermark() {
  return <div className="flex-1 flex items-center justify-center select-none" style={{ background: 'var(--vs-editor)' }}>
    <div className="text-center">
      <Code2 size={150} strokeWidth={0.9} className="mx-auto mb-8" style={{ color: 'var(--vs-fg-dim)', opacity: .22 }} />
      <table className="mx-auto text-[13px]" style={{ color: 'var(--vs-fg-dim)' }}><tbody>{shortcuts.filter(([label]) => !cloud || label !== 'Alternar terminal').map(([label, key]) => <tr key={label}><td className="pr-6 py-1.5 text-right">{label}</td><td className="text-left"><span className="kbd">{key}</span></td></tr>)}</tbody></table>
      
    </div>
  </div>;
}

export const Editor = ({ projectId, fileId }: { projectId: string; fileId?: string }) => {
  const instance = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const preferences = usePreferences();
  const monacoTheme = useMonacoTheme();
  const mobile = useIsMobile();
  const files = useEditorStore(state => state.files);
  const activeFileId = useEditorStore(state => state.activeFileId);
  const openFiles = useEditorStore(state => state.openFiles);
  const updateFileContent = useEditorStore(state => state.updateFileContent);
  const locked = useEditorStore(state => state.locked);
  useEffect(() => {
    for (const [path, content] of Object.entries(flattenFiles(files))) {
      const uri = monaco.Uri.parse(`file:///projects/${projectId}${path}`);
      const model = monaco.editor.getModel(uri);
      if (model) { if (model.getValue() !== content) model.setValue(content); }
      else {
        const language = languageForPath(path);
        monaco.editor.createModel(content, language, uri);
      }
    }
    const paths = flattenFiles(files);
    monaco.editor.getModels().forEach(model => { if (model.uri.path.startsWith(`/projects/${projectId}/`) && paths[model.uri.path.slice(`/projects/${projectId}`.length)] === undefined) model.dispose(); });
  }, [files, projectId]);
  useEffect(() => { const reveal = (event: Event) => { const { line, path } = (event as CustomEvent).detail; setTimeout(() => { if (instance.current?.getModel()?.uri.path !== `/projects/${projectId}${path}`) return; instance.current.revealLineInCenter(line); instance.current.setPosition({ lineNumber: line, column: 1 }); instance.current.focus(); }, 100); }; window.addEventListener('cm-reveal-line', reveal); return () => window.removeEventListener('cm-reveal-line', reveal); }, [projectId]);
  const file = fileId ? { id: fileId, name: fileId.split('/').at(-1)!, content: flattenFiles(files)[fileId] } : openFiles.find(file => file.id === activeFileId);
  if (!file) return <Watermark />;
  const language = languageForPath(file.name);
  return <div className="flex-1 min-h-0"><MonacoEditor onMount={editor => {
    instance.current = editor;
    editor.onDidFocusEditorText(() => setActiveEditor(editor));
    if (fileId) return;
    setActiveEditor(editor);
    const report = () => { const position = editor.getPosition(); const selection = editor.getSelection(); const model = editor.getModel(); useStatus.getState().set({ line: position?.lineNumber ?? 1, column: position?.column ?? 1, selected: selection && model ? model.getValueInRange(selection).length : 0 }); };
    report(); editor.onDidChangeCursorPosition(report); editor.onDidChangeCursorSelection(report);
  }} height="100%" keepCurrentModel path={`file:///projects/${projectId}${file.id}`} language={language} theme={monacoTheme} value={file.content ?? ''} onChange={value => { if (typeof value === 'string') updateFileContent(file.id, value, projectId); }} loading={<div className="p-8" style={{ color: 'var(--vs-fg-dim)' }}>Carregando editor…</div>}
    options={{ readOnly: locked, minimap: { enabled: preferences.minimap && !mobile }, fontSize: mobile ? Math.min(preferences.fontSize, 14) : preferences.fontSize, tabSize: preferences.tabSize, fontFamily: fontFamilies[preferences.fontFamily]?.stack, lineHeight: preferences.lineHeight || 0, lineNumbers: preferences.lineNumbers, cursorStyle: preferences.cursorStyle, wordWrap: preferences.wordWrap || mobile ? 'on' : 'off', glyphMargin: !mobile, folding: !mobile, lineDecorationsWidth: mobile ? 4 : 10, lineNumbersMinChars: mobile ? 3 : 4, stickyScroll: { enabled: !mobile }, scrollBeyondLastLine: false, smoothScrolling: true, formatOnPaste: true, automaticLayout: true, renderWhitespace: 'selection', bracketPairColorization: { enabled: true }, guides: { bracketPairs: true, indentation: true }, cursorBlinking: 'smooth', cursorSmoothCaretAnimation: 'on', fontLigatures: preferences.ligatures, renderLineHighlight: 'all', roundedSelection: false, overviewRulerBorder: false, scrollbar: { verticalScrollbarSize: mobile ? 8 : 14, horizontalScrollbarSize: 10, useShadows: false } }} /></div>;
};
