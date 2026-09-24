interface PurpleDividerProps {
  size?: 'sm' | 'lg'
  className?: string
}

export function PurpleDivider({ size = 'sm', className = '' }: PurpleDividerProps) {
  return <div className={`h-[2px] rounded-full bg-purple-500 ${size === 'lg' ? 'w-20' : 'w-10'} ${className}`} />
}
