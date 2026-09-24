import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { getActiveSessions, signOutOtherSessions, updatePassword, type ActiveSession } from '@/services/supabase/userProfile'

function formatUserAgent(userAgent?: string): string {
  if (!userAgent) return 'Dispositivo desconhecido'
  if (/mobile/i.test(userAgent)) return 'Dispositivo móvel'
  if (/chrome/i.test(userAgent)) return 'Chrome'
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/safari/i.test(userAgent)) return 'Safari'
  if (/edg/i.test(userAgent)) return 'Edge'
  return 'Navegador desconhecido'
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
    <section id="segurança" className="scroll-mt-6">
      <Card>
        <span className="label-caps">Sua conta</span>
        <h2 className="mt-1 text-2xl font-medium tracking-tightest text-neutral-900">Segurança</h2>

        <div className="mt-6 border-b border-neutral-100 pb-6">
          <h3 className="text-sm font-medium text-neutral-800">Alterar senha</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Nova senha"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={passwordError ?? undefined}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleChangePassword} loading={changingPassword}>
              Alterar senha
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-neutral-800">Sessões ativas</h3>
          <p className="mt-1 text-xs text-neutral-400">
            {/* TODO: usar a Admin API do Supabase (via Edge Function) para listar todas as sessões. */}
            Por limitação do SDK do Supabase no navegador, exibimos apenas a sessão atual.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {loadingSessions ? (
              <Skeleton className="h-14 w-full" />
            ) : sessions.length === 0 ? (
              <p className="text-sm text-neutral-500">Nenhuma sessão encontrada.</p>
            ) : (
              sessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-neutral-800">{formatUserAgent(session.user_agent)}</p>
                    <p className="text-xs text-neutral-400">
                      Início: {new Date(session.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {session.current && <Badge variant="purple">Sessão atual</Badge>}
                </div>
              ))
            )}
          </div>

          {sessions.length <= 1 ? (
            <p className="mt-3 text-sm text-neutral-400">Nenhuma outra sessão ativa.</p>
          ) : (
            <Button variant="ghost" size="sm" className="mt-3" onClick={() => setSignOutConfirmOpen(true)}>
              Encerrar outras sessões
            </Button>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={signOutConfirmOpen}
        title="Encerrar outras sessões"
        message="Isso desconectará sua conta em todos os outros dispositivos e navegadores. Deseja continuar?"
        confirmLabel="Encerrar sessões"
        loading={signingOut}
        onConfirm={handleSignOutOthers}
        onCancel={() => setSignOutConfirmOpen(false)}
      />
    </section>
  )
}
