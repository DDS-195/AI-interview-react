// 将共享分类注册表转换为前端选项，保留旧分类 ID 的读取兼容。
import catalog from '../../../shared/catalog.json'
import type { Category, Question, QuestionMode } from '../types'

export const CATEGORY_GROUPS = catalog.groups
export const CURRENT_CATEGORIES = catalog.categories
export const OPTIONAL_CATEGORIES = CURRENT_CATEGORIES.filter(
  (category) => 'optional' in category && category.optional
)
export const CATEGORIES: Category[] = [
  ...CURRENT_CATEGORIES,
  ...Object.entries(catalog.legacyNames).map(([id, name]) => ({ id, name }))
]
export const QUESTION_MODES = catalog.modes as { id: QuestionMode; name: string }[]
export function canonicalCategoryId(id: string): string | undefined {
  const canonical = Object.prototype.hasOwnProperty.call(catalog.aliases, id)
    ? (catalog.aliases as Record<string, string>)[id]
    : id
  return CURRENT_CATEGORIES.some((category) => category.id === canonical) ? canonical : undefined
}
export function categoryName(id: string) {
  return CATEGORIES.find((category) => category.id === id)?.name || id || '历史分类'
}
export function categoryGroup(id: string) {
  const canonical = canonicalCategoryId(id)
  return CATEGORY_GROUPS.find((group) => group.categories.includes(canonical || ''))
}
export function categoryPath(id: string) {
  return `${categoryGroup(id)?.name || (canonicalCategoryId(id) ? '专项拓展' : '历史分类')} › ${categoryName(id)}`
}
export function categoryTopics(id: string) {
  const category = CURRENT_CATEGORIES.find((category) => category.id === canonicalCategoryId(id))
  return category
    ? Object.entries(category.topics).map(([key, name]) => {
        const topicId = `${category.id}:${key}`
        return {
          id: topicId,
          name: name as string,
          modes: ((catalog.topicModes as Record<string, string[]>)[topicId] ||
            catalog.defaultModes) as QuestionMode[]
        }
      })
    : []
}
export function availableModes(categoryId: string, topicId = ''): QuestionMode[] {
  const topics = categoryTopics(categoryId).filter((topic) => !topicId || topic.id === topicId)
  return QUESTION_MODES.filter((mode) => topics.some((topic) => topic.modes.includes(mode.id))).map(
    (mode) => mode.id
  )
}
export function questionMode(question: Question): QuestionMode {
  return (
    question.mode ||
    (question.categoryId === 'scenario'
      ? 'scenario'
      : question.type === 'code'
        ? 'coding'
        : 'theory')
  )
}
