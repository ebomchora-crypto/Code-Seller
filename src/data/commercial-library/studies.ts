import type { CommercialMaterial } from './types.ts'

// Estudos: leituras de referência (não são mensagens prontas). Ficam só na
// Biblioteca; o CS Copilot usa apenas o resumo que está no prompt dele.
type StudySeed = Omit<CommercialMaterial, 'category' | 'stage'>
const asStudies = (items: StudySeed[]): CommercialMaterial[] => items.map((item) => ({ ...item, category: 'estudos', stage: 'diagnostico' }))

export const STUDIES = asStudies([
  {
    id: 'estudo-persuasao',
    title: 'Persuasão, copy e anúncios',
    tags: ['persuasão', 'copy', 'anúncios', 'confiança', 'preço'],
    strategy: 'Quem converte é a confiança e a conexão humana, não técnica agressiva nem texto de IA sem revisão.',
    goal: 'Entender por que confiança vende mais que agressividade, como as plataformas de anúncio punem conteúdo ruim e por que preço baixo não resolve desconfiança.',
    avoid: 'FOMO, escassez falsa e "o preço vai subir"; frases genéricas para parecer íntimo (efeito Barnum); culpar governo, algoritmo ou mercado para criar aliança ("nós contra eles"); dizer ao cliente só o que ele quer ouvir. Tudo isso vai contra a metodologia Code Sellers.',
    body: `OS DOIS PILARES DA PERSUASÃO
• Dar incentivo: um benefício claro (emocional ou concreto) para a pessoa agir.
• Tirar obstáculos: achar e eliminar o atrito (tempo, dinheiro, confiança, quem decide).
• Persuasão nunca é garantida: as pessoas têm livre-arbítrio e agem de forma irracional.

IDEIAS DE FUNDO
• "Um fato convence quarenta sábios; quarenta fatos não convencem um tolo." O problema raramente é falta de prova.
• Caverna de Platão: a pessoa prefere a realidade que já escolheu. Atacar com fatos contrários gera resistência.

VIESES CITADOS (conhecer não é usar)
• Efeito Barnum: frases genéricas que parecem pessoais. Manipulação: não use.
• Nós contra eles: culpar terceiros para ganhar o cliente. Não use.
• Efeito avestruz: a pessoa foge da dor; prefere "renda extra" a "sair das dívidas".
• Caixa-preta: o cliente compra a solução, não o formato (site, app, curso). Venda o resultado.
• Distância e valor: o que é barato ou acessível demais perde valor percebido.

DOIS LANÇAMENTOS COMPARADOS
• Agressivo: Exposição → Realidade → FOMO. Mostra que a pessoa está "numa bolha" enquanto o mercado muda, empilha autoridade e prova, e usa bônus como gatilho (vagas de fundador, preço travado antes do aumento).
• Humanizado: Conexão → Sentimento → Confiança. Conta a própria história, mostra casos reais que derrubam objeções (começou com pouco dinheiro, vende sem falar inglês) e se posiciona como "quem ajuda com o mapa", não como vendedor.

COMO A PLATAFORMA DE ANÚNCIOS AVALIA (Facebook/Instagram)
• Mais de 15 bilhões de anúncios ruins ou fraudulentos por dia.
• A conta só é banida com 95% de certeza de fraude; abaixo disso, o anúncio fica mais caro como punição.
• "Inferno do algoritmo": anúncio ruim sai dos leilões bons e vai para curiosos que não compram, público de oferta barata e gente que não paga.
• O pixel aprende com o anúncio: anúncio enganoso ensina a buscar o público errado.
• Derruba a nota de qualidade: promessa sensacionalista, "comente/compartilhe" forçado, página que não segura a pessoa, muitas denúncias e "ocultar anúncio", campanha ruim duplicada em massa.

PREÇO BAIXO NÃO RESOLVE DESCONFIANÇA
• Sem confiança, nem R$ 9,90 nem grátis vende: pagar exige esforço (abrir o banco, digitar cartão, fazer Pix).
• "Quando a esmola é muita, o santo desconfia." Preço muito baixo para promessa grande gera suspeita.
• Repelente na Amazônia: mesma fórmula a R$ 19,90 e a R$ 99,90. Quem tem muito em jogo escolhe o mais caro.
• Funil inteiro feito por IA fica sem vida. A IA executa, mas não cria emoção nem confiança.

A JORNADA TEM VÁRIOS CONTATOS
• Ver → olhar o perfil → se acostumar (efeito da mera exposição) → um gatilho → agir.
• Erro clássico: desligar os anúncios que "não vendem" e deixar só o de chamada final. Sem os contatos anteriores, a chamada cai em quem não conhece você e a conversão desaba.

RECOMENDAÇÕES
1. Nunca publicar texto de IA sem revisão humana.
2. Confiança acima de promessa exagerada.
3. Sem caça-clique, quiz falso ou página enganosa.
4. Vender o resultado, não o formato.
5. Manter variedade: conteúdo de valor, de confiança e de fechamento.`,
  },
  {
    id: 'estudo-prospeccao-hamburgueria',
    title: 'Prospecção a frio e o caso da hamburgueria',
    tags: ['prospecção', 'whatsapp', 'abordagem', 'nicho', 'assinatura', 'dono'],
    strategy: 'Passar pelo funcionário até o dono com curiosidade, e adaptar a oferta à dor real do nicho.',
    goal: 'Aprender a chegar no decisor pelo WhatsApp público e a reconhecer quando o nicho quer outra coisa que não um site.',
    avoid: 'Vender logo na primeira mensagem; tratar o silêncio do funcionário como recusa do dono; insistir num produto que o nicho não quer.',
    body: `ORIGEM
Um site de R$ 2.500 para uma hamburgueria que o cliente não pagou nem respondeu.

PLANO B: TRANSFORMAR EM MODELO
• Tirar a marca do cliente.
• Deixar logo, cores, endereço e fotos fáceis de trocar.
• Oferecer o mesmo modelo a outras hamburguerias.

PASSAR PELO "PORTEIRO" NO WHATSAPP
• O número público quase sempre é atendido por funcionário, não pelo dono.
• Não vender de cara: despertar curiosidade.
• Script: "Bom dia, quem é o responsável pela empresa [NOME]? Eu montei uma coisa com o nome de vocês e queria mostrar pro dono. Antes de qualquer coisa, é só um print."
• O script acha o dono, diz que já existe algo pronto com o nome dele e baixa a resistência.

RESULTADO REAL (cerca de 15 contatos)
• Sem resposta: várias.
• Resposta automática: 3 a 4.
• Administrativo pedindo mais informação antes de repassar: 2 a 3.
• Gerente (não dono): 1.
• Dono direto: 1 (disponível depois das 18h).
Conclusão: só cerca de 1 em 15 (~6,7%) chega direto no dono. Curiosidade é o que faz o funcionário repassar.

A VIRADA: O NICHO QUERIA OUTRA COISA
• Hamburgueria pequena não quer "marca"; quer pedido entrando.
• A dor real: a taxa dos aplicativos de entrega (~30% do faturamento).
• Nova oferta: pedidos pelo WhatsApp por assinatura de R$ 70 a R$ 150 por mês.

SITE SOB MEDIDA × PEDIDOS POR ASSINATURA
• Preço: ~R$ 2.500 uma vez × R$ 70/90/150 por mês.
• Entrega: marca e identidade × mais pedidos e menos taxa.
• Cliente ideal: rede grande × hamburgueria pequena e média.
• Receita: uma vez × recorrente.
• Fidelização: baixa × alta (vira ferramenta do dia a dia).

TIRAR O CLIENTE DO APLICATIVO DE ENTREGA
1. O pedido chega pelo aplicativo.
2. Vai junto um papel com QR Code e cupom de desconto.
3. O QR leva ao WhatsApp da loja.
4. Os próximos pedidos vêm sem a taxa.

SISTEMA COM IA
• Caso citado: um sistema para vendedores de marketplace, feito com IA, com mais de R$ 100 mil por mês recorrentes.
• Prazo estimado para o sistema da hamburgueria: 2 a 3 dias com IA.`,
  },
  {
    id: 'estudo-carreira-ia',
    title: 'Carreira, IA e segurança de software',
    tags: ['carreira', 'ia', 'segurança', 'portfólio', 'preço', 'freelancer'],
    strategy: 'A IA escreve o código básico, mas fundamentos, arquitetura, segurança e regra de negócio valem mais do que nunca.',
    goal: 'Conhecer o mercado de "terminar o que a IA começou", os erros de segurança mais comuns e o que pesa na carreira.',
    avoid: 'Entregar sistema feito só no prompt sem revisar segurança; deixar preço, saldo ou permissão sob controle do navegador.',
    body: `O MERCADO "90/10"
• Leigos fazem 80–95% do app com ferramentas de IA e travam no resto: integração, pagamento, webhook, casos raros.
• Quem sabe programar cobra de R$ 6 mil a R$ 20 mil só para terminar os 5–10% que faltam.
• Casos: SaaS de uma chef com 228 mil seguidores, 95% pronto e com relatório quebrado (R$ 6.000 em 2 dias); app que falhou na validação da loja (R$ 15.000); atendente de IA no WhatsApp para pequenas empresas (R$ 70 mil+ acumulados).

ERROS TÍPICOS DE IA SEM SUPERVISÃO
• App de calorias salvava fotos no disco do servidor em vez de num armazenamento na nuvem. A IA "consertava" no lugar errado até um sênior intervir.

SEGURANÇA EM APP FEITO SÓ NO PROMPT
Loja de roupas de um influenciador:
• O preço ia do navegador para o servidor (dava para mudar o preço).
• Mandar um e-mail no checkout devolvia o cadastro inteiro: CPF, endereço, senha criptografada e segredo do 2FA.
• Mandando campos extras, dava para desligar o 2FA e virar super admin.
• Dava para trocar o banner do site sem validação.
• O atacante trocou as chaves do pagamento e desviou o dinheiro das vendas.
Cassino online, derrubado em 5 minutos:
• Aceitava CPF e telefone falsos.
• O saldo era alterado direto pelo navegador ("saldo": 999999).
• A posição das bombas do jogo ficava visível no navegador.
• Virar admin com um comando; o painel mostrava prejuízo de R$ 600 mil.
Lição: preço, saldo, permissão e regras sempre conferidos no servidor; cada usuário só acessa os próprios dados.

CARREIRA E SALÁRIOS
• Setores que pagam melhor: fábricas de software (sênior até R$ 20 mil), consultorias, startups e grandes empresas de tecnologia.
• CLT em empresa grande: júnior R$ 6–7 mil; pleno R$ 9–10 mil; sênior R$ 15 mil+.
• Empresa antiga (C#, Java) costuma pagar júnior melhor que startup nova (R$ 2–2,5 mil).
• Inglês vale mais que diploma caro: US$ 2 mil/mês ≈ R$ 15 mil; US$ 10 mil ≈ R$ 60 mil. Como PJ dá para ter dois contratos.

FACULDADE E CURRÍCULO
• Ordem sugerida: Engenharia de Software > Segurança/IA > ADS (rápido, mais raso) > Ciência da Computação (menos prática para dev).
• EAD barato não é discriminado; faculdade cara rende pouco a mais.
• Recrutador busca framework, não linguagem. Currículo de uma página, com GitHub e LinkedIn.

5 PROJETOS DE PORTFÓLIO QUE CONTRATAM
1. Venda de ingressos com taxa de 10%.
2. Monitor de diferença de preço de cripto entre corretoras.
3. Alerta de vagas com notificações.
4. CRM com contrato, assinatura digital, comissão e funil.
5. Atendente de IA no WhatsApp.

LIVROS
• Hábitos Atômicos • A Única Coisa • Steve Jobs (Isaacson) • Roube como um Artista

NÚMEROS
• Agência citada: R$ 120–150 mil/mês.
• Freelancer: R$ 8–10 mil/mês em 2 meses com 3 vídeos por dia + R$ 10–15/dia de anúncio.
• Mais de 13 milhões de empresas no Brasil precisando se modernizar.`,
  },
  {
    id: 'estudo-micro-saas',
    title: 'Micro SaaS: do zero à venda',
    tags: ['micro saas', 'assinatura', 'ideias', 'prospecção', 'método', 'nicho'],
    strategy: 'Um sistema pequeno, para um nicho fácil de achar, com dor clara e disposição para pagar.',
    goal: 'Ter um método para criar e vender um sistema por assinatura, e um catálogo de 18 ideias por nicho.',
    avoid: 'Programar antes de definir o produto; encher de funções antes de ter cliente pagante; prender o cliente sem deixar exportar os próprios dados.',
    body: `OS TRÊS PILARES
1. Cliente fácil de achar (barbearia no Google Maps, personal em grupo, oficina na cidade).
2. Dor clara e urgente (agenda manual no WhatsApp, Pix falso, horas fazendo proposta).
3. Disposição para pagar (retorno claro que justifique a mensalidade).

CONTA DA RECEITA (a R$ 127/mês)
• 20 clientes: R$ 2.540 • 30: R$ 3.810 • 50: R$ 6.350 • 100: R$ 12.700
• Modelo híbrido: R$ 37/mês + R$ 0,50 por Pix validado.

18 IDEIAS (nicho: produto · preço · como vender)
• Barbearia/salão: agendamento com lembrete no WhatsApp · R$ 97–197 · visita de 5–10 min, Google Maps
• Restaurante/lanchonete: cardápio digital por QR · R$ 45–150 · visita, Instagram local
• Personal trainer: alunos, treinos e evolução · R$ 79–149 · grupos, academias, 14 dias grátis
• Autônomos: clientes e cobranças · R$ 49–97 · grupos e anúncios locais
• Nutricionista: avaliação física com gráficos · R$ 127–997 · Instagram de saúde
• Loja pequena: alerta de estoque no celular · R$ 27–47 · porta a porta, feiras
• Prestador de serviço: proposta e contrato com assinatura · R$ 47–70 · LinkedIn, comunidades
• Pilates/yoga: check-in e renovação de pacotes · R$ 47–97 · estúdios sem agenda online
• Gestor de tráfego: relatório automático · R$ 27–97 · grupos de marketing
• Marmita/comida: checkout de uma página com Pix · R$ 37–97 + R$ 0,50/Pix · grupos de WhatsApp
• Oficina: lembrete de revisão por quilometragem · grátis / R$ 45–97 · visita, ligação
• Equipe de vendas: cálculo de comissão · mensal · B2B direto
• Contador: extrato em PDF para planilha · 3 grátis, depois R$ 9,90/mês · vídeos curtos
• Freelancer criativo: proposta com IA e aviso de abertura · 2 grátis, depois R$ 47 · tutoriais
• Loja virtual: coleta de depoimentos · 5 grátis, depois mensal · conteúdo
• Criador de conteúdo: gerador de miniaturas · 3 grátis, depois R$ 57 · grupos de edição
• Vendedor de marketplace: monitor de preço do concorrente · R$ 49,90–97 · contato direto
• MEI: controle financeiro simples · 20 lançamentos grátis, depois R$ 29,90 · vídeos curtos

MÉTODO ANTES DE PROGRAMAR (4 ETAPAS)
1. Documento do produto: proposta, tipos de usuário, funções (Essencial / Importante / Futuro), telas, regras, fluxo principal e tecnologias.
2. Plano por fases (sem programar ainda): fases, banco de dados com regras de acesso, telas e quando entram pagamento, login e mensagens.
3. Conferência cruzada: outra IA compara o documento com o plano e aponta o que não bate, o que ficou de fora, o que está ambíguo e os riscos (Crítico, Importante, Menor). Só avança quando tudo estiver alinhado.
4. Execução no computador, fase por fase, testando tudo. Antes de publicar: cada cliente só vê os próprios dados, chaves fora do código, regras no servidor.

FERRAMENTAS DE IA (comparação geral)
• Geradores "tudo em um": rápidos para protótipo, gastam muito crédito e sofrem com lógica complexa.
• IAs fortes em visual: ótimas em telas, precisam de banco e hospedagem à parte.
• IAs fortes em código: melhores em lógica e banco, exigem mais conhecimento técnico.

VENDER E MANTER
• Visita presencial: 5–10 minutos com o dono, demonstração no celular, falando só de retorno (tempo, agenda, calote). Travou no preço: 14–30 dias grátis com acompanhamento semanal.
• Google Maps: filtrar quem não tem agenda online nem site e chamar no WhatsApp.
• Vídeo curto "problema × solução" com a tela gravada.
• Parceria com influenciador do nicho: ele divulga, você cuida do sistema (caso citado: 1.000+ assinantes em 3 meses).
• Fidelização pelo histórico: o cliente fica porque o histórico tem valor. Deixe-o exportar os dados; fidelidade forçada gera desconfiança.
• Começar simples e só adicionar função que cliente pagante pedir.

CHECKLIST ANTES DE PUBLICAR
• Chaves e senhas fora do código
• Regras de acesso ativas no banco
• Testado no computador e no celular
• Código salvo em repositório
• Hospedagem e domínio com cadeado (SSL)`,
  },
])
