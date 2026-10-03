import { LEGAL_CONTACT_EMAIL, LegalPage, type LegalSection } from '@/components/legal/LegalPage'
import { PLAN_PRICE_LABEL } from '@/services/supabase/billing'

const sections: LegalSection[] = [
  {
    id: 'aceitacao',
    title: 'Aceitação',
    blocks: [
      'Ao criar uma conta ou usar o Code Sellers (site, painel e app para Windows), você concorda com estes Termos de Uso e com a Política de Privacidade. Se não concordar, não use o serviço.',
      'Para usar o Code Sellers você precisa ter 18 anos ou mais e capacidade para assumir as obrigações destes termos. Se usar em nome de uma empresa, você declara ter autorização para aceitá-los por ela.',
    ],
  },
  {
    id: 'servico',
    title: 'O que é o Code Sellers',
    blocks: [
      'O Code Sellers é uma plataforma para quem cria e vende sites e sistemas. Ela reúne:',
      {
        list: [
          'CRM, negócios, propostas online, financeiro, tarefas e relatórios;',
          'Buyers Hunter, que encontra empresas a partir de informações públicas;',
          'CS Copilot, assistente comercial com inteligência artificial;',
          'Code Maker, que cria sites com inteligência artificial;',
          'Sellers Portfolio, formulários de captação e páginas públicas;',
          'Área do aluno, com o método, o kit e a biblioteca comercial;',
          'App para Windows, com avisos de tarefas.',
        ],
      },
    ],
  },
  {
    id: 'conta',
    title: 'Sua conta',
    blocks: [
      'Você deve informar dados verdadeiros e mantê-los atualizados. A senha é pessoal: não a compartilhe. Você responde pelo que for feito na sua conta e deve nos avisar logo se suspeitar de uso indevido.',
      'Cada conta é de uma pessoa. Podemos recusar ou encerrar contas criadas para burlar o teste grátis, os limites do plano ou estes termos.',
    ],
  },
  {
    id: 'teste-gratis',
    title: 'Teste grátis',
    blocks: [
      'Toda conta nova tem 7 dias de teste grátis, contados a partir do cadastro, sem precisar de cartão. Durante o teste valem estes limites:',
      {
        list: [
          '1 busca por dia no Buyers Hunter, com até 10 empresas;',
          '5 mensagens por dia no CS Copilot;',
          '2 sites e 10 alterações por dia no Code Maker.',
        ],
      },
      'Sites publicados durante o teste mostram o selo "Feito com Code Sellers" e saem do ar se o teste terminar sem assinatura. Ao assinar, o selo some e eles voltam ao ar.',
      'Quando o teste termina, o acesso ao painel fica bloqueado até você assinar. Os dados que você cadastrou continuam guardados, como explica a Política de Privacidade. O teste grátis vale uma vez por pessoa.',
    ],
  },
  {
    id: 'assinatura',
    title: 'Assinatura e pagamento',
    blocks: [
      `O plano completo custa ${PLAN_PRICE_LABEL} por mês. O pagamento é feito por uma plataforma de pagamento parceira, e a assinatura renova automaticamente a cada mês até ser cancelada.`,
      'Para liberar o acesso, use na compra o mesmo e-mail da sua conta no Code Sellers. Se usar outro e-mail, fale com o suporte para vincularmos a assinatura.',
      'Se um pagamento atrasar, o acesso continua por até 5 dias. Depois disso, fica bloqueado até o pagamento ser regularizado.',
      'Podemos mudar o preço. Se isso acontecer, avisaremos com pelo menos 30 dias de antecedência, e o novo valor só vale a partir da cobrança seguinte ao aviso.',
    ],
  },
  {
    id: 'cancelamento',
    title: 'Cancelamento e reembolso',
    blocks: [
      'Você pode cancelar quando quiser, sem multa, pela área de assinante da plataforma de pagamento (o link vem no e-mail da compra) ou falando com o suporte. Depois do cancelamento, o acesso continua até o fim do período já pago.',
      'Direito de arrependimento: na primeira contratação, você pode desistir em até 7 dias e recebe o valor pago de volta, como prevê o Código de Defesa do Consumidor (art. 49).',
      'Fora desse prazo, não devolvemos valores proporcionais do mês em andamento, a não ser que o serviço tenha ficado indisponível por falha nossa. Um reembolso ou contestação da cobrança encerra o acesso pago.',
    ],
  },
  {
    id: 'limites',
    title: 'Limites do plano pago',
    blocks: [
      'Para manter o serviço rápido e estável para todos, o plano pago tem estes limites:',
      {
        list: [
          '50 buscas por mês no Buyers Hunter, com até 30 empresas cada;',
          '50 mensagens por dia no CS Copilot;',
          '10 sites e 100 alterações por dia no Code Maker.',
        ],
      },
      'Os limites diários recomeçam à meia-noite (horário de Brasília) e o mensal, no primeiro dia de cada mês. Se for preciso ajustar um limite, avisaremos antes.',
    ],
  },
  {
    id: 'uso-permitido',
    title: 'O que não é permitido',
    blocks: [
      'Ao usar o Code Sellers, você não pode:',
      {
        list: [
          'enviar mensagens em massa não solicitadas (spam) ou insistir com quem pediu para não ser contatado;',
          'criar ou publicar conteúdo ilegal, enganoso, ofensivo, discriminatório ou que viole direitos autorais, marcas ou a imagem de outras pessoas;',
          'se passar por outra pessoa ou empresa, ou criar páginas que imitem marcas reais para enganar alguém;',
          'coletar senhas, dados de cartão ou outros dados pessoais por meio de páginas falsas;',
          'tentar burlar limites, acessar dados de outras contas ou atacar a segurança da plataforma;',
          'copiar, revender ou compartilhar o acesso, ou extrair dados da plataforma de forma automatizada;',
          'usar o serviço para qualquer atividade contrária à lei brasileira.',
        ],
      },
    ],
  },
  {
    id: 'buyers-hunter',
    title: 'Buyers Hunter e contato com empresas',
    blocks: [
      'Os resultados do Buyers Hunter vêm de informações públicas sobre empresas (como nome, endereço, telefone, site e avaliações) e podem estar incompletos ou desatualizados.',
      'Você é responsável pelos contatos que fizer a partir desses resultados: deve seguir a Lei Geral de Proteção de Dados (LGPD), respeitar quem pedir para não ser contatado e cumprir as regras dos aplicativos de mensagem e redes que usar.',
    ],
  },
  {
    id: 'ia',
    title: 'Conteúdo gerado por inteligência artificial',
    blocks: [
      'O CS Copilot e o Code Maker usam inteligência artificial. As respostas, textos e sites podem conter erros, informações imprecisas ou trechos parecidos com conteúdos já existentes. Revise tudo antes de enviar a um cliente ou publicar.',
      'As respostas do CS Copilot são sugestões comerciais. Elas não substituem orientação jurídica, contábil ou financeira profissional.',
    ],
  },
  {
    id: 'seu-conteudo',
    title: 'Seu conteúdo',
    blocks: [
      'Os dados que você cadastra, os arquivos que envia e os sites e propostas que cria são seus. Você nos dá apenas a permissão necessária para guardar, processar e exibir esse conteúdo para prestar o serviço, inclusive mostrar as páginas públicas que você decidir publicar.',
      'Os sites criados no Code Maker podem ser usados e vendidos para os seus clientes. Você garante que tem direito de usar os logos, fotos e textos que enviar.',
    ],
  },
  {
    id: 'paginas-publicas',
    title: 'Páginas públicas',
    blocks: [
      'Portfólio, sites, propostas online e formulários de captação ficam abertos para qualquer pessoa que tenha o link. Você é responsável pelo que publica neles.',
      'Podemos tirar do ar conteúdo denunciado ou que viole estes termos, avisando você sempre que possível.',
    ],
  },
  {
    id: 'dados-de-clientes',
    title: 'Dados dos seus clientes',
    blocks: [
      'Quando você cadastra clientes, leads e contatos, você decide quais dados guarda e para quê. Nesse caso, você é o controlador desses dados e o Code Sellers trata esses dados apenas em seu nome, para prestar o serviço. Você deve ter uma base legal para usá-los e atender os pedidos dessas pessoas, como explica a Política de Privacidade.',
    ],
  },
  {
    id: 'propriedade',
    title: 'Propriedade intelectual',
    blocks: [
      'A plataforma, a marca Code Sellers e o conteúdo da Área do aluno (lições, kit, modelos e biblioteca) pertencem ao Code Sellers. Enquanto a sua conta estiver ativa, você pode usá-los no seu trabalho, de forma pessoal e intransferível. Não é permitido copiar, redistribuir ou revender esse conteúdo.',
    ],
  },
  {
    id: 'app-windows',
    title: 'App para Windows',
    blocks: [
      'O app para Windows segue estes mesmos termos. Ele se atualiza automaticamente para manter as correções e melhorias em dia.',
    ],
  },
  {
    id: 'disponibilidade',
    title: 'Disponibilidade e mudanças no serviço',
    blocks: [
      'Trabalhamos para manter o Code Sellers sempre no ar, mas podem acontecer manutenções e interrupções. Podemos melhorar, mudar ou retirar funções. Quando uma mudança afetar algo importante para você, avisaremos antes.',
    ],
  },
  {
    id: 'encerramento',
    title: 'Suspensão e encerramento da conta',
    blocks: [
      'Podemos suspender ou encerrar contas que violem estes termos ou a lei, avisando você sempre que possível. Você pode pedir a exclusão da sua conta a qualquer momento pelo suporte. Os dados são apagados como explica a Política de Privacidade.',
    ],
  },
  {
    id: 'responsabilidade',
    title: 'Responsabilidade',
    blocks: [
      'O Code Sellers é uma ferramenta de trabalho: não garantimos resultados de vendas. Não respondemos por negociações entre você e seus clientes, por conteúdo usado sem revisão, por falhas de serviços de terceiros fora do nosso controle nem por danos indiretos, como lucros cessantes.',
      'Quando a lei permitir limitar, nossa responsabilidade total fica limitada ao valor que você pagou nos 12 meses anteriores ao ocorrido. Nada nestes termos afasta direitos que o Código de Defesa do Consumidor garante a você.',
    ],
  },
  {
    id: 'alteracoes',
    title: 'Alterações destes termos',
    blocks: [
      'Podemos atualizar estes termos. Mudanças importantes serão avisadas por e-mail ou dentro do app com pelo menos 15 dias de antecedência. Se você continuar usando o Code Sellers depois disso, as novas regras passam a valer.',
    ],
  },
  {
    id: 'lei',
    title: 'Lei aplicável e foro',
    blocks: [
      'Estes termos seguem as leis do Brasil. Fica eleito o foro do domicílio do usuário para resolver qualquer questão sobre eles.',
    ],
  },
  {
    id: 'contato',
    title: 'Contato',
    blocks: [`Dúvidas, pedidos de cancelamento ou reembolso: ${LEGAL_CONTACT_EMAIL}.`],
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      description="Regras de uso do Code Sellers: conta, teste grátis, assinatura, cancelamento, limites e responsabilidades."
      intro="Estes termos explicam as regras para usar o Code Sellers: como funcionam a conta, o teste grátis, a assinatura, o cancelamento e o que cada parte se compromete a fazer. Escrevemos de forma direta para que fique claro."
      sections={sections}
      other={{ to: '/privacidade', label: 'Política de Privacidade' }}
    />
  )
}
