import { Mail, MessageCircle } from 'lucide-react'
import { SectionLabel } from '@/components/ui/section-label'
import { PurpleDivider } from '@/components/ui/purple-divider'
import { Button } from '@/components/ui/Button'

const WHATSAPP_NUMBER = '5516991413756'
// TODO: substituir pelo e-mail real de suporte
const SUPPORT_EMAIL = 'suporte@codesellers.com.br'

export function ContactSection() {
  return (
    <section id="contato" className="scroll-mt-24 py-12">
      <SectionLabel>Contato direto</SectionLabel>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)]">Fale conosco</h2>
      <PurpleDivider className="mt-3" />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <MessageCircle className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">WhatsApp</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Atendimento rápido para dúvidas urgentes</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Seg-Sex, 9h às 18h</p>
          <Button
            className="mt-4 w-full"
            onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener,noreferrer')}
          >
            Abrir WhatsApp
          </Button>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--purple-soft)] text-purple-600">
            <Mail className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)]">E-mail</h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Para questões que precisam de documentação</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Resposta em até 24 horas úteis</p>
          <Button variant="secondary" className="mt-4 w-full" onClick={() => window.open(`mailto:${SUPPORT_EMAIL}`, '_blank')}>
            Enviar e-mail
          </Button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        Antes de entrar em contato, verifique nossa central de ajuda e FAQs.
      </p>
    </section>
  )
}
