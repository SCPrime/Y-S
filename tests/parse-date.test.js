import test from 'node:test'
import assert from 'node:assert/strict'
import { parseDate } from '../src/utils/parseDate.js'

test('returns ISO dates when already formatted', () => {
  const input = 'Snapshot captured on 2025-08-02 for review.'
  assert.equal(parseDate(input), '2025-08-02')
})

test('normalizes slash-delimited dates', () => {
  const input = 'Report period: 08/02/2025 summary.'
  assert.equal(parseDate(input), '2025-08-02')
})

test('normalizes two-digit years from slash-delimited dates', () => {
  const input = 'Report period: 08/02/25 summary.'
  assert.equal(parseDate(input), '2025-08-02')
})

test('parses textual months without punctuation', () => {
  const input = 'Performance through Aug 2 2025 is included.'
  assert.equal(parseDate(input), '2025-08-02')
})

test('parses Figment-style month abbreviations with periods and ordinals', () => {
  const input = 'Figment snapshot • Aug. 2nd 2025 • Wallet update'
  assert.equal(parseDate(input), '2025-08-02')
})

test('normalizes two-digit years from textual dates', () => {
  const input = 'Stats as of Aug. 2nd, 25 with new capital.'
  assert.equal(parseDate(input), '2025-08-02')
})

test('parses alternate abbreviations with periods', () => {
  const input = 'Highlights through Sept. 3rd 2025 show growth.'
  assert.equal(parseDate(input), '2025-09-03')
})

test('ignores unmatched text', () => {
  const input = 'No valid date appears in this text block.'
  assert.equal(parseDate(input), '')
})
