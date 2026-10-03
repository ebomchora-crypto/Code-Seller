import { Select } from '@/components/ui/Select'
import { CURRENCIES, type CurrencyCode } from '@/utils/currency'

// Moeda de um valor que está sendo cadastrado (negócio, lançamento...).
export function CurrencyField({ value, onChange, disabled }: { value: CurrencyCode; onChange: (code: CurrencyCode) => void; disabled?: boolean }) {
  return (
    <div className="w-[118px] shrink-0">
      <Select label="Moeda" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as CurrencyCode)}>
        {CURRENCIES.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.label}
          </option>
        ))}
      </Select>
    </div>
  )
}
