import { useEffect, useState } from 'react'
import { Briefcase, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { SettingsNote, SettingsSection } from '@/components/settings/SettingsSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { getCommercialProfile, saveCommercialProfile } from '@/services/supabase/commercialProfile'
import type { CommercialPackage, CommercialProfile } from '@/types/commercialProfile'
import { COMMERCIAL_LIMITS, EMPTY_COMMERCIAL_PROFILE, commercialProfileProgress } from '@/utils/commercialProfile'

const EMPTY_PACKAGE: CommercialPackage = { name: '', price: '', includes: '', deadline: '' }

type TextField = Exclude<keyof CommercialProfile, 'packages' | 'updated_at'>

function Counter({ value, max }: { value: string; max: number }) {
  if (value.length < max * 0.8) return null
  return <span className="text-[11px] text-[var(--text-muted)]">{value.length}/{max}</span>
}

// O que o usuário vende e como ele escreve. O CS Copilot usa tudo isso para
// sugerir mensagens com a oferta, os preços e o jeito do próprio usuário.
export function CommercialProfileSection() {
  const [profile, setProfile] = useState<CommercialProfile>(EMPTY_COMMERCIAL_PROFILE)
  const [saved, setSaved] = useState<string>(JSON.stringify(EMPTY_COMMERCIAL_PROFILE))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let alive = true
    getCommercialProfile()
      .then((data) => {
        if (!alive) return
        setProfile(data)
        setSaved(JSON.stringify(data))
      })
      .catch(() => toast.error('Não foi possível carregar o perfil comercial.'))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const dirty = JSON.stringify(profile) !== saved
  const progress = commercialProfileProgress(profile)

  function setField(field: TextField, value: string) {
    setProfile((current) => ({ ...current, [field]: value.slice(0, COMMERCIAL_LIMITS[field]) }))
  }

  function setPackage(index: number, field: keyof CommercialPackage, value: string) {
    const max = {
      name: COMMERCIAL_LIMITS.packageName,
      price: COMMERCIAL_LIMITS.packagePrice,
      includes: COMMERCIAL_LIMITS.packageIncludes,
      deadline: COMMERCIAL_LIMITS.packageDeadline,
    }[field]
    setProfile((current) => ({
      ...current,
      packages: current.packages.map((pkg, i) => (i === index ? { ...pkg, [field]: value.slice(0, max) } : pkg)),
    }))
  }

  function addPackage() {
    setProfile((current) =>
      current.packages.length >= COMMERCIAL_LIMITS.packages ? current : { ...current, packages: [...current.packages, { ...EMPTY_PACKAGE }] },
    )
  }

  function removePackage(index: number) {
    setProfile((current) => ({ ...current, packages: current.packages.filter((_, i) => i !== index) }))
  }

  async function save() {
    setSaving(true)
    try {
      const next = await saveCommercialProfile(profile)
      setProfile(next)
      setSaved(JSON.stringify(next))
      toast.success('Perfil comercial salvo. O CS Copilot já usa nas próximas respostas.')
    } catch {
      toast.error('Não foi possível salvar o perfil comercial.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      id="perfil-comercial"
      icon={Briefcase}
      title="Perfil comercial"
      description="Sua oferta, seus preços e seu jeito de escrever. O CS Copilot responde a partir daqui."
      action={
        !loading && (
          <span className="shrink-0 rounded-full border border-[var(--border-default)] px-2.5 py-1 text-[12px] text-[var(--text-muted)]">
            {progress.done}/{progress.total}
          </span>
        )
      }
    >
      <SettingsNote>
        Quanto mais completo, menos genéricas ficam as respostas. O CS Copilot só cita preços que estiverem aqui ou no
        negócio, e imita as mensagens que já funcionaram para você.
      </SettingsNote>

      <div className={`mt-6 flex flex-col gap-5 ${loading ? 'pointer-events-none opacity-60' : ''}`}>
        <Textarea
          label="O que você vende"
          rows={3}
          value={profile.services}
          onChange={(event) => setField('services', event.target.value)}
          placeholder="Ex: sites para clínicas e restaurantes, com agendamento online e botão de WhatsApp. Também faço landing pages para campanhas."
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Pacotes e preços</p>
            <span className="text-[11.5px] text-[var(--text-muted)]">Até {COMMERCIAL_LIMITS.packages}</span>
          </div>

          {profile.packages.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--border-default)] px-4 py-3 text-[13px] text-[var(--text-muted)]">
              Nenhum pacote ainda. Sem preços aqui, o CS Copilot não sugere valores.
            </p>
          )}

          {profile.packages.map((pkg, index) => (
            <div key={index} className="rounded-2xl border border-[var(--border-default)] p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_160px_160px]">
                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label="Nome"
                    value={pkg.name}
                    onChange={(event) => setPackage(index, 'name', event.target.value)}
                    placeholder="Ex: Essencial"
                  />
                </div>
                <Input
                  label="Preço"
                  value={pkg.price}
                  onChange={(event) => setPackage(index, 'price', event.target.value)}
                  placeholder="Ex: R$ 1.500"
                />
                <Input
                  label="Prazo"
                  value={pkg.deadline}
                  onChange={(event) => setPackage(index, 'deadline', event.target.value)}
                  placeholder="Ex: 10 dias"
                />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    label="O que inclui"
                    value={pkg.includes}
                    onChange={(event) => setPackage(index, 'includes', event.target.value)}
                    placeholder="Ex: 1 página, WhatsApp, Google Maps, 2 rodadas de ajustes"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePackage(index)}
                  aria-label="Remover pacote"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-default)] text-[var(--text-muted)] transition-colors hover:border-red-500/40 hover:text-red-500"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          {profile.packages.length < COMMERCIAL_LIMITS.packages && (
            <Button type="button" variant="secondary" size="sm" onClick={addPackage} className="self-start">
              <Plus className="size-4" /> Adicionar pacote
            </Button>
          )}
        </div>

        <Textarea
          label="Diferenciais e garantias"
          rows={3}
          value={profile.differentials}
          onChange={(event) => setField('differentials', event.target.value)}
          placeholder="Ex: entrego em 7 dias, ajustes ilimitados no primeiro mês, atendo por WhatsApp no mesmo dia."
        />

        <Textarea
          label="Nichos e regiões que atende"
          rows={2}
          value={profile.niches}
          onChange={(event) => setField('niches', event.target.value)}
          placeholder="Ex: clínicas de estética, dentistas e restaurantes em Campinas e região."
        />

        <Textarea
          label="Resultados reais de clientes"
          rows={3}
          value={profile.results}
          onChange={(event) => setField('results', event.target.value)}
          placeholder="Ex: Clínica Bela Pele passou a receber 20 agendamentos por mês pelo site. Pizzaria do Zé: pedidos pelo WhatsApp dobraram."
          helperText="Só o que aconteceu de verdade. Vira prova nas mensagens."
        />

        <div className="flex flex-col gap-1">
          <Textarea
            label="Mensagens que já funcionaram"
            rows={6}
            value={profile.winning_messages}
            onChange={(event) => setField('winning_messages', event.target.value)}
            placeholder={'Cole de 5 a 10 mensagens que tiveram resposta ou fecharam venda. Separe cada uma com uma linha em branco.\n\nEx: Oi, tudo bem? Vi que a clínica tem ótimas avaliações, mas quem procura no Google não acha um site. Montei uma prévia rápida, posso te mandar?'}
            helperText="O CS Copilot imita o tom, o tamanho e o jeito dessas mensagens."
          />
          <div className="flex justify-end">
            <Counter value={profile.winning_messages} max={COMMERCIAL_LIMITS.winning_messages} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_220px]">
          <Textarea
            label="Seu jeito de escrever"
            rows={2}
            value={profile.writing_style}
            onChange={(event) => setField('writing_style', event.target.value)}
            placeholder="Ex: informal, trato por você, frases curtas, sem emoji, nunca uso 'prezado'."
          />
          <Input
            label="Como assina"
            value={profile.signature}
            onChange={(event) => setField('signature', event.target.value)}
            placeholder="Ex: Arthur"
            helperText="Deixe vazio para não assinar."
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] pt-5">
          {dirty && <span className="text-[12.5px] text-[var(--text-muted)]">Alterações não salvas</span>}
          <Button type="button" onClick={() => void save()} loading={saving} disabled={!dirty || saving}>
            Salvar perfil
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}
