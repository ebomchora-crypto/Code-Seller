// "Baixar PDF": abre uma janela só com o documento, já formatado para papel, e
// chama a impressão do navegador (onde a pessoa escolhe "Salvar como PDF").

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<em>$2</em>')
}

// Markdown simples (títulos, negrito, itálico, listas, parágrafos) → HTML.
export function markdownToHtml(markdown: string): string {
  const html: string[] = []
  let list: 'ul' | 'ol' | null = null
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length > 0) html.push(`<p>${paragraph.map(inline).join('<br />')}</p>`)
    paragraph = []
  }
  const closeList = () => {
    if (list) html.push(`</${list}>`)
    list = null
  }

  for (const rawLine of markdown.split('\n')) {
    const line = rawLine.trimEnd()
    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/)

    if (!line.trim()) {
      flushParagraph()
      closeList()
    } else if (heading) {
      flushParagraph()
      closeList()
      const level = Math.min(heading[1].length + 1, 4)
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (bullet || numbered) {
      flushParagraph()
      const kind = bullet ? 'ul' : 'ol'
      if (list !== kind) {
        closeList()
        html.push(`<${kind}>`)
        list = kind
      }
      html.push(`<li>${inline((bullet ?? numbered)![1])}</li>`)
    } else if (/^-{3,}$/.test(line.trim())) {
      flushParagraph()
      closeList()
      html.push('<hr />')
    } else {
      closeList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  closeList()
  return html.join('\n')
}

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Inter, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #151318; margin: 0; padding: 32px; line-height: 1.55; font-size: 12.5pt; }
  h1, h2, h3, h4 { font-family: Sora, Inter, sans-serif; line-height: 1.25; margin: 1.2em 0 .5em; }
  h1 { font-size: 20pt; } h2 { font-size: 15pt; } h3 { font-size: 13pt; } h4 { font-size: 12pt; }
  p { margin: .5em 0; } ul, ol { margin: .4em 0 .4em 1.3em; padding: 0; } li { margin: .2em 0; }
  hr { border: 0; border-top: 1px solid #ddd; margin: 1.2em 0; }
  table { width: 100%; border-collapse: collapse; margin: .6em 0 1em; font-size: 11pt; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e5e5; }
  th { font-size: 9.5pt; text-transform: uppercase; letter-spacing: .06em; color: #666; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: #666; font-size: 10.5pt; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 1em 0; }
  .kpi { border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px 12px; }
  .kpi b { display: block; font-size: 15pt; margin-top: 2px; }
  .bar { height: 8px; border-radius: 99px; background: #7c3aed; }
  .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 18px; }
  @page { margin: 16mm; }
  @media print { body { padding: 0; } }
`

export function openPrintWindow(title: string, bodyHtml: string): boolean {
  const win = window.open('', '_blank', 'width=900,height=1100')
  if (!win) return false
  win.document.write(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>${PRINT_STYLES}</style></head><body>${bodyHtml}</body></html>`,
  )
  win.document.close()
  win.focus()
  window.setTimeout(() => win.print(), 350)
  return true
}
