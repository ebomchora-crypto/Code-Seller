// Versão do site que está aberta x a publicada agora. O Code Sellers é uma
// página única: quem deixa a aba (ou o app de Windows) aberta continua com o
// código antigo até recarregar. Aqui comparamos o arquivo principal (que muda
// de nome a cada publicação) com o do index.html publicado.

const ENTRY = /\/assets\/[^"'\s]*index-[A-Za-z0-9_-]+\.js/

export function entryFromHtml(html: string): string | null {
  return html.match(ENTRY)?.[0] ?? null
}

export function loadedEntry(doc: Document = document): string | null {
  for (const script of Array.from(doc.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'))) {
    const path = new URL(script.src, window.location.origin).pathname
    if (ENTRY.test(path)) return path
  }
  return null
}

export async function publishedEntry(): Promise<string | null> {
  const response = await fetch(`/?v=${Date.now()}`, { cache: 'no-store', headers: { accept: 'text/html' } })
  if (!response.ok) return null
  return entryFromHtml(await response.text())
}

/** true quando já existe uma versão publicada diferente da aberta. */
export function isOutdated(loaded: string | null, published: string | null): boolean {
  return Boolean(loaded && published && loaded !== published)
}
