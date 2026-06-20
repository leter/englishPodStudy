export type EnglishToken = {
  text: string
  isWord: boolean
}

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?|\d+(?:[.,]\d+)*/g

export function tokenizeEnglish(line: string): EnglishToken[] {
  const tokens: EnglishToken[] = []
  let lastIndex = 0

  for (const match of line.matchAll(WORD_RE)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, index), isWord: false })
    }

    tokens.push({ text: match[0], isWord: true })
    lastIndex = index + match[0].length
  }

  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), isWord: false })
  }

  return tokens
}
