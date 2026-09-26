// O conteúdo do app rola dentro do <main> (com Lenis), não na window.
// Este evento pede ao Lenis para voltar ao topo; sem Lenis (movimento reduzido),
// rola o <main> direto.
export const SCROLL_TOP_EVENT = 'code-sellers:scroll-top'

export function scrollAppToTop(options: { smooth?: boolean } = {}) {
  const event = new CustomEvent(SCROLL_TOP_EVENT, { cancelable: true, detail: { smooth: Boolean(options.smooth) } })
  const handled = !window.dispatchEvent(event)
  if (!handled) document.querySelector('main')?.scrollTo({ top: 0, behavior: options.smooth ? 'smooth' : 'auto' })
}
