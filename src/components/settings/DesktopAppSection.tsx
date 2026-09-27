import { useEffect, useState, type ReactNode } from 'react'
import { BellRing, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { desktopNotificationsEnabled, setDesktopNotificationsEnabled } from '@/utils/desktopPrefs'

function Row({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <span className="block text-[14px] font-medium text-[var(--text-primary)]">{title}</span>
        <span className="block max-w-md text-[12.5px] text-[var(--text-muted)]">{description}</span>
      </div>
      {children}
    </div>
  )
}

// Só aparece dentro do app de Windows. Tudo aqui vale para este computador.
export function DesktopAppSection() {
  const desktop = window.codeSellersDesktop
  const supportsStartup = Boolean(desktop?.getOpenAtLogin && desktop.setOpenAtLogin)
  const supportsNotify = Boolean(desktop?.notify)

  const [openAtLogin, setOpenAtLogin] = useState<boolean | null>(null)
  const [savingStartup, setSavingStartup] = useState(false)
  const [notify, setNotify] = useState(desktopNotificationsEnabled)

  useEffect(() => {
    if (!desktop?.getOpenAtLogin) return
    desktop
      .getOpenAtLogin()
      .then(setOpenAtLogin)
      .catch(() => setOpenAtLogin(false))
  }, [desktop])

  async function handleStartup(enabled: boolean) {
    if (!desktop?.setOpenAtLogin) return
    setSavingStartup(true)
    try {
      const saved = await desktop.setOpenAtLogin(enabled)
      setOpenAtLogin(saved)
      if (saved !== enabled) toast.error('O Windows não deixou mudar essa opção agora. Tente de novo.')
    } catch {
      toast.error('Não foi possível mudar essa opção.')
    } finally {
      setSavingStartup(false)
    }
  }

  function handleNotify(enabled: boolean) {
    setNotify(enabled)
    setDesktopNotificationsEnabled(enabled)
  }

  function handleTest() {
    desktop?.notify?.({
      title: 'Tudo certo com os avisos',
      body: 'É assim que o Code Sellers vai te avisar das tarefas.',
      path: '/tasks',
    })
    toast.success('Aviso de teste enviado. Deve aparecer no canto da tela.')
  }

  return (
    <SettingsSection
      id="app-windows"
      icon={Monitor}
      title="App de Windows"
      description="Como o Code Sellers funciona neste computador."
    >
      {!supportsStartup && (
        <SettingsNote>
          Estas opções chegam na próxima atualização do app, que é instalada sozinha quando você fechar o Code Sellers.
        </SettingsNote>
      )}

      <div className="divide-y divide-[var(--border-subtle)]">
        <Row
          title="Abrir quando o Windows iniciar"
          description="Ao ligar o computador, o app já abre minimizado na barra de tarefas — pronto para te avisar."
        >
          <Switch
            checked={Boolean(openAtLogin)}
            onChange={(checked) => void handleStartup(checked)}
            disabled={!supportsStartup || openAtLogin === null || savingStartup}
            ariaLabel="Abrir quando o Windows iniciar"
          />
        </Row>

        <Row
          title="Avisos de tarefas"
          description="Aviso do Windows quando uma tarefa vence ou chega a hora do lembrete. O ícone na barra de tarefas mostra quantas estão atrasadas."
        >
          <Switch checked={notify} onChange={handleNotify} disabled={!supportsNotify} ariaLabel="Avisos de tarefas" />
        </Row>
      </div>

      {supportsNotify && notify && (
        <div className="mt-2">
          <Button variant="secondary" size="sm" className="rounded-full" onClick={handleTest}>
            <BellRing className="size-3.5" />
            Testar aviso
          </Button>
        </div>
      )}
    </SettingsSection>
  )
}
