codex/add-weights,-alloc,-and-fees-modules
import { getWeights, normalizeClasses } from './weights.js'

const PARTY_ALIASES = {
  F: 'F',
  L: 'L',
  D: 'D',
  founders: 'F',
  founder: 'F',
  laura: 'L',
  investor: 'L',
  damon: 'D',
  moonbag: 'D',
}

const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const clamp01 = (value) => {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

const getWeight = (weights, key) => {
  if (!weights) return 0
  if (typeof weights[key] !== 'undefined') {
    return Math.max(0, toNumber(weights[key]))
  }
  const alias = PARTY_ALIASES[key]
  if (alias && typeof weights[alias] !== 'undefined') {
    return Math.max(0, toNumber(weights[alias]))
  }
  for (const [candidate, mapped] of Object.entries(PARTY_ALIASES)) {
    if (mapped === key && typeof weights[candidate] !== 'undefined') {
      return Math.max(0, toNumber(weights[candidate]))
    }
  }
  return 0
}

export const allocateProfit = ({
  realizedPnl = 0,
  profit,
  carryPercent = 0,
  weights = {},
  damonDeployed = true,
} = {}) => {
  const baseProfit = profit != null ? toNumber(profit) : toNumber(realizedPnl)
  const sanitizedProfit = baseProfit > 0 ? baseProfit : 0
  const carryRate = clamp01(toNumber(carryPercent) / 100)

  const founderWeightRaw = getWeight(weights, 'F')
  const lauraWeightRaw = getWeight(weights, 'L')
  const damonWeightRaw = getWeight(weights, 'D')
  const weightTotal = founderWeightRaw + lauraWeightRaw + damonWeightRaw

  const normalizedWeights = weightTotal > 0
    ? {
        F: founderWeightRaw / weightTotal,
        L: lauraWeightRaw / weightTotal,
        D: damonWeightRaw / weightTotal,
      }
    : { F: 0, L: 0, D: 0 }

  const damonEffectiveWeight = damonDeployed ? normalizedWeights.D : 0

  const lauraGross = sanitizedProfit * normalizedWeights.L
  const damonGross = sanitizedProfit * normalizedWeights.D
  const damonEligibleGross = sanitizedProfit * damonEffectiveWeight

  const investorGross = lauraGross + damonEligibleGross
  const lauraCarry = lauraGross * carryRate
  const damonCarry = damonEffectiveWeight > 0 ? damonEligibleGross * carryRate : 0
  const carryTotal = lauraCarry + damonCarry

  const lauraNet = lauraGross - lauraCarry
  const damonNet = damonEffectiveWeight > 0 ? damonEligibleGross - damonCarry : 0
  const investorNet = lauraNet + damonNet

  const foundersBase = sanitizedProfit * normalizedWeights.F
  const routedFromDamon = damonGross - damonEligibleGross

  const foundersTotal = sanitizedProfit - investorNet
  const carryBreakdownLaura = lauraCarry
  const carryBreakdownDamon = damonCarry

  return {
    parties: {
      founders: foundersTotal,
      laura: lauraNet,
      damon: damonNet,
    },
    weights: normalizedWeights,
    totals: {
      profit: sanitizedProfit,
      carry: carryTotal,
      afterCarry: sanitizedProfit - carryTotal,
      investorGross,
      investorNet,
    },
    carryBreakdown: {
      total: carryTotal,
      founders: carryTotal,
      laura: carryBreakdownLaura,
      damon: carryBreakdownDamon,
    },
    investorBreakdown: {
      laura: {
        gross: lauraGross,
        net: lauraNet,
        carry: carryBreakdownLaura,
      },
      damon: {
        gross: damonGross,
        effectiveGross: damonEligibleGross,
        net: damonNet,
        carry: carryBreakdownDamon,
        routedToFounders: routedFromDamon,
        deployed: damonDeployed,
      },
    },
    founders: {
      base: foundersBase,
      routedFromDamon,
    },
  }
}

export const computeMoonshotDistribution = (
  amount,
  classWeights = {},
  { damonDeployed = true } = {},
) => {
  const totalAmount = amount != null ? Math.max(0, toNumber(amount)) : 0
  if (totalAmount <= 0) {
    return {
      total: 0,
      founders: 0,
      laura: 0,
      damon: 0,
      baseFounderShare: 0,
      investorPool: 0,
      investorWeights: { laura: 0, damon: 0 },
      routed: { investorPoolToFounders: 0, damonToFounders: 0 },
    }
  }

  const { normalized } = normalizeClasses(classWeights)
  const founderWeight = normalized.founder ?? 0
  const lauraWeight = normalized.investor ?? 0
  const damonWeight = normalized.moonbag ?? 0

  const baseFounderShare = totalAmount * 0.25
  const investorPool = totalAmount * 0.75
  const investorWeightSum = lauraWeight + damonWeight

  let lauraShare = 0
  let damonShare = 0
  let investorPoolRouted = 0

  if (investorWeightSum > 0) {
    lauraShare = investorPool * (lauraWeight / investorWeightSum)
    damonShare = investorPool * (damonWeight / investorWeightSum)
  } else {
    investorPoolRouted = investorPool
  }

  let damonRouted = 0
  if (!damonDeployed && damonShare > 0) {
    damonRouted = damonShare
    damonShare = 0
  }

  const foundersTotal = baseFounderShare + investorPoolRouted + damonRouted

  return {
    total: totalAmount,
    founders: foundersTotal,
    laura: lauraShare,
    damon: damonShare,
    baseFounderShare,
    investorPool,
    investorWeights: {
      founder: founderWeight,
      laura: lauraWeight,
      damon: damonWeight,
    },
    routed: {
      investorPoolToFounders: investorPoolRouted,
      damonToFounders: damonRouted,
    },
  }

export const calcSplit = (profit, carryPct, scenarioKey) => {
  const weights = getWeights(scenarioKey) ?? { F: 0, L: 0, D: 0 }
  const sanitizedProfit = Math.max(0, Number(profit) || 0)
  const carryRate = Math.max(0, Math.min(1, (Number(carryPct) || 0) / 100))

  const founderBase = sanitizedProfit * (weights.F ?? 0)
  const lauraGross = sanitizedProfit * (weights.L ?? 0)
  const damonGross = sanitizedProfit * (weights.D ?? 0)

  const lauraCarry = lauraGross * carryRate
  const damonCarry = damonGross * carryRate
  const foundersCarry = lauraCarry + damonCarry

  const foundersTotal = founderBase + foundersCarry
  const lauraNet = lauraGross - lauraCarry
  const damonNet = damonGross - damonCarry
  const total = foundersTotal + lauraNet + damonNet

  const breakdown = {
    founders: {
      netAmount: foundersTotal,
      baseOrGross: founderBase,
      preFeeAmount: founderBase + foundersCarry,
      carryToFounders: foundersCarry,
      entryFeeComponent: 0,
      managementFeeComponent: 0,
    },
    laura: {
      netAmount: lauraNet,
      baseOrGross: lauraGross,
      preFeeAmount: lauraGross,
      carryToFounders: lauraCarry,
      entryFeeComponent: 0,
      managementFeeComponent: 0,
    },
    damon: {
      netAmount: damonNet,
      baseOrGross: damonGross,
      preFeeAmount: damonGross,
      carryToFounders: damonCarry,
      entryFeeComponent: 0,
      managementFeeComponent: 0,
    },
  }

  return { founders: foundersTotal, laura: lauraNet, damon: damonNet, total, weights, breakdown }
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
main
}
