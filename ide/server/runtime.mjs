import { build } from 'esbuild';
import { parse, serialize } from 'parse5';
import { posix } from 'node:path';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { validateFiles } from './repository.mjs';
const require = createRequire(import.meta.url);
const allowed = new Set(['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'lucide-react']);
const extensions = ['', '.tsx', '.ts', '.jsx', '.js', '.json', '.css', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
function consoleBridge(channel) {
  // Code Makers console: code runs only in the sandboxed browser frame.
  const text = value => { try { return typeof value === 'string' ? value : value instanceof Error ? value.message : JSON.stringify(value); } catch { return String(value); } };
  let count = 0;
  function send(level, args) { if (++count <= 300) parent.postMessage({ channel, level, text: args.map(text).join(' ').slice(0, 4000) }, '*'); }
  ['log', 'info', 'warn', 'error'].forEach(level => { const original = console[level]; console[level] = (...args) => { original.apply(console, args); send(level, args); }; });
  addEventListener('error', event => send('error', [event.message]));
  addEventListener('unhandledrejection', event => send('error', [event.reason]));
}
const scriptEscape = text => text.replace(/<\/script/gi, '<\\/script');

export async function compileProject(project) {
  if (!['react', 'static'].includes(project.template)) return { html: null, channel: randomUUID(), errors: ['Este workspace usa as ferramentas do próprio projeto. Execute seu servidor pelo terminal e abra a URL exibida.'], warnings: [] };
  const files = validateFiles(project.files);
  const channel = randomUUID();
  const errors = []; const warnings = [];
  const htmlPath = project.template === 'static' ? '/index.html' : files['/index.html'] !== undefined ? '/index.html' : '/public/index.html';
  const html = files[htmlPath] || '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="root"></div></body></html>';
  const document = parse(html);
  const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
  const scripts = []; const styles = []; const entries = [];
  const virtual = { ...files };
  function resolvePath(path, base = '/') {
    const candidate = path.startsWith('/') ? path : posix.join(posix.dirname(base), path);
    return extensions.map(extension => posix.normalize(candidate + extension)).find(path => virtual[path] !== undefined);
  }
  const plugin = {
    name: 'project-files-only',
    setup(builder) {
      builder.onResolve({ filter: /.*/, namespace: 'project' }, args => {
        if (!args.path.startsWith('.') && !args.path.startsWith('/')) {
          if (!allowed.has(args.path)) return { errors: [{ text: `Dependência não disponível no runtime local: ${args.path}. Suporte atual: React, React DOM e Lucide.` }] };
          return { path: require.resolve(args.path), namespace: 'file' };
        }
        const path = resolvePath(args.path, args.importer || '/');
        return path ? { path, namespace: 'project' } : { errors: [{ text: `Arquivo não encontrado no projeto: ${args.path}` }] };
      });
      builder.onResolve({ filter: /.*/ }, args => {
        if (args.kind === 'entry-point') return { path: args.path, namespace: 'project' };
      });
      builder.onLoad({ filter: /.*/, namespace: 'project' }, args => {
        const extension = args.path.split('.').at(-1);
        const loader = ['tsx', 'ts', 'jsx', 'js', 'json', 'css'].includes(extension) ? extension : 'text';
        return { contents: virtual[args.path], loader, resolveDir: '/' };
      });
    },
  };
  function visit(parent) {
    if (!parent.childNodes) return;
    parent.childNodes = parent.childNodes.filter(node => {
      if (node.tagName === 'script') {
        const src = attr(node, 'src'); const type = attr(node, 'type');
        if (src) {
          if (/^(?:[a-z]+:)?\/\//i.test(src)) { errors.push('Scripts externos não são suportados no preview local.'); return false; }
          const path = resolvePath(src.split('?')[0], htmlPath === '/public/index.html' ? '/index.html' : htmlPath);
          if (!path) errors.push(`Arquivo não encontrado no projeto: ${src}`); else entries.push(path);
          return false;
        }
        if (type === 'module') {
          const path = `/__inline_${entries.length}.js`;
          virtual[path] = node.childNodes?.map(child => child.value || '').join('') || '';
          entries.push(path); return false;
        }
      }
      if (node.tagName === 'link' && attr(node, 'rel') === 'stylesheet') {
        const href = attr(node, 'href');
        if (href && !/^(?:[a-z]+:)?\/\//i.test(href)) {
          const path = resolvePath(href, htmlPath === '/public/index.html' ? '/index.html' : htmlPath);
          if (!path) errors.push(`Folha de estilo não encontrada: ${href}`); else entries.push(path);
          return false;
        }
      }
      visit(node); return true;
    });
  }
  visit(document);
  if (project.template === 'react' && !entries.some(path => /\.[jt]sx?$/.test(path))) {
    let main;
    try { main = JSON.parse(files['/package.json'] || '{}').main; } catch { errors.push('package.json contém JSON inválido.'); }
    const entry = [main, '/src/main.tsx', '/src/main.jsx', '/index.tsx', '/index.jsx', '/index.js'].find(path => path && files[path] !== undefined);
    if (entry) entries.push(entry); else errors.push('Entrada React não encontrada (index.tsx ou src/main.tsx).');
  }
  for (const entry of [...new Set(entries)]) {
    try {
      const result = await build({ entryPoints: [entry], outdir: 'out', bundle: true, write: false, platform: 'browser', format: 'iife', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' }, plugins: [plugin], logLevel: 'silent' });
      warnings.push(...result.warnings.map(item => item.text));
      for (const output of result.outputFiles) {
        if (output.path.endsWith('.css')) styles.push(output.text);
        if (output.path.endsWith('.js')) scripts.push(output.text);
      }
    } catch (error) {
      errors.push(...(error.errors || [{ text: error.message }]).map(item => `${item.location?.file || entry}${item.location ? `:${item.location.line}:${item.location.column}` : ''} — ${item.text}`));
    }
  }
  const bridge = `<script>/* Code Makers console */(${consoleBridge.toString()})(${JSON.stringify(channel)});</script>`;
  let output = serialize(document);
  output = output.replace(/<head>/i, `<head>${bridge}<style>${styles.join('\n').replace(/<\/style/gi, '<\\/style')}</style>`);
  output = output.replace(/<\/body>/i, `${scripts.map(script => `<script>${scriptEscape(script)}</script>`).join('')}\n</body>`);
  return { html: errors.length ? null : output, errors, warnings, channel };
}
