import { supabase } from '@/lib/supabaseClient'

const BUCKET = 'proposals'
const MAX_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
]

// Observação sobre a coluna `deals.proposal_url`: como o bucket é privado, uma URL
// pública não funciona e uma URL assinada expira — por isso guardamos aqui o CAMINHO
// do arquivo no Storage (não uma URL), e geramos uma signed URL sob demanda em
// getSignedProposalUrl() sempre que o usuário clicar em "Visualizar".

function validateFile(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Formato inválido. Envie um arquivo PDF ou DOCX.')
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Arquivo muito grande. O limite é 10MB.')
  }
}

export async function uploadProposal(dealId: string, file: File): Promise<string> {
  validateFile(file)

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const path = `${userData.user.id}/${dealId}/${file.name}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (uploadError) throw new Error(uploadError.message)

  const { error: updateError } = await supabase.from('deals').update({ proposal_url: path }).eq('id', dealId)
  if (updateError) throw new Error(updateError.message)

  return path
}

export async function getSignedProposalUrl(path: string, expiresInSeconds = 300): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function deleteProposal(dealId: string, proposalPath: string): Promise<void> {
  const { error: removeError } = await supabase.storage.from(BUCKET).remove([proposalPath])
  if (removeError) throw new Error(removeError.message)

  const { error: updateError } = await supabase.from('deals').update({ proposal_url: null }).eq('id', dealId)
  if (updateError) throw new Error(updateError.message)
}
