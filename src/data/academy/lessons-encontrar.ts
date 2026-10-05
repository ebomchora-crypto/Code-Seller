import type { AcademyLesson } from './types'

// Módulo 2 — Encontrar: das empresas certas à primeira resposta.
export const LESSONS_ENCONTRAR: AcademyLesson[] = [
  {
    id: 'onde-estao-os-clientes',
    module: 'encontrar',
    title: 'Quem tem mais chance de comprar',
    summary: 'Nem todo lead vale o mesmo tempo. Aprenda a separar os quentes dos frios.',
    minutes: 5,
    body: `Seu tempo é o recurso mais caro da operação. Abordar 50 empresas aleatórias rende menos que abordar 20 escolhidas a dedo. Antes de mandar qualquer mensagem, separe os leads em três grupos.

## Lead A: aborde primeiro (e faça protótipo)

- **Muitas avaliações** (sinal de movimento e de dinheiro entrando).
- **Sem site**, ou com site quebrado, lento ou antigo.
- **Instagram ativo**: o dono se importa com imagem e já entende divulgação.
- Nicho que você domina.

## Lead B: aborde sem protótipo, só com a mensagem

- Movimento médio, com site fraco ou só Instagram.
- Se responder com interesse, aí sim você faz o protótipo.

## Lead C: deixe para depois

- Poucas avaliações, sem sinal de movimento, nicho fora do seu foco.
- Ou já tem um site bom e recente. Ali a conversa é outra (manutenção, anúncios), não comece por eles.

## O sinal mais forte de todos

Empresa **com muitas avaliações e sem site** é a combinação de ouro: tem clientes, tem dinheiro e está perdendo quem pesquisa no Google e não encontra nada. É exatamente o problema que você resolve.`,
    example: {
      title: 'Separando uma lista',
      text: 'De 30 oficinas encontradas: 6 viraram lead A (mais de 80 avaliações e sem site), 11 viraram B (site antigo ou só Instagram) e 13 ficaram como C. A semana começou pelos 6 do grupo A, cada um com protótipo.',
    },
    mistakes: [
      'Tratar todo lead igual e gastar protótipo com quem não tem dinheiro.',
      'Começar pelas empresas grandes, que já têm agência.',
      'Ignorar o Instagram do lead: ele diz muito sobre o dono.',
    ],
    exercise: {
      prompt: 'Pegue uma lista do seu nicho e escreva quantos leads A, B e C você encontrou, com o nome dos 3 melhores do grupo A.',
      placeholder: 'A: 5 (Clínica X, Clínica Y, Clínica Z…)\nB: 9\nC: 12',
    },
    checklist: [
      'Separei uma lista em A, B e C',
      'Escolhi os leads A da semana',
      'Salvei os leads A no CRM',
    ],
  },
  {
    id: 'buyers-hunter-na-pratica',
    module: 'encontrar',
    title: 'Buyers Hunter: sua lista em 20 minutos',
    summary: 'Uma busca bem feita por dia mantém o funil cheio.',
    minutes: 5,
    body: `O Buyers Hunter encontra empresas do seu nicho na sua cidade e já mostra o que importa: se tem site, quantas avaliações, telefone e WhatsApp. Use assim:

## A sessão diária de 20 minutos

1. **Busque** o nicho + cidade (ou um bairro, se a cidade for grande).
2. **Filtre** pelas que estão sem site ou com site fraco.
3. **Ordene** pelas que têm mais avaliações.
4. **Importe** para o CRM só as que valem a pena (lead A e B). Quando importar, o sistema já sugere a primeira mensagem e agenda o follow-up.
5. **Abra o perfil** de cada uma por 1 minuto para a pesquisa rápida (próxima lição).

## Metas que funcionam

- **20 empresas novas por dia** no CRM, 5 dias por semana = 100 por semana.
- Disso, aborde pelo menos **10 por dia**.
- Com uma taxa normal de resposta, isso vira de 3 a 6 conversas por semana. É daí que saem as vendas.

## Varie a busca

Acabaram as empresas do bairro? Mude de bairro, vá para a cidade vizinha ou busque um termo próximo ("dentista", "clínica odontológica", "ortodontia"). Cada termo traz empresas diferentes.`,
    example: {
      title: 'Uma sessão de 20 minutos',
      text: 'Busca "centro automotivo" na zona sul: 28 resultados, 12 sem site. Ordenou por avaliações, importou 8 para o CRM (os primeiros com mais de 50 avaliações) e deixou a primeira mensagem de cada um pronta para enviar.',
    },
    mistakes: [
      'Importar tudo para o CRM e virar um cemitério de leads.',
      'Buscar só uma vez e achar que "acabaram os clientes".',
      'Pular a pesquisa de 1 minuto e mandar mensagem genérica.',
    ],
    exercise: {
      prompt: 'Faça uma busca agora e anote: termo usado, quantas empresas apareceram, quantas sem site e quantas você importou.',
      placeholder: 'Termo: "dentista" em ... — 34 empresas, 15 sem site, importei 9.',
    },
    checklist: [
      'Fiz uma busca no Buyers Hunter',
      'Importei para o CRM só os leads que valem a pena',
      'Defini minha meta diária de empresas novas',
    ],
  },
  {
    id: 'pesquise-antes',
    module: 'encontrar',
    title: '1 minuto de pesquisa muda a resposta',
    summary: 'Uma mensagem com algo real do negócio parece conversa, não disparo.',
    minutes: 5,
    body: `A diferença entre ser ignorado e receber resposta muitas vezes é **uma frase** que mostra que você olhou para aquele negócio de verdade. Isso leva 1 minuto por lead.

## O que olhar

- **Avaliações:** a nota, quantas são, e o que os clientes elogiam ("atendimento", "pontualidade", "preço justo"). Elogio vira argumento.
- **Reclamações:** "difícil de falar com eles", "nunca atendem o telefone". Isso é dor que o site resolve.
- **Instagram:** posta com frequência? Tem fotos boas? O link da bio leva para onde?
- **Site atual:** existe? Abre no celular? Tem WhatsApp? Está desatualizado?

## Transforme em uma frase

Pegue o mais forte que você achou e coloque no começo da mensagem:

> "Vi que vocês têm 4,9 com mais de 200 avaliações, e quase todas elogiam o atendimento."

> "Vi que o Instagram de vocês é bem ativo, mas o link da bio não leva para nenhum site."

> "Procurei vocês no Google e o site não abriu no celular."

## Anote no CRM

Coloque o que você achou nas observações do contato. O CS Copilot lê essas notas e usa nas mensagens que sugere. E quando o lead responder daqui a uma semana, você lembra na hora.`,
    example: {
      title: 'O que vira argumento',
      text: 'Pesquisa de 1 minuto numa clínica de estética: nota 4,8 com 156 avaliações, várias dizendo "demorei para conseguir agendar pelo WhatsApp". A mensagem começou com: "Vi que as clientes amam o atendimento de vocês, mas algumas comentam que é difícil conseguir horário pelo WhatsApp."',
    },
    mistakes: [
      'Elogio genérico ("adorei o trabalho de vocês") que serve para qualquer empresa.',
      'Apontar defeitos de forma agressiva ("seu site é horrível").',
      'Não anotar nada no CRM e esquecer o contexto depois.',
    ],
    exercise: {
      prompt: 'Pesquise 3 leads e escreva, para cada um, a frase de abertura com algo real do negócio.',
      placeholder: 'Clínica X: "Vi que vocês têm 4,9 com mais de 200 avaliações…"\nClínica Y: …',
    },
    checklist: [
      'Pesquisei 3 leads por 1 minuto cada',
      'Escrevi uma frase real para cada um',
      'Anotei o que achei no CRM',
    ],
  },
  {
    id: 'demo-antes-da-conversa',
    module: 'encontrar',
    title: 'A primeira mensagem: peça para mostrar',
    summary: 'O objetivo da primeira mensagem não é vender. É conseguir um "pode mandar".',
    minutes: 7,
    body: `A primeira mensagem tem **um único objetivo**: conseguir permissão para mostrar algo. Não é explicar o serviço, não é falar de preço, não é se apresentar. É despertar curiosidade e pedir uma ação simples.

## A estrutura

1. **Comece pelo negócio do lead**, com a frase da pesquisa.
2. **Diga o que você fez** em uma frase: montou uma prévia, ou tem uma ideia para eles.
3. **Peça permissão** para mostrar: "Posso te enviar por aqui?"

Até 4 ou 5 linhas. Tom de WhatsApp real.

## Com protótipo pronto

> Olá, tudo bem? Vi que a Clínica Sorriso Pleno tem 4,9 com mais de 200 avaliações no Google, mas não encontrei um site de vocês. Montei uma prévia de como ele poderia ficar. Posso te enviar por aqui?

## Sem protótipo ainda

> Oi, tudo bem? Vi que a oficina de vocês tem ótimas avaliações, mas quem procura no Google não encontra um site. Tenho uma ideia simples de como isso poderia trazer mais pedidos de orçamento. Posso te mostrar um exemplo?

## Quem atende é funcionário

O WhatsApp da empresa quase sempre é atendido pela recepção, não pelo dono. Tudo bem: peça para mostrar ao responsável, sem vender.

> Oi! Montei uma prévia de site com o nome de vocês e queria mostrar para o responsável. É só uma ideia, sem compromisso. Consegue me dizer com quem eu falo?

Silêncio ou "vou passar para ele" não é recusa do dono. Faz parte.

## O que nunca fazer na primeira mensagem

- **Se apresentar primeiro:** "Sou o Arthur, trabalho com criação de sites…". Ninguém liga para quem você é antes de ver algo útil.
- **Despejar benefícios:** "site responsivo, SEO, mais clientes, presença digital…".
- **Falar de preço.**
- **Mandar o link sem pedir:** parece spam e muita gente nem abre.

O CS Copilot escreve essas mensagens para você seguindo exatamente essas regras. Peça: "faz a primeira mensagem para este lead".`,
    example: {
      title: 'Por que pedir permissão funciona',
      text: 'Quem responde "pode mandar" já disse um pequeno sim. Ele vai abrir o link esperando por ele, em vez de ignorar uma mensagem com link de um desconhecido. E você ganha o direito de continuar a conversa.',
    },
    mistakes: [
      'Começar com "Sou fulano, trabalho com…".',
      'Mandar texto longo explicando tudo de uma vez.',
      'Enviar o link do protótipo sem pedir antes.',
      'Desistir porque a recepção não passou para o dono na primeira vez.',
    ],
    exercise: {
      prompt: 'Escreva sua primeira mensagem para um lead real usando a estrutura: negócio dele → o que você fez → pedido de permissão.',
      placeholder: 'Olá, tudo bem? Vi que … Montei uma prévia de … Posso te enviar por aqui?',
    },
    checklist: [
      'Escrevi minha primeira mensagem seguindo a estrutura',
      'Enviei para pelo menos 5 leads',
      'Registrei os envios no CRM',
    ],
  },
  {
    id: 'organize-o-pipeline',
    module: 'encontrar',
    title: 'Ritmo diário e pipeline',
    summary: 'Venda é rotina. Uma hora por dia, todo dia, ganha de um dia inteiro por semana.',
    minutes: 5,
    body: `Quem vende de forma consistente não depende de inspiração: tem uma rotina pequena que repete todo dia. O Code Sellers foi feito para essa rotina caber em uma hora.

## A hora de vendas

- **15 min, follow-ups:** abra Tarefas e responda/retome quem está esperando. Conversa em andamento vale mais que lead novo.
- **20 min, lista nova:** busca no Buyers Hunter e importação dos melhores.
- **20 min, abordagens:** primeira mensagem para 10 leads, com a frase da pesquisa.
- **5 min, atualizar o CRM:** mova os negócios de etapa e anote o que aconteceu.

## As etapas do pipeline

Cada lead está em uma etapa. Saber onde cada um está mostra o que fazer hoje:

1. **Contato:** abordado, esperando resposta.
2. **Qualificado:** respondeu com interesse, recebeu (ou vai receber) o protótipo.
3. **Proposta:** reunião feita, proposta enviada.
4. **Negociação:** conversando sobre valor, prazo ou ajustes.
5. **Fechamento:** aceitou, falta pagamento ou contrato.

## Os números que importam

Toda semana, olhe: quantos abordou, quantos responderam, quantas reuniões, quantas vendas. Se muita gente não responde, melhore a primeira mensagem. Se respondem mas não marcam reunião, melhore o pós-protótipo. O problema sempre aparece em uma etapa.`,
    example: {
      title: 'A conta da semana',
      text: '50 abordagens → 12 respostas → 7 protótipos enviados → 3 reuniões → 1 venda. Com 1 venda de R$ 1.800 por semana, são mais de R$ 7.000 por mês com uma hora por dia. Melhorar só a etapa de reunião (de 3 para 5) já muda o mês.',
    },
    mistakes: [
      'Prospectar um dia inteiro e passar o resto da semana sem fazer nada.',
      'Esquecer os follow-ups e só correr atrás de lead novo.',
      'Não mover os negócios de etapa e perder a noção de quem está quente.',
    ],
    exercise: {
      prompt: 'Escreva sua rotina: em que horário você vai fazer sua hora de vendas e suas metas diárias (empresas novas, abordagens, follow-ups).',
      placeholder: 'Horário: 9h às 10h, de segunda a sexta.\nMetas: 20 empresas novas, 10 abordagens, todos os follow-ups do dia.',
    },
    checklist: [
      'Defini o horário da minha hora de vendas',
      'Coloquei meus leads nas etapas certas do pipeline',
      'Defini a meta do mês no Início',
    ],
  },
]
