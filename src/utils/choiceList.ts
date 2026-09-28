// Junta a lista sugerida com valores já usados, sem repetir (ignora
// maiúsculas/acentos) e mantendo a ordem das sugestões primeiro.
// Testado em src/utils/choiceList.test.mjs.

export function normalizeChoice(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function mergeChoices(suggestions: readonly string[], used: readonly string[]): string[] {
  const seen = new Set(suggestions.map(normalizeChoice))
  const extra = [...new Set(used.map((value) => value.trim()).filter(Boolean))]
    .filter((value) => !seen.has(normalizeChoice(value)))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  return [...suggestions, ...extra]
}

// Opções que combinam com o que foi digitado (todas, se nada foi digitado).
export function filterChoices(options: readonly string[], query: string): string[] {
  const needle = normalizeChoice(query)
  if (!needle) return [...options]
  return options.filter((option) => normalizeChoice(option).includes(needle))
}
