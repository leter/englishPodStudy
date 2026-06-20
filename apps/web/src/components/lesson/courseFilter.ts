export type LessonStatus = 'todo' | 'doing' | 'done'
export type LessonStatusFilter = LessonStatus | 'all'

export function getLessonStatus(progress: number): LessonStatus {
  if (progress >= 100) return 'done'
  return progress > 0 ? 'doing' : 'todo'
}

export function matchesLessonStatusFilter(
  filter: LessonStatusFilter,
  status: LessonStatus,
) {
  return filter === 'all' || filter === status
}


type SearchableLesson = {
  id: string
  title?: string
  displayTitle?: string
  level?: string | null
  category?: string | null
}

export function matchesLessonSearch(lesson: SearchableLesson, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [lesson.id, lesson.title, lesson.displayTitle, lesson.level, lesson.category]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery))
}
