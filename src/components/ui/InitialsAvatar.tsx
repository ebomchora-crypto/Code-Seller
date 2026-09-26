const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#8b5cf6,#5b21b6)',
  'linear-gradient(135deg,#6366f1,#3730a3)',
  'linear-gradient(135deg,#d946ef,#86198f)',
  'linear-gradient(135deg,#0ea5e9,#1e40af)',
  'linear-gradient(135deg,#10b981,#065f46)',
]

const SIZES = {
  sm: 'size-8 rounded-[10px] text-[11px]',
  md: 'size-10 rounded-xl text-[12.5px]',
  lg: 'size-16 rounded-[20px] text-[20px]',
}

// Iniciais com uma cor estável por nome, pra listas não ficarem monocromáticas.
export function InitialsAvatar({ name, size = 'md' }: { name: string; size?: keyof typeof SIZES }) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const initials = (words.length > 1 ? `${words[0][0]}${words[1][0]}` : name.slice(0, 2)).toUpperCase()
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (
    <span
      className={`flex shrink-0 items-center justify-center font-semibold text-white ${SIZES[size]}`}
      style={{ background: AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length] }}
      aria-hidden
    >
      {initials}
    </span>
  )
}
