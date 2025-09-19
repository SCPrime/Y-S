import { describe, test, expect } from 'vitest'
import { extractAdvancedFields } from '../src/lib/ocr.js'

describe('OCR parsing tests', () => {
  test('extracts independent trade counts from inline totals', () => {
    const sample = [
      'Wallet Size $5,000',
      'Total trades – 24',
      'Win trades: 18',
      'Loss trades: 6',
    ].join('\n')

    const fields = extractAdvancedFields(sample)

    expect(fields.totalTrades).toBe('24')
    expect(fields.winTrades).toBe('18')
    expect(fields.lossTrades).toBe('6')
  })

  test('handles separated total labels without confusing win/loss values', () => {
    const sample = [
      'Total trades',
      '30',
      'Winning trades: 20',
      'Losing trades: 10',
    ].join('\n')

    const fields = extractAdvancedFields(sample)

    expect(fields.totalTrades).toBe('30')
    expect(fields.winTrades).toBe('20')
    expect(fields.lossTrades).toBe('10')
  })

  test('supports descriptive count phrasing while keeping counts distinct', () => {
    const sample = [
      'Count of trades 42',
      'Winning trades 33',
      'Losing trades 9',
    ].join('\n')

    const fields = extractAdvancedFields(sample)

    expect(fields.totalTrades).toBe('42')
    expect(fields.winTrades).toBe('33')
    expect(fields.lossTrades).toBe('9')
  })

  test('does not reuse win totals when a total trade count is missing', () => {
    const sample = [
      'Winning trade count: 17',
      'Loss trades: 5',
    ].join('\n')

    const fields = extractAdvancedFields(sample)

    expect(fields.totalTrades).toBe('')
    expect(fields.winTrades).toBe('17')
    expect(fields.lossTrades).toBe('5')
  })
})
