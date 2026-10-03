import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export const LEGAL_CONTACT_EMAIL = 'suporte@codesellers.com.br'
export const LEGAL_UPDATED_AT = '3 de outubro de 2026'

export type LegalBlock = string | { list: string[] }

export interface LegalSection {
  id: string
  title: string
  blocks: LegalBlock[]
}

interface LegalPageProps {
  title: string
  description: string
  intro: string
  sections: LegalSection[]
  other: { to: string; label: string }
}

// Layout das páginas de Termos de Uso e Política de Privacidade: abre com ou
// sem login, no mesmo visual escuro da landing, com índice no computador.
export function LegalPage({ title, description, intro, sections, other }: LegalPageProps) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} — Code Sellers`
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = meta?.content
    if (meta) meta.content = description
    window.scrollTo(0, 0)
    return () => {
      document.title = previousTitle
      if (meta && previousDescription !== undefined) meta.content = previousDescription
    }
  }, [title, description])

  return (
    <div className="min-h-screen bg-landing-bg text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.08] bg-landing-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Code Sellers" className="h-7 w-7 object-contain" />
            <span className="font-display text-base font-bold">Code Sellers</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#c4b5fd]">Documento legal</p>
        <h1 className="mt-3 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[48px]">{title}</h1>
        <p className="mt-3 text-sm text-white/50">Última atualização: {LEGAL_UPDATED_AT}</p>
        <p className="mt-6 max-w-3xl text-[15.5px] leading-7 text-white/75">{intro}</p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Índice" className="hidden lg:block">
            <ol className="sticky top-24 flex flex-col gap-1 border-l border-white/[0.08] text-[13.5px]">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 text-white/55 transition-colors hover:border-white/40 hover:text-white">
                    {index + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <article className="flex max-w-3xl flex-col gap-11">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="font-display text-[21px] font-semibold tracking-[-0.02em] sm:text-[23px]">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-4 flex flex-col gap-4 text-[15px] leading-7 text-white/70">
                  {section.blocks.map((block, blockIndex) =>
                    typeof block === 'string' ? (
                      <p key={blockIndex}>{block}</p>
                    ) : (
                      <ul key={blockIndex} className="flex flex-col gap-2 pl-1">
                        {block.list.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-full bg-[#a78bfa]" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ),
                  )}
                </div>
              </section>
            ))}

            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
              <p className="text-[15px] font-semibold">Ficou com alguma dúvida?</p>
              <p className="mt-2 text-[14.5px] leading-6 text-white/65">
                Escreva para{' '}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="font-medium text-[#c4b5fd] underline-offset-4 hover:underline">
                  {LEGAL_CONTACT_EMAIL}
                </a>
                . Veja também a{' '}
                <Link to={other.to} className="font-medium text-[#c4b5fd] underline-offset-4 hover:underline">
                  {other.label}
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </main>

      <footer className="border-t border-white/[0.08] py-7 text-center text-sm text-white/40">
        © 2026 Code Sellers. Todos os direitos reservados.
      </footer>
    </div>
  )
}
