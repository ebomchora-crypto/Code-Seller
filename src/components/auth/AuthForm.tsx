import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react'
import { signInWithGoogle } from '@/services/supabase/auth'

// Peças das telas de acesso. Cores sempre explícitas: o tema escuro do app
// remapeia bg-white/neutral-* e deixaria essas telas claras quebradas.

export function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-display text-[40px] font-normal leading-[1.05] tracking-[-0.045em] text-[#0f0d14] sm:text-[44px]">
        {title}
      </h1>
      <p className="mt-4 text-[15px] leading-6 text-[#6b6875]">{subtitle}</p>
    </div>
  )
}

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  trailing?: ReactNode
}

export function AuthField({ label, id, trailing, className = '', ...props }: AuthFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div>
      <label htmlFor={inputId} className="mb-2 block text-[14px] font-medium text-[#3f3b48]">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={`h-[52px] w-full rounded-2xl border border-[#ebe9f0] bg-[#f4f3f6] px-4 text-[15px] text-[#0f0d14] outline-none transition placeholder:text-[#9a97a3] focus:border-[#8b5cf6] focus:bg-[#fff] focus:ring-4 focus:ring-[#8b5cf6]/15 ${
            trailing ? 'pr-12' : ''
          } ${className}`}
          {...props}
        />
        {trailing && <div className="absolute inset-y-0 right-2 flex items-center">{trailing}</div>}
      </div>
    </div>
  )
}

export function PasswordField(props: Omit<AuthFieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  return (
    <AuthField
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          className="grid size-9 place-items-center rounded-xl text-[#6b6875] transition hover:bg-[#ebe9f0] hover:text-[#0f0d14]"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      }
    />
  )
}

export function AuthCheckbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-2.5 text-[14px] text-[#3f3b48]">
      <span className="relative grid size-[18px] place-items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 cursor-pointer appearance-none rounded-full border border-[#c9c6d1] bg-[#fff] transition checked:border-[#7c3aed] checked:bg-[#7c3aed] focus-visible:ring-4 focus-visible:ring-[#8b5cf6]/20"
        />
        <Check className="pointer-events-none relative size-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {children}
    </label>
  )
}

export function AuthSubmit({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#111014] text-[15px] font-medium text-[#fff] transition hover:bg-[#000] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3.5 py-2.5 text-[13px] leading-5 text-[#b91c1c]">
      {message}
    </p>
  )
}

export function AuthDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-[13px] text-[#8a8694]">
      <span className="h-px flex-1 bg-[#ebe9f0]" />
      {children}
      <span className="h-px flex-1 bg-[#ebe9f0]" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  )
}

// Some pro Google; em caso de sucesso o navegador já está saindo da página,
// então o botão fica em loading até a troca.
export function GoogleButton({ onBeforeRedirect, onError }: { onBeforeRedirect?: () => void; onError: (message: string) => void }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    onBeforeRedirect?.()
    setLoading(true)
    const response = await signInWithGoogle()
    if (response.error) {
      setLoading(false)
      onError(response.error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-[#e4e2ea] bg-[#fff] text-[15px] font-medium text-[#1f1d24] transition hover:border-[#d6d3de] hover:bg-[#f8f7fa] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? <Loader2 className="size-5 animate-spin text-[#6b6875]" /> : <GoogleIcon />}
      Continuar com Google
    </button>
  )
}
