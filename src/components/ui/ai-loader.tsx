import * as React from 'react'

interface LoaderProps {
  /** Diâmetro do anel, em px. */
  size?: number
  /** Palavra que pulsa dentro do anel. */
  text?: string
  /** "screen" cobre a tela inteira; "cover" cobre só o elemento pai (que precisa ser `relative`). */
  mode?: 'screen' | 'cover'
  /** Fundo meio transparente: deixa ver (borrado) o que está atrás, como numa alteração em um site que já existe. */
  translucent?: boolean
  /** Frase pequena embaixo do anel (o que a IA está fazendo agora). */
  caption?: string
}

// Carregamento da IA do Code Maker: anel girando com a palavra pulsando dentro, sobre um fundo em degradê.
export const Component: React.FC<LoaderProps> = ({ size = 180, text = 'Gerando', mode = 'cover', translucent = false, caption }) => {
  const letters = text.split('')

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={caption ? `${text}. ${caption}` : text}
      className={`${mode === 'screen' ? 'fixed' : 'absolute'} inset-0 z-50 flex flex-col items-center justify-center gap-7 ${
        translucent ? 'bg-[#0b0814]/60 backdrop-blur-md' : 'bg-gradient-to-b from-[#2a1760] via-[#120c26] to-black'
      }`}
    >
      <div className="relative flex select-none items-center justify-center font-sans text-[17px] font-medium tracking-wide" style={{ width: size, height: size }}>
        {letters.map((letter, index) => (
          <span key={index} className="cm-loader-letter inline-block text-white opacity-40" style={{ animationDelay: `${index * 0.1}s` }}>
            {letter}
          </span>
        ))}
        <div className="cm-loader-circle absolute inset-0 rounded-full" />
      </div>
      {caption && <p className="max-w-[300px] px-4 text-center text-[13px] leading-relaxed text-white/60">{caption}</p>}

      <style>{`
        @keyframes cmLoaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 6px 12px 0 #c4b5fd inset,
              0 12px 18px 0 #7c3aed inset,
              0 36px 36px 0 #4c1d95 inset,
              0 0 3px 1.2px rgba(196, 181, 253, 0.3),
              0 0 6px 1.8px rgba(124, 58, 237, 0.2);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 6px 12px 0 #a78bfa inset,
              0 12px 6px 0 #9333ea inset,
              0 24px 36px 0 #7c3aed inset,
              0 0 3px 1.2px rgba(196, 181, 253, 0.3),
              0 0 6px 1.8px rgba(124, 58, 237, 0.2);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 6px 12px 0 #ddd6fe inset,
              0 12px 18px 0 #7c3aed inset,
              0 36px 36px 0 #4c1d95 inset,
              0 0 3px 1.2px rgba(196, 181, 253, 0.3),
              0 0 6px 1.8px rgba(124, 58, 237, 0.2);
          }
        }
        @keyframes cmLoaderLetter {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          20% { opacity: 1; transform: scale(1.15); }
          40% { opacity: 0.7; transform: translateY(0); }
        }
        .cm-loader-circle { animation: cmLoaderCircle 5s linear infinite; }
        .cm-loader-letter { animation: cmLoaderLetter 3s infinite; }
        @media (prefers-reduced-motion: reduce) {
          .cm-loader-circle, .cm-loader-letter { animation-duration: 12s; }
        }
      `}</style>
    </div>
  )
}

export { Component as AiLoader }
