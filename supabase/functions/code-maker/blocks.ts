// Blocos prontos dos sites do Code Maker: cabeçalhos, topos, seções e rodapé
// com acabamento de site premium (camadas, brilho na cor da marca, vidro,
// bordas finas, grades com máscara). Código próprio, escrito para HTML +
// Tailwind. O diretor de arte escolhe um bloco por seção e quem escreve a
// parte recebe o modelo já com as cores, os cantos e as fotos do site: a IA
// troca o conteúdo e ajusta, mas parte de um desenho bom.
//
// Marcadores trocados antes de ir para a IA:
//   {id} id da seção · {bg} fundo da seção · {tx} texto nesse fundo
//   {ptx} texto sobre paper · {btx} texto sobre brand · {htx} texto do cabeçalho no topo
//   {dk} painel de contraste (ink no tema claro, surface no escuro) · {dtx} texto nele
//   {rc} cantos de cartão · {ri} cantos internos · {rb} cantos de botão
//   {FOTO1}… fotos da seção · {wa} link do botão principal

export interface Block {
  kind: 'header' | 'hero' | 'section' | 'footer'
  /** Nome curto para o diretor de arte. */
  name: string
  /** Quando usar. */
  when: string
  /** Fotos que o bloco usa. */
  photos: number
  html: string
}

const ARROW =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4 transition-transform duration-200 group-hover:translate-x-0.5"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>'
const CHECK =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5 size-4 shrink-0"><path d="m5 12 5 5L20 7"/></svg>'
const ICON =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M12 3l2.5 5.5L20 9.5l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1z"/></svg>'
const PLUS =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-4"><path d="M12 5v14M5 12h14"/></svg>'
const MENU =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="size-5"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
const WHATSAPP =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" class="size-5"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1a17 17 0 0 1-1.7-.6 13.4 13.4 0 0 1-5.2-4.6c-.4-.5-1-1.4-1-2.7 0-1.2.7-1.9.9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.1 1.3Z"/></svg>'
const PIN =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-5"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>'
const CLOCK =
  '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="size-5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'

// Título de seção usado em quase todos os blocos.
const HEADING = `<p class="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Rótulo curto</p>
    <h2 class="mt-4 font-display text-[clamp(2rem,4.6vw,3.6rem)] font-bold leading-[1.04] tracking-tight">Título da seção com o benefício</h2>
    <p class="mt-5 max-w-xl text-lg leading-relaxed text-{tx}/70">Uma frase de apoio, concreta, dizendo o que a pessoa ganha.</p>`

const PRIMARY = `<a href="{wa}" class="group inline-flex min-h-12 items-center justify-center gap-2 {rb} bg-brand px-7 font-semibold text-{btx} shadow-lg shadow-brand/30 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand/40 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:scale-[0.98]">Ação principal ${ARROW}</a>`

export const BLOCKS: Record<string, Block> = {
  // ------------------------------------------------------------------ Cabeçalho
  'menu-pilula': {
    kind: 'header',
    name: 'Menu flutuante em pílula de vidro',
    when: 'Padrão moderno: menu centralizado, flutuando sobre o topo, com vidro fosco. Combina com quase tudo.',
    photos: 0,
    html: `<header data-header class="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:pt-4">
  <div class="mx-auto max-w-5xl rounded-[28px] border border-{ptx}/10 bg-paper/75 text-{ptx} shadow-[0_12px_40px_-18px_rgba(0,0,0,0.35)] backdrop-blur-xl">
    <div class="flex items-center justify-between gap-4 py-2 pl-5 pr-2">
      <a href="#hero" class="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight">
        <span class="grid size-8 place-items-center rounded-full bg-brand text-{btx}">${ICON}</span>
        Nome do negócio
      </a>
      <nav aria-label="Principal" class="hidden items-center gap-1 md:flex">
        <a href="#servicos" class="rounded-full px-3.5 py-2 text-sm font-medium text-{ptx}/70 transition hover:bg-{ptx}/5 hover:text-{ptx}">Serviços</a>
        <a href="#sobre" class="rounded-full px-3.5 py-2 text-sm font-medium text-{ptx}/70 transition hover:bg-{ptx}/5 hover:text-{ptx}">Sobre</a>
        <a href="#contato" class="rounded-full px-3.5 py-2 text-sm font-medium text-{ptx}/70 transition hover:bg-{ptx}/5 hover:text-{ptx}">Contato</a>
      </nav>
      <div class="flex items-center gap-1">
        <a href="{wa}" class="hidden min-h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-{btx} transition hover:brightness-110 active:scale-[0.98] sm:inline-flex">Ação principal</a>
        <button type="button" data-menu-toggle aria-label="Abrir menu" class="grid size-11 place-items-center rounded-full transition hover:bg-{ptx}/5 md:hidden">${MENU}</button>
      </div>
    </div>
    <div data-menu class="hidden border-t border-{ptx}/10 px-3 pb-4 pt-2 md:hidden">
      <a href="#servicos" class="block rounded-2xl px-4 py-3 font-medium hover:bg-{ptx}/5">Serviços</a>
      <a href="#sobre" class="block rounded-2xl px-4 py-3 font-medium hover:bg-{ptx}/5">Sobre</a>
      <a href="#contato" class="block rounded-2xl px-4 py-3 font-medium hover:bg-{ptx}/5">Contato</a>
      <a href="{wa}" class="mt-2 flex min-h-12 items-center justify-center rounded-full bg-brand font-semibold text-{btx}">Ação principal</a>
    </div>
  </div>
</header>`,
  },
  'menu-barra': {
    kind: 'header',
    name: 'Barra larga transparente',
    when: 'Menu de ponta a ponta, transparente sobre o topo e com fundo ao rolar. Bom com topo de foto inteira (hero-cinema) ou visual mais clássico.',
    photos: 0,
    html: `<header data-header class="fixed inset-x-0 top-0 z-50 border-b border-transparent text-{htx} transition-all duration-300 data-[scrolled]:border-{ptx}/10 data-[scrolled]:bg-paper/85 data-[scrolled]:text-{ptx} data-[scrolled]:shadow-sm data-[scrolled]:backdrop-blur-xl">
  <div class="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 md:px-8">
    <a href="#hero" class="flex items-center gap-2.5 font-display text-xl font-bold tracking-tight">
      <span class="grid size-9 place-items-center {ri} bg-brand text-{btx}">${ICON}</span>
      Nome do negócio
    </a>
    <nav aria-label="Principal" class="hidden items-center gap-8 text-sm font-medium md:flex">
      <a href="#servicos" class="opacity-75 transition hover:opacity-100">Serviços</a>
      <a href="#sobre" class="opacity-75 transition hover:opacity-100">Sobre</a>
      <a href="#contato" class="opacity-75 transition hover:opacity-100">Contato</a>
    </nav>
    <div class="flex items-center gap-2">
      <a href="{wa}" class="hidden min-h-11 items-center {rb} bg-brand px-5 text-sm font-semibold text-{btx} transition hover:brightness-110 sm:inline-flex">Ação principal</a>
      <button type="button" data-menu-toggle aria-label="Abrir menu" class="grid size-11 place-items-center {rb} md:hidden">${MENU}</button>
    </div>
  </div>
  <div data-menu class="hidden border-t border-{ptx}/10 bg-paper px-5 pb-5 pt-2 text-{ptx} md:hidden">
    <a href="#servicos" class="block py-3 font-medium">Serviços</a>
    <a href="#sobre" class="block py-3 font-medium">Sobre</a>
    <a href="#contato" class="block py-3 font-medium">Contato</a>
    <a href="{wa}" class="mt-2 flex min-h-12 items-center justify-center {rb} bg-brand font-semibold text-{btx}">Ação principal</a>
  </div>
</header>`,
  },

  // ------------------------------------------------------------------ Topo
  'hero-brilho': {
    kind: 'hero',
    name: 'Topo centralizado com brilho e foto em moldura',
    when: 'Título grande no centro sobre um brilho suave na cor da marca e uma grade fina; selo, 2 botões e uma foto larga numa moldura de vidro embaixo. Moderno, de produto/serviço premium, tecnologia, estética, academia.',
    photos: 1,
    html: `<section id="{id}" class="relative isolate overflow-hidden bg-{bg} pb-20 pt-32 text-{tx} md:pb-28 md:pt-44">
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10">
    <div class="absolute left-1/2 top-[-14rem] h-[38rem] w-[64rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]"></div>
    <div class="absolute right-[-8rem] top-48 size-80 rounded-full bg-accent/20 blur-[100px]"></div>
    <div class="absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:56px_56px] opacity-[0.05] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]"></div>
  </div>
  <div class="mx-auto max-w-6xl px-5 text-center md:px-8">
    <p class="mx-auto inline-flex items-center gap-2 rounded-full border border-{tx}/15 bg-{tx}/5 px-4 py-1.5 text-sm font-medium text-{tx}/80 backdrop-blur"><span class="size-1.5 rounded-full bg-accent"></span>Selo com um fato verdadeiro do negócio</p>
    <h1 class="mx-auto mt-7 max-w-4xl font-display text-[clamp(2.75rem,7.4vw,6rem)] font-bold leading-[1.02] tracking-tight">Título do topo com a <span class="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">palavra-chave</span> em destaque</h1>
    <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-{tx}/70 md:text-xl">Subtítulo de até duas linhas com o benefício concreto para quem visita.</p>
    <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
      ${PRIMARY}
      <a href="#servicos" class="inline-flex min-h-12 items-center justify-center {rb} border border-{tx}/15 bg-{tx}/5 px-7 font-semibold backdrop-blur transition hover:bg-{tx}/10">Ação secundária</a>
    </div>
    <div class="reveal relative mx-auto mt-16 max-w-5xl md:mt-20">
      <div aria-hidden="true" class="absolute -inset-x-6 -bottom-10 top-12 -z-10 rounded-[3rem] bg-brand/25 blur-3xl"></div>
      <div class="{rc} border border-{tx}/10 bg-{tx}/5 p-2 shadow-2xl backdrop-blur">
        <img src="{FOTO1}" alt="Descrição da foto" fetchpriority="high" class="aspect-[16/10] w-full {ri} object-cover md:aspect-[16/8]">
      </div>
    </div>
  </div>
</section>`,
  },
  'hero-dividido': {
    kind: 'hero',
    name: 'Topo dividido: texto + foto alta com foto menor sobreposta',
    when: 'Texto à esquerda e duas fotos em camadas à direita, com um selo de vidro. Versátil para serviços locais (clínica, salão, barbearia, imobiliária, restaurante).',
    photos: 2,
    html: `<section id="{id}" class="relative isolate overflow-hidden bg-{bg} pt-28 text-{tx} md:pt-36">
  <div aria-hidden="true" class="pointer-events-none absolute -right-40 -top-40 -z-10 size-[36rem] rounded-full bg-brand/20 blur-[120px]"></div>
  <div class="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 md:grid-cols-[1.05fr_1fr] md:px-8 md:pb-28">
    <div>
      <p class="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand"><span class="h-px w-8 bg-brand"></span>Rótulo · Cidade</p>
      <h1 class="mt-6 font-display text-[clamp(2.6rem,6.2vw,5.25rem)] font-bold leading-[1.02] tracking-tight">Título do topo que diz o que o negócio faz de melhor</h1>
      <p class="mt-6 max-w-xl text-lg leading-relaxed text-{tx}/70">Subtítulo curto com o benefício e o que está incluso.</p>
      <div class="mt-9 flex flex-col gap-3 sm:flex-row">
        ${PRIMARY}
        <a href="#servicos" class="inline-flex min-h-12 items-center justify-center {rb} border border-{tx}/15 px-7 font-semibold transition hover:bg-{tx}/5">Ação secundária</a>
      </div>
      <ul class="mt-12 grid max-w-lg grid-cols-3 divide-x divide-{tx}/10 border-y border-{tx}/10 py-5 text-sm">
        <li class="pr-4"><strong class="block font-display text-base">Vantagem 1</strong><span class="text-{tx}/60">detalhe curto</span></li>
        <li class="px-4"><strong class="block font-display text-base">Vantagem 2</strong><span class="text-{tx}/60">detalhe curto</span></li>
        <li class="pl-4"><strong class="block font-display text-base">Vantagem 3</strong><span class="text-{tx}/60">detalhe curto</span></li>
      </ul>
    </div>
    <div class="relative md:pl-6">
      <img src="{FOTO1}" alt="Descrição da foto principal" fetchpriority="high" class="aspect-[4/5] w-full {rc} object-cover shadow-2xl">
      <img src="{FOTO2}" alt="" loading="lazy" decoding="async" class="absolute -bottom-8 -left-2 hidden aspect-square w-40 {rc} border-[6px] border-{bg} object-cover shadow-xl md:block lg:w-48">
      <p class="absolute right-4 top-4 max-w-[13rem] rounded-2xl border border-white/20 bg-black/45 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">Destaque curto e verdadeiro</p>
    </div>
  </div>
</section>`,
  },
  'hero-cinema': {
    kind: 'hero',
    name: 'Topo de cinema: foto de fundo inteira',
    when: 'Foto forte ocupando a tela com degradê escuro e título enorme embaixo, em branco. Para negócios com foto de impacto (gastronomia, imóveis de alto padrão, academia, eventos, automotivo).',
    photos: 1,
    html: `<section id="{id}" class="relative isolate flex min-h-[94vh] items-end overflow-hidden bg-black text-white">
  <img src="{FOTO1}" alt="Descrição da foto" fetchpriority="high" class="absolute inset-0 -z-20 size-full object-cover">
  <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/55 to-black/20"></div>
  <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-black/60 via-transparent to-transparent"></div>
  <div class="mx-auto w-full max-w-6xl px-5 pb-14 pt-40 md:px-8 md:pb-20">
    <p class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur"><span class="size-1.5 rounded-full bg-accent"></span>Selo com um fato verdadeiro</p>
    <h1 class="mt-6 max-w-4xl font-display text-[clamp(3rem,8.4vw,7rem)] font-bold leading-[0.96] tracking-tight">Título do topo forte e curto</h1>
    <div class="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <p class="max-w-md text-lg leading-relaxed text-white/75">Subtítulo de até duas linhas com o benefício.</p>
      <div class="flex flex-col gap-3 sm:flex-row">
        ${PRIMARY}
        <a href="#servicos" class="inline-flex min-h-12 items-center justify-center {rb} border border-white/25 bg-white/10 px-7 font-semibold backdrop-blur transition hover:bg-white/20">Ação secundária</a>
      </div>
    </div>
    <dl class="mt-12 grid gap-6 border-t border-white/15 pt-6 sm:grid-cols-3">
      <div><dt class="text-sm text-white/60">Rótulo</dt><dd class="mt-1 font-display text-lg font-semibold">Informação útil</dd></div>
      <div><dt class="text-sm text-white/60">Rótulo</dt><dd class="mt-1 font-display text-lg font-semibold">Informação útil</dd></div>
      <div><dt class="text-sm text-white/60">Rótulo</dt><dd class="mt-1 font-display text-lg font-semibold">Informação útil</dd></div>
    </dl>
  </div>
</section>`,
  },
  'hero-editorial': {
    kind: 'hero',
    name: 'Topo editorial: tipografia gigante + mosaico de fotos',
    when: 'Título enorme em caixa alta ocupando a largura e uma faixa com 2 fotos e um cartão na cor da marca. Ousado e com personalidade (moda, barbearia, arquitetura, estúdio, marcas jovens).',
    photos: 2,
    html: `<section id="{id}" class="bg-{bg} pt-32 text-{tx} md:pt-40">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="flex flex-wrap items-end justify-between gap-6">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-{tx}/60">Rótulo · Cidade</p>
      <p class="max-w-sm text-base leading-relaxed text-{tx}/70">Subtítulo curto com o benefício principal.</p>
    </div>
    <h1 class="mt-6 font-display text-[clamp(3.25rem,11.5vw,10rem)] font-bold uppercase leading-[0.86] tracking-tight">Título<br><span class="text-brand">em duas</span> linhas</h1>
    <div class="mt-9 flex flex-col gap-3 sm:flex-row">
      ${PRIMARY}
      <a href="#servicos" class="inline-flex min-h-12 items-center justify-center {rb} border border-{tx}/15 px-7 font-semibold transition hover:bg-{tx}/5">Ação secundária</a>
    </div>
  </div>
  <div class="mx-auto mt-14 grid max-w-[88rem] grid-cols-12 gap-3 px-3 pb-20 md:gap-4 md:pb-28">
    <img src="{FOTO1}" alt="Descrição da foto" fetchpriority="high" class="col-span-12 aspect-[16/10] w-full {rc} object-cover md:col-span-7 md:aspect-auto md:h-[30rem]">
    <img src="{FOTO2}" alt="Descrição da foto" loading="lazy" decoding="async" class="col-span-6 aspect-[4/5] w-full {rc} object-cover md:col-span-3 md:aspect-auto md:h-[30rem]">
    <a href="{wa}" class="group col-span-6 flex flex-col justify-between {rc} bg-brand p-6 text-{btx} transition hover:brightness-110 md:col-span-2">
      <span class="font-display text-2xl font-bold leading-tight">Chamada curta</span>
      <span class="inline-flex items-center gap-2 text-sm font-semibold">Ação ${ARROW}</span>
    </a>
  </div>
</section>`,
  },

  // ------------------------------------------------------------------ Seções
  bento: {
    kind: 'section',
    name: 'Bento com luz que segue o mouse',
    when: 'Grade de blocos de tamanhos diferentes: um grande com foto e preço, outros com ícone e um na cor da marca. Ótimo para serviços ou diferenciais (4 a 5 itens).',
    photos: 1,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal max-w-2xl">
    ${HEADING}
    </div>
    <div data-fx="stagger" class="mt-14 grid gap-4 md:grid-cols-6">
      <article data-fx="spotlight" class="group relative isolate min-h-[24rem] overflow-hidden {rc} border border-{tx}/10 md:col-span-4 md:row-span-2">
        <img src="{FOTO1}" alt="Descrição da foto" loading="lazy" decoding="async" class="absolute inset-0 -z-10 size-full object-cover transition duration-700 ease-out group-hover:scale-105">
        <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
        <div class="flex h-full flex-col justify-end p-7 text-white md:p-9">
          <span class="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur tabular-nums">A partir de R$ 00</span>
          <h3 class="mt-3 font-display text-3xl font-bold">Serviço principal</h3>
          <p class="mt-2 max-w-md text-white/75">O que inclui e quanto tempo leva.</p>
        </div>
      </article>
      <article data-fx="spotlight" class="{rc} border border-{tx}/10 bg-{tx}/[0.03] p-7 md:col-span-2">
        <span class="grid size-11 place-items-center {ri} bg-brand/15 text-brand">${ICON}</span>
        <h3 class="mt-6 font-display text-xl font-semibold">Item</h3>
        <p class="mt-2 leading-relaxed text-{tx}/70">Descrição curta e útil.</p>
      </article>
      <article data-fx="spotlight" class="{rc} border border-{tx}/10 bg-{tx}/[0.03] p-7 md:col-span-2">
        <span class="grid size-11 place-items-center {ri} bg-brand/15 text-brand">${ICON}</span>
        <h3 class="mt-6 font-display text-xl font-semibold">Item</h3>
        <p class="mt-2 leading-relaxed text-{tx}/70">Descrição curta e útil.</p>
      </article>
      <article data-fx="spotlight" class="{rc} border border-{tx}/10 bg-{tx}/[0.03] p-7 md:col-span-3">
        <span class="grid size-11 place-items-center {ri} bg-brand/15 text-brand">${ICON}</span>
        <h3 class="mt-6 font-display text-xl font-semibold">Item</h3>
        <p class="mt-2 leading-relaxed text-{tx}/70">Descrição curta e útil.</p>
      </article>
      <a href="{wa}" class="group flex flex-col justify-between gap-8 {rc} bg-brand p-7 text-{btx} transition hover:brightness-110 md:col-span-3">
        <h3 class="font-display text-2xl font-bold leading-tight">Chamada curta para a ação</h3>
        <span class="inline-flex items-center gap-2 font-semibold">Ação ${ARROW}</span>
      </a>
    </div>
  </div>
</section>`,
  },
  'cards-foto': {
    kind: 'section',
    name: 'Cards com foto, zoom e etiqueta de vidro',
    when: 'Catálogo com foto: serviços, pratos, imóveis, produtos, planos de treino (3 a 6 itens com preço ou dado útil).',
    photos: 3,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div class="max-w-2xl">
      ${HEADING}
      </div>
      <a href="{wa}" class="group inline-flex items-center gap-2 font-semibold text-brand">Ver todos ${ARROW}</a>
    </div>
    <div data-fx="stagger" class="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <article class="group relative overflow-hidden {rc} bg-{tx}/5">
        <div class="aspect-[4/5] overflow-hidden"><img src="{FOTO1}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"></div>
        <div class="absolute inset-x-3 bottom-3 {ri} border border-white/15 bg-black/50 p-5 text-white backdrop-blur-md">
          <div class="flex items-start justify-between gap-4">
            <div><h3 class="font-display text-xl font-semibold">Nome do item</h3><p class="mt-1 text-sm text-white/70">Detalhe útil</p></div>
            <span class="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-black tabular-nums">R$ 00</span>
          </div>
        </div>
      </article>
      <article class="group relative overflow-hidden {rc} bg-{tx}/5">
        <div class="aspect-[4/5] overflow-hidden"><img src="{FOTO2}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"></div>
        <div class="absolute inset-x-3 bottom-3 {ri} border border-white/15 bg-black/50 p-5 text-white backdrop-blur-md">
          <div class="flex items-start justify-between gap-4">
            <div><h3 class="font-display text-xl font-semibold">Nome do item</h3><p class="mt-1 text-sm text-white/70">Detalhe útil</p></div>
            <span class="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-black tabular-nums">R$ 00</span>
          </div>
        </div>
      </article>
      <article class="group relative overflow-hidden {rc} bg-{tx}/5">
        <div class="aspect-[4/5] overflow-hidden"><img src="{FOTO3}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.06]"></div>
        <div class="absolute inset-x-3 bottom-3 {ri} border border-white/15 bg-black/50 p-5 text-white backdrop-blur-md">
          <div class="flex items-start justify-between gap-4">
            <div><h3 class="font-display text-xl font-semibold">Nome do item</h3><p class="mt-1 text-sm text-white/70">Detalhe útil</p></div>
            <span class="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-semibold text-black tabular-nums">R$ 00</span>
          </div>
        </div>
      </article>
    </div>
  </div>
</section>`,
  },
  split: {
    kind: 'section',
    name: 'Foto + texto com lista de vantagens',
    when: 'Sobre o negócio, um serviço em destaque ou "por que escolher": foto grande com cartão de vidro de um lado, texto e 3 vantagens com ícone do outro.',
    photos: 1,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2 md:gap-20 md:px-8">
    <div class="reveal relative">
      <div aria-hidden="true" class="absolute -inset-4 -z-10 {rc} bg-gradient-to-br from-brand/25 to-accent/10 blur-2xl"></div>
      <img src="{FOTO1}" alt="Descrição da foto" loading="lazy" decoding="async" class="aspect-[4/5] w-full {rc} object-cover shadow-xl">
      <div class="absolute bottom-4 left-4 right-4 {ri} border border-white/15 bg-black/45 p-5 text-white backdrop-blur-md md:left-auto md:w-64">
        <p class="font-display text-lg font-semibold">Destaque curto</p>
        <p class="mt-1 text-sm text-white/70">Um detalhe verdadeiro</p>
      </div>
    </div>
    <div class="reveal">
    ${HEADING}
      <ul class="mt-10 space-y-6">
        <li class="flex gap-4"><span class="grid size-11 shrink-0 place-items-center {ri} bg-brand/15 text-brand">${ICON}</span><div><h3 class="font-display text-lg font-semibold">Vantagem</h3><p class="mt-1 text-{tx}/70">Explicação em uma linha.</p></div></li>
        <li class="flex gap-4"><span class="grid size-11 shrink-0 place-items-center {ri} bg-brand/15 text-brand">${ICON}</span><div><h3 class="font-display text-lg font-semibold">Vantagem</h3><p class="mt-1 text-{tx}/70">Explicação em uma linha.</p></div></li>
        <li class="flex gap-4"><span class="grid size-11 shrink-0 place-items-center {ri} bg-brand/15 text-brand">${ICON}</span><div><h3 class="font-display text-lg font-semibold">Vantagem</h3><p class="mt-1 text-{tx}/70">Explicação em uma linha.</p></div></li>
      </ul>
    </div>
  </div>
</section>`,
  },
  editorial: {
    kind: 'section',
    name: 'Lista numerada com título fixo ao lado',
    when: 'Título fixo à esquerda enquanto uma lista numerada grande rola à direita. Elegante para diferenciais, especialidades, áreas de atuação (advocacia, consultoria, saúde).',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:px-8">
    <div class="md:sticky md:top-28 md:self-start">
    ${HEADING}
      <div class="mt-9">${PRIMARY}</div>
    </div>
    <ol class="divide-y divide-{tx}/10 border-y border-{tx}/10">
      <li class="group grid grid-cols-[3rem_1fr] gap-4 py-8"><span class="font-display text-sm font-semibold text-brand tabular-nums">01</span><div><h3 class="font-display text-2xl font-semibold transition-transform duration-300 group-hover:translate-x-1">Item</h3><p class="mt-2 leading-relaxed text-{tx}/70">Descrição útil em uma ou duas linhas.</p></div></li>
      <li class="group grid grid-cols-[3rem_1fr] gap-4 py-8"><span class="font-display text-sm font-semibold text-brand tabular-nums">02</span><div><h3 class="font-display text-2xl font-semibold transition-transform duration-300 group-hover:translate-x-1">Item</h3><p class="mt-2 leading-relaxed text-{tx}/70">Descrição útil em uma ou duas linhas.</p></div></li>
      <li class="group grid grid-cols-[3rem_1fr] gap-4 py-8"><span class="font-display text-sm font-semibold text-brand tabular-nums">03</span><div><h3 class="font-display text-2xl font-semibold transition-transform duration-300 group-hover:translate-x-1">Item</h3><p class="mt-2 leading-relaxed text-{tx}/70">Descrição útil em uma ou duas linhas.</p></div></li>
      <li class="group grid grid-cols-[3rem_1fr] gap-4 py-8"><span class="font-display text-sm font-semibold text-brand tabular-nums">04</span><div><h3 class="font-display text-2xl font-semibold transition-transform duration-300 group-hover:translate-x-1">Item</h3><p class="mt-2 leading-relaxed text-{tx}/70">Descrição útil em uma ou duas linhas.</p></div></li>
    </ol>
  </div>
</section>`,
  },
  'lista-icones': {
    kind: 'section',
    name: 'Grade de diferenciais com linhas finas',
    when: '6 diferenciais curtos em grade com divisórias finas e ícones em quadrado degradê. Limpo e organizado.',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal mx-auto max-w-2xl text-center [&>p:last-child]:mx-auto">
    ${HEADING}
    </div>
    <div data-fx="stagger" class="mt-14 grid gap-px overflow-hidden {rc} border border-{tx}/10 bg-{tx}/10 sm:grid-cols-2 lg:grid-cols-3">
      <div class="bg-{bg} p-8 transition-colors duration-300 hover:bg-{tx}/[0.03]"><span class="grid size-12 place-items-center {ri} bg-gradient-to-br from-brand to-accent text-{btx} shadow-lg shadow-brand/25">${ICON}</span><h3 class="mt-6 font-display text-lg font-semibold">Diferencial</h3><p class="mt-2 leading-relaxed text-{tx}/70">Uma linha explicando.</p></div>
      <div class="bg-{bg} p-8 transition-colors duration-300 hover:bg-{tx}/[0.03]"><span class="grid size-12 place-items-center {ri} bg-gradient-to-br from-brand to-accent text-{btx} shadow-lg shadow-brand/25">${ICON}</span><h3 class="mt-6 font-display text-lg font-semibold">Diferencial</h3><p class="mt-2 leading-relaxed text-{tx}/70">Uma linha explicando.</p></div>
      <div class="bg-{bg} p-8 transition-colors duration-300 hover:bg-{tx}/[0.03]"><span class="grid size-12 place-items-center {ri} bg-gradient-to-br from-brand to-accent text-{btx} shadow-lg shadow-brand/25">${ICON}</span><h3 class="mt-6 font-display text-lg font-semibold">Diferencial</h3><p class="mt-2 leading-relaxed text-{tx}/70">Uma linha explicando.</p></div>
      <div class="bg-{bg} p-8 transition-colors duration-300 hover:bg-{tx}/[0.03]"><span class="grid size-12 place-items-center {ri} bg-gradient-to-br from-brand to-accent text-{btx} shadow-lg shadow-brand/25">${ICON}</span><h3 class="mt-6 font-display text-lg font-semibold">Diferencial</h3><p class="mt-2 leading-relaxed text-{tx}/70">Uma linha explicando.</p></div>
      <div class="bg-{bg} p-8 transition-colors duration-300 hover:bg-{tx}/[0.03]"><span class="grid size-12 place-items-center {ri} bg-gradient-to-br from-brand to-accent text-{btx} shadow-lg shadow-brand/25">${ICON}</span><h3 class="mt-6 font-display text-lg font-semibold">Diferencial</h3><p class="mt-2 leading-relaxed text-{tx}/70">Uma linha explicando.</p></div>
      <div class="bg-{bg} p-8 transition-colors duration-300 hover:bg-{tx}/[0.03]"><span class="grid size-12 place-items-center {ri} bg-gradient-to-br from-brand to-accent text-{btx} shadow-lg shadow-brand/25">${ICON}</span><h3 class="mt-6 font-display text-lg font-semibold">Diferencial</h3><p class="mt-2 leading-relaxed text-{tx}/70">Uma linha explicando.</p></div>
    </div>
  </div>
</section>`,
  },
  'lista-precos': {
    kind: 'section',
    name: 'Tabela de preços estilo cardápio',
    when: 'Lista de serviços/produtos com preço, agrupada por categoria, com linha pontilhada até o preço (barbearia, salão, restaurante, oficina, estética).',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal max-w-2xl">
    ${HEADING}
    </div>
    <div class="reveal mt-14 grid gap-x-16 gap-y-12 md:grid-cols-2">
      <div>
        <h3 class="flex items-center gap-4 font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand">Categoria<span class="h-px flex-1 bg-{tx}/10"></span></h3>
        <ul class="mt-6 space-y-6">
          <li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">Item</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-{tx}/25"></span><span class="font-display text-lg font-semibold tabular-nums">R$ 00</span></div><p class="mt-1 text-sm text-{tx}/60">O que inclui · duração</p></li>
          <li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">Item</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-{tx}/25"></span><span class="font-display text-lg font-semibold tabular-nums">R$ 00</span></div><p class="mt-1 text-sm text-{tx}/60">O que inclui · duração</p></li>
          <li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">Item</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-{tx}/25"></span><span class="font-display text-lg font-semibold tabular-nums">R$ 00</span></div><p class="mt-1 text-sm text-{tx}/60">O que inclui · duração</p></li>
        </ul>
      </div>
      <div>
        <h3 class="flex items-center gap-4 font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand">Categoria<span class="h-px flex-1 bg-{tx}/10"></span></h3>
        <ul class="mt-6 space-y-6">
          <li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">Item</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-{tx}/25"></span><span class="font-display text-lg font-semibold tabular-nums">R$ 00</span></div><p class="mt-1 text-sm text-{tx}/60">O que inclui · duração</p></li>
          <li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">Item</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-{tx}/25"></span><span class="font-display text-lg font-semibold tabular-nums">R$ 00</span></div><p class="mt-1 text-sm text-{tx}/60">O que inclui · duração</p></li>
          <li><div class="flex items-baseline gap-3"><span class="font-display text-lg font-semibold">Item</span><span aria-hidden="true" class="flex-1 -translate-y-1 border-b border-dotted border-{tx}/25"></span><span class="font-display text-lg font-semibold tabular-nums">R$ 00</span></div><p class="mt-1 text-sm text-{tx}/60">O que inclui · duração</p></li>
        </ul>
      </div>
    </div>
  </div>
</section>`,
  },
  planos: {
    kind: 'section',
    name: 'Planos lado a lado com o do meio em destaque',
    when: 'Pacotes, mensalidades ou combos (2 ou 3). O do meio fica escuro, maior e com borda de luz.',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal mx-auto max-w-2xl text-center [&>p:last-child]:mx-auto">
    ${HEADING}
    </div>
    <div class="mt-16 grid items-center gap-5 lg:grid-cols-3">
      <article class="flex h-full flex-col {rc} border border-{tx}/10 bg-{tx}/[0.03] p-8">
        <h3 class="font-display text-xl font-semibold">Plano</h3>
        <p class="mt-2 text-sm text-{tx}/60">Para quem…</p>
        <p class="mt-6 font-display text-5xl font-bold tabular-nums">R$ 00<span class="text-base font-medium text-{tx}/50">/mês</span></p>
        <ul class="mt-8 space-y-3 text-sm"><li class="flex gap-3 text-{tx}/80"><span class="text-brand">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{tx}/80"><span class="text-brand">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{tx}/80"><span class="text-brand">${CHECK}</span>Item incluso</li></ul>
        <a href="{wa}" class="mt-10 inline-flex min-h-12 items-center justify-center {rb} border border-{tx}/15 font-semibold transition hover:bg-{tx}/5">Escolher plano</a>
      </article>
      <article data-fx="beam" class="relative flex h-full flex-col {rc} bg-{dk} p-8 text-{dtx} shadow-2xl shadow-brand/20 lg:py-12">
        <span class="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wider text-{btx}">Mais escolhido</span>
        <h3 class="font-display text-xl font-semibold">Plano</h3>
        <p class="mt-2 text-sm text-{dtx}/60">Para quem…</p>
        <p class="mt-6 font-display text-5xl font-bold tabular-nums">R$ 00<span class="text-base font-medium text-{dtx}/50">/mês</span></p>
        <ul class="mt-8 space-y-3 text-sm"><li class="flex gap-3 text-{dtx}/85"><span class="text-accent">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{dtx}/85"><span class="text-accent">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{dtx}/85"><span class="text-accent">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{dtx}/85"><span class="text-accent">${CHECK}</span>Item incluso</li></ul>
        <a href="{wa}" class="mt-10 inline-flex min-h-12 items-center justify-center {rb} bg-brand font-semibold text-{btx} transition hover:brightness-110">Escolher plano</a>
      </article>
      <article class="flex h-full flex-col {rc} border border-{tx}/10 bg-{tx}/[0.03] p-8">
        <h3 class="font-display text-xl font-semibold">Plano</h3>
        <p class="mt-2 text-sm text-{tx}/60">Para quem…</p>
        <p class="mt-6 font-display text-5xl font-bold tabular-nums">R$ 00<span class="text-base font-medium text-{tx}/50">/mês</span></p>
        <ul class="mt-8 space-y-3 text-sm"><li class="flex gap-3 text-{tx}/80"><span class="text-brand">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{tx}/80"><span class="text-brand">${CHECK}</span>Item incluso</li><li class="flex gap-3 text-{tx}/80"><span class="text-brand">${CHECK}</span>Item incluso</li></ul>
        <a href="{wa}" class="mt-10 inline-flex min-h-12 items-center justify-center {rb} border border-{tx}/15 font-semibold transition hover:bg-{tx}/5">Escolher plano</a>
      </article>
    </div>
  </div>
</section>`,
  },
  passos: {
    kind: 'section',
    name: 'Etapas ligadas por uma linha de luz',
    when: 'Como funciona / como agendar: 3 ou 4 etapas reais com números em círculos ligados por uma linha degradê.',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal max-w-2xl">
    ${HEADING}
    </div>
    <div class="relative mt-16">
      <div aria-hidden="true" class="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-brand via-accent/60 to-transparent md:block"></div>
      <ol data-fx="stagger" class="relative grid gap-10 md:grid-cols-4 md:gap-6">
        <li><span class="grid size-12 place-items-center rounded-full border border-brand/40 bg-{bg} font-display font-bold text-brand ring-8 ring-brand/10 tabular-nums">01</span><h3 class="mt-6 font-display text-xl font-semibold">Etapa</h3><p class="mt-2 leading-relaxed text-{tx}/70">O que acontece nessa etapa.</p></li>
        <li><span class="grid size-12 place-items-center rounded-full border border-brand/40 bg-{bg} font-display font-bold text-brand ring-8 ring-brand/10 tabular-nums">02</span><h3 class="mt-6 font-display text-xl font-semibold">Etapa</h3><p class="mt-2 leading-relaxed text-{tx}/70">O que acontece nessa etapa.</p></li>
        <li><span class="grid size-12 place-items-center rounded-full border border-brand/40 bg-{bg} font-display font-bold text-brand ring-8 ring-brand/10 tabular-nums">03</span><h3 class="mt-6 font-display text-xl font-semibold">Etapa</h3><p class="mt-2 leading-relaxed text-{tx}/70">O que acontece nessa etapa.</p></li>
        <li><span class="grid size-12 place-items-center rounded-full border border-brand/40 bg-{bg} font-display font-bold text-brand ring-8 ring-brand/10 tabular-nums">04</span><h3 class="mt-6 font-display text-xl font-semibold">Etapa</h3><p class="mt-2 leading-relaxed text-{tx}/70">O que acontece nessa etapa.</p></li>
      </ol>
    </div>
  </div>
</section>`,
  },
  galeria: {
    kind: 'section',
    name: 'Mosaico de fotos com legendas de vidro',
    when: 'Mostrar o ambiente, trabalhos feitos, pratos ou imóveis em fotos de tamanhos diferentes (4 fotos).',
    photos: 4,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal max-w-2xl">
    ${HEADING}
    </div>
    <div class="reveal mt-12 grid auto-rows-[11rem] grid-cols-2 gap-3 md:auto-rows-[15rem] md:grid-cols-4 md:gap-4">
      <figure class="group relative col-span-2 row-span-2 overflow-hidden {rc}"><img src="{FOTO1}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-105"><figcaption class="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">Legenda curta</figcaption></figure>
      <figure class="group relative overflow-hidden {rc}"><img src="{FOTO2}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-105"></figure>
      <figure class="group relative row-span-2 overflow-hidden {rc}"><img src="{FOTO3}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-105"><figcaption class="absolute bottom-3 left-3 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">Legenda curta</figcaption></figure>
      <figure class="group relative overflow-hidden {rc}"><img src="{FOTO4}" alt="Descrição" loading="lazy" decoding="async" class="size-full object-cover transition duration-700 ease-out group-hover:scale-105"></figure>
    </div>
  </div>
</section>`,
  },
  depoimentos: {
    kind: 'section',
    name: 'Depoimentos em cartões',
    when: 'SOMENTE com avaliações/depoimentos reais informados no pedido.',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto max-w-6xl px-5 md:px-8">
    <div class="reveal max-w-2xl">
    ${HEADING}
    </div>
    <div data-fx="stagger" class="mt-14 grid gap-5 md:grid-cols-3">
      <figure class="flex flex-col justify-between {rc} border border-{tx}/10 bg-{tx}/[0.03] p-8"><blockquote class="text-lg leading-relaxed">“Depoimento real, curto.”</blockquote><figcaption class="mt-8 flex items-center gap-3"><span class="grid size-11 place-items-center rounded-full bg-brand/15 font-display font-bold text-brand">AB</span><span><strong class="block font-semibold">Nome</strong><span class="text-sm text-{tx}/60">Contexto</span></span></figcaption></figure>
      <figure class="flex flex-col justify-between {rc} border border-{tx}/10 bg-{tx}/[0.03] p-8"><blockquote class="text-lg leading-relaxed">“Depoimento real, curto.”</blockquote><figcaption class="mt-8 flex items-center gap-3"><span class="grid size-11 place-items-center rounded-full bg-brand/15 font-display font-bold text-brand">CD</span><span><strong class="block font-semibold">Nome</strong><span class="text-sm text-{tx}/60">Contexto</span></span></figcaption></figure>
      <figure class="flex flex-col justify-between {rc} border border-{tx}/10 bg-{tx}/[0.03] p-8"><blockquote class="text-lg leading-relaxed">“Depoimento real, curto.”</blockquote><figcaption class="mt-8 flex items-center gap-3"><span class="grid size-11 place-items-center rounded-full bg-brand/15 font-display font-bold text-brand">EF</span><span><strong class="block font-semibold">Nome</strong><span class="text-sm text-{tx}/60">Contexto</span></span></figcaption></figure>
    </div>
  </div>
</section>`,
  },
  letreiro: {
    kind: 'section',
    name: 'Faixa de letreiro correndo',
    when: 'Faixa fina na cor da marca com serviços, bairros atendidos ou especialidades correndo sem parar. Boa logo depois do topo. No máximo uma.',
    photos: 0,
    html: `<section id="{id}" aria-label="Destaques" class="bg-brand py-5 text-{btx}">
  <div data-fx="marquee" data-speed="40">
    <ul class="flex shrink-0 items-center gap-10 pr-10 font-display text-2xl font-bold uppercase tracking-tight md:text-3xl">
      <li>Serviço</li><li aria-hidden="true" class="opacity-50">✦</li>
      <li>Serviço</li><li aria-hidden="true" class="opacity-50">✦</li>
      <li>Serviço</li><li aria-hidden="true" class="opacity-50">✦</li>
      <li>Serviço</li><li aria-hidden="true" class="opacity-50">✦</li>
    </ul>
  </div>
</section>`,
  },
  'faixa-destaque': {
    kind: 'section',
    name: 'Painel de chamada com brilho',
    when: 'Chamada para a ação perto do fim: painel escuro arredondado com brilho da marca e textura de pontos, título forte e botão.',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} px-3 py-16 md:py-24">
  <div class="reveal relative isolate mx-auto max-w-6xl overflow-hidden {rc} border border-{dtx}/10 bg-{dk} px-6 py-16 text-center text-{dtx} md:px-16 md:py-24">
    <div aria-hidden="true" class="absolute left-1/2 top-0 -z-10 h-[30rem] w-[52rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/45 blur-[110px]"></div>
    <div aria-hidden="true" class="absolute inset-0 -z-10 bg-[radial-gradient(currentColor_1px,transparent_1px)] bg-[size:22px_22px] opacity-[0.08] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"></div>
    <h2 class="mx-auto max-w-3xl font-display text-[clamp(2.25rem,5.2vw,4.25rem)] font-bold leading-[1.04] tracking-tight">Frase forte que leva à ação</h2>
    <p class="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-{dtx}/70">Uma linha de apoio.</p>
    <div class="mt-10 flex justify-center">${PRIMARY}</div>
  </div>
</section>`,
  },
  faq: {
    kind: 'section',
    name: 'Perguntas frequentes em 2 colunas',
    when: 'Dúvidas reais do nicho: título fixo à esquerda, perguntas abrindo à direita.',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:px-8">
    <div class="md:sticky md:top-28 md:self-start">
    ${HEADING}
    </div>
    <div class="space-y-3">
      <details class="group {ri} border border-{tx}/10 bg-{tx}/[0.03] px-6 transition-colors open:bg-{tx}/[0.06]"><summary class="flex min-h-16 items-center justify-between gap-6 py-5 font-display text-lg font-semibold">Pergunta real?<span class="grid size-8 shrink-0 place-items-center rounded-full border border-{tx}/15 transition-transform duration-300 group-open:rotate-45">${PLUS}</span></summary><p class="pb-6 leading-relaxed text-{tx}/70">Resposta completa e útil.</p></details>
      <details class="group {ri} border border-{tx}/10 bg-{tx}/[0.03] px-6 transition-colors open:bg-{tx}/[0.06]"><summary class="flex min-h-16 items-center justify-between gap-6 py-5 font-display text-lg font-semibold">Pergunta real?<span class="grid size-8 shrink-0 place-items-center rounded-full border border-{tx}/15 transition-transform duration-300 group-open:rotate-45">${PLUS}</span></summary><p class="pb-6 leading-relaxed text-{tx}/70">Resposta completa e útil.</p></details>
      <details class="group {ri} border border-{tx}/10 bg-{tx}/[0.03] px-6 transition-colors open:bg-{tx}/[0.06]"><summary class="flex min-h-16 items-center justify-between gap-6 py-5 font-display text-lg font-semibold">Pergunta real?<span class="grid size-8 shrink-0 place-items-center rounded-full border border-{tx}/15 transition-transform duration-300 group-open:rotate-45">${PLUS}</span></summary><p class="pb-6 leading-relaxed text-{tx}/70">Resposta completa e útil.</p></details>
    </div>
  </div>
</section>`,
  },
  contato: {
    kind: 'section',
    name: 'Contato: cartão da marca + informações',
    when: 'Fechamento com o botão de contato grande num cartão na cor da marca e, ao lado, só as informações que existem (cidade, horário, endereço).',
    photos: 0,
    html: `<section id="{id}" class="bg-{bg} py-24 text-{tx} md:py-32">
  <div class="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-[1.2fr_1fr] md:px-8">
    <div class="reveal relative isolate flex flex-col justify-between overflow-hidden {rc} bg-brand p-8 text-{btx} md:p-12">
      <div aria-hidden="true" class="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-white/15 blur-3xl"></div>
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.18em] opacity-80">Rótulo</p>
        <h2 class="mt-4 font-display text-[clamp(2rem,4.4vw,3.4rem)] font-bold leading-[1.05] tracking-tight">Chamada final clara</h2>
        <p class="mt-4 max-w-md text-lg opacity-80">O que acontece quando a pessoa chamar.</p>
      </div>
      <a href="{wa}" class="group mt-12 inline-flex min-h-14 w-fit items-center gap-3 {rb} bg-{btx} px-7 font-semibold text-brand shadow-lg transition hover:-translate-y-0.5">${WHATSAPP}Ação de contato</a>
    </div>
    <div class="reveal {rc} border border-{tx}/10 bg-{tx}/[0.03] p-8 md:p-12">
      <h3 class="font-display text-xl font-semibold">Informações</h3>
      <dl class="mt-8 divide-y divide-{tx}/10">
        <div class="flex gap-4 py-5 first:pt-0"><dt class="text-brand">${PIN}<span class="sr-only">Cidade</span></dt><dd><strong class="block font-semibold">Cidade</strong><span class="text-{tx}/70">Detalhe real</span></dd></div>
        <div class="flex gap-4 py-5"><dt class="text-brand">${CLOCK}<span class="sr-only">Horário</span></dt><dd><strong class="block font-semibold">Horário</strong><span class="text-{tx}/70">Só se informado</span></dd></div>
      </dl>
    </div>
  </div>
</section>`,
  },

  // ------------------------------------------------------------------ Rodapé
  'rodape-assinatura': {
    kind: 'footer',
    name: 'Rodapé com nome gigante',
    when: 'Rodapé escuro com colunas e o nome do negócio enorme e apagado no fim.',
    photos: 0,
    html: `<footer class="relative overflow-hidden bg-{dk} pt-20 text-{dtx}">
  <div class="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
    <div>
      <p class="font-display text-2xl font-bold">Nome do negócio</p>
      <p class="mt-3 max-w-xs leading-relaxed text-{dtx}/60">Frase curta do que o negócio faz de melhor.</p>
      <a href="{wa}" class="mt-7 inline-flex min-h-11 items-center gap-2 {rb} bg-brand px-5 text-sm font-semibold text-{btx} transition hover:brightness-110">Ação principal</a>
    </div>
    <nav aria-label="Rodapé"><p class="text-sm font-semibold uppercase tracking-[0.18em] text-{dtx}/50">Navegue</p><ul class="mt-5 space-y-3"><li><a href="#servicos" class="text-{dtx}/75 transition hover:text-{dtx}">Serviços</a></li><li><a href="#contato" class="text-{dtx}/75 transition hover:text-{dtx}">Contato</a></li></ul></nav>
    <div><p class="text-sm font-semibold uppercase tracking-[0.18em] text-{dtx}/50">Contato</p><ul class="mt-5 space-y-3 text-{dtx}/75"><li>Só dados reais</li></ul></div>
  </div>
  <div class="mx-auto mt-16 flex max-w-6xl flex-col gap-2 border-t border-{dtx}/10 px-5 py-6 text-sm text-{dtx}/50 md:flex-row md:justify-between md:px-8"><p>© <span data-year></span> Nome do negócio</p></div>
  <p aria-hidden="true" class="pointer-events-none -mb-[0.18em] select-none whitespace-nowrap text-center font-display text-[18vw] font-black uppercase leading-none tracking-tighter text-{dtx}/[0.06]">Nome</p>
</footer>`,
  },
}

export const HEADER_BLOCKS = Object.keys(BLOCKS).filter((id) => BLOCKS[id].kind === 'header')
export const HERO_BLOCKS = Object.keys(BLOCKS).filter((id) => BLOCKS[id].kind === 'hero')
export const SECTION_BLOCKS = Object.keys(BLOCKS).filter((id) => BLOCKS[id].kind === 'section')

// Nomes antigos de formato que ainda aparecem em planos salvos.
const ALIASES: Record<string, string> = { hero: 'hero-dividido' }

/** Bloco válido para o tipo de parte, ou null. */
export function blockFor(id: unknown, kinds: Block['kind'][]): string | null {
  const key = typeof id === 'string' ? (ALIASES[id] ?? id) : ''
  return key in BLOCKS && kinds.includes(BLOCKS[key].kind) ? key : null
}

/** Lista curta (id: nome — quando usar) para o diretor de arte. */
export function blocksMenu(kind: Block['kind']): string {
  return Object.entries(BLOCKS)
    .filter(([, block]) => block.kind === kind)
    .map(([id, block]) => `- ${id}: ${block.name}. ${block.when}${block.photos ? ` (${block.photos} foto${block.photos > 1 ? 's' : ''})` : ''}`)
    .join('\n')
}

export interface BlockTokens {
  id: string
  bg: string
  tx: string
  ptx: string
  btx: string
  dk: string
  dtx: string
  htx: string
  radius: 'round' | 'soft' | 'sharp'
  wa: string
  photos: string[]
}

const RADIUS = {
  round: { rc: 'rounded-[2rem]', ri: 'rounded-2xl', rb: 'rounded-full' },
  soft: { rc: 'rounded-2xl', ri: 'rounded-xl', rb: 'rounded-xl' },
  sharp: { rc: 'rounded-none', ri: 'rounded-none', rb: 'rounded-none' },
}

/** O modelo do bloco com as cores, cantos, fotos e links deste site. */
export function renderBlock(id: string, tokens: BlockTokens): string {
  const block = BLOCKS[id]
  if (!block) return ''
  const values: Record<string, string> = {
    ...RADIUS[tokens.radius],
    id: tokens.id,
    bg: tokens.bg,
    tx: tokens.tx,
    ptx: tokens.ptx,
    btx: tokens.btx,
    dk: tokens.dk,
    dtx: tokens.dtx,
    htx: tokens.htx,
    wa: tokens.wa,
  }
  return block.html
    .replace(/\{FOTO(\d)\}/g, (_, n) => tokens.photos[Number(n) - 1] ?? tokens.photos[0] ?? '')
    .replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match)
}
