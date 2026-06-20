import assert from 'node:assert/strict'
import { getCenteredScrollTop } from './subtitleScroll.ts'

const container = {
  scrollTop: 120,
  clientHeight: 300,
  getBoundingClientRect: () => ({ top: 40 }),
}
const cue = {
  clientHeight: 40,
  getBoundingClientRect: () => ({ top: 520 }),
}

assert.equal(getCenteredScrollTop(container, cue), 470)
