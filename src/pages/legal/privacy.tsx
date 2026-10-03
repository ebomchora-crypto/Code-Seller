import { LEGAL_CONTACT_EMAIL, LegalPage, type LegalSection } from '@/components/legal/LegalPage'

const sections: LegalSection[] = [
  {
    id: 'quem-somos',
    title: 'Quem somos e o que esta política cobre',
    blocks: [
      'Esta política explica como o Code Sellers trata dados pessoais no site, no painel e no app para Windows, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).',
      'O Code Sellers é o controlador dos dados da sua conta. Já os dados que você cadastra sobre os seus clientes e leads são tratados em seu nome: nesse caso você é o controlador, e nós tratamos esses dados apenas em seu nome (veja o item 10).',
    ],
  },
  {
    id: 'dados',
    title: 'Dados que coletamos',
    blocks: [
      {
        list: [
          'Conta: nome, e-mail e senha (guardada de forma criptografada; nós não temos acesso a ela). Se você entrar com o Google, recebemos seu nome, e-mail e foto de perfil.',
          'Assinatura: e-mail usado na compra, situação da assinatura, datas de cobrança e números do pedido. Não recebemos os dados do seu cartão: eles ficam só com a plataforma de pagamento.',
          'O que você cadastra: contatos, empresas, negócios, propostas, tarefas, lançamentos financeiros, metas, modelos de mensagem, portfólio, sites e configurações.',
          'Arquivos que você envia: imagens, PDFs, documentos do Word e textos anexados no CS Copilot, e logos e fotos usados no Code Maker e no portfólio.',
          'Conversas com o CS Copilot e pedidos feitos ao Code Maker.',
          'Buscas no Buyers Hunter e os resultados encontrados, que são informações públicas de empresas (nome, endereço, telefone, site e avaliações).',
          'Uso do serviço: quantas buscas, mensagens e sites você usou (para aplicar os limites do plano), seu progresso na Área do aluno e o número de visualizações das suas páginas públicas. Esse número é só um total: não identifica quem visitou.',
          'Notificações: se você ativar os avisos, guardamos um identificador do seu navegador ou aparelho para enviar as notificações.',
          'Registros de acesso: endereço IP, data e hora de acesso, guardados como exige o Marco Civil da Internet.',
        ],
      },
    ],
  },
  {
    id: 'uso',
    title: 'Para que usamos os dados',
    blocks: [
      {
        list: [
          'Criar e manter sua conta e permitir o login.',
          'Prestar o serviço: guardar seu CRM, gerar respostas e sites com inteligência artificial, buscar empresas e publicar as páginas que você escolher.',
          'Liberar o acesso de acordo com o seu plano e aplicar os limites de uso.',
          'Enviar avisos sobre tarefas, sua conta e sua assinatura.',
          'Atender você no suporte.',
          'Proteger a plataforma contra fraudes, abusos e acessos indevidos.',
          'Cumprir obrigações legais.',
          'Melhorar o produto, usando informações agregadas de uso.',
        ],
      },
      'Não vendemos seus dados e não os usamos para publicidade de terceiros.',
    ],
  },
  {
    id: 'bases-legais',
    title: 'Bases legais',
    blocks: [
      'Tratamos dados pessoais com estas bases da LGPD (art. 7º):',
      {
        list: [
          'execução de contrato: para prestar o serviço que você contratou ou está testando;',
          'cumprimento de obrigação legal: por exemplo, a guarda dos registros de acesso e dos dados fiscais;',
          'legítimo interesse: segurança, prevenção de abusos e melhoria do produto, sempre respeitando os seus direitos;',
          'consentimento: para as notificações no navegador ou no celular, que você pode desativar quando quiser.',
        ],
      },
    ],
  },
  {
    id: 'compartilhamento',
    title: 'Com quem compartilhamos',
    blocks: [
      'Compartilhamos dados apenas com fornecedores que nos ajudam a operar o serviço, por contrato e somente para essa finalidade:',
      {
        list: [
          'hospedagem e banco de dados em nuvem, onde ficam sua conta e seus dados;',
          'plataforma de pagamento, que processa a assinatura;',
          'serviços de inteligência artificial, que recebem o conteúdo que você envia ao CS Copilot e ao Code Maker apenas para gerar a resposta;',
          'serviços de dados públicos de empresas, que recebem só os termos da busca do Buyers Hunter (nicho e localização);',
          'serviço de notificações do navegador, para entregar os avisos que você ativou.',
        ],
      },
      'Também podemos compartilhar dados quando a lei exigir ou por ordem de autoridade competente. Se você configurar um webhook ou o link de agenda, enviamos os dados para o endereço que você mesmo escolheu.',
    ],
  },
  {
    id: 'transferencia',
    title: 'Transferência internacional',
    blocks: [
      'Alguns fornecedores podem guardar ou processar dados fora do Brasil. Nesses casos, escolhemos fornecedores com padrões adequados de proteção e adotamos as garantias previstas no art. 33 da LGPD.',
    ],
  },
  {
    id: 'retencao',
    title: 'Por quanto tempo guardamos',
    blocks: [
      'Guardamos os seus dados enquanto a sua conta existir, inclusive depois que o teste grátis acaba ou a assinatura é cancelada, para que você possa voltar de onde parou.',
      'Se você pedir a exclusão da conta, apagamos os dados em até 30 dias. A exceção é o que a lei manda guardar: os registros de acesso ficam por 6 meses e os dados de pagamento pelo prazo exigido pela legislação fiscal.',
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    blocks: [
      'Usamos conexão criptografada (HTTPS) e senhas criptografadas. Regras de acesso no banco de dados garantem que cada conta veja apenas os próprios dados, e as chaves dos serviços ficam somente no servidor.',
      'Nenhum sistema é totalmente imune a falhas. Se acontecer um incidente de segurança que possa causar risco ou dano relevante, avisaremos você e a autoridade competente, como manda a lei.',
    ],
  },
  {
    id: 'direitos',
    title: 'Seus direitos',
    blocks: [
      'Pela LGPD (art. 18), você pode pedir:',
      {
        list: [
          'confirmação de que tratamos seus dados e acesso a eles;',
          'correção de dados incompletos, errados ou desatualizados;',
          'anonimização, bloqueio ou exclusão de dados desnecessários ou tratados em desacordo com a lei;',
          'portabilidade dos dados;',
          'informação sobre com quem compartilhamos seus dados;',
          'exclusão dos dados tratados com o seu consentimento e revogação desse consentimento;',
          'oposição a um tratamento que descumpra a lei.',
        ],
      },
      `Para exercer qualquer um desses direitos, escreva para ${LEGAL_CONTACT_EMAIL}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
    ],
  },
  {
    id: 'dados-de-clientes',
    title: 'Dados dos seus clientes',
    blocks: [
      'Quando você cadastra clientes, leads ou contatos, ou recebe dados pelos seus formulários de captação e propostas online, você é o controlador desses dados. Isso quer dizer que você deve ter uma base legal para usá-los e responder aos pedidos dessas pessoas.',
      'Nós guardamos e processamos esses dados apenas para prestar o serviço a você. Se alguém entrar em contato conosco pedindo algo sobre esses dados, vamos encaminhar o pedido para você e ajudar no que for preciso.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies e armazenamento no navegador',
    blocks: [
      'Usamos o armazenamento do navegador para manter você conectado, lembrar suas preferências (como o tema e a opção "manter conectado") e guardar etapas do uso, como o pedido de baixar o app depois do cadastro.',
      'Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros. Se você bloquear esse armazenamento, o login pode deixar de funcionar.',
    ],
  },
  {
    id: 'menores',
    title: 'Menores de idade',
    blocks: ['O Code Sellers não é destinado a menores de 18 anos, e não coletamos dados de menores de forma intencional.'],
  },
  {
    id: 'alteracoes',
    title: 'Alterações desta política',
    blocks: [
      'Podemos atualizar esta política. Mudanças importantes serão avisadas por e-mail ou dentro do app. A data da última atualização aparece no topo desta página.',
    ],
  },
  {
    id: 'contato',
    title: 'Encarregado de dados e contato',
    blocks: [
      `Para falar com o encarregado pelo tratamento de dados pessoais ou tirar dúvidas sobre esta política, escreva para ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      description="Como o Code Sellers coleta, usa, guarda e protege dados pessoais, conforme a LGPD."
      intro="Aqui explicamos, de forma direta, quais dados o Code Sellers coleta, para que usa, com quem compartilha, por quanto tempo guarda e como você pode exercer os seus direitos."
      sections={sections}
      other={{ to: '/termos', label: 'Termos de Uso' }}
    />
  )
}
