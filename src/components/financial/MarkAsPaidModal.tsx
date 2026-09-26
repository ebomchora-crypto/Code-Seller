import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { formatCurrency, PAYMENT_METHOD_LABELS } from '@/utils/financial'
import type { PaymentMethod, Receivable } from '@/types'

interface MarkAsPaidModalProps {
  receivable: Receivable | null
  onClose: () => void
  onConfirm: (paymentMethod: PaymentMethod, paidAt: string, notes: string) => Promise<void>
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10)
}

export function MarkAsPaidModal({ receivable, onClose, onConfirm }: MarkAsPaidModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [paidAt, setPaidAt] = useState(todayInputValue())
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    if (!receivable) return
    setSubmitting(true)
    await onConfirm(paymentMethod, new Date(`${paidAt}T12:00:00`).toISOString(), notes)
    setSubmitting(false)
  }

  return (
    <Modal open={receivable !== null} onClose={onClose} title="Confirmar pagamento" size="sm">
      {receivable && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-[12.5px] text-[var(--text-muted)]">Valor a receber</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums text-[var(--text-primary)]">{formatCurrency(receivable.amount)}</p>
            <p className="text-sm text-[var(--text-muted)]">{receivable.description}</p>
          </div>

          <Select
            label="Método de pagamento"
            required
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
          >
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Input label="Data de pagamento" type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} />

          <Textarea
            label="Observações (opcional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} loading={submitting}>
              Confirmar pagamento
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
