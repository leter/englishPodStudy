import assert from 'node:assert/strict'
import { isTranslationLine } from './subtitleLine.js'

assert.equal(isTranslationLine('英语学习者你们好，欢迎来到EnglishPod。'), true)
assert.equal(isTranslationLine('Hello English learners and welcome to EnglishPod.'), false)
assert.equal(isTranslationLine('EnglishPod'), false)
assert.equal(isTranslationLine('Marco'), false)

console.log('subtitle line checks passed')
