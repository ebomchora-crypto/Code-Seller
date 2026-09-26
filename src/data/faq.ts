import type { FAQItem } from '@/types'

export const FAQ_ITEMS: FAQItem[] = [
  // CATEGORIA: Conta
  {
    id: 'faq-1',
    category: 'Conta',
    question: 'Como altero meu e-mail de acesso?',
    answer:
      'Acesse Configurações > Segurança > Alterar e-mail. Você receberá um link de confirmação no novo endereço.',
  },
  {
    id: 'faq-2',
    category: 'Conta',
    question: 'Como faço para cancelar minha conta?',
    answer: 'Entre em contato pelo suporte. Seu histórico de dados será mantido por 30 dias após o cancelamento.',
  },
  // CATEGORIA: CRM
  {
    id: 'faq-3',
    category: 'CRM',
    question: 'Qual o limite de contatos no plano gratuito?',
    answer: 'No plano gratuito você pode cadastrar até 50 contatos. No plano Pro e Agência os contatos são ilimitados.',
  },
  {
    id: 'faq-4',
    category: 'CRM',
    question: 'Como importo contatos em lote?',
    answer: 'Acesse CRM > botão "Importar CSV". O arquivo deve ter as colunas: nome, email, telefone, nicho, cidade, estado.',
  },
  // CATEGORIA: Negócios
  {
    id: 'faq-5',
    category: 'Negócios',
    question: 'Como funciona o pipeline de vendas?',
    answer:
      'O pipeline organiza seus deals por etapa: Contato > Qualificado > Proposta > Negociação > Fechamento. Arraste os cards entre colunas para atualizar o status.',
  },
  {
    id: 'faq-6',
    category: 'Negócios',
    question: 'Como gero uma proposta com IA?',
    answer:
      'Abra um deal > aba Proposta > botão "Gerar com IA". O CS Copilot usará os dados do deal e do contato para criar uma proposta personalizada.',
  },
  // CATEGORIA: Financeiro
  {
    id: 'faq-7',
    category: 'Financeiro',
    question: 'Como registro uma receita?',
    answer: 'Acesse Financeiro > "+ Nova Transação" > selecione "Receita". Preencha valor, data, categoria e método de pagamento.',
  },
  {
    id: 'faq-8',
    category: 'Financeiro',
    question: 'O que são contas a receber?',
    answer:
      'Quando você fecha um negócio (deal ganho), o sistema cria automaticamente uma conta a receber. Acesse Financeiro > Contas a Receber para acompanhar e registrar pagamentos.',
  },
  // CATEGORIA: CS Copilot
  {
    id: 'faq-9',
    category: 'CS Copilot',
    question: 'O CS Copilot tem acesso aos meus dados?',
    answer:
      'Sim. O CS Copilot recebe um snapshot dos seus dados (contatos, deals, tarefas, financeiro) para contextualizar as respostas. Nenhum dado é enviado para terceiros além da API da Anthropic.',
  },
  {
    id: 'faq-10',
    category: 'CS Copilot',
    question: 'As ações sugeridas pelo CS Copilot são automáticas?',
    answer:
      'Não. O CS Copilot sempre pede confirmação antes de criar ou editar qualquer dado. Você aprova ou rejeita cada ação sugerida.',
  },
  // CATEGORIA: Planos
  {
    id: 'faq-11',
    category: 'Planos',
    question: 'Posso mudar de plano a qualquer momento?',
    answer: 'Sim. O upgrade é imediato. O downgrade entra em vigor no próximo ciclo de cobrança.',
  },
  {
    id: 'faq-12',
    category: 'Planos',
    question: 'Existe período de teste gratuito?',
    answer: 'O plano gratuito não tem limite de tempo. Você pode usar o Code Sellers gratuitamente para sempre, com as limitações do plano Free.',
  },
]

export const FAQ_CATEGORIES = ['Todos', ...Array.from(new Set(FAQ_ITEMS.map((item) => item.category)))]
