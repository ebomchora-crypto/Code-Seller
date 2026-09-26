import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AvatarUpload } from '@/components/settings/AvatarUpload'
import { toast } from 'sonner'
import { updateEmail } from '@/services/supabase/userProfile'
import type { UserProfile } from '@/types'

interface ProfileSectionProps {
  profile: UserProfile | null
  userEmail: string
  onSave: (data: Partial<UserProfile>) => Promise<boolean>
  onUploadAvatar: (file: File) => Promise<void>
  onDeleteAvatar: () => Promise<void>
  onUploadLogo: (file: File) => Promise<void>
  onDeleteLogo: () => Promise<void>
  saving: boolean
}

const MAX_BIO_LENGTH = 300

export function ProfileSection({
  profile,
  userEmail,
  onSave,
  onUploadAvatar,
  onDeleteAvatar,
  onUploadLogo,
  onDeleteLogo,
  saving,
}: ProfileSectionProps) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [website, setWebsite] = useState(profile?.website ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
    setCompanyName(profile?.company_name ?? '')
    setWebsite(profile?.website ?? '')
    setBio(profile?.bio ?? '')
  }, [profile])

  async function handleSave() {
    await onSave({
      full_name: fullName.trim() || null,
      phone: phone.trim() || null,
      company_name: companyName.trim() || null,
      website: website.trim() || null,
      bio: bio.trim() || null,
    })
  }

  async function handleChangeEmail() {
    if (!newEmail.trim()) return
    setChangingEmail(true)
    try {
      await updateEmail(newEmail.trim())
      toast.success('E-mail de confirmação enviado para o novo endereço.')
      setEmailModalOpen(false)
      setNewEmail('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível alterar o e-mail.')
    } finally {
      setChangingEmail(false)
    }
  }

  const nameWords = (profile?.full_name ?? '').trim().split(/\s+/).filter(Boolean)
  const initials = (
    nameWords.length > 1 ? `${nameWords[0][0]}${nameWords[nameWords.length - 1][0]}` : (profile?.full_name || userEmail).slice(0, 2)
  ).toUpperCase()

  return (
    <>
      <SettingsSection id="perfil" icon={User} title="Perfil" description="Seus dados e os da sua empresa.">
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-black/[0.015] p-4 dark:bg-white/[0.02]">
          <AvatarUpload
            imageUrl={profile?.avatar_url ?? null}
            fallbackText={initials}
            onUpload={onUploadAvatar}
            onDelete={onDeleteAvatar}
            uploading={saving}
            label="foto"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nome completo" value={fullName} onChange={(event) => setFullName(event.target.value)} />

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">E-mail</span>
            <div className="flex h-11 items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-black/[0.02] pl-4 pr-1.5 dark:bg-white/[0.03]">
              <span className="truncate text-sm text-[var(--text-secondary)]">{userEmail}</span>
              <button
                type="button"
                onClick={() => setEmailModalOpen(true)}
                className="h-8 shrink-0 rounded-lg px-3 text-[12.5px] font-medium text-[var(--accent-text)] transition hover:bg-[var(--accent-tint)]"
              >
                Alterar
              </button>
            </div>
          </div>

          <Input label="Telefone/WhatsApp" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Input label="Nome da empresa" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
          <Input
            label="Site"
            placeholder="https://suaempresa.com"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          <p className="mb-3 text-[13px] font-medium text-[var(--text-secondary)]">Logo da empresa</p>
          <AvatarUpload
            imageUrl={profile?.company_logo_url ?? null}
            fallbackText={(companyName || 'CS').slice(0, 2).toUpperCase()}
            onUpload={onUploadLogo}
            onDelete={onDeleteLogo}
            uploading={saving}
            shape="square"
            label="logo"
          />
        </div>

        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          <Textarea
            label="Bio"
            placeholder="Conte em poucas linhas o que você faz."
            value={bio}
            onChange={(event) => event.target.value.length <= MAX_BIO_LENGTH && setBio(event.target.value)}
            helperText={`${bio.length}/${MAX_BIO_LENGTH} caracteres`}
          />
        </div>

        <div className="mt-6 flex justify-end border-t border-[var(--border-subtle)] pt-6">
          <Button onClick={handleSave} loading={saving} className="h-11 rounded-full px-5">
            Salvar alterações
          </Button>
        </div>
      </SettingsSection>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Alterar e-mail" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Novo e-mail"
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <p className="text-xs text-[var(--text-muted)]">Um e-mail de confirmação será enviado para o novo endereço.</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setEmailModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangeEmail} loading={changingEmail}>
              Enviar confirmação
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
