import type { ComponentType } from 'react'
import { KanbanSquare, Radar } from 'lucide-react'
import { SilkRibbons } from '@/components/auth/SilkRibbons'

// Os cards de vidro seguem o formato dos depoimentos da referência, mas com
// destaques do produto — não há depoimentos reais ainda, e inventar pessoas
// numa tela de login seria enganar quem chega. Quando houver, é só trocar.
const highlights: Array<{ icon: ComponentType<{ className?: string }>; title: string; tag: string; text: string }> = [
  {
    icon: Radar,
    title: 'Buyers Hunter',
    tag: 'Prospecção',
    text: 'Encontre empresas que realmente precisam do que você vende.',
  },
  {
    icon: KanbanSquare,
    title: 'Pipeline de vendas',
    tag: 'CRM',
    text: 'Do primeiro contato ao pagamento recebido, tudo num lugar só.',
  },
]

export function AuthShowcase() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[28px] bg-[#0e0826]">
      <div className="absolute -inset-[6%] animate-silk-drift">
        <SilkRibbons className="h-full w-full" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex gap-4 p-6 xl:p-8">
        {highlights.map(({ icon: Icon, title, tag, text }) => (
          <div
            key={title}
            className="flex-1 rounded-[24px] border border-white/50 bg-white/60 p-4 shadow-[0_20px_50px_rgba(12,4,40,0.28)] backdrop-blur-2xl backdrop-saturate-150 xl:max-w-[250px]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#4c1d95] text-white shadow-[0_6px_16px_rgba(76,29,149,0.35)]">
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium leading-tight text-[#15121c]">{title}</p>
                <p className="truncate text-[13px] leading-tight text-[#5b5766]">{tag}</p>
              </div>
            </div>
            <p className="mt-2.5 text-[13.5px] leading-snug text-[#26222e]">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
