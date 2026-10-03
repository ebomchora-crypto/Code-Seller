// Moedas do Code Sellers. Cada valor salvo (negócio, lançamento, conta a
// receber, proposta) tem a sua moeda; os totais da tela mostram uma moeda por
// vez — a escolhida no seletor "Moeda" (Início, Sala de receita, Negócios,
// Financeiro, Relatórios).

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP'

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: 'BRL', label: 'Real', symbol: 'R$' },
  { code: 'USD', label: 'Dólar', symbol: 'US$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'Libra', symbol: '£' },
]

export const DEFAULT_CURRENCY: CurrencyCode = 'BRL'

export function isCurrency(value: unknown): value is CurrencyCode {
  return CURRENCIES.some((currency) => currency.code === value)
}

export function currencyOf(value: unknown): CurrencyCode {
  return isCurrency(value) ? value : DEFAULT_CURRENCY
}

export function currencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((currency) => currency.code === code)?.symbol ?? 'R$'
}

// ---------------------------------------------------------------------------
// Moeda dos totais (vale para o app inteiro e fica salva neste navegador).
// ---------------------------------------------------------------------------
const STORAGE_KEY = 'cs-view-currency'
const listeners = new Set<() => void>()

function readStored(): CurrencyCode {
  try {
    return currencyOf(globalThis.localStorage?.getItem(STORAGE_KEY))
  } catch {
    return DEFAULT_CURRENCY
  }
}

let viewCurrency: CurrencyCode = readStored()

export function getViewCurrency(): CurrencyCode {
  return viewCurrency
}

export function setViewCurrency(code: CurrencyCode): void {
  if (code === viewCurrency) return
  viewCurrency = code
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, code)
  } catch {
    // Sem armazenamento: a escolha vale até fechar a página.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeViewCurrency(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Valor formatado na moeda pedida (ou na moeda dos totais). Sempre no jeito
// brasileiro de escrever número: US$ 1.234,50 · € 980,00 · £ 75,00.
export function formatMoney(
  value: number | null | undefined,
  currency: CurrencyCode | string | null | undefined = getViewCurrency(),
  options: { decimals?: boolean } = {},
): string {
  const amount = value ?? 0
  const fractions = options.decimals === false ? { maximumFractionDigits: 0 } : {}
  return amount.toLocaleString('pt-BR', { style: 'currency', currency: currencyOf(currency), ...fractions })
}
