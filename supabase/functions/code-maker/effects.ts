// Biblioteca de efeitos dos sites do Code Maker: animações de rolagem, texto,
// interação, fundos e molduras, em JavaScript puro e leve (sem React nem
// bibliotecas pesadas). A IA marca o HTML com data-fx="nome" e só o código dos
// efeitos usados entra na página. O diretor de arte escolhe poucos por site —
// nunca todos. Quem prefere menos movimento recebe a versão parada, e efeitos
// de mouse só ligam em aparelho com mouse.

export interface Effect {
  /** Nome curto para o plano e as alterações. */
  name: string
  /** Quando faz sentido usar (e quando não). */
  when: string
  /** Como escrever no HTML. */
  markup: string
  css?: string
  js?: string
}

const IN_VIEW = 'html.fx'
const MOTION_OK = '@media (prefers-reduced-motion:no-preference)'

export const EFFECTS: Record<string, Effect> = {
  // ------------------------------------------------------------- Rolagem
  'scroll-progress': {
    name: 'Barra de progresso de leitura',
    when: 'Páginas longas com muito conteúdo (cardápio, catálogo, guia). Desnecessária em site curto.',
    markup:
      'Coloque uma vez, dentro do cabeçalho: <span data-fx="scroll-progress" hidden></span>. A barra fina na cor da marca aparece sozinha no topo da tela.',
    css: '.fx-progress{position:fixed;left:0;top:0;z-index:70;height:3px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--fx-brand);pointer-events:none}',
    js: `if(all('scroll-progress').length){var bar=document.createElement('div');bar.className='fx-progress';bar.setAttribute('aria-hidden','true');document.body.appendChild(bar);onScroll(function(){var d=document.documentElement;bar.style.transform='scaleX('+(d.scrollTop/((d.scrollHeight-d.clientHeight)||1))+')'})}`,
  },
  parallax: {
    name: 'Parallax em foto',
    when: 'Uma foto grande de clima (topo, faixa de destaque) que ganha profundidade ao rolar. No máximo 1 ou 2 no site.',
    markup:
      'Foto dentro de um bloco com overflow-hidden; o data-fx vai num <div> em volta da <img> (não na própria seção nem em elemento com outras classes de transform), e a foto fica um pouco maior que o bloco: <div class="overflow-hidden rounded-3xl aspect-[4/5]"><div data-fx="parallax" data-speed="0.12" class="h-[115%] -mt-[7%]"><img class="h-full w-full object-cover" ...></div></div>. data-speed de 0.05 (sutil) a 0.2 (forte).',
    js: `if(!RM)all('parallax').forEach(function(el){var s=parseFloat(el.getAttribute('data-speed')||'0.12');onScroll(function(){var r=el.getBoundingClientRect();if(r.bottom<-200||r.top>innerHeight+200)return;var c=r.top+r.height/2-innerHeight/2;el.style.transform='translate3d(0,'+(-c*s).toFixed(1)+'px,0)'})})`,
  },
  stagger: {
    name: 'Entrada em sequência',
    when: 'Grupos de itens iguais (cards de serviço, passos, ícones) que aparecem um após o outro ao rolar. Use no lugar de "reveal" nesses grupos.',
    markup:
      'data-fx="stagger" no elemento pai (a grade/lista); cada filho direto entra em sequência: <ul data-fx="stagger" class="grid gap-6 md:grid-cols-3"><li>…</li><li>…</li></ul>.',
    css: `${MOTION_OK}{${IN_VIEW} [data-fx~="stagger"]>*{opacity:0;transform:translateY(16px);transition:opacity .55s cubic-bezier(.16,1,.3,1),transform .55s cubic-bezier(.16,1,.3,1)}${IN_VIEW} [data-fx~="stagger"].fx-in>*{opacity:1;transform:none}}`,
    js: `all('stagger').forEach(function(el){Array.prototype.forEach.call(el.children,function(c,i){c.style.transitionDelay=Math.min(i*80,560)+'ms'});seen(el,function(){el.classList.add('fx-in')})})`,
  },
  horizontal: {
    name: 'Rolagem lateral presa',
    when: 'Uma vitrine de itens (imóveis, pratos, projetos, etapas) que desliza para o lado enquanto a pessoa rola para baixo. Impactante: no máximo uma vez no site, em seção com 4 a 8 itens. No celular vira um carrossel de arrastar.',
    markup:
      'Dentro da seção (não na <section>), um <div data-fx="horizontal"> cujo ÚNICO filho é a fileira: <div data-fx="horizontal"><div class="flex gap-6 px-5 md:px-8">…itens com shrink-0 w-[80vw] md:w-[38vw]…</div></div>.',
    css: '.fx-h-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;align-items:center}[data-fx~="horizontal"]>.fx-h-sticky>*{will-change:transform}.fx-snap{overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.fx-snap::-webkit-scrollbar{display:none}.fx-snap>*{scroll-snap-align:start}',
    js: `all('horizontal').forEach(function(el){var track=el.firstElementChild;if(!track)return;if(RM||matchMedia('(max-width: 767px)').matches){track.classList.add('fx-snap');return}var sticky=document.createElement('div');sticky.className='fx-h-sticky';el.insertBefore(sticky,track);sticky.appendChild(track);var dist=0;function size(){dist=Math.max(0,track.scrollWidth-sticky.clientWidth);el.style.height=(innerHeight+dist)+'px'}size();addEventListener('resize',size);onScroll(function(){var r=el.getBoundingClientRect();var p=Math.min(1,Math.max(0,-r.top/((r.height-innerHeight)||1)));track.style.transform='translate3d('+(-p*dist).toFixed(1)+'px,0,0)'})})`,
  },
  stack: {
    name: 'Cards empilhando',
    when: 'Etapas ou diferenciais (3 a 5) contados como uma história: cada card gruda no topo e o próximo para por cima. Bom para "como funciona".',
    markup:
      'data-fx="stack" no pai; cada filho é um card com fundo sólido (bg-surface ou bg-paper) e altura parecida: <div data-fx="stack" class="space-y-6"><article class="rounded-3xl bg-surface p-8 shadow-lg">…</article>…</div>.',
    css: '[data-fx~="stack"]>*{position:sticky;top:calc(6rem + var(--fx-i,0) * 1.25rem)}',
    js: `all('stack').forEach(function(el){Array.prototype.forEach.call(el.children,function(c,i){c.style.setProperty('--fx-i',i)})})`,
  },
  'image-reveal': {
    name: 'Foto que se revela',
    when: 'Fotos importantes (sobre, destaque) que se abrem como uma cortina ao aparecer. Elegante; 1 a 3 fotos no site.',
    markup: 'data-fx="image-reveal" no bloco que envolve a foto: <div data-fx="image-reveal" class="overflow-hidden rounded-3xl"><img …></div>.',
    css: `${MOTION_OK}{${IN_VIEW} [data-fx~="image-reveal"]{clip-path:inset(0 0 100% 0);transition:clip-path 1.1s cubic-bezier(.16,1,.3,1)}${IN_VIEW} [data-fx~="image-reveal"].fx-in{clip-path:inset(0 0 0 0)}}`,
    js: `all('image-reveal').forEach(function(el){seen(el,function(){el.classList.add('fx-in')})})`,
  },
  'scrub-text': {
    name: 'Texto que acende ao rolar',
    when: 'UMA frase-manifesto grande (2 a 4 linhas) cujas palavras acendem conforme a pessoa rola. Só texto simples, sem links dentro.',
    markup: '<p data-fx="scrub-text" class="font-display text-3xl md:text-5xl leading-tight">Frase forte do negócio…</p>',
    css: '.fx-w{opacity:.18;transition:opacity .25s ease}.fx-w.on{opacity:1}',
    js: `if(!RM)all('scrub-text').forEach(function(el){var words=el.textContent.trim().split(/\\s+/);el.setAttribute('aria-label',el.textContent.trim());el.innerHTML=words.map(function(w){return '<span class="fx-w" aria-hidden="true">'+w.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</span>'}).join(' ');var spans=el.querySelectorAll('.fx-w');onScroll(function(){var r=el.getBoundingClientRect();var p=Math.min(1,Math.max(0,(innerHeight*0.85-r.top)/(r.height+innerHeight*0.35)));var lit=Math.round(p*spans.length);spans.forEach(function(s,i){s.classList.toggle('on',i<lit)})})})`,
  },

  // ------------------------------------------------------------- Texto
  count: {
    name: 'Número que conta',
    when: 'Números REAIS do pedido (nota, avaliações, anos informados) ou preços contando ao aparecer. Nunca para número inventado.',
    markup:
      'O texto já vem com o valor final (aparece mesmo sem animação): <span data-fx="count" data-to="4.9" data-decimals="1" class="tabular-nums">4,9</span>. Opcionais: data-prefix="R$ " data-suffix="+".',
    js: `all('count').forEach(function(el){var to=parseFloat(el.getAttribute('data-to'));if(isNaN(to)||RM)return;var dec=parseInt(el.getAttribute('data-decimals')||'0',10),pre=el.getAttribute('data-prefix')||'',suf=el.getAttribute('data-suffix')||'',lang=document.documentElement.lang||'pt-BR';function fmt(v){return pre+v.toLocaleString(lang,{minimumFractionDigits:dec,maximumFractionDigits:dec})+suf}seen(el,function(){var t0=performance.now();function step(t){var k=Math.min(1,(t-t0)/1300);var e=1-Math.pow(1-k,3);el.textContent=fmt(to*e);if(k<1)requestAnimationFrame(step)}requestAnimationFrame(step)})})`,
  },
  'split-text': {
    name: 'Título que sobe palavra por palavra',
    when: 'O título principal do topo entrando com as palavras subindo em sequência ao abrir a página. Só no h1 do topo.',
    markup: '<h1 data-fx="split-text" class="…">Título do topo</h1> (só texto, sem spans dentro).',
    css: `.fx-sw{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em}.fx-sw>span{display:inline-block}${MOTION_OK}{.fx-sw>span{transform:translateY(105%);animation:fx-rise .9s cubic-bezier(.16,1,.3,1) forwards}}@keyframes fx-rise{to{transform:none}}`,
    js: `all('split-text').forEach(function(el){var text=el.textContent.trim();el.setAttribute('aria-label',text);el.innerHTML=text.split(/\\s+/).map(function(w,i){return '<span class="fx-sw" aria-hidden="true"><span style="animation-delay:'+(120+i*70)+'ms">'+w.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</span></span>'}).join(' ')})`,
  },
  'rotate-words': {
    name: 'Palavra que troca',
    when: 'Uma palavra do título que alterna entre 3 a 4 opções reais do negócio ("Corte · Barba · Sobrancelha"). Só uma no site.',
    markup:
      'Corte <span data-fx="rotate-words" data-words="barba|sobrancelha|pigmentação" class="text-brand">barba</span> com hora marcada (o texto inicial é a primeira palavra da lista).',
    css: '[data-fx~="rotate-words"]{display:inline-block;transition:opacity .3s ease,transform .3s ease,filter .3s ease}[data-fx~="rotate-words"].fx-out{opacity:0;transform:translateY(-.3em);filter:blur(4px)}',
    js: `if(!RM)all('rotate-words').forEach(function(el){var words=(el.getAttribute('data-words')||'').split('|').filter(Boolean);if(words.length<2)return;var i=0;setInterval(function(){el.classList.add('fx-out');setTimeout(function(){i=(i+1)%words.length;el.textContent=words[i];el.classList.remove('fx-out')},300)},2400)})`,
  },
  annotate: {
    name: 'Marca feita à mão',
    when: 'Destacar 1 ou 2 palavras-chave com sublinhado, círculo, marca-texto ou risco desenhado à mão ao aparecer. Clima artesanal, próximo, humano.',
    markup: '<span data-fx="annotate" data-style="underline">palavra</span> — data-style: underline, circle, highlight ou strike. A cor vem da marca.',
    css: '[data-fx~="annotate"]{position:relative;display:inline-block;isolation:isolate;white-space:nowrap}.fx-ann{position:absolute;pointer-events:none;overflow:visible;color:var(--fx-accent)}.fx-ann path{fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .9s cubic-bezier(.65,0,.35,1)}.fx-in .fx-ann path{stroke-dashoffset:0}[data-style="highlight"]::before{content:"";position:absolute;inset:.15em -.12em .05em;z-index:-1;background:var(--fx-accent);opacity:.35;border-radius:.2em;transform:scaleX(0);transform-origin:left;transition:transform .8s cubic-bezier(.65,0,.35,1)}[data-style="highlight"].fx-in::before{transform:none}',
    js: `var ANN={underline:['0 0 100 10','M2 7 C 25 2, 55 11, 98 4','left:-2%;width:104%;bottom:-.32em;height:.45em'],strike:['0 0 100 10','M1 6 C 30 4, 70 7, 99 5','left:-3%;width:106%;top:42%;height:.3em'],circle:['0 0 100 40','M52 4 C 84 2, 99 12, 97 22 C 95 34, 62 39, 36 37 C 11 35, 1 26, 4 16 C 7 6, 30 1, 60 5','left:-10%;width:120%;top:-28%;height:156%']};all('annotate').forEach(function(el){var st=el.getAttribute('data-style')||'underline';var a=ANN[st];if(a){var svg='<svg class="fx-ann" aria-hidden="true" viewBox="'+a[0]+'" preserveAspectRatio="none" style="'+a[2]+'"><path pathLength="1" d="'+a[1]+'"/></svg>';el.insertAdjacentHTML('beforeend',svg)}if(RM){el.classList.add('fx-in');return}seen(el,function(){setTimeout(function(){el.classList.add('fx-in')},250)})})`,
  },
  shimmer: {
    name: 'Brilho passando no texto',
    when: 'Um título curto de destaque (preço promocional, nome do plano premium) com um brilho que atravessa uma vez ao aparecer.',
    markup: '<span data-fx="shimmer">Texto curto</span>',
    css: '[data-fx~="shimmer"].fx-in{background:linear-gradient(110deg,var(--fx-base) 40%,var(--fx-accent) 50%,var(--fx-base) 60%) 100% 0/300% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:fx-shimmer 1.8s cubic-bezier(.65,0,.35,1) forwards}@keyframes fx-shimmer{to{background-position:0 0}}',
    js: `if(!RM)all('shimmer').forEach(function(el){el.style.setProperty('--fx-base',getComputedStyle(el).color);seen(el,function(){el.classList.add('fx-in')})})`,
  },
  draw: {
    name: 'Desenho que se traça',
    when: 'Um SVG de linhas (rota no mapa, assinatura, ícone grande, planta, seta) que se desenha ao aparecer.',
    markup:
      'data-fx="draw" no <svg> (traços com stroke, sem fill): <svg data-fx="draw" viewBox="…" fill="none" stroke="currentColor" aria-hidden="true">…<path d="…"/></svg>.',
    css: `${MOTION_OK}{${IN_VIEW} [data-fx~="draw"] :is(path,line,polyline,circle,rect,ellipse){stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.6s cubic-bezier(.65,0,.35,1)}${IN_VIEW} [data-fx~="draw"].fx-in :is(path,line,polyline,circle,rect,ellipse){stroke-dashoffset:0}}`,
    js: `all('draw').forEach(function(el){el.querySelectorAll('path,line,polyline,circle,rect,ellipse').forEach(function(p){p.setAttribute('pathLength','1')});seen(el,function(){el.classList.add('fx-in')})})`,
  },

  'blur-in': {
    name: 'Título que surge do desfoque',
    when: 'Um título importante (topo ou chamada) cujas palavras saem do desfoque uma a uma ao aparecer. Sofisticado e discreto.',
    markup: '<h2 data-fx="blur-in" class="…">Título curto</h2> (só texto, sem spans dentro).',
    css: `.fx-bw{display:inline-block}${MOTION_OK}{${IN_VIEW} .fx-bw{opacity:0;filter:blur(10px);transform:translateY(.25em);transition:opacity .7s ease,filter .7s ease,transform .7s cubic-bezier(.16,1,.3,1)}${IN_VIEW} .fx-in .fx-bw{opacity:1;filter:none;transform:none}}`,
    js: `all('blur-in').forEach(function(el){var text=el.textContent.trim();el.setAttribute('aria-label',text);el.innerHTML=text.split(/\\s+/).map(function(w,i){return '<span class="fx-bw" aria-hidden="true" style="transition-delay:'+(i*90)+'ms">'+w.replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'</span>'}).join(' ');seen(el,function(){el.classList.add('fx-in')})})`,
  },
  'gradient-text': {
    name: 'Texto em degradê que flui',
    when: 'UMA palavra ou frase curta de destaque (no título do topo) com o degradê da marca andando devagar. No máximo um lugar no site.',
    markup: 'Título com a <span data-fx="gradient-text">palavra-chave</span> em destaque.',
    css: '[data-fx~="gradient-text"]{background:linear-gradient(90deg,var(--fx-brand),var(--fx-accent),var(--fx-brand)) 0 0/200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:fx-flow 6s linear infinite}@keyframes fx-flow{to{background-position:200% 0}}',
  },
  typewriter: {
    name: 'Texto que se digita',
    when: 'Uma frase curta do topo que se digita e alterna entre 2 a 4 opções reais ("corte", "barba", "sobrancelha"). Clima tecnológico ou descontraído.',
    markup: 'Agende <span data-fx="typewriter" data-words="seu corte|sua barba|seu pacote">seu corte</span> (o texto inicial é a primeira opção).',
    css: '[data-fx~="typewriter"]::after{content:"";display:inline-block;width:.08em;height:.9em;margin-left:.06em;vertical-align:-.08em;background:currentColor;animation:fx-caret 1s steps(1) infinite}@keyframes fx-caret{50%{opacity:0}}',
    js: `if(!RM)all('typewriter').forEach(function(el){var words=(el.getAttribute('data-words')||el.textContent).split('|').filter(Boolean);if(!words.length)return;el.setAttribute('aria-label',words.join(', '));var w=0,n=words[0].length,del=true;function tick(){var word=words[w];if(del){n--;if(n<=0){del=false;w=(w+1)%words.length;word=words[w]}}else{n++;if(n>=word.length){del=true;el.textContent=word;setTimeout(tick,1800);return}}el.textContent=word.slice(0,Math.max(0,n));setTimeout(tick,del?45:85)}setTimeout(tick,1800)})`,
  },

  // ------------------------------------------------------------- Interação (mouse)
  tilt: {
    name: 'Card que inclina (3D)',
    when: 'Cards de destaque (planos, produtos, projetos) que inclinam levemente seguindo o mouse, com reflexo. Só aparece em computador.',
    markup: 'data-fx="tilt" no card (que não tenha outras classes de transform/hover:translate): <article data-fx="tilt" class="rounded-3xl …">…</article>.',
    css: '[data-fx~="tilt"]{transition:transform .25s ease-out;transform-style:preserve-3d;will-change:transform}.fx-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(420px circle at var(--fx-x,50%) var(--fx-y,50%),rgba(255,255,255,.22),transparent 55%);opacity:0;transition:opacity .25s ease}[data-fx~="tilt"]:hover .fx-glare{opacity:1}',
    js: `if(FINE&&!RM)all('tilt').forEach(function(el){if(getComputedStyle(el).position==='static')el.style.position='relative';var g=document.createElement('span');g.className='fx-glare';g.setAttribute('aria-hidden','true');el.appendChild(g);el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.transform='perspective(900px) rotateX('+((.5-y)*7).toFixed(2)+'deg) rotateY('+((x-.5)*7).toFixed(2)+'deg)';el.style.setProperty('--fx-x',x*100+'%');el.style.setProperty('--fx-y',y*100+'%')});el.addEventListener('pointerleave',function(){el.style.transform=''})})`,
  },
  spotlight: {
    name: 'Luz que segue o mouse',
    when: 'Cards ou faixas em fundo escuro com um brilho suave na cor da marca seguindo o mouse. Só em computador; combina com sites escuros.',
    markup: 'data-fx="spotlight" no card (com cantos arredondados): <div data-fx="spotlight" class="rounded-3xl bg-surface p-8">…</div>.',
    css: '[data-fx~="spotlight"]{position:relative;isolation:isolate}[data-fx~="spotlight"]::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(340px circle at var(--fx-x,50%) var(--fx-y,50%),color-mix(in srgb,var(--fx-brand) 22%,transparent),transparent 65%);opacity:0;transition:opacity .3s ease}[data-fx~="spotlight"]:hover::after{opacity:1}',
    js: `if(FINE)all('spotlight').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--fx-x',(e.clientX-r.left)+'px');el.style.setProperty('--fx-y',(e.clientY-r.top)+'px')})})`,
  },
  magnetic: {
    name: 'Botão magnético',
    when: 'O botão principal (1 no site) que é levemente puxado na direção do mouse. Só em computador.',
    markup: 'data-fx="magnetic" no próprio <a> do botão principal, sem classes de transform/hover:translate nele.',
    css: '[data-fx~="magnetic"]{transition:transform .35s cubic-bezier(.16,1,.3,1)}',
    js: `if(FINE&&!RM)all('magnetic').forEach(function(el){el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();var x=(e.clientX-r.left-r.width/2)*.25,y=(e.clientY-r.top-r.height/2)*.35;el.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)'});el.addEventListener('pointerleave',function(){el.style.transform=''})})`,
  },

  // ------------------------------------------------------------- Componentes
  marquee: {
    name: 'Faixa que corre',
    when: 'Uma faixa de palavras (serviços, bairros atendidos, especialidades) ou logos reais correndo devagar e sem fim. Pausa ao passar o mouse. No máximo uma.',
    markup:
      'data-fx="marquee" num <div> cujo ÚNICO filho é a lista: <div data-fx="marquee" data-speed="35"><ul class="flex shrink-0 items-center gap-12 pr-12 font-display text-3xl">…</ul></div>. data-speed = segundos por volta (maior = mais devagar).',
    css: '[data-fx~="marquee"]{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}.fx-mq{display:flex;width:max-content;animation:fx-mq var(--fx-speed,35s) linear infinite}[data-fx~="marquee"]:hover .fx-mq,[data-fx~="marquee"]:focus-within .fx-mq{animation-play-state:paused}@keyframes fx-mq{to{transform:translateX(-50%)}}',
    js: `all('marquee').forEach(function(el){var list=el.firstElementChild;if(!list)return;if(RM){el.style.overflowX='auto';return}var track=document.createElement('div');track.className='fx-mq';track.style.setProperty('--fx-speed',(parseFloat(el.getAttribute('data-speed')||'35'))+'s');el.insertBefore(track,list);track.appendChild(list);var copy=list.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.querySelectorAll('a,button').forEach(function(a){a.setAttribute('tabindex','-1')});track.appendChild(copy)})`,
  },
  carousel: {
    name: 'Carrossel de arrastar',
    when: 'Galeria, depoimentos reais ou itens de catálogo para passar com o dedo (e com setas no computador). Melhor que uma grade enorme no celular.',
    markup:
      'data-fx="carousel" num <div> cujo ÚNICO filho é a fileira: <div data-fx="carousel"><div class="flex gap-4">…itens com shrink-0 w-[85%] sm:w-[48%] lg:w-[32%]…</div></div>. As setas são criadas sozinhas.',
    css: '.fx-snap{overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}.fx-snap::-webkit-scrollbar{display:none}.fx-snap>*{scroll-snap-align:start}[data-fx~="carousel"]{position:relative}.fx-car-nav{display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem}.fx-car-nav button{display:inline-flex;align-items:center;justify-content:center;width:2.75rem;height:2.75rem;border-radius:999px;border:1px solid color-mix(in srgb,currentColor 25%,transparent);background:transparent;color:inherit;cursor:pointer;transition:background .2s ease}.fx-car-nav button:hover{background:color-mix(in srgb,currentColor 10%,transparent)}',
    js: `all('carousel').forEach(function(el){var track=el.firstElementChild;if(!track)return;track.classList.add('fx-snap');track.setAttribute('tabindex','0');var nav=document.createElement('div');nav.className='fx-car-nav';var L=lbl();nav.innerHTML='<button type="button" aria-label="'+L.prev+'">&#8592;</button><button type="button" aria-label="'+L.next+'">&#8594;</button>';el.appendChild(nav);var b=nav.querySelectorAll('button');function go(d){var item=track.firstElementChild;var w=item?item.getBoundingClientRect().width+16:track.clientWidth*.8;track.scrollBy({left:d*w,behavior:RM?'auto':'smooth'})}b[0].addEventListener('click',function(){go(-1)});b[1].addEventListener('click',function(){go(1)})})`,
  },
  'before-after': {
    name: 'Antes e depois',
    when: 'Comparar um par REAL de fotos de antes/depois enviado pelo usuário (reforma, estética, limpeza, corte). Nunca com fotos de banco diferentes entre si.',
    markup:
      '<div data-fx="before-after" class="aspect-[4/3] overflow-hidden rounded-3xl"><img src="ANTES" alt="Antes: …"><img src="DEPOIS" alt="Depois: …"></div> (exatamente duas imagens, antes primeiro).',
    css: '[data-fx~="before-after"]{position:relative;touch-action:pan-y}[data-fx~="before-after"]>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}[data-fx~="before-after"]>img:nth-of-type(2){clip-path:inset(0 0 0 var(--fx-pos,50%))}.fx-ba-range{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}.fx-ba-line{position:absolute;top:0;bottom:0;left:var(--fx-pos,50%);width:2px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.15);pointer-events:none}.fx-ba-line::after{content:"\\2194";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:2.75rem;height:2.75rem;border-radius:999px;background:#fff;color:#111;display:grid;place-items:center;font-size:1.1rem;box-shadow:0 4px 14px rgba(0,0,0,.25)}.fx-ba-range:focus-visible+.fx-ba-line::after{outline:3px solid var(--fx-brand);outline-offset:2px}.fx-ba-tag{position:absolute;top:.75rem;padding:.25rem .6rem;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font-size:.75rem;font-weight:600;pointer-events:none}',
    js: `all('before-after').forEach(function(el){if(el.querySelectorAll('img').length<2)return;var L=lbl();var r=document.createElement('input');r.type='range';r.min='0';r.max='100';r.value='50';r.className='fx-ba-range';r.setAttribute('aria-label',L.compare);var line=document.createElement('span');line.className='fx-ba-line';line.setAttribute('aria-hidden','true');el.appendChild(r);el.appendChild(line);el.insertAdjacentHTML('beforeend','<span class="fx-ba-tag" style="left:.75rem" aria-hidden="true">'+L.before+'</span><span class="fx-ba-tag" style="right:.75rem" aria-hidden="true">'+L.after+'</span>');r.addEventListener('input',function(){el.style.setProperty('--fx-pos',r.value+'%')})})`,
  },
  'price-toggle': {
    name: 'Alternar preços (mensal/anual)',
    when: 'Seção de planos com dois jeitos de pagar (mensal × anual, avulso × pacote). Os dois preços precisam estar no conteúdo.',
    markup:
      'Um data-fx="price-toggle" envolvendo tudo; botões com data-period e cada preço com data-price-NOME: <div data-fx="price-toggle"><div role="group" class="inline-flex rounded-full border p-1"><button type="button" data-period="mensal" aria-pressed="true" class="… aria-pressed:bg-brand aria-pressed:text-white">Mensal</button><button type="button" data-period="anual" aria-pressed="false" class="…">Anual</button></div> … <p data-price-mensal="R$ 129" data-price-anual="R$ 99" class="tabular-nums">R$ 129</p></div>.',
    js: `all('price-toggle').forEach(function(el){var btns=el.querySelectorAll('[data-period]');btns.forEach(function(b){b.addEventListener('click',function(){var p=b.getAttribute('data-period');btns.forEach(function(o){o.setAttribute('aria-pressed',String(o===b))});el.querySelectorAll('[data-price-'+p+']').forEach(function(t){t.textContent=t.getAttribute('data-price-'+p)})})})})`,
  },
  countdown: {
    name: 'Contagem regressiva',
    when: 'Só com uma data REAL informada pelo usuário (fim de promoção, inauguração, evento). Nunca com prazo inventado.',
    markup:
      '<div data-fx="countdown" data-to="2026-12-24T23:59:00-03:00" class="flex gap-3 font-display text-4xl tabular-nums"></div> (os blocos de dias, horas, minutos e segundos são criados sozinhos).',
    css: '.fx-cd{display:flex;flex-direction:column;align-items:center;min-width:3.5rem}.fx-cd small{font-family:inherit;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;opacity:.7}',
    js: `all('countdown').forEach(function(el){var end=new Date(el.getAttribute('data-to')||'').getTime();if(isNaN(end))return;var L=lbl();el.setAttribute('role','timer');function tick(){var s=Math.max(0,Math.floor((end-Date.now())/1000));var v=[Math.floor(s/86400),Math.floor(s%86400/3600),Math.floor(s%3600/60),s%60];el.innerHTML=v.map(function(n,i){return '<span class="fx-cd"><span>'+String(n).padStart(2,'0')+'</span><small>'+L.units[i]+'</small></span>'}).join('');if(s>0)setTimeout(tick,1000)}tick()})`,
  },

  // ------------------------------------------------------------- Fundos e texturas
  grain: {
    name: 'Granulado de filme',
    when: 'Textura analógica sutil por cima de uma seção (clima vintage, artesanal, fotográfico, editorial).',
    markup: 'data-fx="grain" na <section> ou bloco.',
    css: "[data-fx~=\"grain\"]{position:relative;isolation:isolate}[data-fx~=\"grain\"]::before{content:\"\";position:absolute;inset:0;pointer-events:none;z-index:1;opacity:.12;mix-blend-mode:overlay;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")}",
  },
  aurora: {
    name: 'Aurora de cor',
    when: 'Fundo de luz colorida que se move bem devagar. SÓ quando for a marca registrada e o clima pedir (spa, bem-estar, vida noturna, tecnologia); nunca como enfeite padrão.',
    markup: 'data-fx="aurora" na <section> (o conteúdo fica por cima).',
    css: '[data-fx~="aurora"]{position:relative;isolation:isolate;overflow:hidden}[data-fx~="aurora"]::before{content:"";position:absolute;inset:-25%;z-index:-1;pointer-events:none;background:radial-gradient(38% 38% at 22% 30%,color-mix(in srgb,var(--fx-brand) 55%,transparent),transparent 70%),radial-gradient(34% 34% at 78% 22%,color-mix(in srgb,var(--fx-accent) 45%,transparent),transparent 70%),radial-gradient(42% 42% at 60% 82%,color-mix(in srgb,var(--fx-brand) 35%,transparent),transparent 70%);filter:blur(48px);animation:fx-aurora 22s ease-in-out infinite alternate}@keyframes fx-aurora{to{transform:translate3d(4%,-3%,0) rotate(8deg) scale(1.08)}}',
  },
  pattern: {
    name: 'Padrão de fundo',
    when: 'Textura geométrica discreta atrás de uma seção: pontos, grade, papel milimetrado ou listras diagonais (engenharia, arquitetura, escola, tecnologia).',
    markup: 'data-fx="pattern" data-pattern="dots|grid|paper|diagonal" na <section>.',
    css: '[data-fx~="pattern"]{position:relative;isolation:isolate}[data-fx~="pattern"]::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;--fx-line:color-mix(in srgb,currentColor 12%,transparent);-webkit-mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%);mask-image:radial-gradient(ellipse at center,#000 30%,transparent 80%)}[data-pattern="dots"]::before{background:radial-gradient(var(--fx-line) 1.2px,transparent 1.6px) 0 0/22px 22px}[data-pattern="grid"]::before{background:linear-gradient(var(--fx-line) 1px,transparent 1px) 0 0/40px 40px,linear-gradient(90deg,var(--fx-line) 1px,transparent 1px) 0 0/40px 40px}[data-pattern="paper"]::before{background:linear-gradient(var(--fx-line) 1px,transparent 1px) 0 0/12px 12px,linear-gradient(90deg,var(--fx-line) 1px,transparent 1px) 0 0/12px 12px}[data-pattern="diagonal"]::before{background:repeating-linear-gradient(45deg,var(--fx-line) 0 1px,transparent 1px 14px)}',
  },
  beam: {
    name: 'Borda com luz correndo',
    when: 'UM card que precisa chamar atenção (plano mais escolhido, oferta). Nunca em vários.',
    markup: 'data-fx="beam" no card (com cantos arredondados).',
    css: '@property --fx-a{syntax:"<angle>";inherits:false;initial-value:0deg}[data-fx~="beam"]{position:relative;isolation:isolate}[data-fx~="beam"]::before{content:"";position:absolute;inset:0;padding:1.5px;border-radius:inherit;pointer-events:none;background:conic-gradient(from var(--fx-a),transparent 0 72%,var(--fx-accent) 84%,var(--fx-brand) 92%,transparent);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);animation:fx-beam 5s linear infinite}@keyframes fx-beam{to{--fx-a:360deg}}',
  },

  'dot-grid': {
    name: 'Grade de pontos viva',
    when: 'Fundo de pontos finos que acendem e se afastam perto do mouse (parado no celular). Tecnologia, arquitetura, engenharia, estúdios. Atrás do topo ou de uma chamada.',
    markup:
      'Primeiro filho da <section> (que tenha relative isolate overflow-hidden): <div data-fx="dot-grid" aria-hidden="true" class="absolute inset-0 -z-10"></div>.',
    css: '[data-fx~="dot-grid"]{pointer-events:none;-webkit-mask-image:radial-gradient(ellipse at center,#000 35%,transparent 80%);mask-image:radial-gradient(ellipse at center,#000 35%,transparent 80%)}[data-fx~="dot-grid"] canvas{display:block;width:100%;height:100%}',
    js: `all('dot-grid').forEach(function(el){var c=document.createElement('canvas');el.appendChild(c);var x=c.getContext('2d');if(!x)return;var col=getComputedStyle(el).color,brand=getComputedStyle(d).getPropertyValue('--fx-brand').trim()||col,gap=26,mx=-999,my=-999,on=false,dpr=Math.min(2,devicePixelRatio||1),W=0,H=0;function size(){W=el.clientWidth;H=el.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);draw()}function draw(){x.clearRect(0,0,W,H);for(var py=gap/2;py<H;py+=gap)for(var px=gap/2;px<W;px+=gap){var dx=px-mx,dy=py-my,dist=Math.sqrt(dx*dx+dy*dy),k=Math.max(0,1-dist/140),ox=dist?dx/dist*k*10:0,oy=dist?dy/dist*k*10:0;x.globalAlpha=.22+k*.7;x.fillStyle=k>.05?brand:col;x.beginPath();x.arc(px+ox,py+oy,1.2+k*1.6,0,6.283);x.fill()}}size();addEventListener('resize',size);if(FINE&&!RM){var host=el.parentElement;host.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;if(!on){on=true;requestAnimationFrame(function(){on=false;draw()})}});host.addEventListener('pointerleave',function(){mx=my=-999;draw()})}})`,
  },
  particles: {
    name: 'Partículas flutuando',
    when: 'Pontinhos de luz na cor da marca flutuando devagar e ligados por linhas finas. Clima de tecnologia, noite, energia. Só em fundo escuro, atrás do topo.',
    markup:
      'Primeiro filho da <section> (que tenha relative isolate overflow-hidden): <div data-fx="particles" aria-hidden="true" class="absolute inset-0 -z-10"></div>.',
    css: '[data-fx~="particles"]{pointer-events:none}[data-fx~="particles"] canvas{display:block;width:100%;height:100%}',
    js: `all('particles').forEach(function(el){var c=document.createElement('canvas');el.appendChild(c);var x=c.getContext('2d');if(!x)return;var brand=getComputedStyle(d).getPropertyValue('--fx-brand').trim()||'#fff',dpr=Math.min(2,devicePixelRatio||1),W=0,H=0,P=[],run=false;function size(){W=el.clientWidth;H=el.clientHeight;c.width=W*dpr;c.height=H*dpr;x.setTransform(dpr,0,0,dpr,0,0);var n=Math.min(70,Math.round(W*H/16000));P=[];for(var i=0;i<n;i++)P.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.6+.6})}function frame(){x.clearRect(0,0,W,H);x.fillStyle=brand;x.strokeStyle=brand;for(var i=0;i<P.length;i++){var p=P[i];if(!RM){p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}x.globalAlpha=.75;x.beginPath();x.arc(p.x,p.y,p.r,0,6.283);x.fill();for(var j=i+1;j<P.length;j++){var q=P[j],dx=p.x-q.x,dy=p.y-q.y,dd=dx*dx+dy*dy;if(dd<12000){x.globalAlpha=.18*(1-dd/12000);x.beginPath();x.moveTo(p.x,p.y);x.lineTo(q.x,q.y);x.stroke()}}}if(run&&!RM)requestAnimationFrame(frame)}size();frame();addEventListener('resize',function(){size();frame()});if(!RM&&'IntersectionObserver' in window)new IntersectionObserver(function(es){var v=es[0].isIntersecting;if(v&&!run){run=true;requestAnimationFrame(frame)}else if(!v)run=false}).observe(el)})`,
  },

  // ------------------------------------------------------------- Molduras
  polaroid: {
    name: 'Foto polaroid',
    when: 'Fotos com clima de lembrança, bastidor ou "nossa história" (família, pet, café, eventos). Fica ótimo com 2 ou 3 sobrepostas e levemente giradas.',
    markup: '<figure data-fx="polaroid" style="--fx-rot:-3deg"><img …><figcaption>Legenda curta</figcaption></figure>.',
    css: '[data-fx~="polaroid"]{background:#fff;color:#1c1917;padding:.6rem .6rem 0;border-radius:.25rem;box-shadow:0 18px 40px -18px rgba(0,0,0,.45);transform:rotate(var(--fx-rot,-2deg));transition:transform .3s ease}[data-fx~="polaroid"]:hover{transform:rotate(0) scale(1.02)}[data-fx~="polaroid"] img{width:100%;aspect-ratio:1;object-fit:cover}[data-fx~="polaroid"] figcaption{padding:.7rem .2rem .9rem;font-size:.9rem;text-align:center}',
  },
  receipt: {
    name: 'Comanda/recibo',
    when: 'Lista de preços com cara de comanda de papel, borda serrilhada e letra de máquina (lanchonete, barbearia, café, oficina).',
    markup: '<div data-fx="receipt" class="max-w-md p-6">…linhas nome + preço…</div>.',
    css: '[data-fx~="receipt"]{background:#fffdf6;color:#1f1b16;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;box-shadow:0 18px 40px -20px rgba(0,0,0,.35);padding-bottom:2rem;-webkit-mask:linear-gradient(#000 0 0) top/100% calc(100% - 10px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/20px 10px repeat-x;mask:linear-gradient(#000 0 0) top/100% calc(100% - 10px) no-repeat,conic-gradient(from -45deg at bottom,#0000,#000 1deg 89deg,#0000 90deg) bottom/20px 10px repeat-x}',
  },
  ticket: {
    name: 'Ingresso/cupom',
    when: 'Oferta, convite ou evento com cara de ingresso (recortes nas laterais). Ex.: "primeira visita com desconto" informado pelo usuário.',
    markup: '<div data-fx="ticket" class="bg-brand p-8 text-…">…</div>.',
    css: '[data-fx~="ticket"]{-webkit-mask:radial-gradient(circle 14px at 0 50%,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 14px at 100% 50%,#0000 98%,#000) right/51% 100% no-repeat;mask:radial-gradient(circle 14px at 0 50%,#0000 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 14px at 100% 50%,#0000 98%,#000) right/51% 100% no-repeat}',
  },
  'phone-frame': {
    name: 'Moldura de celular',
    when: 'Mostrar um app, perfil de rede social ou tela de agendamento dentro de um celular (agências, apps, criadores).',
    markup: '<div data-fx="phone-frame" class="w-64"><img src="…" alt="…"></div>.',
    css: '[data-fx~="phone-frame"]{position:relative;aspect-ratio:9/19.5;border:10px solid #111;border-radius:2.6rem;overflow:hidden;background:#111;box-shadow:0 30px 60px -25px rgba(0,0,0,.6)}[data-fx~="phone-frame"]::before{content:"";position:absolute;top:.5rem;left:50%;transform:translateX(-50%);width:32%;height:1.4rem;border-radius:999px;background:#111;z-index:1}[data-fx~="phone-frame"] img{width:100%;height:100%;object-fit:cover}',
  },
  'browser-frame': {
    name: 'Moldura de navegador',
    when: 'Mostrar um site ou sistema já feito pelo negócio (portfólio de agência, software).',
    markup: '<div data-fx="browser-frame"><img src="…" alt="…"></div>.',
    css: '[data-fx~="browser-frame"]{border-radius:.9rem;overflow:hidden;background:#1c1c1e;padding-top:2rem;position:relative;box-shadow:0 30px 60px -25px rgba(0,0,0,.55)}[data-fx~="browser-frame"]::before{content:"";position:absolute;top:.75rem;left:.9rem;width:.6rem;height:.6rem;border-radius:999px;background:#ff5f57;box-shadow:1rem 0 #febc2e,2rem 0 #28c840}[data-fx~="browser-frame"] img{display:block;width:100%}',
  },

  // ------------------------------------------------------------- Rolagem suave
  'smooth-scroll': {
    name: 'Rolagem suave',
    when: 'Sites com clima premium/cinematográfico que usam efeitos de rolagem (parallax, rolagem lateral). Só liga em computador.',
    markup: 'Coloque uma vez, dentro do cabeçalho: <span data-fx="smooth-scroll" hidden></span>.',
    js: `if(FINE&&!RM&&all('smooth-scroll').length){var ls=document.createElement('script');ls.src='https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js';ls.onload=function(){if(!window.Lenis)return;var lenis=new window.Lenis({lerp:.1,anchors:true});function raf(t){lenis.raf(t);requestAnimationFrame(raf)}requestAnimationFrame(raf)};document.head.appendChild(ls)}`,
  },
}

export const EFFECT_IDS = Object.keys(EFFECTS)

/** No máximo estes efeitos por site: o resto fica calmo. */
export const MAX_EFFECTS = 4

export function cleanEffects(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id in EFFECTS))].slice(0, MAX_EFFECTS)
}

/** Lista curta (nome + quando usar) para o diretor de arte escolher. */
export function effectsMenu(ids: string[] = EFFECT_IDS): string {
  return ids
    .filter((id) => id in EFFECTS)
    .map((id) => `- ${id}: ${EFFECTS[id].name}. ${EFFECTS[id].when}`)
    .join('\n')
}

/** Como usar os efeitos (para quem escreve o HTML). */
export function effectsGuide(ids: string[] = EFFECT_IDS): string {
  return ids
    .filter((id) => id in EFFECTS)
    .map((id) => `- ${id} (${EFFECTS[id].name}): ${EFFECTS[id].when} Como usar: ${EFFECTS[id].markup}`)
    .join('\n')
}

/** Efeitos usados no HTML (data-fx="a b"). */
export function usedEffects(html: string): string[] {
  const used = new Set<string>()
  for (const match of html.matchAll(/data-fx\s*=\s*["']([^"']+)["']/gi)) {
    for (const id of match[1].split(/\s+/)) if (id in EFFECTS) used.add(id)
  }
  return EFFECT_IDS.filter((id) => used.has(id))
}

const RUNTIME_HEAD = `(function(){var d=document.documentElement;d.classList.add('fx');var RM=matchMedia('(prefers-reduced-motion: reduce)').matches,FINE=matchMedia('(hover: hover) and (pointer: fine)').matches;function all(n){return document.querySelectorAll('[data-fx~="'+n+'"]')}function seen(el,fn){if(!('IntersectionObserver' in window)){fn();return}var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.disconnect();fn()}})},{rootMargin:'0px 0px -12% 0px'});io.observe(el)}var subs=[],busy=false;function run(){busy=false;subs.forEach(function(f){f()})}function onScroll(f){subs.push(f);f()}addEventListener('scroll',function(){if(!busy){busy=true;requestAnimationFrame(run)}},{passive:true});addEventListener('resize',run);function lbl(){var l=(d.lang||'pt').slice(0,2);return ({en:{prev:'Previous',next:'Next',compare:'Compare before and after',before:'Before',after:'After',units:['days','hours','min','sec']},es:{prev:'Anterior',next:'Siguiente',compare:'Comparar antes y después',before:'Antes',after:'Después',units:['días','horas','min','seg']}})[l]||{prev:'Anterior',next:'Próximo',compare:'Comparar antes e depois',before:'Antes',after:'Depois',units:['dias','horas','min','seg']}}`

/** CSS e JS só dos efeitos usados (vazio se nenhum). */
export function effectsRuntime(html: string): { css: string; js: string } {
  const ids = usedEffects(html)
  if (ids.length === 0) return { css: '', js: '' }
  const css = ids
    .map((id) => EFFECTS[id].css ?? '')
    .filter(Boolean)
    .join('')
  const modules = ids.map((id) => EFFECTS[id].js).filter(Boolean)
  // Cada efeito roda isolado: um erro num não derruba os outros.
  const js = `${RUNTIME_HEAD}${modules.map((code) => `try{${code}}catch(e){}`).join('')}})();`
  return { css, js }
}
