import { useEffect, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ReceiptSection } from '@/components/financial/ReceiptSection'
import { getContacts } from '@/services/supabase/contacts'
import { getDeals } from '@/services/supabase/deals'
import {
  createCategory as createCategoryService,
  getCategories,
} from '@/services/supabase/financialCategories'
import {
  createTransaction,
  deleteReceipt,
  updateTransaction,
  uploadReceipt,
} from '@/services/supabase/transactions'
import { PAYMENT_METHOD_LABELS, RECURRENCE_LABELS, TRANSACTION_STATUS_LABELS } from '@/utils/financial'
import { CATEGORY_COLOR_SWATCHES } from '@/types'
import type {
  Contact,
  Deal,
  FinancialCategory,
  PaymentMethod,
  Recurrence,
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/types'

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess: (transaction: Transaction) => void
  onCancel: () => void
}

interface FormState {
  type: TransactionType
  description: string
  amountCents: string
  date: string
  dueDate: string
  categoryId: string
  status: TransactionStatus
  paidAt: string
  paymentMethod: PaymentMethod | ''
  contactId: string | null
  contactName: string
  dealId: string | null
  dealTitle: string
  recurrence: Recurrence
  recurrenceEndDate: string
  notes: string
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

function nowLocalInputValue(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16)
}

function centsFromAmount(amount?: number | null): string {
  if (!amount) return ''
  return Math.round(amount * 100).toString()
}

function formatCentsAsBRL(cents: string): string {
  if (!cents) return ''
  const value = Number(cents) / 100
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function buildInitialState(transaction?: Transaction): FormState {
  return {
    type: transaction?.type ?? 'income',
    description: transaction?.description ?? '',
    amountCents: centsFromAmount(transaction?.amount),
    date: transaction?.date ?? todayInputValue(),
    dueDate: transaction?.due_date ?? '',
    categoryId: transaction?.category_id ?? '',
    status: transaction?.status ?? 'pending',
    paidAt: transaction?.paid_at ? transaction.paid_at.slice(0, 16) : nowLocalInputValue(),
    paymentMethod: transaction?.payment_method ?? '',
    contactId: transaction?.contact_id ?? null,
    contactName: transaction?.contact?.name ?? '',
    dealId: transaction?.deal_id ?? null,
    dealTitle: transaction?.deal?.title ?? '',
    recurrence: transaction?.recurrence ?? 'none',
    recurrenceEndDate: transaction?.recurrence_end_date ?? '',
    notes: transaction?.notes ?? '',
  }
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(transaction))
  const [errors, setErrors] = useState<Partial<Record<'description' | 'amountCents' | 'recurrenceEndDate', string>>>(
    {},
  )
  const [submitting, setSubmitting] = useState(false)

  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLOR_SWATCHES[0])

  const [contactOptions, setContactOptions] = useState<Contact[]>([])
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false)
  const contactBoxRef = useRef<HTMLDivElement>(null)

  const [dealOptions, setDealOptions] = useState<Deal[]>([])
  const [dealDropdownOpen, setDealDropdownOpen] = useState(false)
  const dealBoxRef = useRef<HTMLDivElement>(null)

  const [receiptUrl, setReceiptUrl] = useState(transaction?.receipt_url ?? null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
    getContacts({ pageSize: 100 })
      .then((result) => setContactOptions(result.data))
      .catch(() => setContactOptions([]))
    getDeals({})
      .then((result) => setDealOptions(result.data))
      .catch(() => setDealOptions([]))
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactBoxRef.current && !contactBoxRef.current.contains(event.target as Node)) {
        setContactDropdownOpen(false)
      }
      if (dealBoxRef.current && !dealBoxRef.current.contains(event.target as Node)) {
        setDealDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleAmountChange(rawValue: string) {
    const digitsOnly = rawValue.replace(/\D/g, '')
    updateField('amountCents', digitsOnly)
  }

  function selectContact(contact: Contact | null) {
    setForm((current) => ({
      ...current,
      contactId: contact?.id ?? null,
      contactName: contact?.name ?? '',
      // Trocar de contato invalida a seleção de deal anterior, já que a lista é filtrada por contato
      dealId: contact ? current.dealId : null,
      dealTitle: contact ? current.dealTitle : '',
    }))
    setContactDropdownOpen(false)
  }

  function selectDeal(deal: Deal | null) {
    setForm((current) => ({ ...current, dealId: deal?.id ?? null, dealTitle: deal?.title ?? '' }))
    setDealDropdownOpen(false)
  }

  const categoriesForType = categories.filter((category) => category.type === form.type)
  const filteredContacts = contactOptions.filter((contact) =>
    contact.name.toLowerCase().includes(form.contactName.toLowerCase()),
  )
  const dealsForContact = form.contactId
    ? dealOptions.filter((deal) => deal.contact_id === form.contactId)
    : dealOptions
  const filteredDeals = dealsForContact.filter((deal) =>
    deal.title.toLowerCase().includes(form.dealTitle.toLowerCase()),
  )

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    try {
      const category = await createCategoryService({
        name: newCategoryName.trim(),
        type: form.type,
        color: newCategoryColor,
        icon: null,
      })
      setCategories((current) => [...current, category])
      updateField('categoryId', category.id)
      setNewCategoryName('')
      setCreatingCategory(false)
      toast.success('Categoria criada com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar a categoria.')
    }
  }

  async function handleUploadReceipt(file: File) {
    if (!transaction) return
    setUploadingReceipt(true)
    try {
      const path = await uploadReceipt(transaction.id, file)
      setReceiptUrl(path)
      toast.success('Comprovante anexado com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível anexar o comprovante.')
    } finally {
      setUploadingReceipt(false)
    }
  }

  async function handleDeleteReceipt() {
    if (!transaction || !receiptUrl) return
    try {
      await deleteReceipt(transaction.id, receiptUrl)
      setReceiptUrl(null)
      toast.success('Comprovante removido.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover o comprovante.')
    }
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {}

    if (!form.description.trim()) {
      nextErrors.description = 'Informe uma descrição.'
    }
    if (!form.amountCents || Number(form.amountCents) <= 0) {
      nextErrors.amountCents = 'Informe um valor maior que zero.'
    }
    if (form.recurrence !== 'none' && !form.recurrenceEndDate) {
      nextErrors.recurrenceEndDate = 'Informe até quando a recorrência deve se repetir.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function countFutureInstances(): number {
    if (form.recurrence === 'none' || !form.recurrenceEndDate) return 0
    const step = form.recurrence === 'monthly' ? 1 : form.recurrence === 'quarterly' ? 3 : 12
    let cursor = new Date(`${form.date}T00:00:00`)
    const end = new Date(`${form.recurrenceEndDate}T00:00:00`)
    let count = 0
    cursor.setMonth(cursor.getMonth() + step)
    while (cursor.getTime() <= end.getTime()) {
      count += 1
      cursor = new Date(cursor)
      cursor.setMonth(cursor.getMonth() + step)
    }
    return count
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        type: form.type,
        status: form.status,
        description: form.description.trim(),
        amount: Number(form.amountCents) / 100,
        date: form.date,
        due_date: form.dueDate || null,
        paid_at: form.status === 'paid' ? new Date(form.paidAt).toISOString() : null,
        category_id: form.categoryId || null,
        contact_id: form.contactId,
        deal_id: form.dealId,
        payment_method: form.paymentMethod || null,
        recurrence: form.recurrence,
        recurrence_end_date: form.recurrence !== 'none' ? form.recurrenceEndDate || null : null,
        receipt_url: receiptUrl,
        notes: form.notes.trim() || null,
      }

      const result = transaction
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload)

      toast.success(transaction ? 'Transação atualizada com sucesso.' : 'Transação criada com sucesso.')
      onSuccess(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível salvar a transação.')
    } finally {
      setSubmitting(false)
    }
  }

  const futureInstances = countFutureInstances()

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-[13px] font-medium text-[var(--text-secondary)]">Tipo</label>
        <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--field-bg)] p-1">
          <button
            type="button"
            onClick={() => {
              updateField('type', 'income')
              updateField('categoryId', '')
            }}
            className={`rounded-lg py-2 text-sm font-medium transition-colors duration-150 ${
              form.type === 'income' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Receita
          </button>
          <button
            type="button"
            onClick={() => {
              updateField('type', 'expense')
              updateField('categoryId', '')
            }}
            className={`rounded-lg py-2 text-sm font-medium transition-colors duration-150 ${
              form.type === 'expense' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Despesa
          </button>
        </div>
      </div>

      <Input
        label="Descrição"
        required
        value={form.description}
        onChange={(event) => updateField('description', event.target.value)}
        error={errors.description}
      />

      <Input
        label="Valor"
        required
        placeholder="R$ 0,00"
        value={formatCentsAsBRL(form.amountCents)}
        onChange={(event) => handleAmountChange(event.target.value)}
        error={errors.amountCents}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Data"
          type="date"
          required
          value={form.date}
          onChange={(event) => updateField('date', event.target.value)}
        />
        <Input
          label="Data de vencimento"
          type="date"
          value={form.dueDate}
          onChange={(event) => updateField('dueDate', event.target.value)}
        />
      </div>

      <div>
        <Select
          label="Categoria"
          value={form.categoryId}
          onChange={(event) => updateField('categoryId', event.target.value)}
        >
          <option value="">Sem categoria</option>
          {categoriesForType.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        {!creatingCategory ? (
          <button
            type="button"
            onClick={() => setCreatingCategory(true)}
            className="mt-1.5 text-xs font-medium text-[var(--accent-text)] hover:underline"
          >
            + Criar categoria
          </button>
        ) : (
          <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[var(--border-default)] p-3">
            <Input
              placeholder="Nome da categoria"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
            />
            <div className="flex gap-1.5">
              {CATEGORY_COLOR_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Cor ${color}`}
                  onClick={() => setNewCategoryColor(color)}
                  className={`h-5 w-5 rounded-full ${newCategoryColor === color ? 'ring-2 ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setCreatingCategory(false)}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={handleCreateCategory}>
                Criar
              </Button>
            </div>
          </div>
        )}
      </div>

      <Select
        label="Status"
        required
        value={form.status}
        onChange={(event) => updateField('status', event.target.value as TransactionStatus)}
      >
        {(['pending', 'paid', 'cancelled'] as TransactionStatus[]).map((status) => (
          <option key={status} value={status}>
            {TRANSACTION_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>

      {form.status === 'paid' && (
        <Input
          label="Pago em"
          type="datetime-local"
          value={form.paidAt}
          onChange={(event) => updateField('paidAt', event.target.value)}
        />
      )}

      <Select
        label="Método de pagamento"
        value={form.paymentMethod}
        onChange={(event) => updateField('paymentMethod', event.target.value as PaymentMethod | '')}
      >
        <option value="">Não informado</option>
        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <div ref={contactBoxRef} className="relative flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-[var(--text-secondary)]">Contato vinculado</label>
        <Input
          placeholder="Buscar contato do CRM"
          value={form.contactName}
          onChange={(event) => {
            updateField('contactName', event.target.value)
            updateField('contactId', null)
            setContactDropdownOpen(true)
          }}
          onFocus={() => setContactDropdownOpen(true)}
        />
        {contactDropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1 shadow-[var(--shadow-modal)]">
            <button
              type="button"
              onClick={() => selectContact(null)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
            >
              Nenhum contato
            </button>
            {filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => selectContact(contact)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              >
                {contact.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={dealBoxRef} className="relative flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-[var(--text-secondary)]">Negócio vinculado</label>
        <Input
          placeholder="Buscar negócio"
          value={form.dealTitle}
          onChange={(event) => {
            updateField('dealTitle', event.target.value)
            updateField('dealId', null)
            setDealDropdownOpen(true)
          }}
          onFocus={() => setDealDropdownOpen(true)}
        />
        {dealDropdownOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--panel-bg)] p-1 shadow-[var(--shadow-modal)]">
            <button
              type="button"
              onClick={() => selectDeal(null)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-muted)] hover:bg-[var(--bg-muted)]"
            >
              Nenhum negócio
            </button>
            {filteredDeals.map((deal) => (
              <button
                key={deal.id}
                type="button"
                onClick={() => selectDeal(deal)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              >
                {deal.title}
              </button>
            ))}
            {filteredDeals.length === 0 && (
              <p className="px-3 py-2 text-sm text-[var(--text-muted)]">Nenhum negócio encontrado.</p>
            )}
          </div>
        )}
      </div>

      <Select
        label="Recorrência"
        value={form.recurrence}
        onChange={(event) => updateField('recurrence', event.target.value as Recurrence)}
      >
        {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      {form.recurrence !== 'none' && (
        <>
          <Input
            label="Data de fim da recorrência"
            type="date"
            required
            value={form.recurrenceEndDate}
            onChange={(event) => updateField('recurrenceEndDate', event.target.value)}
            error={errors.recurrenceEndDate}
          />
          {futureInstances > 0 && (
            <p className="rounded-xl border border-[var(--accent-ring)] bg-[var(--accent-tint)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              Serão criadas {futureInstances} transações futuras até {new Date(`${form.recurrenceEndDate}T00:00:00`).toLocaleDateString('pt-BR')}.
            </p>
          )}
        </>
      )}

      {transaction ? (
        <ReceiptSection
          receiptUrl={receiptUrl}
          onUpload={handleUploadReceipt}
          uploading={uploadingReceipt}
          onDelete={handleDeleteReceipt}
        />
      ) : (
        <p className="text-xs text-[var(--text-muted)]">O comprovante pode ser anexado após salvar a transação.</p>
      )}

      <Textarea
        label="Observações"
        value={form.notes}
        onChange={(event) => updateField('notes', event.target.value)}
      />

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" loading={submitting}>
          {transaction ? 'Salvar alterações' : 'Criar transação'}
        </Button>
      </div>
    </form>
  )
}
