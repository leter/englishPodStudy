const STORAGE_KEY = 'englishpod.lessonProgress.v1'

export const PROGRESS_CHANGE_EVENT = 'englishpod-progress-change'

function emitProgressChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(PROGRESS_CHANGE_EVENT))
}

export type LessonProgress = {
  currentTime: number
  duration: number
  progress: number
  updatedAt: number
}

export type LessonProgressMap = Record<string, LessonProgress>

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeRecord(value: unknown): LessonProgress | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Partial<LessonProgress>
  const currentTime = Number(record.currentTime)
  const duration = Number(record.duration)
  const updatedAt = Number(record.updatedAt)

  if (!Number.isFinite(currentTime) || !Number.isFinite(duration)) return null

  return {
    currentTime: Math.max(0, currentTime),
    duration: Math.max(0, duration),
    progress: clampProgress(Number(record.progress)),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0,
  }
}

export function calculateProgress(currentTime: number, duration: number) {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0
  }

  return clampProgress((currentTime / duration) * 100)
}

export function readLessonProgress(): LessonProgressMap {
  if (typeof window === 'undefined') return {}

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (!rawValue) return {}

    const parsed = JSON.parse(rawValue) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([lessonId, value]) => [lessonId, normalizeRecord(value)] as const)
        .filter((entry): entry is [string, LessonProgress] => entry[1] !== null),
    )
  } catch {
    return {}
  }
}

export function writeLessonProgress(progressMap: LessonProgressMap) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progressMap))
}

export function clearLessonProgress() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEY)
  emitProgressChange()
}

export function saveLessonProgress(
  progressMap: LessonProgressMap,
  lessonId: string,
  currentTime: number,
  duration: number,
): LessonProgressMap {
  const progress = calculateProgress(currentTime, duration)
  const nextMap = {
    ...progressMap,
    [lessonId]: {
      currentTime: Math.max(0, currentTime),
      duration: Math.max(0, duration),
      progress,
      updatedAt: Date.now(),
    },
  }

  writeLessonProgress(nextMap)
  return nextMap
}
