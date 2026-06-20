import assert from 'node:assert/strict'
import { shouldAutoplaySeek } from './seekBehavior.ts'

assert.equal(shouldAutoplaySeek(true, true), true)
assert.equal(shouldAutoplaySeek(false, true), false)
assert.equal(shouldAutoplaySeek(true, false), false)
assert.equal(shouldAutoplaySeek(false, false), false)
