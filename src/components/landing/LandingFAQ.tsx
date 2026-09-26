import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { LandingFadeIn } from '@/components/landing/LandingFadeIn'
import { LandingKicker } from '@/components/landing/LandingKicker'

const EASE = [0.22, 1, 0.36, 1] as const

const faqItems = [
  {
    question: 'Preciso saber programar?',
    answer: 'Não. O método ensina a usar IA pra criar sites e sistemas — a habilidade que você desenvolve é conduzir a IA e refinar o resultado, não escrever código do zero.',
  },
  {
    question: 'Posso começar sem portfólio?',
    answer: 'Sim. O primeiro módulo existe justamente pra isso: sair com um projeto real construído, que vira o início do seu portfólio.',
  },
  {
    question: 'Funciona para sites?',
    answer: 'Sim — sites institucionais, landing pages e páginas de conversão fazem parte do que você aprende a criar e vender.',
  },
  {
    question: 'Funciona para sistemas?',
    answer: 'Sim. Além de sites, o método cobre sistemas e automações mais complexas, voltadas a resolver um problema comercial específico.',
  },
  {
    question: 'O que é a Buyers Hunter?',
    answer: 'É a ferramenta de prospecção do ecossistema — encontra empresas com potencial real de compra, pra você não abordar no escuro. Não se confunde com o método Code Sellers.',
  },
  {
    question: 'O método ensina prospecção?',
    answer: 'Sim. Encontrar as empresas certas é uma etapa do processo, com o Buyers Hunter como ferramenta de apoio.',
  },
  {
    question: 'O método ensina venda?',
    answer: 'Sim — oferta, abordagem, demonstração, proposta e fechamento fazem parte do conteúdo, não só a parte técnica de criação.',
  },
  {
    question: 'Preciso pagar ferramentas?',
    answer: 'O método usa ferramentas de IA amplamente disponíveis, muitas com planos gratuitos suficientes pra começar.',
  },
  {
    question: 'Como participo?',
    answer: 'Pelo botão "Entrar no grupo" nesta página — é o ponto de entrada pro ecossistema Code Sellers.',
  },
]

function FAQItem({
  item,
  index,
  isOpen,
  onToggle,
}: {
  item: (typeof faqItems)[number]
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        className={`group flex w-full items-center justify-between gap-6 py-6 text-left font-display text-[18px] tracking-[-0.02em] transition-colors duration-300 lg:py-7 lg:text-[21px] ${
          isOpen ? 'text-[#5b21b6]' : 'text-[#151318] hover:text-[#6d28d9]'
        }`}
      >
        <span>{item.question}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className={`relative grid size-10 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
            isOpen
              ? 'border-[#6d28d9] bg-[#6d28d9] text-[#fff]'
              : 'border-[rgba(20,14,34,0.15)] text-[#151318] group-hover:border-[#6d28d9]'
          }`}
        >
          <span className="absolute h-px w-3.5 bg-current" />
          <motion.span
            animate={{ opacity: isOpen ? 0 : 1, rotate: isOpen ? 90 : 0, scaleY: isOpen ? 0 : 1 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="absolute h-3.5 w-px bg-current"
          />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${index}`}
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -8 }}
            transition={{ height: { duration: 0.48, ease: EASE }, opacity: { duration: 0.3, delay: 0.08 }, y: { duration: 0.4, ease: EASE } }}
            className="overflow-hidden"
          >
            <p className="max-w-[760px] pb-8 pr-12 text-[16px] leading-7 text-[rgba(60,48,80,0.72)]">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// FAQ entre o bloco roxo e o CTA final com fade. Sobe por cima do fim do
// bloco roxo com uma aba de papel curva; o papel da seção começa logo abaixo
// da aba (profundidade do encaixe: 62px / 120px).
export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="relative z-[2] -mt-[62px] text-[#151318] lg:-mt-[120px]">
      <div aria-hidden className="cs-interlock-up cs-paper-soft absolute inset-x-0 top-0 h-[62px] lg:h-[120px]" />
      <div aria-hidden className="cs-paper-soft absolute inset-x-0 bottom-0 top-[60px] lg:top-[118px]" />
      {/* Some com as linhas do grid antes do CTA final (que começa no mesmo papel, liso). */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#f5f3f5]" />

      <div className="relative mx-auto grid w-full max-w-[1280px] gap-12 px-5 pb-24 pt-[134px] sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20 lg:px-12 lg:pb-28 lg:pt-[200px]">
        <LandingFadeIn className="text-center lg:text-left">
          <LandingKicker>Antes de decidir</LandingKicker>
          <h2 className="text-[40px] font-normal leading-[0.98] tracking-[-0.055em] sm:text-[48px] lg:text-[56px]">
            As dúvidas que travam quase todo iniciante.
          </h2>
          <p className="mx-auto mt-7 max-w-[460px] text-[16px] leading-7 text-[rgba(60,48,80,0.72)] lg:mx-0 lg:text-[17px]">
            O método existe justamente pra remover a distância entre aprender uma ferramenta e
            conseguir entregar algo comercial.
          </p>
        </LandingFadeIn>

        <LandingFadeIn delay={0.08}>
          <div className="divide-y divide-[rgba(20,14,34,0.12)] border-y border-[rgba(20,14,34,0.12)]">
            {faqItems.map((item, index) => (
              <FAQItem
                key={item.question}
                item={item}
                index={index}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
              />
            ))}
          </div>
        </LandingFadeIn>
      </div>
    </section>
  )
}
