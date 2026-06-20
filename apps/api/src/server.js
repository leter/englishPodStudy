import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { createServer as createHttpServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../..')
const resourceDir = path.join(rootDir, 'resource')
const catalogPath = path.join(resourceDir, 'course-list.json')
const dictDir = process.env.ENGLISHPOD_DICT_DIR
  ? path.resolve(process.env.ENGLISHPOD_DICT_DIR)
  : path.join(resourceDir, 'dict')
const lookupPath = path.join(dictDir, 'lookup.json')
const lemmasPath = path.join(dictDir, 'lemmas.json')

const resourceTypes = new Map([
  ['dialog.mp3', 'audio/mpeg'],
  ['lesson.mp3', 'audio/mpeg'],
  ['review.mp3', 'audio/mpeg'],
  ['worksheet.pdf', 'application/pdf'],
  ['host.pdf', 'application/pdf'],
  ['subtitle.srt', 'text/plain; charset=utf-8'],
  ['subtitle.bilingual.srt', 'text/plain; charset=utf-8'],
  ['subtitle.zh.srt', 'text/plain; charset=utf-8'],
  ['transcript.txt', 'text/plain; charset=utf-8'],
])

const subtitleModeFiles = new Map([
  ['en', 'subtitle.srt'],
  ['bilingual', 'subtitle.bilingual.srt'],
  ['off', 'subtitle.bilingual.srt'],
  ['zh', 'subtitle.zh.srt'],
])

function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

function notFound(res) {
  json(res, 404, { error: 'Not found' })
}

function methodNotAllowed(res) {
  json(res, 405, { error: 'Method not allowed' })
}

function serviceUnavailable(res, message) {
  json(res, 503, { error: message })
}

function stripWord(word) {
  return Array.from(word)
    .filter((char) => /[a-z0-9]/i.test(char))
    .join('')
    .toLowerCase()
}

function parseTime(value) {
  const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/)
  if (!match) return 0
  const [, hours, minutes, seconds, millis] = match
  return (
    Number(hours) * 3600 +
    Number(minutes) * 60 +
    Number(seconds) +
    Number(millis) / 1000
  )
}

export function parseSrt(content) {
  return content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\r?\n/)
      const id = lines.shift() ?? ''
      const timing = lines.shift() ?? ''
      const [startRaw, endRaw] = timing.split(/\s+-->\s+/)

      return {
        id,
        start: parseTime(startRaw ?? ''),
        end: parseTime(endRaw ?? ''),
        text: lines.join('\n').trim(),
      }
    })
}

async function readCatalog() {
  const content = await readFile(catalogPath, 'utf8')
  return JSON.parse(content.replace(/^\uFEFF/, ''))
}

let dictionaryState = null

async function readJsonFile(filePath) {
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content.replace(/^\uFEFF/, ''))
}

async function loadDictionary() {
  if (!dictionaryState) {
    dictionaryState = Promise.all([
      readJsonFile(lookupPath),
      readJsonFile(lemmasPath).catch(() => ({})),
    ])
      .then(([lookup, lemmas]) => ({ lookup, lemmas }))
      .catch((error) => {
        dictionaryState = null
        throw error
      })
  }

  return dictionaryState
}

async function lookupDictionary(inputWord) {
  const word = decodeURIComponent(inputWord).trim()
  if (!word) return { found: false, word: '' }

  const normalizedWord = word.toLowerCase()
  const strippedWord = stripWord(word)
  const { lookup, lemmas } = await loadDictionary()
  const candidates = [normalizedWord, strippedWord, lemmas[normalizedWord], lemmas[strippedWord]]
    .filter(Boolean)

  for (const candidate of candidates) {
    const entry = lookup[candidate]
    if (!entry) continue

    return {
      found: true,
      query: word,
      matched: entry.word,
      word: entry.word,
      phonetic: entry.phonetic,
      pos: entry.pos,
      translation: entry.translation,
    }
  }

  return { found: false, word }
}

function isLessonId(value) {
  return /^\d{4}$/.test(value)
}

function resourcePathFor(lessonId, fileName) {
  if (!isLessonId(lessonId) || !resourceTypes.has(fileName)) return null
  const fullPath = path.join(resourceDir, lessonId, fileName)
  const resolved = path.resolve(fullPath)
  const expectedRoot = path.resolve(resourceDir, lessonId) + path.sep
  return resolved.startsWith(expectedRoot) ? resolved : null
}

async function sendResource(req, res, lessonId, fileName) {
  const fullPath = resourcePathFor(lessonId, fileName)
  if (!fullPath) {
    notFound(res)
    return
  }

  let fileStat
  try {
    fileStat = await stat(fullPath)
  } catch {
    notFound(res)
    return
  }

  const contentType = resourceTypes.get(fileName)
  const range = req.headers.range

  if (range) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/)
    if (!match) {
      res.writeHead(416)
      res.end()
      return
    }

    const start = match[1] ? Number(match[1]) : 0
    const end = match[2] ? Number(match[2]) : fileStat.size - 1
    if (start >= fileStat.size || end >= fileStat.size || start > end) {
      res.writeHead(416, { 'content-range': `bytes */${fileStat.size}` })
      res.end()
      return
    }

    res.writeHead(206, {
      'accept-ranges': 'bytes',
      'content-type': contentType,
      'content-length': end - start + 1,
      'content-range': `bytes ${start}-${end}/${fileStat.size}`,
    })
    createReadStream(fullPath, { start, end }).pipe(res)
    return
  }

  res.writeHead(200, {
    'accept-ranges': 'bytes',
    'content-type': contentType,
    'content-length': fileStat.size,
  })
  createReadStream(fullPath).pipe(res)
}

async function route(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    methodNotAllowed(res)
    return
  }

  const url = new URL(req.url ?? '/', 'http://localhost')
  const parts = url.pathname.split('/').filter(Boolean)

  if (url.pathname === '/api/health') {
    json(res, 200, { ok: true })
    return
  }

  if (url.pathname === '/api/courses') {
    json(res, 200, await readCatalog())
    return
  }

  if (parts[0] === 'api' && parts[1] === 'dict' && parts.length === 3) {
    try {
      json(res, 200, await lookupDictionary(parts[2]))
    } catch {
      serviceUnavailable(
        res,
        'Dictionary is not built. Put ecdict.mini.csv in resource/dict and run: node tools/build-dict.mjs',
      )
    }
    return
  }

  if (parts[0] === 'api' && parts[1] === 'courses' && parts[2]) {
    const lessonId = parts[2]
    if (!isLessonId(lessonId)) {
      notFound(res)
      return
    }

    if (parts[3] === 'subtitles' && parts.length === 4) {
      const mode = url.searchParams.get('mode') ?? 'en'
      const subtitleFile = subtitleModeFiles.get(mode)
      const fullPath = subtitleFile ? resourcePathFor(lessonId, subtitleFile) : null
      if (!fullPath) {
        notFound(res)
        return
      }

      try {
        json(res, 200, parseSrt(await readFile(fullPath, 'utf8')))
      } catch {
        notFound(res)
      }
      return
    }

    if (parts.length === 3) {
      const catalog = await readCatalog()
      const lesson = catalog.lessons.find((item) => item.id === lessonId)
      if (lesson) {
        json(res, 200, lesson)
      } else {
        notFound(res)
      }
      return
    }
  }

  if (
    parts[0] === 'api' &&
    parts[1] === 'resources' &&
    parts.length === 4
  ) {
    await sendResource(req, res, parts[2], parts[3])
    return
  }

  notFound(res)
}

export function createServer() {
  return createHttpServer((req, res) => {
    route(req, res).catch(() => {
      json(res, 500, { error: 'Internal server error' })
    })
  })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4173)
  createServer().listen(port, () => {
    console.log(`EnglishPod API listening on http://localhost:${port}`)
  })
}
