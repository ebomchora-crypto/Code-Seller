import type { AcademyLesson } from './types'

// Módulo 3 — Vender: do protótipo enviado ao dinheiro no bolso.
// Processo: PROTÓTIPO → INTERESSE → REUNIÃO SEM COMPROMISSO → ENTENDER O
// CLIENTE → FAZER O CLIENTE PARTICIPAR → EXPLICAR O PROJETO → VALOR → PREÇO →
// OBJEÇÕES → FECHAMENTO. Sumiu? Espera 2–3 dias e faz um follow-up leve.
export const LESSONS_VENDER: AcademyLesson[] = [
  {
    id: 'primeira-mensagem',
    module: 'vender',
    title: 'Depois do protótipo: marque a reunião',
    summary: 'É aqui que a venda avança ou esfria. A mensagem sempre termina pedindo um horário.',
    minutes: 7,
    body: `O lead disse "pode mandar". Este é o momento mais importante do processo, e onde a maioria erra: manda o link e escreve "qualquer dúvida estou à disposição". A conversa esfria e o lead some.

**A mensagem que acompanha o protótipo sempre convida para uma reunião e termina perguntando o horário.**

## A ordem da mensagem

1. **Entregue a prévia.**
2. **Diga que é um ponto de partida:** cores, textos e fotos mudam do jeito que ele quiser.
3. **Mostre que quer ouvir a opinião dele.**
4. **Convide para uma conversa rápida, sem compromisso** (10 a 15 minutos).
5. **Pergunte o horário com duas opções concretas.**

## O roteiro

> Segue a prévia que montei para a clínica! [link]
>
> É só um ponto de partida: cores, textos e fotos a gente ajusta do jeito que você quiser.
>
> Queria marcar 15 minutinhos para te ouvir sobre o que gostou e o que mudaria, sem compromisso. Fica melhor hoje à tarde ou amanhã de manhã?

Adapte o tratamento ao lead: "você", "a senhora", "doutora".

## Por que funciona

- **"Ponto de partida"** tira a pressão: ele não precisa amar tudo, só opinar.
- **O motivo da reunião é bom para ele** (ser ouvido), não "eu apresentar meu serviço".
- **Duas opções de horário** tornam a resposta fácil. "Quando você pode?" dá trabalho e fica sem resposta.

## E se ele responder só "gostei"?

Ótimo sinal. Agradeça e puxe a reunião de novo, com horário:

> Que bom que gostou! Para eu deixar do jeito certo para vocês, vale a gente conversar 15 minutinhos. Pode ser amanhã às 10h ou às 15h?

## E se ele não quiser reunião?

"Pode explicar por aqui", "não tenho tempo para reunião". **Respeite e continue pelo WhatsApp.** Não insista duas vezes na reunião: faça as perguntas da reunião por mensagem, uma de cada vez.`,
    example: {
      title: 'A mensagem fraca e a forte',
      text: 'Fraca: "Oi! Como te falei, segue o protótipo. Lembrando que é só uma prévia do que poderia ser o seu site. Qualquer dúvida estou à disposição." Forte: "Segue a prévia que montei para a clínica! É um ponto de partida, a gente ajusta tudo do seu jeito. Queria marcar 15 minutinhos para te ouvir, sem compromisso. Fica melhor hoje à tarde ou amanhã de manhã?"',
    },
    mistakes: [
      'Terminar com "qualquer dúvida estou à disposição" ou "se preferir, podemos conversar".',
      'Perguntar "quando você pode?" em vez de oferecer dois horários.',
      'Explicar o projeto inteiro por mensagem antes da reunião.',
      'Insistir na reunião depois que o cliente disse que prefere mensagem.',
    ],
    exercise: {
      prompt: 'Escreva a mensagem que vai junto do seu próximo protótipo, seguindo a ordem: prévia → ponto de partida → opinião → conversa sem compromisso → dois horários.',
      placeholder: 'Segue a prévia que montei para … É só um ponto de partida … Queria marcar 15 minutinhos … Fica melhor … ou …?',
    },
    checklist: [
      'Escrevi minha mensagem de pós-protótipo com dois horários',
      'Usei essa mensagem no próximo protótipo enviado',
      'Marquei a reunião no CRM quando o lead aceitou',
    ],
  },
  {
    id: 'diagnostico',
    module: 'vender',
    title: 'A reunião sem compromisso',
    summary: 'Primeiro você entende o cliente. Preço só no final.',
    minutes: 8,
    body: `A reunião não é para "apresentar o serviço". É para **entender o negócio, ouvir o cliente e fazer ele participar da construção do site**. Quem participa compra. Quem só assiste, "vai pensar".

## O roteiro de 15 minutos

1. **Quebra-gelo (1 min):** agradeça o tempo, diga que vai ser rápido.
2. **Entenda o negócio (4 min):**
   - Como os clientes chegam hoje?
   - O que acontece quando alguém procura vocês no Google?
   - Qual serviço vocês mais querem vender?
3. **Mostre o protótipo e pergunte (5 min):**
   - O que você mais gostou?
   - O que você mudaria?
   - Tem algo que não pode faltar?
4. **Explique o raciocínio (3 min):** por que o botão de WhatsApp está ali, por que as avaliações estão no topo, por que tal serviço está em destaque. Mostre que **cada escolha tem um motivo**, que não é só um site bonito.
5. **Próximo passo e valores (2 min):** só agora, depois que ele participou, fale de valor e prazo.

## Faça o cliente participar

Não pergunte tudo de uma vez como um formulário. Faça uma pergunta, escute, comente, mostre no protótipo. Quando ele disser "aqui eu colocaria as fotos do consultório novo", ele já está imaginando o site pronto. Anote tudo: isso vira a proposta.

## O que nunca fazer

- Abrir a reunião falando de preço.
- Falar mais do que o cliente. A regra é ele falar 70% do tempo.
- Vender o site como "bonito". Venda o que ele resolve: mais pacientes, mais orçamentos, mais confiança.

## Depois da reunião

Registre no CRM: o que ele precisa, o que gostou, o que quer mudar, objeções, valor conversado e o próximo passo. O CS Copilot organiza isso para você: cole suas anotações e peça "registra essa reunião".`,
    example: {
      title: 'A pergunta que mais vende',
      text: '"Quando alguém procura dentista no bairro hoje, o que acontece?" A resposta costuma ser "acho que não aparece nada nosso" ou "aparece o Instagram". O próprio dono descobre o problema, e você não precisou convencer ninguém.',
    },
    mistakes: [
      'Começar a reunião pelo preço.',
      'Fazer monólogo apresentando o serviço.',
      'Não anotar o que o cliente disse e depois mandar uma proposta genérica.',
    ],
    exercise: {
      prompt: 'Escreva as 5 perguntas que você vai fazer na sua próxima reunião, adaptadas ao seu nicho.',
      placeholder: '1. Como os pacientes chegam hoje?\n2. …',
    },
    checklist: [
      'Escrevi minhas perguntas de reunião',
      'Fiz uma reunião seguindo o roteiro',
      'Registrei a reunião no CRM',
    ],
  },
  {
    id: 'proposta-que-fecha',
    module: 'vender',
    title: 'Preço: quando e como falar',
    summary: 'Tente levar para a conversa primeiro. Se o cliente insistir, passe o preço.',
    minutes: 6,
    body: `O cliente vai perguntar o preço, às vezes antes da reunião. A regra é simples: **tente conduzir para uma conversa rápida primeiro, mas nunca esconda o preço**.

## Pergunta de preço antes da reunião (primeira vez)

Reconheça a pergunta e explique por que vale conversar antes:

> Consigo te passar certinho, sim! Como a prévia ainda pode mudar bastante conforme o que você precisa, o ideal é a gente conversar uns 10 minutinhos para eu entender o que manter ou mudar, e aí já te passo o valor fechado. Pode ser hoje às 17h ou amanhã às 10h?

## O cliente insistiu ("mas quanto custa?")

**Passe o preço.** Desviar duas vezes irrita e parece esconder algo. Dê a faixa dos pacotes e o que muda entre eles:

> Claro! Os sites ficam entre R$ 900 e R$ 3.200, dependendo do que entra. Esse da prévia, do jeito que está, fica R$ 1.800, com entrega em 10 dias e 2 rodadas de ajuste. Quer que eu te explique o que muda entre as opções?

## Depois da reunião: a proposta

Envie pela **Proposta online** do Code Sellers (na página do negócio): o cliente abre um link bonito, vê o que está incluso e aprova com um clique. Uma boa proposta tem:

- **O que ele disse na reunião**, com as palavras dele ("receber pacientes de quem pesquisa no Google").
- **O que está incluso** e o prazo.
- **O preço**, com no máximo 3 opções.
- **Como começar:** forma de pagamento e o primeiro passo.

## Como falar o número

Fale o preço com calma, uma vez, e fique em silêncio. Quem justifica demais parece que está pedindo desculpa. Se o cliente ficar quieto, deixe ele pensar.`,
    example: {
      title: 'Ancoragem pelo valor',
      text: '"Um paciente de implante para vocês vale uns R$ 3.000, certo? O site completo fica R$ 1.800. Se ele trouxer um paciente novo, já se pagou." O preço deixa de ser custo e vira investimento.',
    },
    mistakes: [
      'Esconder o preço depois de o cliente pedir duas vezes.',
      'Mandar o preço seco, sem dizer o que está incluso.',
      'Justificar demais o valor, como se estivesse pedindo desculpa.',
      'Inventar um preço na hora.',
    ],
    exercise: {
      prompt: 'Escreva como você responde "quanto custa?" na primeira vez e quando o cliente insiste, com os seus preços.',
      placeholder: 'Primeira vez: Consigo te passar certinho …\nSe insistir: Claro! Fica entre R$ … e R$ …',
    },
    checklist: [
      'Escrevi minhas respostas para a pergunta de preço',
      'Enviei uma proposta pela Proposta online',
      'Treinei falar o preço uma vez e ficar em silêncio',
    ],
  },
  {
    id: 'objecoes-e-fechamento',
    module: 'vender',
    title: 'Objeções e fechamento',
    summary: 'Objeção não é "não". É o cliente dizendo o que falta para ele decidir.',
    minutes: 8,
    body: `Antes de rebater qualquer objeção, descubra o **obstáculo real**. Quase sempre é um destes quatro: **dinheiro, confiança, tempo ou quem decide**. Rebater a objeção errada só empurra o cliente para longe.

## "Está caro"

Não ofereça desconto de cara. Descubra se é orçamento ou valor percebido:

> Entendo. Me ajuda a entender: o valor está acima do que você tinha separado agora, ou ficou alguma dúvida se vai valer a pena?

- **Se for orçamento:** ofereça o pacote menor ou parcelamento. Tire coisas, não baixe o preço da mesma entrega.
- **Se for valor:** volte para o que ele disse na reunião (os pacientes que perde, a dependência de indicação).

## "Vou pensar"

Normalmente esconde uma dúvida. Pergunte com leveza:

> Claro! Para eu te ajudar a pensar: tem alguma parte que ainda não ficou clara, ou é mais a questão do momento?

## "Preciso falar com meu sócio / minha esposa"

Ajude a pessoa a levar a conversa:

> Faz todo sentido. Quer que eu te mande um resumo curto com o que conversamos, para você mostrar? Se ajudar, também posso fazer uma chamada rápida com vocês dois.

## "Meu sobrinho faz" / "Já tenho alguém"

Não fale mal de ninguém. Mostre a diferença:

> Que bom que você tem com quem contar! A diferença aqui é que o site já sai pensado para trazer paciente pelo Google e pelo WhatsApp, com os ajustes inclusos. Se em algum momento quiser comparar, a prévia continua aqui.

## "Agora não é o momento"

Respeite e combine o próximo contato com data:

> Sem problema. Posso te chamar no começo do mês que vem para ver se faz sentido?

## Fechamento

Quando as dúvidas acabarem, **peça o próximo passo de forma direta**:

> Então fechamos o Profissional? Te mando o link de pagamento da entrada e já começo os ajustes que você pediu.

## O que é proibido

Urgência falsa ("últimas vagas", "só hoje"), aumento de preço inventado, outro cliente fictício interessado, culpar o cliente. Pode até fechar uma venda, mas destrói a confiança, e confiança é o que traz indicação.`,
    example: {
      title: 'Desconto que não é desconto',
      text: 'Cliente: "R$ 1.800 está pesado." Em vez de baixar para R$ 1.400, ofereça: "Consigo fazer o Essencial por R$ 900 agora e, quando quiser, a gente acrescenta a galeria e o FAQ." Você mantém o valor do seu trabalho, fecha a venda e abre espaço para o upgrade depois.',
    },
    mistakes: [
      'Dar desconto na primeira objeção.',
      'Rebater sem descobrir o obstáculo real.',
      'Falar mal do concorrente ou do "sobrinho".',
      'Usar urgência falsa para forçar o fechamento.',
      'Não pedir o fechamento quando o cliente já está pronto.',
    ],
    exercise: {
      prompt: 'Escreva suas respostas para as 3 objeções que você mais ouve (ou acha que vai ouvir).',
      placeholder: '"Está caro": …\n"Vou pensar": …\n"Meu sobrinho faz": …',
    },
    checklist: [
      'Escrevi respostas para as objeções mais comuns',
      'Pratiquei a pergunta que descobre o obstáculo real',
      'Pedi o fechamento de forma direta na última negociação',
    ],
  },
  {
    id: 'follow-up',
    module: 'vender',
    title: 'Follow-up que traz de volta',
    summary: 'A maioria das vendas acontece depois do segundo contato. Leve, útil e no tempo certo.',
    minutes: 6,
    body: `O lead viu o protótipo, gostou… e sumiu. Isso é normal: o dono está atendendo, apagando incêndio, esqueceu. **Silêncio não é recusa.** Quem faz follow-up do jeito certo vende mais que quem tem a melhor mensagem inicial.

## Quando

- **Espere 2 a 3 dias** depois da última mensagem. Antes disso parece cobrança.
- Ao importar um lead do Buyers Hunter, o Code Sellers já agenda os follow-ups nas Tarefas (2, 5 e 10 dias). Siga as tarefas.

## Como: leve e com um motivo

Retome em uma frase, conecte com o último passo e proponha algo simples:

> Oi, doutora! Conseguiu dar uma olhada na prévia? Se quiser, te mostro numa conversa rápida o que dá para mudar. Fica melhor amanhã de manhã ou à tarde?

Um follow-up que acrescenta algo é ainda melhor:

> Oi! Lembrei de vocês: fiz uma versão da prévia com o botão de agendamento em destaque, que é o que mais traz paciente. Quer ver?

## A sequência

1. **Dia 2–3:** retomada leve, com convite para conversa.
2. **Dia 5–7:** algo novo (um ajuste na prévia, uma ideia para o negócio).
3. **Dia 10–14:** última mensagem, sem pressão:

> Oi! Não quero ficar te enchendo, então essa é minha última mensagem sobre o site. Se em algum momento fizer sentido, é só me chamar que a prévia continua aqui.

Muitos respondem justamente nessa última.

## Agenda cheia só se for verdade

"Estou fechando a agenda de projetos deste mês" funciona, **mas só se for verdade**. Nunca invente vagas, prazos, aumento de preço ou outro cliente interessado.`,
    example: {
      title: 'O poder da última mensagem',
      text: 'É comum o lead passar uma semana em silêncio e responder justamente na despedida educada ("não quero ficar te enchendo…") com algo como: "Desculpa a demora, a semana foi uma loucura. Vamos marcar sim." Sem a última mensagem, essa venda não aconteceria.',
    },
    mistakes: [
      'Cobrar no dia seguinte ("e aí, viu?").',
      'Mandar a mesma mensagem toda vez.',
      'Desistir depois de um follow-up sem resposta.',
      'Inventar urgência para pressionar.',
    ],
    exercise: {
      prompt: 'Escreva suas 3 mensagens de follow-up (dia 2–3, dia 5–7 e a última), adaptadas ao seu nicho.',
      placeholder: 'Dia 3: Oi! Conseguiu dar uma olhada na prévia? …\nDia 6: …\nÚltima: …',
    },
    checklist: [
      'Escrevi minha sequência de 3 follow-ups',
      'Fiz os follow-ups pendentes nas Tarefas',
      'Salvei as mensagens como modelos no Kit',
    ],
  },
]
