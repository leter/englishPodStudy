const CJK_RE = /[\u3400-\u9fff\uf900-\ufaff]/

export function isTranslationLine(line: string) {
  return CJK_RE.test(line)
}
