import { supabase } from './client';
import { assemble, fromIdeTree, isSitePath, toIdeTree, type SiteState } from './tree';
import type { Checkpoint, Project, ProjectDetail } from '../api';

type Row = { id: string; user_id: string; name: string; slug: string; status: string; published: boolean; plan: SiteState['plan'] | null; parts: SiteState['parts'] | null; files: SiteState['files'] | null; updated_at: string; created_at: string };
type VersionRow = { id: string; kind: string; instruction: string | null; plan: SiteState['plan'] | null; parts: SiteState['parts'] | null; files: SiteState['files'] | null; created_at: string };
const fail = (message: string) => { throw new Error(message); };
// updated_at com microssegundos não cabe num number: guardamos o texto original e entregamos ao IDE um contador.
const revisions = new Map<string, { rev: number; updated_at: string }>();
let counter = 1;
const remember = (row: Pick<Row, 'id' | 'updated_at'>) => { const rev = counter++; revisions.set(row.id, { rev, updated_at: row.updated_at }); return rev; };
const stateOf = (row: Row): SiteState => ({ plan: row.plan ?? fail('Este site ainda não terminou de ser gerado.'), parts: row.parts ?? {}, files: row.files ?? {} });
const summary = (row: Pick<Row, 'id' | 'name' | 'created_at' | 'updated_at'> & Partial<Pick<Row, 'slug' | 'published'>>): Project => ({ id: row.id, name: row.name, description: 'Site do Code Maker', template: 'static', created_at: row.created_at, updated_at: row.updated_at, revision: revisions.get(row.id)?.rev ?? 0, deleted_at: null, publicUrl: row.slug ? `${location.origin}/${row.slug}` : undefined, published: row.published });
async function fetchRow(id: string): Promise<Row> {
  const { data, error } = await supabase.from('sites').select('id, user_id, name, slug, status, published, plan, parts, files, updated_at, created_at').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Row | null) ?? fail('Site não encontrado.');
}
async function detail(row: Row): Promise<ProjectDetail> {
  const { data, error } = await supabase.from('site_versions').select('id, kind, instruction, plan, parts, files, created_at').eq('site_id', row.id).order('created_at', { ascending: false }).limit(30);
  if (error) throw new Error(error.message);
  const history: Checkpoint[] = ((data ?? []) as VersionRow[]).filter(version => version.plan && version.parts).map(version => ({
    id: version.id, created_at: version.created_at, files: toIdeTree({ plan: version.plan!, parts: version.parts!, files: version.files ?? {} }),
    label: version.instruction?.trim() || (version.kind === 'restore' ? 'Versão restaurada' : version.kind === 'create' ? 'Versão anterior à alteração' : 'Alteração'),
  }));
  const rev = remember(row);
  return { ...summary(row), revision: rev, files: toIdeTree(stateOf(row)), history };
}
async function save(id: string, revision: number, next: Record<string, string>): Promise<Row> {
  const known = revisions.get(id);
  if (!known || known.rev !== revision) fail('O projeto foi alterado em outra janela. Recarregue a página.');
  const bad = Object.keys(next).find(path => !isSitePath(path));
  if (bad) fail(`Neste ambiente só são editados site.json, secoes/*.html, paginas/*.html, estilos.css e script.js (${bad.slice(1)}).`);
  const row = await fetchRow(id);
  const state = fromIdeTree(next, stateOf(row));
  const { data, error } = await supabase.from('sites').update({ plan: state.plan, parts: state.parts, files: state.files }).eq('id', id).eq('updated_at', known!.updated_at).select('id, user_id, name, slug, status, published, plan, parts, files, updated_at, created_at').maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Row | null) ?? fail('O site mudou em outra janela (ou pelo assistente). Recarregue a página.');
}
async function checkpoint(row: Row, label: string) {
  const { error } = await supabase.from('site_versions').insert({ site_id: row.id, user_id: row.user_id, kind: 'edit', instruction: label.slice(0, 200), actions: [], plan: row.plan, parts: row.parts, files: row.files ?? {} });
  if (error) throw new Error(error.message);
}
const consoleBridge = (channel: string) => `<script>(function(){var c=${JSON.stringify(channel)};var n=0;function s(l,a){if(++n>300)return;parent.postMessage({channel:c,level:l,text:a.map(function(v){try{return typeof v==='string'?v:v instanceof Error?v.message:JSON.stringify(v)}catch(e){return String(v)}}).join(' ').slice(0,4000)},'*')}['log','info','warn','error'].forEach(function(l){var o=console[l];console[l]=function(){o.apply(console,arguments);s(l,[].slice.call(arguments))}});addEventListener('error',function(e){s('error',[e.message])})})();</script>`;

type Body = Record<string, unknown>;
export async function cloudApi<T>(path: string, method: string, body?: unknown): Promise<T> {
  const input = (body ?? {}) as Body; const url = new URL(path, 'http://x'); const parts = url.pathname.split('/').filter(Boolean);
  const out = (value: unknown) => value as T;
  if (parts[0] === 'projects' && parts.length === 1) {
    if (method === 'GET') {
      if (url.searchParams.get('deleted') === 'true') return out([]);
      const { data, error } = await supabase.from('sites').select('id, name, slug, published, created_at, updated_at').eq('status', 'ready').order('updated_at', { ascending: false });
      if (error) throw new Error(error.message);
      return out((data ?? []).map(row => { remember(row as Row); return summary(row as Row); }));
    }
    fail('Para criar um site novo, use o Code Maker.');
  }
  if (parts[0] === 'projects') {
    const id = parts[1]; const action = parts[2];
    if (!action) {
      if (method === 'GET') return out(await detail(await fetchRow(id)));
      if (method === 'PUT' && typeof input.name === 'string') {
        const { error } = await supabase.from('sites').update({ name: input.name.trim().slice(0, 100) }).eq('id', id); if (error) throw new Error(error.message);
        return out(await detail(await fetchRow(id)));
      }
      if (method === 'PUT') return out(await detail(await save(id, Number(input.revision), input.files as Record<string, string>)));
      fail('Para apagar um site, use o Code Maker.');
    }
    if (action === 'apply' && method === 'POST') {
      const row = await fetchRow(id); const known = revisions.get(id);
      if (!known || known.rev !== Number(input.revision)) fail('O projeto foi alterado em outra janela. Recarregue a página.');
      await checkpoint(row, String(input.label || 'Antes da alteração'));
      return out(await detail(await save(id, Number(input.revision), input.files as Record<string, string>)));
    }
    if (action === 'publish' && method === 'POST') {
      // Salvar de verdade: monta as páginas a partir do que está gravado e publica o site.
      const row = await fetchRow(id); const known = revisions.get(id);
      if (!known || known.rev !== Number(input.revision)) fail('O projeto foi alterado em outra janela. Recarregue a página.');
      const state = stateOf(row); const built = assemble(state);
      if (!/<main\b/.test(built.html) || Object.values(built.pages_html).some(page => !/<main\b/.test(page))) fail('O site não monta com esses arquivos (falta o <main>). Nada foi publicado.');
      const { data, error } = await supabase.from('sites').update({ ...built, published: true }).eq('id', id).eq('updated_at', known!.updated_at).select('id, user_id, name, slug, status, published, plan, parts, files, updated_at, created_at').maybeSingle();
      if (error) throw new Error(error.message);
      const saved = (data as Row | null) ?? fail('O site mudou em outra janela (ou pelo assistente). Recarregue a página.');
      return out({ revision: remember(saved), publicUrl: `${location.origin}/${saved.slug}` });
    }
    if (action === 'checkpoint' && method === 'POST') { await checkpoint(await fetchRow(id), String(input.label || 'Checkpoint manual')); return out({}); }
    if (action === 'restore' && method === 'POST') {
      const row = await fetchRow(id);
      const { data, error } = await supabase.from('site_versions').select('plan, parts, files').eq('id', String(input.id)).eq('site_id', id).maybeSingle();
      if (error || !data?.plan || !data.parts) throw new Error(error?.message || 'Esta versão não pode ser restaurada.');
      await checkpoint(row, 'Antes de restaurar uma versão');
      const state: SiteState = { plan: data.plan, parts: data.parts, files: (data.files as SiteState['files']) ?? {} };
      const { data: saved, error: updateError } = await supabase.from('sites').update({ plan: state.plan, parts: state.parts, files: state.files, status: 'ready', ...assemble(state) }).eq('id', id).select('id, user_id, name, slug, status, published, plan, parts, files, updated_at, created_at').single();
      if (updateError) throw new Error(updateError.message);
      return out(await detail(saved as Row));
    }
    if (action === 'preview' && method === 'POST') {
      const row = await fetchRow(id);
      const state = fromIdeTree((input.files as Record<string, string>) ?? {}, stateOf(row));
      const channel = crypto.randomUUID();
      return out({ html: assemble(state).html.replace('</head>', `${consoleBridge(channel)}</head>`), channel, errors: [], warnings: [] });
    }
    if (action === 'workspace') return out({ path: '', trusted: false, scripts: {}, shell: '' });
    if (action === 'git') return out({ initialized: false, branch: '', files: [], commits: [] });
    if (action === 'conversation') return out(method === 'GET' ? [] : {});
  }
  if (parts[0] === 'status') return out({ ai: true, model: 'Code Maker' });
  fail('Este recurso só existe na IDE instalada no computador.');
  return out(null);
}
