import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ThemeToggle, type Theme } from '@/components/ThemeToggle'
import { CourseSidebar } from '@/components/lesson/CourseSidebar'
import { PersistentPlayer } from '@/components/lesson/PersistentPlayer'
import { SubtitlePanel, type SubtitleWordSelection } from '@/components/lesson/SubtitlePanel'
import { WordDefinitionPopover } from '@/components/lesson/WordDefinitionPopover'
import { useCourseList, useLessonSubtitles, type SubtitleMode } from '@/data/courseList'
import {
  calculateProgress,
  readLessonProgress,
  saveLessonProgress,
  type LessonProgressMap,
} from '@/data/progressStore'
import { addReviewSentence, addVocab, isVocabSaved, removeVocabByWord } from '@/data/vocabStore'

type LessonPageProps = {
  theme: Theme
  onCycleTheme: () => void
}

const SUBTITLE_MODE_STORE = 'ep_subtitle_mode'
const SUBTITLE_MODES: SubtitleMode[] = ['bilingual', 'off', 'zh', 'en']

function readSubtitleMode(): SubtitleMode {
  try {
    const value = localStorage.getItem(SUBTITLE_MODE_STORE)
    return SUBTITLE_MODES.includes(value as SubtitleMode) ? (value as SubtitleMode) : 'bilingual'
  } catch {
    return 'bilingual'
  }
}

function saveSubtitleMode(mode: SubtitleMode) {
  try {
    localStorage.setItem(SUBTITLE_MODE_STORE, mode)
  } catch {
    // localStorage can be unavailable in private or restricted contexts.
  }
}

export function LessonPage({ theme, onCycleTheme }: LessonPageProps) {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const { data, loading, error } = useCourseList()
  const lesson = data?.lessons.find((item) => item.id === lessonId)
  const activeLesson = lesson ?? data?.lessons[0]
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>(() => readSubtitleMode())
  const subtitles = useLessonSubtitles(activeLesson?.id, subtitleMode)
  const [progressMap, setProgressMap] = useState<LessonProgressMap>(() => readLessonProgress())
  const [playbackState, setPlaybackState] = useState({
    lessonId: '',
    currentTime: 0,
    duration: 0,
  })
  const [seekRequest, setSeekRequest] = useState<{
    time: number
    version: number
    autoplay?: boolean
  } | null>(null)
  const [autoplayRequest, setAutoplayRequest] = useState<{
    lessonId: string
    version: number
  } | null>(null)
  const [selectedWord, setSelectedWord] = useState<SubtitleWordSelection | null>(null)
  const [, setVocabVersion] = useState(0)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const handledSeekParamRef = useRef('')

  const savedProgress = activeLesson ? progressMap[activeLesson.id] : undefined
  const playbackMatchesLesson = playbackState.lessonId === activeLesson?.id
  const currentTime = playbackMatchesLesson
    ? playbackState.currentTime
    : (savedProgress?.currentTime ?? 0)
  const duration = playbackMatchesLesson
    ? playbackState.duration
    : (savedProgress?.duration ?? 0)

  const handleSubtitleModeChange = (mode: SubtitleMode) => {
    setSubtitleMode(mode)
    saveSubtitleMode(mode)
  }

  const rememberProgress = (time: number, nextDuration = duration) => {
    if (!activeLesson || nextDuration <= 0) return
    setProgressMap((currentMap) =>
      saveLessonProgress(currentMap, activeLesson.id, time, nextDuration),
    )
  }

  const handleTimeUpdate = (time: number) => {
    if (!activeLesson) return
    setPlaybackState((current) => ({
      lessonId: activeLesson.id,
      currentTime: time,
      duration: current.lessonId === activeLesson.id ? current.duration : duration,
    }))
    rememberProgress(time)
  }

  const handleDurationChange = (nextDuration: number) => {
    if (!activeLesson) return
    setPlaybackState((current) => ({
      lessonId: activeLesson.id,
      currentTime: current.lessonId === activeLesson.id ? current.currentTime : currentTime,
      duration: nextDuration,
    }))
    rememberProgress(currentTime, nextDuration)
  }

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    if (!activeLesson) return

    const timeParam = searchParams.get('t')
    const time = Number(timeParam)
    const seekKey = `${activeLesson.id}:${timeParam ?? ''}`
    if (!timeParam || !Number.isFinite(time) || time < 0 || handledSeekParamRef.current === seekKey) {
      return
    }

    handledSeekParamRef.current = seekKey
    setSeekRequest((current) => ({
      time,
      version: (current?.version ?? 0) + 1,
      autoplay: true,
    }))
  }, [activeLesson, searchParams])

  if (loading) {
    return (
      <div className="app lesson-app" id="app">
        <header className="topbar">
          <Link className="brand" to="/dashboard" aria-label="回到仪表盘">
            <span className="logo">E</span>
            EnglishPod
          </Link>
        </header>
        <main className="main p-8 text-[var(--muted)]">正在加载课程...</main>
      </div>
    )
  }

  if (error || !data || !activeLesson) {
    return (
      <div className="app lesson-app" id="app">
        <header className="topbar">
          <Link className="brand" to="/dashboard" aria-label="回到仪表盘">
            <span className="logo">E</span>
            EnglishPod
          </Link>
        </header>
        <main className="main p-8 text-[var(--muted)]">
          课程加载失败：{error ?? '没有可用课程'}
        </main>
      </div>
    )
  }

  const subtitleMessage = subtitles.loading
    ? '正在加载字幕...'
    : subtitles.error
      ? `字幕加载失败：${subtitles.error}`
      : undefined
  const activeProgress = calculateProgress(currentTime, duration)
  const selectedWordSaved =
    selectedWord && activeLesson
      ? isVocabSaved(
          selectedWord.word,
          activeLesson.id,
          selectedWord.cue.start,
          selectedWord.cue.text,
        )
      : false

  return (
    <div className="app lesson-app" id="app">
      <header className="topbar">
        <button className="menu-toggle" type="button" aria-label="课程列表">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M2 4.5h14M2 9h14M2 13.5h14" />
          </svg>
        </button>

        <Link className="brand" to="/dashboard" aria-label="回到仪表盘">
          <span className="logo">E</span>
          EnglishPod
        </Link>
        <span className="topbar-spacer" />
        <ThemeToggle theme={theme} onToggle={onCycleTheme} />
      </header>

      <div className="body-grid">
        <div className="scrim" />
        <CourseSidebar
          lessons={data.lessons}
          activeLesson={activeLesson}
          progressMap={progressMap}
          activeProgress={activeProgress}
          onSelectLesson={(selectedLessonId) =>
            setAutoplayRequest((current) => ({
              lessonId: selectedLessonId,
              version: (current?.version ?? 0) + 1,
            }))
          }
        />

        <main className="main">
          <div className="lesson-nav-row">
            <Link className="back-link" to="/courses" aria-label="返回课程库">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M11 4 6 9l5 5" />
              </svg>
            </Link>
            <span className="crumbs" aria-label="当前位置">
              <Link to="/courses">课程库</Link>
              <span aria-hidden="true">/</span>
              <b>{activeLesson.title}</b>
            </span>
          </div>

          <SubtitlePanel
            cues={subtitles.data ?? []}
            currentTime={currentTime}
            message={subtitleMessage}
            obscured={subtitleMode === 'off'}
            onWordSelect={setSelectedWord}
            onSeek={(time) => {
              setSelectedWord(null)
              setSeekRequest((current) => ({
                time,
                version: (current?.version ?? 0) + 1,
                autoplay: true,
              }))
            }}
            onSentenceReviewAdd={(cue) => {
              addReviewSentence({
                lessonId: activeLesson.id,
                audioStart: cue.start,
                audioEnd: cue.end,
                sourceText: cue.text,
              })
              setToastMessage('整句已加入复习，明天提醒你再听一遍')
            }}
          />
          <WordDefinitionPopover
            selection={selectedWord}
            saved={selectedWordSaved}
            onClose={() => setSelectedWord(null)}
            onSave={(entry, selection) => {
              addVocab({
                word: entry.word,
                phonetic: entry.phonetic,
                translation: entry.translation,
                pos: entry.pos,
                lessonId: activeLesson.id,
                audioStart: selection.cue.start,
                audioEnd: selection.cue.end,
                sourceText: selection.cue.text,
              })
              setVocabVersion((version) => version + 1)
              setToastMessage(`${entry.word} 已加入生词本`)
            }}
            onRemove={(entry) => {
              if (!selectedWord) return
              removeVocabByWord(
                entry.word,
                activeLesson.id,
                selectedWord.cue.start,
                selectedWord.cue.text,
              )
              setVocabVersion((version) => version + 1)
              setToastMessage(`${entry.word} 已移出生词本`)
            }}
          />
          {toastMessage && <div className="lesson-toast">{toastMessage}</div>}
        </main>
      </div>

      <PersistentPlayer
        lesson={activeLesson}
        lessons={data.lessons}
        currentTime={currentTime}
        seekRequest={seekRequest}
        autoplayRequest={autoplayRequest}
        resumeTime={progressMap[activeLesson.id]?.currentTime ?? 0}
        onTimeUpdate={handleTimeUpdate}
        subtitleMode={subtitleMode}
        onSubtitleModeChange={handleSubtitleModeChange}
        onDurationChange={handleDurationChange}
        onAutoplayLesson={(nextLessonId) =>
          setAutoplayRequest((current) => ({
            lessonId: nextLessonId,
            version: (current?.version ?? 0) + 1,
          }))
        }
      />
    </div>
  )
}
