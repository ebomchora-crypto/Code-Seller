import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
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

  const initials = (profile?.full_name ?? userEmail).slice(0, 2).toUpperCase()

  return (
    <section id="perfil" className="scroll-mt-6">
      <Card>
        <span className="label-caps">Sua conta</span>
        <h2 className="mt-1 text-2xl font-medium tracking-tightest text-neutral-900">Perfil</h2>

        <div className="mt-6 border-b border-neutral-100 pb-6">
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
            <label className="text-sm font-medium text-neutral-700">E-mail</label>
            <div className="flex items-center gap-2">
              <Input value={userEmail} readOnly className="bg-neutral-50 text-neutral-500" />
              <Button variant="ghost" size="md" onClick={() => setEmailModalOpen(true)}>
                Alterar
              </Button>
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

        <div className="mt-6 border-t border-neutral-100 pt-6">
          <p className="mb-3 text-sm font-medium text-neutral-700">Logo da empresa</p>
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

        <div className="mt-6 border-t border-neutral-100 pt-6">
          <Textarea
            label="Bio"
            value={bio}
            onChange={(event) => event.target.value.length <= MAX_BIO_LENGTH && setBio(event.target.value)}
            helperText={`${bio.length}/${MAX_BIO_LENGTH} caracteres`}
          />
        </div>

        <div className="mt-6 flex justify-end border-t border-neutral-100 pt-6">
          <Button onClick={handleSave} loading={saving}>
            Salvar alterações
          </Button>
        </div>
      </Card>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="Alterar e-mail" size="sm">
        <div className="flex flex-col gap-4">
          <Input
            label="Novo e-mail"
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
          />
          <p className="text-xs text-neutral-500">Um e-mail de confirmação será enviado para o novo endereço.</p>
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
    </section>
  )
}
