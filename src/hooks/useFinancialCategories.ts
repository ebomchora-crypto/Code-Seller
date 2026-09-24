import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  createCategory as createCategoryService,
  deleteCategory as deleteCategoryService,
  getCategories,
  seedDefaultCategories,
  updateCategory as updateCategoryService,
} from '@/services/supabase/financialCategories'
import type { FinancialCategory, TransactionType } from '@/types'

export function useFinancialCategories() {
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      let result = await getCategories()

      // Primeiro acesso: sem nenhuma categoria ainda. Populamos as categorias
      // padrão automaticamente (ver seed_default_financial_categories no SQL),
      // para o usuário não precisar cadastrar tudo manualmente do zero.
      if (result.length === 0) {
        await seedDefaultCategories()
        result = await getCategories()
      }

      setCategories(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchCategories()
  }, [fetchCategories])

  const createCategory = useCallback(async (name: string, type: TransactionType, color: string) => {
    try {
      const category = await createCategoryService({ name, type, color, icon: null })
      setCategories((current) => [...current, category].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Categoria criada com sucesso.')
      return category
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível criar a categoria.')
      return null
    }
  }, [])

  const updateCategory = useCallback(async (id: string, data: Partial<FinancialCategory>) => {
    try {
      const updated = await updateCategoryService(id, data)
      setCategories((current) => current.map((category) => (category.id === id ? updated : category)))
      toast.success('Categoria atualizada com sucesso.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível atualizar a categoria.')
    }
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await deleteCategoryService(id)
      setCategories((current) => current.filter((category) => category.id !== id))
      toast.success('Categoria removida.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível remover a categoria.')
    }
  }, [])

  const incomeCategories = useMemo(() => categories.filter((category) => category.type === 'income'), [categories])
  const expenseCategories = useMemo(() => categories.filter((category) => category.type === 'expense'), [categories])

  return {
    categories,
    incomeCategories,
    expenseCategories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
