import type { AcademyLesson } from './types'

export const LESSONS_ENCONTRAR: AcademyLesson[] = [
  {
    id: 'onde-estao-os-clientes',
    module: 'encontrar',
    title: 'Onde estão seus clientes',
    summary: 'As fontes que funcionam para quem vende para negócios locais.',
    minutes: 4,
    body: `Seu cliente não está procurando por você. Ele está ocupado atendendo. Por isso a prospecção é **ativa**: você vai até ele.

## As melhores fontes

- **Buyers Hunter:** busca por nicho e cidade, mostra quem não tem site e dá uma nota de potencial. É a fonte principal.
- **Google Maps:** para conferir detalhes, fotos e avaliações de uma empresa.
- **Instagram local:** perfis ativos, com seguidores e sem link de site na bio.
- **Indicação:** cada cliente satisfeito conhece outros donos de negócio. Peça sempre.
- **Seu círculo:** amigos, família e ex-colegas que têm ou conhecem um negócio.

## Quem priorizar

1. **Sem site e com muitas avaliações:** tem movimento e ainda não resolveu o problema.
2. **Só Instagram:** já entende a importância do digital.
3. **Site antigo ou fora do ar:** sabe que precisa, mas ficou para depois.

Evite gastar tempo com quem tem poucas avaliações e nenhum sinal de atividade — geralmente não tem orçamento.`,
    checklist: [
      'Anotei as fontes que vou usar esta semana',
      'Pedi indicação para 3 pessoas do meu círculo',
    ],
  },
  {
    id: 'buyers-hunter-na-pratica',
    module: 'encontrar',
    title: 'Use o Buyers Hunter do jeito certo',
    summary: 'Da busca aos 10 melhores leads no CRM, com follow-up agendado.',
    minutes: 4,
    body: `O Buyers Hunter não é para importar tudo. É para **filtrar os melhores** e começar por eles.

## Passo a passo

1. Informe o **nicho** e a **cidade**, e marque o que você vende (site, landing, sistema, automação).
2. Ordene por **maior potencial** e leia o "Por quê" de cada empresa.
3. Use os filtros: **Sem site**, **50+ avaliações**, **só com telefone**.
4. Selecione as **10 melhores** e clique em **Adicionar ao CRM**.
5. O **follow-up automático** agenda as tarefas de retorno — você recebe o lembrete no dia certo.
6. Use **Ignorar** para empresas que não fazem sentido; elas somem das próximas buscas.

## Ritmo que funciona

Melhor **10 leads bem escolhidos por semana** do que 100 importados e esquecidos. Cada lead importado precisa de uma primeira mensagem nas próximas 24 horas.`,
    example: {
      title: 'Uma sessão de 20 minutos',
      text: 'Busca "estética" em Campinas → filtro Sem site + 50+ avaliações → 12 resultados → 10 importados → 10 primeiras mensagens enviadas com "Mensagem pronta" → follow-ups agendados sozinhos.',
    },
    checklist: [
      'Fiz uma busca no Buyers Hunter com filtros',
      'Importei os 10 melhores para o CRM',
      'Enviei a primeira mensagem para todos em até 24 horas',
    ],
  },
  {
    id: 'pesquise-antes',
    module: 'encontrar',
    title: 'Pesquise antes de abordar',
    summary: 'Dois minutos de pesquisa transformam uma mensagem genérica em conversa.',
    minutes: 3,
    body: `Mensagem genérica parece spam. Dois minutos de pesquisa mostram que você olhou para aquele negócio de verdade.

## O que olhar (2 minutos)

- **Avaliações:** o que os clientes elogiam? Do que reclamam? ("demoram a responder", "difícil marcar horário")
- **Instagram:** posta com frequência? Tem link na bio? Usa o direct para agendar?
- **Site atual (se houver):** abre no celular? Tem WhatsApp? Está desatualizado?
- **Concorrentes:** algum concorrente próximo tem um site bom? É um ótimo argumento.

## Registre no CRM

Anote o que achou em **Observações** do contato. Isso alimenta a primeira mensagem, a conversa e a proposta.`,
    example: {
      title: 'O que vira argumento',
      text: 'Três avaliações recentes dizem "difícil conseguir horário por telefone". Isso vira a abertura: "Vi que alguns clientes comentam que é difícil marcar pelo telefone — um agendamento online resolveria isso."',
    },
    checklist: [
      'Pesquisei 5 leads antes de abordar',
      'Anotei um argumento para cada um nas Observações do CRM',
    ],
  },
  {
    id: 'demo-antes-da-conversa',
    module: 'encontrar',
    title: 'Mostre antes de pedir',
    summary: 'Uma prévia pronta vale mais que qualquer explicação.',
    minutes: 4,
    body: `O dono do negócio tem dificuldade de imaginar um site. Quando ele **vê** algo pronto, a conversa muda de "preciso pensar" para "quanto custa?".

## Duas formas de mostrar

- **Portfólio:** mande o link do seu **Sellers Portfolio** com trabalhos parecidos com o que ele precisa.
- **Prévia personalizada:** para leads com alto potencial, crie em 30 a 60 minutos uma prévia da página inicial com o nome e os serviços da empresa. Mande um print ou um link privado.

## Cuidados

- Deixe claro que é **uma prévia**, não um site publicado.
- Não publique nada com a marca do cliente sem autorização.
- Use a prévia só com os leads mais promissores — ela custa tempo.`,
    checklist: [
      'Publiquei meu Sellers Portfolio com pelo menos 1 projeto',
      'Criei uma prévia personalizada para o meu lead mais promissor',
    ],
  },
  {
    id: 'organize-o-pipeline',
    module: 'encontrar',
    title: 'Organize o pipeline',
    summary: 'Uma rotina curta, todos os dias, vence a empolgação de um dia só.',
    minutes: 4,
    body: `Venda é constância. Uma rotina de 30 a 45 minutos por dia, todos os dias, gera mais resultado que uma maratona no fim de semana.

## Rotina diária

1. **Foco de hoje (5 min):** abra o Início e resolva as tarefas do dia e os follow-ups.
2. **Novos leads (15 min):** Buyers Hunter → importar → primeira mensagem.
3. **Conversas (15 min):** responder quem respondeu, marcar diagnósticos, enviar propostas.
4. **Atualizar o CRM (5 min):** mover negócios de etapa e registrar o que aconteceu.

## Metas simples por semana

- **Abordagens:** comece com 30 novas por semana.
- **Conversas:** acompanhe quantas viraram conversa de verdade.
- **Propostas:** o número que mais importa. Sem proposta, não há venda.

Use o **Relatório do mês** para ver onde os negócios emperram e ajustar.`,
    checklist: [
      'Separei um horário fixo para a rotina diária',
      'Defini minha meta de abordagens da semana',
      'Defini minha meta do mês no Início',
    ],
  },
]
