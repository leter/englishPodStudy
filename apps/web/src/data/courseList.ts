import { useEffect, useState } from 'react'

export type CourseResourceName =
  | 'dialog.mp3'
  | 'lesson.mp3'
  | 'review.mp3'
  | 'worksheet.pdf'
  | 'host.pdf'
  | 'subtitle.srt'
  | 'subtitle.bilingual.srt'
  | 'subtitle.zh.srt'
  | 'transcript.txt'

export type CourseResourcePaths = {
  dialog: string | null
  lesson: string | null
  review: string | null
  worksheet: string | null
  host: string | null
  subtitle: string | null
  transcript: string | null
}

export type CourseAvailability = Record<keyof CourseResourcePaths, boolean>

export type CourseLesson = {
  id: string
  number: string
  seq: number
  title: string
  displayTitle: string
  level: string | null
  levelCode: string | null
  category: string | null
  group: string
  section: 'level' | 'category'
  resourceDir: string
  resources: CourseResourcePaths
  availability: CourseAvailability
}

export type CourseListData = {
  generatedAt: string
  count: number
  source: string
  sections: Array<{
    name: string
    from: string
    to: string
    count: number
    description: string
  }>
  levels: Array<{ code: string; name: string; count: number }>
  categories: Array<{ name: string; count: number }>
  lessons: CourseLesson[]
}

export function getLevelBadge(lesson: CourseLesson) {
  const code = lesson.levelCode ?? 'X'
  const normalizedCode = /^[A-Z]$/.test(code) ? code : 'X'

  return {
    code: normalizedCode,
    label: lesson.level ?? lesson.category ?? '未分类',
    className: `level-${normalizedCode.toLowerCase()}`,
  }
}

export type SubtitleCue = {
  id: string
  start: number
  end: number
  text: string
}

export type SubtitleMode = 'bilingual' | 'off' | 'zh' | 'en'

type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

type SubtitleState = {
  lessonId: string | null
  mode: SubtitleMode | null
  data: SubtitleCue[] | null
  error: string | null
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function useCourseList(): AsyncState<CourseListData> {
  const [state, setState] = useState<AsyncState<CourseListData>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchJson<CourseListData>('/api/courses', controller.signal)
      .then((data) => {
        setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : '课程列表加载失败',
        })
      })

    return () => controller.abort()
  }, [])

  return state
}

export function useLessonSubtitles(
  lessonId: string | undefined,
  mode: SubtitleMode,
): AsyncState<SubtitleCue[]> {
  const [state, setState] = useState<SubtitleState>({
    lessonId: null,
    mode: null,
    data: null,
    error: null,
  })

  useEffect(() => {
    if (!lessonId) {
      return
    }

    const controller = new AbortController()
    fetchJson<SubtitleCue[]>(
      `/api/courses/${lessonId}/subtitles?mode=${mode}`,
      controller.signal,
    )
      .then((data) => {
        setState({ lessonId, mode, data, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          lessonId,
          mode,
          data: null,
          error: error instanceof Error ? error.message : '字幕加载失败',
        })
      })

    return () => controller.abort()
  }, [lessonId, mode])

  if (!lessonId) {
    return { data: null, loading: false, error: null }
  }

  if (state.lessonId !== lessonId || state.mode !== mode) {
    return { data: null, loading: true, error: null }
  }

  return { data: state.data, loading: false, error: state.error }
}

export function getResourceUrl(
  lessonId: string,
  fileName: CourseResourceName,
) {
  return `/api/resources/${lessonId}/${fileName}`
}

export function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0))
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
