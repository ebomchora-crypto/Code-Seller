import type { AcademyLesson } from './types'

export const LESSONS_CRIAR: AcademyLesson[] = [
  {
    id: 'nicho-que-paga',
    module: 'criar',
    title: 'Escolha um nicho que paga',
    summary: 'Quem tem dinheiro, precisa de você e ainda não resolveu o problema.',
    minutes: 4,
    body: `Vender "site para qualquer empresa" é difícil. Vender **site com agendamento para clínicas de estética** é muito mais fácil: você entende o cliente, fala a língua dele e reaproveita o que já fez.

## O que faz um nicho ser bom

- **Ticket médio alto:** cada cliente novo vale dinheiro para o negócio (clínicas, estética, oficinas, escolas, imobiliárias, advocacia).
- **Depende de contato:** vive de agenda, orçamento ou WhatsApp. Um site que traz contato vira dinheiro.
- **Pouca presença digital:** muitas empresas do nicho não têm site, ou só têm Instagram.
- **Já investe em algo:** paga anúncio, panfleto ou comissão. Sabe que marketing custa.

## Como decidir

Liste 3 nichos que você entende ou conhece alguém de dentro. Para cada um, abra o Buyers Hunter (ou o Google Maps) na sua cidade e veja: quantas empresas aparecem? Quantas estão **sem site**? Quantas têm **muitas avaliações** (sinal de movimento)?

O nicho vencedor é o que tem **mais empresas movimentadas sem site**. Comece por ele. Você pode mudar depois — mas escolha um para começar hoje.`,
    example: {
      title: 'Exemplo',
      text: 'Em uma cidade média, uma busca por "clínica odontológica" mostrou 40 clínicas: 17 sem site, 9 só com Instagram e várias com mais de 100 avaliações. É um nicho com dinheiro, demanda e espaço.',
    },
    checklist: [
      'Listei 3 nichos que entendo ou conheço alguém de dentro',
      'Pesquisei os 3 no Buyers Hunter ou no Google Maps da minha cidade',
      'Escolhi 1 nicho para começar',
    ],
  },
  {
    id: 'problema-que-vale-dinheiro',
    module: 'criar',
    title: 'Encontre o problema que vale dinheiro',
    summary: 'Ninguém compra "um site". Compra mais clientes, menos trabalho ou mais confiança.',
    minutes: 4,
    body: `O dono da empresa não quer um site. Ele quer **mais clientes**, **menos tempo no telefone** ou **parecer mais profissional que o concorrente**. O site é só o caminho.

## Perguntas que revelam o problema

- Como os clientes chegam hoje? (indicação, Instagram, passando na frente)
- O que acontece quando alguém procura "[serviço] em [cidade]" no Google?
- Quanto tempo se perde respondendo as mesmas perguntas no WhatsApp?
- Quanto vale um cliente novo para esse negócio?

## Transforme em promessa

Pegue o problema e escreva uma frase de resultado. Evite prometer números que você não controla:

- Em vez de "faço sites", diga: **"Ajudo clínicas a receber agendamentos pelo site, sem depender só do telefone."**
- Em vez de "faço landing pages", diga: **"Crio páginas que transformam quem vê seu anúncio em conversa no WhatsApp."**

Essa frase vai para a sua bio, para o seu Sellers Portfolio e para a primeira mensagem.`,
    example: {
      title: 'Frase de promessa',
      text: '"Ajudo oficinas mecânicas a receber pedidos de orçamento pelo WhatsApp de quem procura no Google, sem precisar pagar anúncio todo mês."',
    },
    checklist: [
      'Escrevi os 3 principais problemas do meu nicho',
      'Criei minha frase de promessa',
      'Coloquei a frase na minha página do Sellers Portfolio',
    ],
  },
  {
    id: 'construa-com-ia',
    module: 'criar',
    title: 'Construa com IA sem travar',
    summary: 'Um fluxo simples: briefing, estrutura, geração e ajuste fino.',
    minutes: 5,
    body: `A IA faz o trabalho pesado, mas quem conduz é você. O segredo é não pedir "faz um site" de uma vez só — é ir por etapas.

## O fluxo

1. **Briefing:** junte nome da empresa, cidade, serviços, diferenciais, público e o objetivo do site (ex.: agendar avaliação).
2. **Estrutura:** peça à IA a estrutura de seções antes de qualquer texto. Ajuste até fazer sentido.
3. **Geração:** gere a página seção por seção no construtor que você usa.
4. **Ajuste fino:** revise textos, troque imagens genéricas por fotos reais sempre que possível, confira cores e fontes.
5. **Celular primeiro:** a maioria dos clientes vai abrir no celular. Revise tudo nele antes de mostrar.

## Dicas que economizam tempo

- Salve seus melhores prompts (use a aba **Kit** para copiar os prontos).
- Monte uma "base" por nicho: da segunda clínica em diante, você só adapta.
- Não perca horas no detalhe antes de o cliente ver. Mostre cedo, ajuste depois.`,
    example: {
      title: 'Ordem que funciona',
      text: 'Briefing (10 min) → estrutura aprovada (5 min) → primeira versão (30 a 60 min) → revisão no celular (15 min). Em cerca de 1h30 você tem algo bom o bastante para mostrar.',
    },
    checklist: [
      'Montei o briefing de um negócio real do meu nicho',
      'Usei o prompt de estrutura do Kit',
      'Gerei a primeira versão e revisei no celular',
    ],
  },
  {
    id: 'qualidade-que-parece-cara',
    module: 'criar',
    title: 'Qualidade que parece cara',
    summary: 'Os detalhes que fazem o cliente sentir que vale o preço.',
    minutes: 4,
    body: `O cliente não sabe avaliar código. Ele avalia o que **vê e sente** nos primeiros segundos. Alguns cuidados fazem um site simples parecer profissional.

## Checklist de qualidade

- **Abre rápido**, principalmente no 4G.
- **Botão de WhatsApp** visível sem precisar rolar a página.
- **Título que diz o que a empresa faz e onde**, não só o nome.
- **Fotos reais** do lugar e da equipe (peça ao cliente; evite banco de imagens óbvio).
- **Prova social:** avaliações, número de clientes atendidos, anos de mercado.
- **Endereço, horário e mapa** para negócios locais.
- **Textos curtos**, sem erros de português.
- **Funciona no celular** do jeito que o cliente usa: com o dedo, com pressa.

## Antes de mostrar

Abra o site no seu celular, no de outra pessoa e no computador. Clique em todos os botões. Um botão de WhatsApp que não funciona derruba a confiança na hora.`,
    checklist: [
      'Passei o checklist de qualidade no meu projeto',
      'Testei em 2 celulares diferentes',
      'Adicionei o projeto ao meu Sellers Portfolio',
    ],
  },
  {
    id: 'transforme-em-oferta',
    module: 'criar',
    title: 'Transforme em oferta',
    summary: 'Pacotes claros, preço pelo valor e o que está (e não está) incluído.',
    minutes: 5,
    body: `Oferta boa é fácil de entender e fácil de dizer "sim". Em vez de um preço solto, monte **3 pacotes**: o cliente compara e escolhe, em vez de decidir entre "compro ou não compro".

## Estrutura de 3 pacotes

- **Essencial:** o mínimo que resolve (ex.: página única com WhatsApp e mapa).
- **Profissional:** o que você mais quer vender (ex.: site com páginas de serviço, agendamento e ajustes por 30 dias).
- **Completo:** tudo do anterior + extras (ex.: textos otimizados, integração, manutenção mensal).

## Como pensar o preço

- Parta do **valor para o cliente**, não das suas horas. Se um cliente novo vale R$ 500 para a clínica, um site que traz alguns por mês se paga rápido.
- Defina **prazo** e **número de rodadas de ajuste** em cada pacote.
- Deixe claro o que **não** está incluído (domínio, hospedagem, fotos, textos longos).
- Ofereça **entrada + restante na entrega** (ex.: 50% + 50%).

Use os modelos de proposta do **Kit** para montar a sua.`,
    example: {
      title: 'Exemplo de pacotes',
      text: 'Essencial R$ 900 (landing page, 7 dias) · Profissional R$ 1.800 (site de 5 páginas com agendamento, 15 dias, 30 dias de ajustes) · Completo R$ 2.900 (tudo + textos para Google e 3 meses de manutenção). Os valores são ilustrativos — ajuste para a sua cidade e o seu nicho.',
    },
    checklist: [
      'Montei meus 3 pacotes com preço, prazo e o que inclui',
      'Escrevi o que não está incluído',
      'Adaptei um modelo de proposta do Kit',
    ],
  },
]
