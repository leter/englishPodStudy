import { useEffect, useRef, type KeyboardEvent } from 'react'
import { formatTime, type SubtitleCue } from '@/data/courseList'
import { getCenteredScrollTop } from './subtitleScroll'
import { isTranslationLine } from './subtitleLine'
import { tokenizeEnglish } from './tokenizeEnglish'

export type SubtitleWordSelection = {
  word: string
  cue: SubtitleCue
  lineIndex: number
  anchor: {
    left: number
    top: number
    bottom: number
  }
}

type SubtitlePanelProps = {
  cues: SubtitleCue[]
  currentTime: number
  message?: string
  obscured?: boolean
  onSeek: (time: number) => void
  onWordSelect?: (selection: SubtitleWordSelection) => void
  onSentenceReviewAdd?: (cue: SubtitleCue) => void
}

export function SubtitlePanel({
  cues,
  currentTime,
  message,
  obscured = false,
  onSeek,
  onWordSelect,
  onSentenceReviewAdd,
}: SubtitlePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeCueRef = useRef<HTMLDivElement>(null)
  const activeIndex = cues.findIndex(
    (cue) => currentTime >= cue.start && currentTime < cue.end,
  )

  useEffect(() => {
    const scrollEl = scrollRef.current
    const cueEl = activeCueRef.current
    if (activeIndex < 0 || !scrollEl || !cueEl) return

    scrollEl.scrollTo({
      top: getCenteredScrollTop(scrollEl, cueEl),
      behavior: 'smooth',
    })
  }, [activeIndex])

  const handleCueKeyDown = (event: KeyboardEvent<HTMLDivElement>, start: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSeek(start)
  }

  return (
    <div className={`subs-scroll${obscured ? ' obscured' : ''}`} id="subsScroll" ref={scrollRef}>
      <div className="subs" id="subs">
        {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
        {cues.map((cue, index) => (
          <div
            key={cue.id}
            ref={index === activeIndex ? activeCueRef : null}
            className={[
              'cue',
              index === activeIndex ? 'active' : '',
              index < activeIndex ? 'passed' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="button"
            tabIndex={0}
            onClick={() => onSeek(cue.start)}
            onKeyDown={(event) => handleCueKeyDown(event, cue.start)}
          >
            <button
              className="t"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onSeek(cue.start)
              }}
            >
              {formatTime(cue.start)}
            </button>
            <span className="line">
              {cue.text.split('\n').map((line, lineIndex) => (
                <span
                  key={`${cue.id}-${lineIndex}`}
                  className={isTranslationLine(line) ? 'line-translation' : undefined}
                >
                  {isTranslationLine(line) || obscured
                    ? line
                    : tokenizeEnglish(line).map((token, tokenIndex) =>
                        token.isWord ? (
                          <button
                            key={`${cue.id}-${lineIndex}-${tokenIndex}`}
                            className="word-token"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              const rect = event.currentTarget.getBoundingClientRect()
                              onWordSelect?.({
                                word: token.text,
                                cue,
                                lineIndex,
                                anchor: {
                                  left: rect.left,
                                  top: rect.top,
                                  bottom: rect.bottom,
                                },
                              })
                            }}
                          >
                            {token.text}
                          </button>
                        ) : (
                          <span key={`${cue.id}-${lineIndex}-${tokenIndex}`}>
                            {token.text}
                          </span>
                        ),
                      )}
                </span>
              ))}
            </span>
            {onSentenceReviewAdd && (
              <button
                className="cue-review"
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onSentenceReviewAdd(cue)
                }}
              >
                加入复习
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
