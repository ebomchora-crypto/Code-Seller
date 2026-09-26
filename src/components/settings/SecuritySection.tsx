import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Monitor, Shield } from 'lucide-react'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { getActiveSessions, signOutOtherSessions, updatePassword, type ActiveSession } from '@/services/supabase/userProfile'

function formatUserAgent(userAgent?: string): string {
  if (!userAgent) return 'Dispositivo desconhecido'
  const device = /mobile/i.test(userAgent) ? 'celular' : 'computador'
  // A ordem importa: o Edge também diz "Chrome" e o Chrome também diz "Safari".
  const browser = /edg/i.test(userAgent)
    ? 'Edge'
    : /chrome|crios/i.test(userAgent)
      ? 'Chrome'
      : /firefox|fxios/i.test(userAgent)
        ? 'Firefox'
        : /safari/i.test(userAgent)
          ? 'Safari'
          : 'Navegador'
  return `${browser} no ${device}`
}

export function SecuritySection() {
  const [sessions, setSessions] = useState<ActiveSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    getActiveSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false))
  }, [])

  async function handleChangePassword() {
    setPasswordError(null)
    if (newPassword.length < 8) {
      setPasswordError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }

    setChangingPassword(true)
    try {
      await updatePassword(newPassword)
      toast.success('Senha alterada com sucesso.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível alterar a senha.')
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleSignOutOthers() {
    setSigningOut(true)
    try {
      await signOutOtherSessions()
      toast.success('Outras sessões encerradas.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível encerrar as outras sessões.')
    } finally {
      setSigningOut(false)
      setSignOutConfirmOpen(false)
    }
  }

  return (
    <>
      <SettingsSection id="segurança" icon={Shield} title="Segurança" description="Senha e dispositivos conectados à sua conta.">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Alterar senha</h3>
        <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
          Se você entra com o Google, pode criar uma senha aqui para também entrar com e-mail.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={passwordError ?? undefined}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleChangePassword} loading={changingPassword} className="h-10 rounded-full px-5">
            Salvar nova senha
          </Button>
        </div>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Sessões ativas</h3>
          <p className="mt-0.5 text-[12.5px] text-[var(--text-muted)]">
            {/* TODO: usar a Admin API do Supabase (via Edge Function) para listar todas as sessões. */}
            Por enquanto mostramos só o dispositivo que você está usando agora.
          </p>

          <div className="mt-4 flex flex-col gap-2">
            {loadingSessions ? (
              <Skeleton className="h-16 w-full rounded-2xl" />
            ) : sessions.length === 0 ? (
              <p className="text-[13.5px] text-[var(--text-muted)]">Nenhuma sessão encontrada.</p>
            ) : (
              sessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-default)] p-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--text-secondary)]">
                      <Monitor className="size-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{formatUserAgent(session.user_agent)}</p>
                      <p className="text-[12px] text-[var(--text-muted)]">
                        Desde {new Date(session.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                  {session.current && <Badge variant="purple" size="sm">Este dispositivo</Badge>}
                </div>
              ))
            )}
          </div>

          <div className="mt-4">
            <Button variant="secondary" size="sm" className="h-9 rounded-full px-4" onClick={() => setSignOutConfirmOpen(true)}>
              Sair de todos os outros dispositivos
            </Button>
          </div>
        </div>
      </SettingsSection>

      <ConfirmDialog
        open={signOutConfirmOpen}
        title="Encerrar outras sessões"
        message="Isso desconectará sua conta em todos os outros dispositivos e navegadores. Deseja continuar?"
        confirmLabel="Encerrar sessões"
        loading={signingOut}
        onConfirm={handleSignOutOthers}
        onCancel={() => setSignOutConfirmOpen(false)}
      />
    </>
  )
}
