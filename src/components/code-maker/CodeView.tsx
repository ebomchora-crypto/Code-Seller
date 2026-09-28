import { memo, useEffect, useMemo, useRef } from 'react'
import { tokenizeHtml, type CodeToken } from '@/utils/codeMakerStream'

const TOKEN_CLASS: Record<CodeToken['kind'], string> = {
  text: 'text-[#d4d4dc]',
  tag: 'text-[#f0a3ff]',
  attr: 'text-[#8ec7ff]',
  string: 'text-[#9fe0a8]',
  comment: 'text-[#6b6b7a] italic',
}

// Acima disto, sem cores (texto muito longo deixaria a tela lenta).
const MAX_HIGHLIGHT = 90_000

interface CodeViewProps {
  code: string
  /** Enquanto a IA escreve, acompanha o fim do texto. */
  follow?: boolean
  className?: string
}

export const CodeView = memo(function CodeView({ code, follow = false, className = '' }: CodeViewProps) {
  const ref = useRef<HTMLPreElement>(null)
  const tokens = useMemo(() => (code.length > MAX_HIGHLIGHT ? null : tokenizeHtml(code)), [code])

  useEffect(() => {
    const element = ref.current
    if (follow && element) element.scrollTop = element.scrollHeight
  }, [code, follow])

  return (
    <pre
      ref={ref}
      className={`overflow-auto whitespace-pre-wrap break-words bg-[#0d0c12] p-4 font-mono text-[12px] leading-[1.65] text-[#d4d4dc] [scrollbar-width:thin] ${className}`}
    >
      <code>
        {tokens
          ? tokens.map((token, index) => (
              <span key={index} className={TOKEN_CLASS[token.kind]}>
                {token.value}
              </span>
            ))
          : code}
        {follow && <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse bg-[#a78bfa]" />}
      </code>
    </pre>
  )
})
