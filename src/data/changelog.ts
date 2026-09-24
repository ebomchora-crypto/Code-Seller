import type { ChangelogItem } from '@/types'

export const CHANGELOG: ChangelogItem[] = [
  {
    version: '1.3.0',
    date: '2026-09-24',
    title: 'AutoPilot com ações confirmadas',
    description: 'O AutoPilot agora pode criar tarefas, atualizar deals e registrar interações — sempre com confirmação do usuário.',
    type: 'feature',
    items: [
      'AutoPilot pode criar tarefas via chat',
      'AutoPilot pode mover deals entre etapas',
      'Histórico de conversas salvo no banco',
      'Contexto do sistema injetado automaticamente',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-09-10',
    title: 'Módulo Financeiro completo',
    description: 'Controle total de receitas, despesas, recorrências e contas a receber.',
    type: 'feature',
    items: [
      'Transações com categorias customizáveis',
      'Contas a receber vinculadas a deals',
      'Gráfico de fluxo de caixa mensal',
      'Exportação de relatório em CSV',
      'Upload de comprovantes',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-08-28',
    title: 'Kanban e drag and drop',
    description: 'CRM e Negócios agora têm visualização kanban com drag and drop.',
    type: 'improvement',
    items: [
      'Kanban de contatos por status',
      'Pipeline de deals com drag and drop',
      'Atualização otimista ao mover cards',
      'Indicador de probabilidade nos cards de deal',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-08-15',
    title: 'Lançamento do Code Sellers',
    description: 'Primeira versão do Code Sellers disponível.',
    type: 'feature',
    items: [
      'CRM completo com contatos e tags',
      'Pipeline de negócios',
      'Dashboard com métricas',
      'Autenticação segura com Supabase',
    ],
  },
]
