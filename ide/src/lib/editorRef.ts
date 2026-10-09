import type { monaco as Monaco } from './monaco';
// O editor Monaco em foco, para que os menus (Editar, Seleção, Ir) executem as mesmas ações do VS Code.
type Editor = Monaco.editor.IStandaloneCodeEditor;
let current: Editor | null = null;
export function setActiveEditor(editor: Editor | null) { current = editor; }
export function activeEditor() { return current; }
export function runEditorAction(id: string) {
  const editor = current; if (!editor) return;
  editor.focus();
  if (id === 'undo' || id === 'redo') { editor.trigger('menu', id, null); return; }
  if (id === 'cut' || id === 'copy') { document.execCommand(id); return; }
  if (id === 'paste') {
    void navigator.clipboard?.readText().then(text => { const selection = editor.getSelection(); if (selection) editor.executeEdits('menu', [{ range: selection, text, forceMoveMarkers: true }]); }).catch(() => undefined);
    return;
  }
  const action = editor.getAction(id);
  if (action) void action.run(); else editor.trigger('menu', id, null);
}
