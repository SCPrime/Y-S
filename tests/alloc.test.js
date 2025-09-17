import assert from 'node:assert/strict'
import test from 'node:test'

import { calcSplit, calculateAdvancedMetrics, parseAdvancedInputs } from '../src/lib/alloc.js'
import { getWeights, normalizeWeightInputs } from '../src/lib/weights.js'

test('calcSplit applies carry routing across scenarios', () => {
  const profit = 1000
  const carry = 20
  const { founders, laura, damon, total, weights } = calcSplit(profit, carry, 'deployed')

  assert.ok(Math.abs(total - profit) < 1e-9)

  const expectedWeights = getWeights('deployed')
  assert.deepEqual(weights, expectedWeights)

  assert.ok(Math.abs(founders - 677.1929824561404) < 1e-9)
  assert.ok(Math.abs(laura - 245.61403508771932) < 1e-9)
  assert.ok(Math.abs(damon - 77.19298245614036) < 1e-9)
})

test('normalizeWeightInputs produces normalized shares and clamps invalid entries', () => {
  const { normalized } = normalizeWeightInputs({ founder: '50', investor: '30', moonbag: '20' })

  assert.ok(Math.abs(normalized.founder - 0.5) < 1e-12)
  assert.ok(Math.abs(normalized.investor - 0.3) < 1e-12)
  assert.ok(Math.abs(normalized.moonbag - 0.2) < 1e-12)

  const zeroed = normalizeWeightInputs({ founder: '-10', investor: '', moonbag: null })
  assert.deepEqual(zeroed.normalized, { founder: 0, investor: 0, moonbag: 0 })
})

test('calculateAdvancedMetrics summarizes combined profit distribution and ratios', () => {
  const advancedNumbers = parseAdvancedInputs({
    walletSize: '5000',
    pnl: '1000',
    unrealizedPnl: '500',
    totalTrades: '10',
    winTrades: '7',
    lossTrades: '3',
  })

  const normalizedWeights = { founder: 0.5, investor: 0.3, moonbag: 0.2 }
  const metrics = calculateAdvancedMetrics(advancedNumbers, normalizedWeights)

  assert.ok(Math.abs(metrics.combinedProfit - 1500) < 1e-9)
  assert.ok(Math.abs(metrics.advancedDistribution.founder - 750) < 1e-9)
  assert.ok(Math.abs(metrics.advancedDistribution.investor - 450) < 1e-9)
  assert.ok(Math.abs(metrics.advancedDistribution.moonbag - 300) < 1e-9)
  assert.ok(Math.abs(metrics.winRate - 0.7) < 1e-9)
  assert.ok(Math.abs(metrics.lossRate - 0.3) < 1e-9)
  assert.ok(Math.abs(metrics.profitPerTrade - 100) < 1e-9)
  assert.ok(Math.abs(metrics.roi - 0.3) < 1e-9)
})

test('calculateAdvancedMetrics guards against divide-by-zero scenarios', () => {
  const metrics = calculateAdvancedMetrics(
    parseAdvancedInputs({ walletSize: '0', pnl: '0', unrealizedPnl: '0', totalTrades: '0' }),
    normalizeWeightInputs({}).normalized,
  )

  assert.deepEqual(metrics.advancedDistribution, { founder: 0, investor: 0, moonbag: 0 })
  assert.equal(metrics.combinedProfit, 0)
  assert.equal(metrics.winRate, 0)
  assert.equal(metrics.lossRate, 0)
  assert.equal(metrics.profitPerTrade, 0)
  assert.equal(metrics.roi, 0)
})
