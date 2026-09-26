import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PanelHeader } from '@/components/ui/PanelHeader'

const WHATSAPP_NUMBER = '5516991413756'
// TODO: substituir pelo e-mail real de suporte
const SUPPORT_EMAIL = 'suporte@codesellers.com.br'

export function ContactSection() {
  return (
    <Card id="contato" className="scroll-mt-6">
      <PanelHeader title="Fale com a gente" subtitle="Não achou a resposta? A gente ajuda." />

      <div className="flex flex-col gap-2.5">
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-3 rounded-[18px] border border-emerald-500/30 bg-emerald-500/[0.08] p-4 transition hover:bg-emerald-500/[0.14]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.9)]">
            <MessageCircle className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[var(--text-primary)]">WhatsApp</span>
            <span className="block text-[12.5px] text-[var(--text-muted)]">Resposta rápida · seg a sex, 9h às 18h</span>
          </span>
          <ArrowUpRight className="size-4 text-[var(--text-muted)] transition group-hover:text-[var(--text-primary)]" />
        </a>

        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="group flex items-center gap-3 rounded-[18px] border border-[var(--border-default)] p-4 transition hover:border-[var(--accent-ring)]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-tint)] text-[var(--accent-text)]">
            <Mail className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-[var(--text-primary)]">E-mail</span>
            <span className="block truncate text-[12.5px] text-[var(--text-muted)]">Resposta em até 24h úteis</span>
          </span>
          <ArrowUpRight className="size-4 text-[var(--text-muted)] transition group-hover:text-[var(--text-primary)]" />
        </a>
      </div>
    </Card>
  )
}
