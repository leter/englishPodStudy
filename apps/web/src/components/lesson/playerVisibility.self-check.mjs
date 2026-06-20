import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8')

assert.match(css, /\.mode-toggle\s*,\s*\.speed/)
assert.doesNotMatch(css, /\.crumbs,\s*\.extras\s*\{\s*display:\s*none;/)
