// Code Maker — o projeto como arquivos. O site é guardado em três lugares:
// o plano (cores, fontes, ordem das seções), as seções em HTML (parts) e os
// arquivos extras (files: estilos.css, script.js, paginas/*.html). A IA da
// alteração trabalha sobre esta árvore de arquivos-fonte — nunca sobre o HTML
// montado — e cada operação dela é aplicada e conferida aqui, sem Deno nem
// banco (testado em src/utils/codeMakerProject.test.mjs).

import {
  applyEdit,
  balanceHtml,
  cleanFragment,
  normalizePart,
  pageSlugs,
  PAGE_PATH,
  parseActions,
  parseContent,
  replaceInPart,
  type EditResult,
  type PlanSection,
  type ProjectFiles,
  type SectionBackground,
  type SiteAsset,
  type SiteBrief,
  type SiteParts,
  type SitePlan,
} from './site.ts'

export type FileTree = Record<string, string>

export const SITE_JSON = 'site.json'
export const STYLES = 'estilos.css'
export const SCRIPT = 'script.js'
export const SECTION_PATH = /^secoes\/([a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?)\.html$/
const MAX_FILE_CHARS = 120_000
const MAX_CODE_CHARS = 80_000
const MAX_PAGES = 12
const HEX = /^#[0-9a-f]{6}$/i
const PROTECTED = new Set(['header', 'footer', 'hero'])

export function sectionPath(id: string): string {
  return `secoes/${id}.html`
}

export function isProjectPath(path: string): boolean {
  return path === SITE_JSON || path === STYLES || path === SCRIPT || SECTION_PATH.test(path) || PAGE_PATH.test(path)
}

// ---------------------------------------------------------------------------
// Árvore de arquivos a partir do que está guardado
// ---------------------------------------------------------------------------

interface SiteJson {
  titulo: string
  descricao: string
  idioma: string
  cores: SitePlan['palette']
  fontes: SitePlan['fonts']
  cantos: NonNullable<SitePlan['radius']>
  secoes: { id: string; rotulo: string; fundo: SectionBackground }[]
  paginas: string[]
}

export function siteJson(plan: SitePlan, files: ProjectFiles = {}): string {
  const value: SiteJson = {
    titulo: plan.title,
    descricao: plan.description,
    idioma: plan.lang ?? 'pt-BR',
    cores: plan.palette,
    fontes: plan.fonts,
    cantos: plan.radius ?? 'soft',
    secoes: plan.sections.map((section) => ({ id: section.id, rotulo: section.label, fundo: section.bg })),
    paginas: pageSlugs(files).map((slug) => `paginas/${slug}.html`),
  }
  return JSON.stringify(value, null, 2)
}

/** Ordem de leitura: configuração, cabeçalho, seções, rodapé, páginas, CSS e JS. */
export function projectTree(plan: SitePlan, parts: SiteParts, files: ProjectFiles = {}): FileTree {
  const tree: FileTree = { [SITE_JSON]: siteJson(plan, files) }
  for (const id of ['header', ...plan.sections.map((section) => section.id), 'footer']) {
    if (parts[id]) tree[sectionPath(id)] = parts[id]
  }
  for (const slug of pageSlugs(files)) tree[`paginas/${slug}.html`] = files[`paginas/${slug}.html`]
  if (files[STYLES]) tree[STYLES] = files[STYLES]
  if (files[SCRIPT]) tree[SCRIPT] = files[SCRIPT]
  return tree
}

// Resumo de um arquivo para o índice (o que a IA vê dos arquivos que não
// foram enviados inteiros).
function summary(path: string, content: string): string {
  if (path.endsWith('.html')) {
    const headings = [...content.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)]
      .map((match) => match[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 6)
    const items = (content.match(/<(?:article|li|details)\b/gi) ?? []).length
    return [headings.length ? `títulos: ${headings.join(' | ')}` : '', items ? `${items} itens` : ''].filter(Boolean).join('; ')
  }
  if (path === SITE_JSON) return 'configuração: título, cores, fontes, ordem das seções'
  return content.split('\n').find((line) => line.trim())?.trim().slice(0, 80) ?? ''
}

export function fileIndex(tree: FileTree): string {
  return Object.entries(tree)
    .map(([path, content]) => `- ${path} (${content.length} caracteres)${summary(path, content) ? ` — ${summary(path, content)}` : ''}`)
    .join('\n')
}

// ---------------------------------------------------------------------------
// Quais arquivos vão inteiros para a IA
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(['para', 'com', 'uma', 'que', 'dos', 'das', 'nos', 'nas', 'todo', 'toda', 'todos', 'todas', 'site', 'mais', 'como', 'deixe', 'faça', 'coloque', 'quero', 'pagina', 'página', 'seção', 'secao'])

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
}

/**
 * Arquivos que vão inteiros. Projeto pequeno: todos. Grande: os pedidos pela
 * IA de seleção (`chosen`), os que o pedido cita por palavra e os de
 * configuração — os demais aparecem só no índice.
 */
export function selectFiles(tree: FileTree, instruction: string, budget: number, chosen: string[] = []): string[] {
  const paths = Object.keys(tree)
  const total = Object.values(tree).reduce((sum, content) => sum + content.length, 0)
  if (total <= budget) return paths
  const always = [SITE_JSON, STYLES, SCRIPT, sectionPath('header')].filter((path) => tree[path] !== undefined)
  const asked = words(instruction)
  const matched = paths.filter((path) => {
    const haystack = words(`${path} ${summary(path, tree[path])}`)
    return asked.some((word) => haystack.some((item) => item.startsWith(word.slice(0, 6))))
  })
  const picked: string[] = []
  let used = 0
  for (const path of [...always, ...chosen.filter((path) => tree[path] !== undefined), ...matched]) {
    if (picked.includes(path)) continue
    if (used + tree[path].length > budget && picked.length >= always.length) continue
    picked.push(path)
    used += tree[path].length
  }
  return picked
}

// ---------------------------------------------------------------------------
// Operações devolvidas pela IA
// ---------------------------------------------------------------------------

export type FileOperation =
  | { kind: 'edit'; path: string; before: string; after: string }
  | { kind: 'write'; path: string; content: string; after?: string; label?: string }
  | { kind: 'delete'; path: string }

export interface ProjectEdit {
  actions: string[]
  operations: FileOperation[]
  /** Seções redesenhadas com um bloco pronto (o código monta o HTML). */
  blocks: NonNullable<EditResult['blocks']>
  /** Itens com formato quebrado (contados como falha). */
  invalid: number
}

const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1]?.trim()

// Trecho de uma troca. Formato principal: <antes>…</antes><depois>…</depois>
// (código cru, sem escapar aspas). Também aceita o JSON {"antes","depois"} e,
// se o JSON veio com aspas do HTML sem escapar, recupera os dois textos.
function readPatch(body: string): { before: string; after: string } | null {
  const tagged = body.match(/<antes>\n?([\s\S]*?)\n?<\/antes>\s*<depois>\n?([\s\S]*?)\n?<\/depois>/i)
  if (tagged) return tagged[1] ? { before: tagged[1], after: tagged[2] } : null
  try {
    const patch = JSON.parse(body)
    if (typeof patch.antes === 'string' && patch.antes && typeof patch.depois === 'string') return { before: patch.antes, after: patch.depois }
    return null
  } catch {
    const loose = body.trim().match(/^\{\s*"antes"\s*:\s*"([\s\S]*?)"\s*,\s*"depois"\s*:\s*"([\s\S]*)"\s*\}$/)
    if (!loose || !loose[1]) return null
    const unescape = (value: string) => value.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    return { before: unescape(loose[1]), after: unescape(loose[2]) }
  }
}

function cleanPath(value: string | undefined): string {
  return (value ?? '').trim().replace(/^\.?\//, '').toLowerCase()
}

/**
 * Lê a resposta da alteração. Formato atual: <editar arquivo>, <escrever
 * arquivo>, <apagar arquivo/> e <bloco>. Também entende o formato antigo
 * (<substituir id>, <parte id>, <remover id/>, <tema>), convertido para
 * operações nos mesmos arquivos.
 */
export function parseProjectEdit(raw: string): ProjectEdit {
  // A última tag às vezes chega cortada ("</editar"): completa.
  const text = raw.replace(/<\/(editar|escrever|substituir|parte|bloco|acoes|tema)\s*$/i, '</$1>')
  const operations: FileOperation[] = []
  let invalid = 0
  const tags = /<(editar|substituir)\s+([^>]*)>([\s\S]*?)<\/\1>|<(escrever|parte)\s+([^>]*)>([\s\S]*?)<\/\4>|<(apagar|remover)\s+([^>]*?)\/?>/gi
  for (const match of text.matchAll(tags)) {
    if (match[1]) {
      const path = match[1].toLowerCase() === 'substituir' ? sectionPath(cleanPath(attr(match[2], 'id'))) : cleanPath(attr(match[2], 'arquivo'))
      const patch = readPatch(match[3])
      if (patch) operations.push({ kind: 'edit', path, ...patch })
      else invalid++
    } else if (match[4]) {
      const legacy = match[4].toLowerCase() === 'parte'
      const path = legacy ? sectionPath(cleanPath(attr(match[5], 'id'))) : cleanPath(attr(match[5], 'arquivo'))
      const after = attr(match[5], 'depois')
      const label = attr(match[5], 'rotulo')
      operations.push({ kind: 'write', path, content: match[6].replace(/^\s*```[a-z]*\n?|\n?```\s*$/gi, ''), ...(after ? { after: after.replace(/^secoes\/|\.html$/g, '') } : {}), ...(label ? { label } : {}) })
    } else if (match[7]) {
      const legacy = match[7].toLowerCase() === 'remover'
      operations.push({ kind: 'delete', path: legacy ? sectionPath(cleanPath(attr(match[8], 'id'))) : cleanPath(attr(match[8], 'arquivo')) })
    }
  }
  // Formato antigo de tema: vira uma alteração do site.json.
  const theme = text.match(/<tema>([\s\S]*?)<\/tema>/i)?.[1]
  if (theme) {
    try {
      operations.push({ kind: 'write', path: `${SITE_JSON}#tema`, content: JSON.stringify(JSON.parse(theme.trim())) })
    } catch {
      invalid++
    }
  }
  const blocks: ProjectEdit['blocks'] = []
  for (const match of text.matchAll(/<bloco\s+([^>]*)>([\s\S]*?)<\/bloco>/gi)) {
    const id = cleanPath(attr(match[1], 'id')).replace(/^secoes\/|\.html$/g, '')
    const content = parseContent(match[2])
    if (!id || !content) { invalid++; continue }
    const bg = attr(match[1], 'fundo')
    blocks.push({
      id,
      block: attr(match[1], 'modelo') ?? '',
      content,
      ...(attr(match[1], 'depois') ? { after: attr(match[1], 'depois')!.replace(/^secoes\/|\.html$/g, '') } : {}),
      ...(attr(match[1], 'rotulo') ? { label: attr(match[1], 'rotulo') } : {}),
      ...(bg && ['paper', 'surface', 'ink', 'brand'].includes(bg) ? { bg: bg as SectionBackground } : {}),
    })
  }
  // Tag aberta sem fechar = item perdido.
  for (const name of ['editar', 'escrever', 'substituir', 'parte', 'bloco']) {
    invalid += Math.max(0, (text.match(new RegExp(`<${name}\\b`, 'gi')) ?? []).length - (text.match(new RegExp(`</${name}>`, 'gi')) ?? []).length)
  }
  return { actions: parseActions(text), operations, blocks, invalid }
}

// ---------------------------------------------------------------------------
// Aplicação conferida
// ---------------------------------------------------------------------------

export interface OperationResult {
  path: string
  kind: FileOperation['kind'] | 'block'
  ok: boolean
  reason?: string
}

export interface FileChange {
  path: string
  change: 'criado' | 'alterado' | 'apagado'
  before: number
  after: number
}

export interface ProjectEditResult {
  plan: SitePlan
  parts: SiteParts
  files: ProjectFiles
  results: OperationResult[]
  changes: FileChange[]
}

function rejectEmbedded(html: string): string | null {
  if (/<script\b/i.test(html)) return 'HTML com <script>: o JavaScript vai em script.js'
  if (/<style\b/i.test(html)) return 'HTML com <style>: o CSS vai em estilos.css'
  if (/\son[a-z]+\s*=/i.test(html)) return 'HTML com evento inline (onclick…): use script.js'
  return null
}

function validateCode(path: string, content: string): string | null {
  if (content.length > MAX_CODE_CHARS) return `arquivo grande demais (máximo ${MAX_CODE_CHARS} caracteres)`
  if (path === SCRIPT) {
    if (/<\/script/i.test(content)) return 'script.js não pode fechar a tag <script>'
    try {
      new Function(content)
    } catch (error) {
      if (error instanceof SyntaxError) return `erro de sintaxe no JavaScript: ${error.message}`
    }
  }
  if (path === STYLES) {
    if (/<\/style/i.test(content)) return 'estilos.css não pode fechar a tag <style>'
    const open = (content.match(/{/g) ?? []).length
    const close = (content.match(/}/g) ?? []).length
    if (open !== close) return 'CSS com chaves { } desbalanceadas'
  }
  return null
}

// site.json → plano. Seção que não está na lista continua no fim (só some com
// <apagar>); seção listada sem arquivo é ignorada.
export function planFromSiteJson(text: string, plan: SitePlan, sectionIds: string[]): SitePlan | string {
  let value: Partial<SiteJson>
  try {
    value = JSON.parse(text)
  } catch {
    return 'site.json não é um JSON válido'
  }
  const next: SitePlan = { ...plan, palette: { ...plan.palette }, fonts: { ...plan.fonts } }
  if (typeof value.titulo === 'string' && value.titulo.trim()) next.title = value.titulo.trim().slice(0, 120)
  if (typeof value.descricao === 'string') next.description = value.descricao.trim().slice(0, 300)
  if (typeof value.idioma === 'string' && /^[a-z]{2}(?:-[A-Z]{2})?$/.test(value.idioma)) next.lang = value.idioma
  for (const [key, color] of Object.entries(value.cores ?? {})) {
    if (key in next.palette && typeof color === 'string' && HEX.test(color)) next.palette[key as keyof SitePlan['palette']] = color
  }
  for (const key of ['display', 'body'] as const) {
    const font = value.fontes?.[key]
    if (typeof font === 'string' && /^[A-Za-z0-9 ]{2,40}$/.test(font.trim())) next.fonts[key] = font.trim()
  }
  if (value.cantos && ['round', 'soft', 'sharp'].includes(value.cantos)) next.radius = value.cantos
  const listed = Array.isArray(value.secoes) ? value.secoes : []
  const byId = new Map(plan.sections.map((section) => [section.id, section]))
  const ordered: PlanSection[] = []
  for (const item of listed) {
    const id = typeof item?.id === 'string' ? item.id : ''
    if (!sectionIds.includes(id) || ordered.some((section) => section.id === id)) continue
    const base = byId.get(id) ?? { id, label: id, brief: '', bg: 'paper' as SectionBackground }
    ordered.push({
      ...base,
      ...(typeof item.rotulo === 'string' && item.rotulo.trim() ? { label: item.rotulo.trim().slice(0, 40) } : {}),
      ...(item.fundo && ['paper', 'surface', 'ink', 'brand'].includes(item.fundo) ? { bg: item.fundo } : {}),
    })
  }
  for (const section of plan.sections) if (!ordered.some((item) => item.id === section.id)) ordered.push(section)
  next.sections = ordered
  return next
}

/**
 * Aplica as operações sobre uma cópia do projeto. Cada operação é conferida
 * (caminho permitido, trecho encontrado, HTML/CSS/JS/JSON válidos); a que
 * falha não muda nada e entra no relatório com o motivo. `changes` vem da
 * comparação dos arquivos antes e depois — não do que a IA disse.
 */
export function applyProjectEdit(
  plan: SitePlan,
  parts: SiteParts,
  files: ProjectFiles,
  edit: ProjectEdit,
  context: { brief: SiteBrief; fresh?: SiteAsset[] },
): ProjectEditResult {
  const before = projectTree(plan, parts, files)
  const results: OperationResult[] = []
  let nextPlan: SitePlan = { ...plan, sections: [...plan.sections] }
  const nextParts: SiteParts = { ...parts }
  const nextFiles: ProjectFiles = { ...files }
  let jsonText = before[SITE_JSON]

  const read = (path: string): string | undefined => {
    if (path === SITE_JSON) return jsonText
    const section = path.match(SECTION_PATH)?.[1]
    if (section) return nextParts[section]
    return nextFiles[path]
  }

  const writeSection = (id: string, html: string, options: { after?: string; label?: string } = {}): string | null => {
    const problem = rejectEmbedded(html)
    if (problem) return problem
    const normalized = normalizePart(id, cleanFragment(html))
    if (!normalized) return 'HTML vazio'
    if (normalized.length > MAX_FILE_CHARS) return 'arquivo grande demais'
    const known = id === 'header' || id === 'footer' || nextPlan.sections.some((section) => section.id === id)
    if (!known) {
      const section: PlanSection = { id, label: (options.label ?? id).slice(0, 40), brief: '', bg: 'paper' }
      const index = options.after ? nextPlan.sections.findIndex((entry) => entry.id === options.after) : -1
      if (index >= 0) nextPlan.sections.splice(index + 1, 0, section)
      else nextPlan.sections.push(section)
    }
    nextParts[id] = normalized
    return null
  }

  const writeFile = (path: string, content: string, options: { after?: string; label?: string } = {}): string | null => {
    const section = path.match(SECTION_PATH)?.[1]
    if (section) return writeSection(section, content, options)
    if (path === SITE_JSON) {
      const planned = planFromSiteJson(content, nextPlan, nextPlan.sections.map((entry) => entry.id))
      if (typeof planned === 'string') return planned
      nextPlan = planned
      jsonText = content
      return null
    }
    const page = path.match(PAGE_PATH)?.[1]
    if (page) {
      const problem = rejectEmbedded(content)
      if (problem) return problem
      // O <main> da página é posto na montagem: um <main> do arquivo vira só o conteúdo.
      let body = cleanFragment(content).trim()
      const wrapped = body.match(/^<main\b[^>]*>([\s\S]*)<\/main>$/i)
      if (wrapped) body = wrapped[1].trim()
      const html = balanceHtml(body)
      if (!html) return 'HTML vazio'
      if (html.length > MAX_FILE_CHARS) return 'arquivo grande demais'
      if (nextFiles[path] === undefined && pageSlugs(nextFiles).length >= MAX_PAGES) return `limite de ${MAX_PAGES} páginas`
      nextFiles[path] = html
      return null
    }
    if (path === STYLES || path === SCRIPT) {
      const problem = validateCode(path, content)
      if (problem) return problem
      if (content.trim()) nextFiles[path] = content.trim() + '\n'
      else delete nextFiles[path]
      return null
    }
    return 'caminho fora do projeto'
  }

  for (const operation of edit.operations) {
    const path = operation.path
    const record = (reason: string | null) => results.push({ path: path.replace(/#tema$/, ''), kind: operation.kind, ok: !reason, ...(reason ? { reason } : {}) })
    // Tema no formato antigo: mistura com o site.json atual.
    if (path === `${SITE_JSON}#tema` && operation.kind === 'write') {
      try {
        const theme = JSON.parse(operation.content) as { palette?: Record<string, string>; fonts?: Record<string, string>; lang?: string }
        const current = JSON.parse(jsonText) as SiteJson
        record(writeFile(SITE_JSON, JSON.stringify({
          ...current,
          cores: { ...current.cores, ...(theme.palette ?? {}) },
          fontes: { ...current.fontes, ...(theme.fonts ?? {}) },
          ...(theme.lang ? { idioma: theme.lang } : {}),
        }, null, 2)))
      } catch {
        record('tema inválido')
      }
      continue
    }
    if (path === 'index.html') {
      record('index.html é montado a partir das seções: altere secoes/*.html')
      continue
    }
    if (!isProjectPath(path)) {
      record('caminho fora do projeto')
      continue
    }
    if (operation.kind === 'delete') {
      const section = path.match(SECTION_PATH)?.[1]
      if (section) {
        if (PROTECTED.has(section)) { record('o cabeçalho, o topo e o rodapé não podem ser apagados'); continue }
        if (nextParts[section] === undefined) { record('arquivo não existe'); continue }
        delete nextParts[section]
        nextPlan.sections = nextPlan.sections.filter((entry) => entry.id !== section)
        record(null)
      } else if (path === SITE_JSON) {
        record('site.json não pode ser apagado')
      } else if (nextFiles[path] === undefined) {
        record('arquivo não existe')
      } else {
        delete nextFiles[path]
        record(null)
      }
      continue
    }
    if (operation.kind === 'write') {
      record(writeFile(path, operation.content, { after: operation.after, label: operation.label }))
      continue
    }
    // Trecho localizado: primeiro no arquivo indicado; numa seção, se a IA errou
    // o arquivo, procura nas outras seções.
    const source = read(path)
    let updated = source === undefined ? null : replaceInPart(source, operation.before, operation.after)
    let target = path
    if (updated === null && SECTION_PATH.test(path)) {
      for (const id of Object.keys(nextParts)) {
        const candidate = replaceInPart(nextParts[id], operation.before, operation.after)
        if (candidate !== null) { updated = candidate; target = sectionPath(id); break }
      }
    }
    if (updated === null) {
      record(source === undefined ? 'arquivo não existe' : 'trecho "antes" não encontrado no arquivo')
      continue
    }
    record(writeFile(target, updated))
  }

  // Seções redesenhadas com bloco pronto: o código monta o HTML.
  if (edit.blocks.length) {
    try {
      const built = applyEdit(nextPlan, nextParts, { actions: [], parts: [], replacements: [], blocks: edit.blocks, removals: [], theme: null }, context)
      nextPlan = built.plan
      Object.assign(nextParts, built.parts)
      for (const item of edit.blocks) results.push({ path: sectionPath(item.id), kind: 'block', ok: true })
    } catch (error) {
      for (const item of edit.blocks) results.push({ path: sectionPath(item.id), kind: 'block', ok: false, reason: error instanceof Error ? error.message : 'bloco inválido' })
    }
  }

  const after = projectTree(nextPlan, nextParts, nextFiles)
  const changes: FileChange[] = []
  for (const path of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (before[path] === after[path]) continue
    changes.push({
      path,
      change: before[path] === undefined ? 'criado' : after[path] === undefined ? 'apagado' : 'alterado',
      before: before[path]?.length ?? 0,
      after: after[path]?.length ?? 0,
    })
  }
  return { plan: nextPlan, parts: nextParts, files: nextFiles, results, changes }
}

/** Linhas do relatório que a tela mostra: só o que de fato mudou nos arquivos. */
export function changeReport(changes: FileChange[], results: OperationResult[], invalid = 0): string[] {
  const lines = changes.map((change) => {
    const delta = change.after - change.before
    return change.change === 'alterado'
      ? `Arquivo alterado: ${change.path} (${delta >= 0 ? '+' : ''}${delta} caracteres)`
      : `Arquivo ${change.change}: ${change.path}`
  })
  const failed = results.filter((result) => !result.ok)
  if (failed.length) lines.push(`Não aplicado (${failed.length}): ${failed.slice(0, 4).map((result) => `${result.path} — ${result.reason}`).join('; ')}`)
  if (invalid) lines.push(`Não aplicado (${invalid}): ${invalid === 1 ? 'uma operação veio' : `${invalid} operações vieram`} com formato quebrado`)
  return lines
}
