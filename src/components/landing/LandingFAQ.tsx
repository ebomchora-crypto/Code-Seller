import { useState } from 'react'
import { Plus } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { LandingEyebrow } from '@/components/landing/LandingEyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { fadeInUp } from '@/motion/variants'

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
    question: 'O que é a Code Hunter?',
    answer: 'É a ferramenta de prospecção do ecossistema — encontra empresas com potencial real de compra, pra você não abordar no escuro. Não se confunde com o método Code Sellers.',
  },
  {
    question: 'O método ensina prospecção?',
    answer: 'Sim. Encontrar as empresas certas é uma etapa do processo, com o Code Hunter como ferramenta de apoio.',
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

function FAQItem({ item, isOpen, onToggle }: { item: (typeof faqItems)[number]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-landing-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-base font-medium text-landing-text sm:text-lg">{item.question}</span>
        <Plus
          className={`h-5 w-5 shrink-0 text-landing-text-muted transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 text-sm leading-relaxed text-landing-text-secondary">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="relative overflow-hidden bg-landing-surface-2 py-24 sm:py-32">
      <div className="relative mx-auto w-full max-w-[880px] px-6 sm:px-8">
        <Reveal variants={fadeInUp} className="text-center">
          <LandingEyebrow>FAQ</LandingEyebrow>
          <h2 className="mt-4 text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-landing-text sm:text-4xl">
            Perguntas frequentes.
          </h2>
        </Reveal>

        <div className="mt-14">
          {faqItems.map((item, index) => (
            <FAQItem
              key={item.question}
              item={item}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
