import test from 'node:test'
import assert from 'node:assert/strict'
import { initialAdvancedInputs, parseMetrics, sanitizeParsedMetrics } from '../src/lib/ocr.js'

test('parseMetrics normalizes OCR numbers and surfaces ISO date', () => {
  const text = `
  FIGMENT TRADING SNAPSHOT
  Snapshot captured: 2024-09-15 at 09:45 UTC

  Wallet Balance
  $4.8k USD

  Realized PnL .......... +$1.9k
  Unrealized P/L est.
  (650)

  Trades total
  24 executed
  Win trades
  18
  Loss trades
  6

  Carry Percent : 12.5 %
  `

  const metrics = parseMetrics(text)

  assert.deepStrictEqual(metrics, {
    walletSize: '4800',
    pnl: '1900',
    unrealizedPnl: '650',
    totalTrades: '24',
    winTrades: '18',
    lossTrades: '6',
    date: '2024-09-15',
    carry: '12.5',
  })
})

test('sanitizeParsedMetrics merges parsed values without clobbering manual edits', () => {
  const previous = {
    ...initialAdvancedInputs,
    walletSize: '5000',
    pnl: '1200',
    carry: '8.5',
    date: '2024-09-01',
  }

  const parsed = {
    walletSize: '',
    pnl: '2100',
    unrealizedPnl: null,
    totalTrades: 42,
    winTrades: 30,
    lossTrades: 12,
    date: '2024-09-15',
    carry: 14.25,
  }

  const merged = sanitizeParsedMetrics(previous, parsed)

  assert.deepStrictEqual(merged, {
    walletSize: '5000',
    pnl: '2100',
    unrealizedPnl: '',
    totalTrades: '42',
    winTrades: '30',
    lossTrades: '12',
    date: '2024-09-15',
    carry: '14.25',
  })
})
