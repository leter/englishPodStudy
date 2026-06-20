import { useEffect, useState } from 'react'

export type DictLookupResult =
  | {
      found: false
      word: string
    }
  | {
      found: true
      query: string
      matched: string
      word: string
      phonetic: string
      pos: string
      translation: string
    }

type LookupState = {
  data: DictLookupResult | null
  loading: boolean
  error: string | null
}

type InternalLookupState = LookupState & {
  word: string
}

const cache = new Map<string, DictLookupResult>()

export function useDictLookup(word: string | null): LookupState {
  const normalizedWord = word?.trim().toLowerCase() ?? ''
  const [state, setState] = useState<InternalLookupState>({
    word: '',
    data: null,
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!normalizedWord || cache.has(normalizedWord)) return

    const controller = new AbortController()

    fetch(`/api/dict/${encodeURIComponent(normalizedWord)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { error?: string } | null
          throw new Error(body?.error ?? `查词失败：${response.status}`)
        }
        return response.json() as Promise<DictLookupResult>
      })
      .then((data) => {
        if (data.found) cache.set(normalizedWord, data)
        setState({ word: normalizedWord, data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          word: normalizedWord,
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : '查词失败',
        })
      })

    return () => controller.abort()
  }, [normalizedWord])

  if (!normalizedWord) return { data: null, loading: false, error: null }

  const cached = cache.get(normalizedWord)
  if (cached) return { data: cached, loading: false, error: null }

  if (state.word === normalizedWord) {
    return { data: state.data, loading: state.loading, error: state.error }
  }

  return { data: null, loading: true, error: null }
}
