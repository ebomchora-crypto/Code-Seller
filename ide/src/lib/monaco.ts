import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/editor/editor.api';
import 'monaco-editor/language/typescript/monaco.contribution';
import 'monaco-editor/language/json/monaco.contribution';
import 'monaco-editor/language/css/monaco.contribution';
import 'monaco-editor/language/html/monaco.contribution';
// Todas as linguagens do Monaco (carregadas sob demanda) para abrir qualquer tipo de arquivo de texto.
import 'monaco-editor/languages/definitions/register.all';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import TypeScriptWorker from 'monaco-editor/language/typescript/ts.worker?worker';
import JsonWorker from 'monaco-editor/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/language/html/html.worker?worker';
import { typescriptDefaults, JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'monaco-editor/languages/features/typescript/register';
import reactTypes from '../../node_modules/@types/react/index.d.ts?raw';
import reactGlobals from '../../node_modules/@types/react/global.d.ts?raw';
import reactJsx from '../../node_modules/@types/react/jsx-runtime.d.ts?raw';
import reactDomTypes from '../../node_modules/@types/react-dom/index.d.ts?raw';
import reactDomClient from '../../node_modules/@types/react-dom/client.d.ts?raw';
import cssTypes from '../../node_modules/csstype/index.d.ts?raw';
import propTypes from '../../node_modules/@types/prop-types/index.d.ts?raw';

self.MonacoEnvironment = { getWorker(_moduleId, label) {
  if (label === 'typescript' || label === 'javascript') return new TypeScriptWorker();
  if (label === 'json') return new JsonWorker();
  if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
  if (label === 'html') return new HtmlWorker();
  return new EditorWorker();
} };
loader.config({ monaco });
typescriptDefaults.setCompilerOptions({ target: ScriptTarget.ES2020, module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.NodeJs, jsx: JsxEmit.ReactJSX, allowNonTsExtensions: true, esModuleInterop: true, allowSyntheticDefaultImports: true });
typescriptDefaults.setEagerModelSync(true);
const libraries: Record<string, string> = {
  '/node_modules/@types/react/index.d.ts': reactTypes,
  '/node_modules/@types/react/global.d.ts': reactGlobals,
  '/node_modules/@types/react/jsx-runtime.d.ts': reactJsx,
  '/node_modules/@types/react-dom/index.d.ts': reactDomTypes,
  '/node_modules/@types/react-dom/client.d.ts': reactDomClient,
  '/node_modules/csstype/index.d.ts': cssTypes,
  '/node_modules/@types/prop-types/index.d.ts': propTypes,
};
Object.entries(libraries).forEach(([path, content]) => typescriptDefaults.addExtraLib(content, `file://${path}`));
export { monaco };
const extraExtensions: Record<string, string> = { '.mjs': 'javascript', '.cjs': 'javascript', '.mts': 'typescript', '.cts': 'typescript', '.jsonc': 'json', '.env': 'ini', '.toml': 'ini', '.conf': 'ini', '.properties': 'ini', '.gradle': 'java', '.vue': 'html', '.svelte': 'html', '.astro': 'html', '.mdx': 'mdx', '.h': 'cpp', '.hpp': 'cpp', '.cc': 'cpp', '.ino': 'cpp', '.zsh': 'shell', '.bash': 'shell', '.cmd': 'bat', '.kts': 'kotlin', '.log': 'plaintext' };
const extraNames: Record<string, string> = { makefile: 'shell', '.gitignore': 'ini', '.env': 'ini', '.env.local': 'ini', '.editorconfig': 'ini', '.npmrc': 'ini', dockerfile: 'dockerfile', 'package-lock.json': 'json', 'tsconfig.json': 'json' };
export function languageForPath(path: string) {
  const name = path.split('/').at(-1) || path; const extension = `.${name.split('.').at(-1)}`;
  const lower = name.toLowerCase();
  return monaco.languages.getLanguages().find(language => language.extensions?.includes(extension) || language.filenames?.includes(name))?.id || extraNames[lower] || extraExtensions[extension.toLowerCase()] || 'plaintext';
}
