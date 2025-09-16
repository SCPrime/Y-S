import { normalizeClasses } from './weights'

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
}
