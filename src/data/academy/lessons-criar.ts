import type { AcademyLesson } from './types'

// Módulo 1 — Criar: da escolha do nicho ao protótipo que abre a conversa.
// O método é o mesmo que o CS Copilot segue: protótipo → interesse → reunião
// sem compromisso → entender o cliente → valor → preço → fechamento.
export const LESSONS_CRIAR: AcademyLesson[] = [
  {
    id: 'nicho-que-paga',
    module: 'criar',
    title: 'Escolha um nicho que paga',
    summary: 'Quem tem dinheiro, vive de contato e ainda não resolveu isso na internet.',
    minutes: 6,
    body: `Vender "site para qualquer empresa" é difícil: cada conversa começa do zero e você nunca fica bom em nada. Vender **site para clínicas odontológicas** é outra história: você aprende as dores do nicho, reaproveita protótipos, fala a língua do dono e fica mais rápido a cada venda.

## Os 4 sinais de um nicho que paga

1. **Cada cliente novo vale muito.** Uma clínica que ganha um paciente de implante fatura milhares. Uma oficina que fecha uma retífica também. Se um cliente vale pouco, um site é caro demais para eles.
2. **O negócio vive de contato.** Agenda, orçamento, WhatsApp, visita. Quando o site gera conversa, gera dinheiro, e o dono entende isso na hora.
3. **Muitos ainda não têm site (ou têm um ruim).** Só Instagram, link quebrado, site de 2015 que não abre no celular.
4. **Já gastam com divulgação.** Panfleto, anúncio, comissão, plataforma. Quem já paga para aparecer entende que aparecer custa.

Bons nichos para começar: clínicas (odonto, estética, fisioterapia), oficinas e centros automotivos, imobiliárias e corretores, escritórios de advocacia e contabilidade, escolas e cursos, academias e studios.

## Como decidir em 20 minutos

- Liste **3 nichos** que você entende ou onde conhece alguém de dentro.
- Para cada um, faça uma busca no **Buyers Hunter** na sua cidade e anote: quantas empresas aparecem, quantas estão **sem site** e quantas têm **muitas avaliações** (sinal de movimento e dinheiro).
- O vencedor é o que tem **mais empresas movimentadas sem site**. Empate? Fique com o que você entende melhor.

## Uma regra que poupa meses

Escolha **um** nicho e fique nele por pelo menos 30 dias. Trocar de nicho a cada semana é a forma mais comum de nunca vender. Depois que você fecha os 3 primeiros clientes num nicho, os próximos ficam muito mais fáceis: você tem prova, tem modelo e sabe as respostas.`,
    example: {
      title: 'Exemplo de decisão',
      text: 'Busca em uma cidade média: "clínica odontológica" trouxe 40 empresas, 17 sem site e 11 com mais de 100 avaliações. "Pet shop" trouxe 35, mas quase todos com poucas avaliações. O nicho escolhido foi odontologia: mais dinheiro em jogo e mais espaço para entrar.',
    },
    mistakes: [
      'Escolher o nicho pelo que é "legal" e não pelo que paga.',
      'Atirar para todo lado: 5 nichos ao mesmo tempo, nenhum bem feito.',
      'Desistir do nicho depois de 10 abordagens. O jogo é volume e consistência.',
    ],
    exercise: {
      prompt: 'Escreva os 3 nichos que você pesquisou, com os números que encontrou (empresas, sem site, com muitas avaliações), e qual você escolheu.',
      placeholder: 'Ex.: Odontologia — 40 empresas, 17 sem site, 11 com +100 avaliações. Escolhi: odontologia.',
    },
    checklist: [
      'Listei 3 nichos que entendo ou onde conheço alguém',
      'Pesquisei os 3 no Buyers Hunter e anotei os números',
      'Escolhi 1 nicho para os próximos 30 dias',
    ],
  },
  {
    id: 'problema-que-vale-dinheiro',
    module: 'criar',
    title: 'Venda o resultado, não o site',
    summary: 'O dono não quer um site. Quer mais clientes, menos trabalho e mais confiança.',
    minutes: 6,
    body: `Ninguém acorda querendo "um site". O dono da clínica quer **agenda cheia**. O dono da oficina quer **o telefone tocando com orçamento**. O site é só o caminho. Se você vende o caminho, vira comparação de preço. Se vende o destino, vira conversa sobre valor.

## A dor de cada nicho

- **Clínicas:** pacientes que pesquisam no Google e caem no concorrente; agenda dependente de indicação; recepção perdendo tempo respondendo preço no WhatsApp.
- **Oficinas:** clientes que só chegam por indicação; dificuldade de mostrar que são confiáveis; orçamento que nunca vira serviço.
- **Imobiliárias e corretores:** imóveis espalhados em portais que cobram caro; contato que chega sem informação; falta de autoridade na região.
- **Restaurantes e lanchonetes:** taxa alta dos aplicativos de entrega; cardápio desatualizado; pedido que se perde no WhatsApp.
- **Advocacia e contabilidade:** confiança é tudo; quem pesquisa e não encontra nada desconfia.

Antes de abordar, saiba qual dessas dores é a do lead. É ela que vai na conversa, não a lista de recursos do site.

## Transforme a dor em uma frase de promessa

Uma frase simples, sem prometer número que você não controla:

> "Ajudo clínicas a receber pacientes de quem pesquisa no Google, sem depender só de indicação."

> "Crio sites para oficinas que fazem o cliente chamar no WhatsApp pedindo orçamento."

> "Faço o site do corretor virar o lugar onde o cliente vê os imóveis e já chama para visitar."

Essa frase vai para o seu Sellers Portfolio, para a sua bio e para o seu Perfil comercial (em Configurações), que o CS Copilot usa para escrever as mensagens com a sua oferta.

## Fale como o dono fala

Corte da sua boca: "presença digital", "potencializar", "soluções personalizadas", "alavancar resultados". O dono não fala assim e desconfia de quem fala. Diga "mais gente chamando no WhatsApp", "aparecer quando procuram no Google", "parecer tão profissional quanto vocês são".`,
    example: {
      title: 'Antes e depois',
      text: 'Antes: "Desenvolvo sites modernos e responsivos com SEO otimizado." Depois: "Faço o site da sua oficina aparecer quando alguém procura mecânico no bairro, com um botão que já abre o WhatsApp pedindo orçamento."',
    },
    mistakes: [
      'Falar de tecnologia (responsivo, SEO, hospedagem) para quem quer clientes.',
      'Prometer números ("vou dobrar seu faturamento") que você não controla.',
      'Usar a mesma frase para todos os nichos.',
    ],
    exercise: {
      prompt: 'Escreva a dor principal do seu nicho e a sua frase de promessa (uma linha, sem marketingês).',
      placeholder: 'Dor: clínicas dependem de indicação e perdem pacientes para quem aparece no Google.\nFrase: Ajudo clínicas a receber pacientes de quem pesquisa no Google, sem depender só de indicação.',
    },
    checklist: [
      'Escrevi a dor principal do meu nicho',
      'Escrevi minha frase de promessa',
      'Coloquei a frase no Perfil comercial e no Sellers Portfolio',
    ],
  },
  {
    id: 'construa-com-ia',
    module: 'criar',
    title: 'O protótipo é a isca',
    summary: 'Mostrar uma prévia com o nome do cliente abre mais portas que qualquer apresentação.',
    minutes: 7,
    body: `Esta é a base do método. Em vez de chegar falando "eu faço sites", você chega com **uma prévia de como o site daquela empresa poderia ficar**. O dono vê o próprio nome, as próprias fotos, o próprio negócio na tela. A curiosidade faz o resto.

## Por que funciona

- **Mostra em vez de explicar.** Ninguém entende "site profissional" em texto. Todo mundo entende uma prévia aberta no celular.
- **Personalizado não parece spam.** Uma mensagem com "montei uma prévia para vocês" não é disparo em massa.
- **O cliente começa a participar.** Ele olha e já pensa no que mudaria. Quem opina já está dentro do projeto.

## O que o protótipo é (e o que não é)

O protótipo **não é o produto final**. É um ponto de partida para abrir a conversa. Cores, textos, fotos e estrutura mudam conforme o que o cliente precisar. Deixe isso claro quando enviar: assim ele se sente à vontade para opinar e você não fica preso ao que montou.

## Quando fazer

Não faça protótipo para todo mundo. Faça para os leads **mais promissores**: muitas avaliações, sem site ou com site ruim, nicho que você domina. O fluxo é:

1. Encontre o lead no Buyers Hunter e salve no CRM.
2. Peça permissão para mostrar ("montei uma prévia, posso enviar por aqui?").
3. Quando ele disser sim, envie o link do protótipo feito no Code Maker.

Se preferir, faça o protótipo antes de abordar: com ele pronto, a primeira mensagem já pode dizer "montei uma prévia de como o site de vocês poderia ficar".

## Como pedir ao Code Maker

Quanto mais real o pedido, melhor o protótipo. Inclua: nome do negócio, nicho, cidade, WhatsApp, nota e número de avaliações reais, e o que o negócio tem de especial. Se tiver, anexe a logo e fotos do Instagram do cliente: nada impressiona mais do que ver as próprias fotos.`,
    example: {
      title: 'Pedido bem feito no Code Maker',
      text: 'Site para a Clínica Sorriso Pleno, odontologia em Campinas. WhatsApp (19) 99999-0000. Nota 4,9 com 213 avaliações no Google. Fazem implante, clareamento e ortodontia. Visual claro e confiável, com azul. (Anexei a logo e 4 fotos do Instagram.)',
    },
    mistakes: [
      'Mandar o protótipo sem pedir permissão: parece spam e muitos nem abrem.',
      'Tratar o protótipo como produto final e ficar defendendo cada detalhe.',
      'Gastar horas em protótipo para lead frio. Prévia boa sai em 15 minutos.',
    ],
    exercise: {
      prompt: 'Escolha 3 leads do seu nicho e escreva o pedido do Code Maker para o primeiro, com os dados reais dele.',
      placeholder: 'Site para ..., [nicho] em [cidade]. WhatsApp ... Nota ... com ... avaliações. Destaques: ...',
    },
    checklist: [
      'Escolhi 3 leads promissores para receber protótipo',
      'Escrevi o pedido do primeiro com dados reais',
      'Criei o primeiro protótipo no Code Maker',
    ],
  },
  {
    id: 'qualidade-que-parece-cara',
    module: 'criar',
    title: 'O protótipo que impressiona',
    summary: 'O que faz o dono pensar "isso é para mim" em 5 segundos.',
    minutes: 5,
    body: `O dono vai abrir o protótipo no celular, entre um cliente e outro. Você tem **5 segundos** para ele pensar "nossa, ficou bom". Não é sobre ter mais seções: é sobre parecer feito para ele.

## O que mais pesa

- **Nome e dados reais logo no topo.** Nome do negócio, cidade, o serviço principal.
- **Reputação real em destaque.** "4,9 no Google com 213 avaliações" vale mais que qualquer frase bonita. Use só números reais.
- **Fotos do próprio negócio.** Se conseguir as fotos do Instagram, use. Foto de banco serve, mas a do cliente impressiona muito mais.
- **Um botão de WhatsApp claro.** O dono entende na hora: "isso traz cliente".
- **Funcionar perfeito no celular.** É lá que ele vai abrir.

## Revisão de 2 minutos antes de enviar

Abra o protótipo no seu celular e confira:

1. O nome está certo? A cidade está certa?
2. Tem algum texto genérico ou estranho? Peça ao Code Maker para trocar.
3. O botão de WhatsApp leva para o número certo?
4. Tem alguma informação inventada (anos de mercado, número de clientes)? Tire. Um dado falso derruba a confiança.

## Ajuste pelo chat

No editor do Code Maker, peça mudanças em linguagem normal: "deixe o topo mais impactante", "troque a cor por verde-escuro", "coloque as avaliações em destaque". Duas ou três rodadas e o protótipo fica pronto para enviar.`,
    example: {
      title: 'O detalhe que fecha',
      text: 'Compare: um protótipo genérico de imobiliária e um com a foto do corretor (tirada do Instagram) no topo e três imóveis do próprio perfil. O primeiro recebe "legal". O segundo costuma receber "caramba, ficou muito bom, quanto fica pra deixar assim?".',
    },
    mistakes: [
      'Enviar sem revisar no celular.',
      'Deixar informação inventada no site do cliente.',
      'Achar que mais seções impressionam mais. Clareza impressiona.',
    ],
    exercise: {
      prompt: 'Revise seu primeiro protótipo com a lista de 2 minutos e anote o que você ajustou.',
      placeholder: 'Ex.: troquei o título do topo, coloquei a nota 4,9 em destaque, conferi o WhatsApp.',
    },
    checklist: [
      'Revisei o protótipo no celular',
      'Coloquei a reputação real em destaque',
      'Tirei qualquer informação inventada',
    ],
  },
  {
    id: 'transforme-em-oferta',
    module: 'criar',
    title: 'Sua oferta e seus preços',
    summary: 'Pacotes simples, preço definido e clareza do que está incluso.',
    minutes: 6,
    body: `Na hora em que o cliente perguntar o preço, você precisa saber responder com segurança. Quem gagueja no preço passa insegurança, e insegurança derruba a venda.

## Monte 2 ou 3 pacotes

Pacotes facilitam a decisão: o cliente escolhe entre opções suas, em vez de comparar você com o sobrinho que "faz por 300".

- **Essencial:** site de uma página com WhatsApp, mapa, serviços e fotos. Para quem precisa aparecer.
- **Profissional (o mais escolhido):** várias seções, galeria, perguntas frequentes, ajustes em 30 dias. O que você quer vender.
- **Completo:** tudo do profissional + agendamento, catálogo ou integração que o nicho pede.

Para cada pacote, defina: **preço, prazo de entrega e o que está incluso** (rodadas de ajuste, domínio, manutenção). Coloque tudo no seu **Perfil comercial** (Configurações): o CS Copilot só cita preços que estão lá.

## Como pensar o preço

- Pense no **valor de um cliente novo** para aquele negócio. Se um paciente de implante vale R$ 3.000, um site de R$ 1.500 se paga com meio paciente.
- Comece num preço que você consegue defender sem vergonha. Suba a cada 3 clientes fechados.
- Mensalidade de manutenção (hospedagem, pequenos ajustes) cria renda recorrente. Ofereça sempre.

## O que nunca fazer

- **Baixar o preço por desespero.** Preço baixo não resolve desconfiança: só faz você trabalhar mais por menos e atrai cliente difícil.
- **Dar desconto na primeira objeção.** Primeiro descubra se a trava é orçamento ou valor (você vai ver isso no módulo Vender).
- **Esconder o que está incluso.** Clareza evita briga depois.`,
    example: {
      title: 'Exemplo de pacotes',
      text: 'Essencial R$ 900 (1 página, WhatsApp, mapa, 7 dias). Profissional R$ 1.800 (até 6 seções, galeria, FAQ, 2 rodadas de ajuste, 10 dias). Completo R$ 3.200 (profissional + agendamento online + 30 dias de ajustes). Manutenção: R$ 80/mês.',
    },
    mistakes: [
      'Inventar o preço na hora, olhando para o cliente.',
      'Ter um preço só: sem opção, o cliente compara com qualquer um.',
      'Esquecer a manutenção mensal, que é a renda que se acumula.',
    ],
    exercise: {
      prompt: 'Escreva seus 2 ou 3 pacotes com preço, prazo e o que está incluso.',
      placeholder: 'Essencial — R$ ... — inclui ... — prazo ...\nProfissional — R$ ... — inclui ... — prazo ...',
    },
    checklist: [
      'Defini 2 ou 3 pacotes com preço e prazo',
      'Defini o valor da manutenção mensal',
      'Cadastrei os pacotes no Perfil comercial',
    ],
  },
]
