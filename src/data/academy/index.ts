import { LESSONS_CRIAR } from './lessons-criar'
import { LESSONS_ENCONTRAR } from './lessons-encontrar'
import { LESSONS_VENDER } from './lessons-vender'
import type { AcademyLesson, AcademyModule } from './types'

export * from './types'
export { KIT_PROMPTS, KIT_PROPOSALS, KIT_SCRIPTS } from './kit'

export const ACADEMY_MODULES: AcademyModule[] = [
  { id: 'criar', title: 'Criar', subtitle: 'Da ideia à oferta', color: '#a78bfa' },
  { id: 'encontrar', title: 'Encontrar', subtitle: 'Das empresas certas à primeira conversa', color: '#60a5fa' },
  { id: 'vender', title: 'Vender', subtitle: 'Da conversa ao dinheiro no bolso', color: '#34d399' },
]

export const ACADEMY_LESSONS: AcademyLesson[] = [...LESSONS_CRIAR, ...LESSONS_ENCONTRAR, ...LESSONS_VENDER]

export function lessonKey(lessonId: string) {
  return `lesson:${lessonId}`
}

export function checkKey(lessonId: string, index: number) {
  return `check:${lessonId}:${index}`
}
