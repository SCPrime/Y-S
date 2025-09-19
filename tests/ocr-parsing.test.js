import test from 'node:test'
import assert from 'node:assert/strict'

import { extractAdvancedFields } from '../src/lib/ocr.js'

test('extracts independent trade counts from inline totals', () => {
  const sample = [
    'Wallet Size $5,000',
    'Total trades – 24',
    'Win trades: 18',
    'Loss trades: 6',
  ].join('\n')

  const fields = extractAdvancedFields(sample)

  assert.equal(fields.totalTrades, '24')
  assert.equal(fields.winTrades, '18')
  assert.equal(fields.lossTrades, '6')
})

test('handles separated total labels without confusing win/loss values', () => {
  const sample = [
    'Total trades',
    '30',
    'Winning trades: 20',
    'Losing trades: 10',
  ].join('\n')

  const fields = extractAdvancedFields(sample)

  assert.equal(fields.totalTrades, '30')
  assert.equal(fields.winTrades, '20')
  assert.equal(fields.lossTrades, '10')
})

test('supports descriptive count phrasing while keeping counts distinct', () => {
  const sample = [
    'Count of trades 42',
    'Winning trades 33',
    'Losing trades 9',
  ].join('\n')

  const fields = extractAdvancedFields(sample)

  assert.equal(fields.totalTrades, '42')
  assert.equal(fields.winTrades, '33')
  assert.equal(fields.lossTrades, '9')
})

test('does not reuse win totals when a total trade count is missing', () => {
  const sample = [
    'Winning trade count: 17',
    'Loss trades: 5',
  ].join('\n')

  const fields = extractAdvancedFields(sample)

  assert.equal(fields.totalTrades, '')
  assert.equal(fields.winTrades, '17')
  assert.equal(fields.lossTrades, '5')
})
