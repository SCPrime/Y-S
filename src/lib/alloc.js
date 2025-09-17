import { getWeights } from './weights.js'

export const calcSplit = (profit, carryPct, scenarioKey) => {
  const weights = getWeights(scenarioKey)
  const carry = (carryPct || 0) / 100
  const founders = profit * (weights.F + carry * (weights.L + weights.D))
  const laura = profit * ((1 - carry) * weights.L)
  const damon = profit * ((1 - carry) * weights.D)
  const total = founders + laura + damon

  return { founders, laura, damon, total, weights }
}

export const parseAdvancedInputs = (inputs = {}) => ({
  walletSize: Number(inputs.walletSize) || 0,
  pnl: Number(inputs.pnl) || 0,
  unrealizedPnl: Number(inputs.unrealizedPnl) || 0,
  totalTrades: Number(inputs.totalTrades) || 0,
  winTrades: Number(inputs.winTrades) || 0,
  lossTrades: Number(inputs.lossTrades) || 0,
  carry: Number(inputs.carry) || 0,
})

export const calculateCombinedProfit = (advancedNumbers) =>
  advancedNumbers.pnl + advancedNumbers.unrealizedPnl

export const distributeCombinedProfit = (combinedProfit, normalizedWeights) => ({
  founder: combinedProfit * (normalizedWeights.founder || 0),
  investor: combinedProfit * (normalizedWeights.investor || 0),
  moonbag: combinedProfit * (normalizedWeights.moonbag || 0),
})

export const calculateWinRate = (winTrades, totalTrades) =>
  totalTrades > 0 ? winTrades / totalTrades : 0

export const calculateLossRate = (lossTrades, totalTrades) =>
  totalTrades > 0 ? lossTrades / totalTrades : 0

export const calculateProfitPerTrade = (pnl, totalTrades) =>
  totalTrades > 0 ? pnl / totalTrades : 0

export const calculateRoi = (combinedProfit, walletSize) =>
  walletSize > 0 ? combinedProfit / walletSize : 0

export const calculateAdvancedMetrics = (advancedNumbers, normalizedWeights) => {
  const combinedProfit = calculateCombinedProfit(advancedNumbers)
  const advancedDistribution = distributeCombinedProfit(combinedProfit, normalizedWeights)
  const winRate = calculateWinRate(advancedNumbers.winTrades, advancedNumbers.totalTrades)
  const lossRate = calculateLossRate(advancedNumbers.lossTrades, advancedNumbers.totalTrades)
  const profitPerTrade = calculateProfitPerTrade(advancedNumbers.pnl, advancedNumbers.totalTrades)
  const roi = calculateRoi(combinedProfit, advancedNumbers.walletSize)

  return { combinedProfit, advancedDistribution, winRate, lossRate, profitPerTrade, roi }
}
