import type { AcademyLesson } from './types'

export const LESSONS_VENDER: AcademyLesson[] = [
  {
    id: 'primeira-mensagem',
    module: 'vender',
    title: 'A primeira mensagem',
    summary: 'Curta, personalizada e terminando com uma pergunta fácil de responder.',
    minutes: 4,
    body: `A primeira mensagem tem um único objetivo: **conseguir uma resposta**. Não é hora de vender o site inteiro.

## Regras

- **Curta:** até 4 ou 5 linhas. Ninguém lê textão de desconhecido.
- **Personalizada:** cite algo real do negócio (as avaliações, o Instagram, a falta de site).
- **Sem pressão:** nada de "promoção só hoje".
- **Termine com uma pergunta simples:** "Posso te mandar um exemplo?" é mais fácil de responder do que "Vamos marcar uma reunião?".

## Ruim × bom

**Ruim:** "Olá! Sou desenvolvedor web e crio sites profissionais com os melhores preços do mercado. Tenho vários pacotes. Tem interesse?"

**Bom:** "Oi, tudo bem? Vi que a Clínica Sorriso tem ótimas avaliações, mas ainda não tem um site para quem procura no Google. Fiz um para outra clínica aqui da cidade com agendamento online. Posso te mandar para você ver?"

Use **Mensagem pronta** no contato: os modelos já preenchem o nome, a cidade e a sua assinatura.`,
    checklist: [
      'Personalizei meu modelo de primeira abordagem',
      'Enviei 10 primeiras mensagens usando "Mensagem pronta"',
    ],
  },
  {
    id: 'follow-up',
    module: 'vender',
    title: 'Follow-up sem ser chato',
    summary: 'A maioria das vendas acontece depois do segundo ou terceiro contato.',
    minutes: 4,
    body: `Não responder não é "não". Donos de negócio são ocupados: leem, pensam "depois vejo" e esquecem. O follow-up é o que traz a conversa de volta.

## A cadência

- **Dia 2:** um lembrete leve, com uma pergunta.
- **Dia 5:** traga algo novo — um exemplo, um print, uma ideia específica para o negócio.
- **Dia 10:** último contato, deixando a porta aberta.

O **follow-up automático** do app cria essas tarefas com lembrete e a mensagem sugerida. Você só revisa e envia.

## Regras

- **Cada mensagem acrescenta algo** — nunca só "e aí, viu?".
- **Respeite o não.** Se a pessoa disser que não quer, agradeça e pare.
- **Pare depois do último.** Três tentativas sem resposta: siga para o próximo lead e volte daqui a alguns meses.`,
    example: {
      title: 'Follow-up que acrescenta',
      text: '"Oi! Separei um exemplo de página de agendamento parecida com o que imagino para a clínica. Te mando o link?"',
    },
    checklist: [
      'Deixei o follow-up automático ligado em Configurações',
      'Ajustei meus modelos de follow-up com a minha linguagem',
    ],
  },
  {
    id: 'diagnostico',
    module: 'vender',
    title: 'A conversa de diagnóstico',
    summary: 'Pergunte mais, fale menos — e deixe o cliente descobrir o próprio problema.',
    minutes: 5,
    body: `Quando o lead responde, não mande o preço na hora. Proponha uma conversa rápida (10 a 15 minutos, por ligação ou áudio) para entender o negócio. Quem entende o problema vende melhor e cobra mais.

## Perguntas que funcionam

1. Como os clientes chegam até vocês hoje?
2. O que acontece quando alguém procura [serviço] em [cidade] no Google?
3. Quanto tempo a equipe gasta respondendo as mesmas perguntas no WhatsApp?
4. Quanto vale, em média, um cliente novo para vocês?
5. Já tentaram ter um site antes? O que aconteceu?
6. Se isso estivesse resolvido daqui a um mês, o que mudaria no dia a dia?

## Durante a conversa

- **Ouça mais do que fala** (70% ele, 30% você).
- **Anote as palavras do cliente** no histórico do negócio — elas vão para a proposta.
- **Termine combinando o próximo passo:** "Vou montar uma proposta e te mando até amanhã às 18h."`,
    checklist: [
      'Salvei as perguntas de diagnóstico para usar nas conversas',
      'Registrei no histórico do negócio o resumo da última conversa',
    ],
  },
  {
    id: 'proposta-que-fecha',
    module: 'vender',
    title: 'A proposta que fecha',
    summary: 'Problema, solução, escopo, prazo, investimento e próximo passo — nessa ordem.',
    minutes: 5,
    body: `Uma boa proposta repete o que o cliente disse e mostra o caminho. Ela não é uma lista de tecnologias.

## Estrutura

1. **O que entendi:** o problema com as palavras do cliente.
2. **A solução:** o que você vai entregar e como isso resolve o problema.
3. **Escopo:** o que está incluído (e o que não está).
4. **Prazo:** com as etapas principais.
5. **Investimento:** de preferência em 3 opções (Essencial, Profissional, Completo).
6. **Próximos passos:** como aprovar e começar.

## Dicas

- Envie **no mesmo dia ou no seguinte** à conversa. Proposta fria perde força.
- Use o **CS Copilot** no negócio para gerar a primeira versão e revise.
- **Combine o retorno:** "Consegue me dar um retorno até quinta?" — e crie a tarefa.
- Depois do "sim", gere o **Contrato** no próprio negócio.`,
    checklist: [
      'Adaptei um modelo de proposta do Kit ao meu pacote principal',
      'Gerei uma proposta com o CS Copilot em um negócio real',
      'Combinei a data de retorno e criei a tarefa',
    ],
  },
  {
    id: 'objecoes-e-fechamento',
    module: 'vender',
    title: 'Objeções e fechamento',
    summary: 'As respostas para "tá caro", "vou pensar" e "meu sobrinho faz".',
    minutes: 5,
    body: `Objeção não é recusa — é uma dúvida que ainda não foi respondida. Responda com calma, sem brigar pelo preço.

## As mais comuns

**"Tá caro."**
"Entendo. Me conta: comparado com o quê?" Depois, volte ao valor: "Se o site trouxer [X] clientes por mês, quanto isso representa para vocês?" Se precisar, ofereça o pacote Essencial — nunca o mesmo pacote com desconto.

**"Vou pensar."**
"Claro. Ficou alguma dúvida sobre o que conversamos? Prefere que eu te chame na quinta para decidirmos?" Combine uma data.

**"Já tenho Instagram."**
"O Instagram é ótimo para quem já te segue. O site é para quem ainda não te conhece e procura no Google."

**"Meu sobrinho faz."**
"Perfeito! Se ele puder, ótimo. Se quiser algo pronto em [prazo], com agendamento e ajustes incluídos, estou aqui."

## Fechamento

Depois de responder as dúvidas, **peça o sim**: "Podemos começar? Te mando o contrato e o Pix da entrada." Silêncio depois dessa pergunta é normal — espere a resposta.

Fechou? Marque o negócio como **Ganho** e veja o "+ R$" na Sala de receita.`,
    checklist: [
      'Escrevi minhas respostas para as 4 objeções mais comuns',
      'Pedi o fechamento de forma direta em uma negociação',
      'Marquei meu primeiro negócio como Ganho',
    ],
  },
]
