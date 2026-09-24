import { supabase } from '@/lib/supabaseClient'
import type { Contact, ContactFilters, ContactStatus, Tag } from '@/types'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

interface RawContactTag {
  tag: Tag | null
}

interface RawContactRow {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  niche: string | null
  city: string | null
  state: string | null
  status: ContactStatus
  origin: string | null
  notes: string | null
  current_site: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  contact_tags?: RawContactTag[] | null
  deals?: Contact['deals']
  interactions?: Contact['interactions']
}

function mapContact(row: RawContactRow): Contact {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    niche: row.niche,
    city: row.city,
    state: row.state,
    status: row.status,
    origin: row.origin,
    notes: row.notes,
    current_site: row.current_site,
    assigned_to: row.assigned_to,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: row.contact_tags?.map((entry) => entry.tag).filter((tag): tag is Tag => tag !== null),
    deals: row.deals,
    interactions: row.interactions,
  }
}

const CONTACT_LIST_SELECT = '*, contact_tags(tag:tags(*)), deals(*)'
const CONTACT_DETAIL_SELECT = '*, contact_tags(tag:tags(*)), deals(*), interactions(*)'

export type ContactSortColumn = 'name' | 'status' | 'created_at'
export type SortDirection = 'asc' | 'desc'

export interface GetContactsOptions {
  filters?: Partial<ContactFilters>
  sortColumn?: ContactSortColumn
  sortDirection?: SortDirection
  page?: number
  pageSize?: number
}

export interface GetContactsResult {
  data: Contact[]
  count: number
}

export async function getContacts(options: GetContactsOptions = {}): Promise<GetContactsResult> {
  const { filters, sortColumn = 'created_at', sortDirection = 'desc', page = 1, pageSize = 20 } = options

  // Quando filtramos por tag, o join com contact_tags precisa ser "!inner" para que
  // o filtro (e a contagem/paginação) considerem apenas contatos que têm aquela tag —
  // um join comum retornaria todos os contatos e só filtraria as tags aninhadas.
  const selectClause = filters?.tag_id
    ? '*, contact_tags!inner(tag:tags(*)), deals(*)'
    : CONTACT_LIST_SELECT

  let query = supabase.from('contacts').select(selectClause, { count: 'exact' })

  if (filters?.tag_id) {
    query = query.eq('contact_tags.tag_id', filters.tag_id)
  }
  if (filters?.search) {
    const term = filters.search.trim()
    if (term) {
      query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
    }
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.niche) {
    query = query.eq('niche', filters.niche)
  }
  if (filters?.origin) {
    query = query.eq('origin', filters.origin)
  }

  query = query.order(sortColumn, { ascending: sortDirection === 'asc' })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  const contacts = ((data ?? []) as unknown as RawContactRow[]).map(mapContact)

  return { data: contacts, count: count ?? contacts.length }
}

export async function getContactById(id: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select(CONTACT_DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  const contact = mapContact(data as unknown as RawContactRow)
  contact.interactions = [...(contact.interactions ?? [])].sort(
    (a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  )
  return contact
}

export async function createContact(
  input: Omit<Contact, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'tags' | 'interactions' | 'deals'>,
): Promise<Contact> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...input, user_id: userData.user.id })
    .select(CONTACT_LIST_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return mapContact(data as unknown as RawContactRow)
}

export async function updateContact(id: string, input: Partial<Contact>): Promise<Contact> {
  const { tags: _tags, interactions: _interactions, deals: _deals, ...updatable } = input

  const { data, error } = await supabase
    .from('contacts')
    .update(updatable)
    .eq('id', id)
    .select(CONTACT_LIST_SELECT)
    .single()

  if (error) throw new Error(error.message)
  return mapContact(data as unknown as RawContactRow)
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function updateContactStatus(id: string, status: ContactStatus): Promise<void> {
  const { error } = await supabase.from('contacts').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
}

export interface ImportContactsResult {
  success: number
  errors: number
  errorDetails: { row: number; message: string }[]
}

export async function importContacts(contacts: Partial<Contact>[]): Promise<ImportContactsResult> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error('Usuário não autenticado.')

  let success = 0
  const errorDetails: { row: number; message: string }[] = []

  for (let i = 0; i < contacts.length; i++) {
    const row = contacts[i]
    if (!row.name) {
      errorDetails.push({ row: i + 1, message: 'Nome é obrigatório.' })
      continue
    }

    const { error } = await supabase.from('contacts').insert({
      user_id: userData.user.id,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      niche: row.niche ?? null,
      city: row.city ?? null,
      state: row.state ?? null,
      status: row.status ?? 'lead',
      origin: row.origin ?? null,
      notes: row.notes ?? null,
      current_site: row.current_site ?? null,
    })

    if (error) {
      errorDetails.push({ row: i + 1, message: getErrorMessage(error) })
    } else {
      success += 1
    }
  }

  return { success, errors: errorDetails.length, errorDetails }
}
