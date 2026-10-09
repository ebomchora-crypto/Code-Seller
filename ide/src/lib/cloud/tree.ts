import { assemblePages, assembleSite, type ProjectFiles, type SiteParts, type SitePlan } from '../../../../supabase/functions/code-maker/site.ts';
import { planFromSiteJson, projectTree, SECTION_PATH, SITE_JSON, STYLES, SCRIPT, isProjectPath } from '../../../../supabase/functions/code-maker/project.ts';
import { PAGE_PATH } from '../../../../supabase/functions/code-maker/site.ts';

export type SiteState = { plan: SitePlan; parts: SiteParts; files: ProjectFiles };
const PROTECTED = new Set(['header', 'footer']);

/** Árvore de arquivos do IDE (caminhos com "/" na frente). */
export const toIdeTree = (state: SiteState): Record<string, string> =>
  Object.fromEntries(Object.entries(projectTree(state.plan, state.parts, state.files)).map(([path, content]) => [`/${path}`, content]));

/** Caminho permitido no site? (site.json, secoes/*.html, paginas/*.html, estilos.css, script.js) */
export const isSitePath = (idePath: string) => isProjectPath(idePath.replace(/^\//, ''));

/**
 * Volta da árvore do IDE para o formato guardado do site. É permissivo de propósito: durante a digitação o
 * conteúdo pode estar incompleto, e quem protege o site público é o quadro isolado em que ele roda.
 */
export function fromIdeTree(tree: Record<string, string>, current: SiteState): SiteState {
  const entries = Object.entries(tree).map(([path, content]) => [path.replace(/^\//, ''), content] as const).filter(([path]) => isProjectPath(path));
  const sectionFiles = entries.filter(([path]) => SECTION_PATH.test(path));
  const ids = sectionFiles.map(([path]) => path.match(SECTION_PATH)![1]);
  const parts: SiteParts = {};
  for (const [path, content] of sectionFiles) parts[path.match(SECTION_PATH)![1]] = content;
  const siteJson = entries.find(([path]) => path === SITE_JSON)?.[1];
  let plan = current.plan;
  if (siteJson !== undefined) { const next = planFromSiteJson(siteJson, current.plan, ids.filter(id => !PROTECTED.has(id))); if (typeof next !== 'string') plan = next; }
  // Seção apagada some do plano; seção nova entra no fim.
  const sections = plan.sections.filter(section => ids.includes(section.id));
  for (const id of ids) if (!PROTECTED.has(id) && !sections.some(section => section.id === id)) sections.push({ id, label: id, brief: '', bg: 'paper' });
  plan = { ...plan, sections };
  const files: ProjectFiles = {};
  for (const [path, content] of entries) if (path === STYLES || path === SCRIPT || PAGE_PATH.test(path)) files[path] = content;
  return { plan, parts, files };
}

export const assemble = (state: SiteState) => ({ html: assembleSite(state.plan, state.parts, { files: state.files }), pages_html: assemblePages(state.plan, state.parts, state.files) });
