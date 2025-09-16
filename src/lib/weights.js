const MS_PER_DAY = 24 * 60 * 60 * 1000

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

const DEFAULT_CLASS_KEYS = ['founder', 'investor', 'moonbag']

const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const toDate = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const getAlias = (contribution) => {
  if (!contribution) return null
  const keys = [
    contribution.party,
    contribution.investor,
    contribution.key,
    contribution.classKey,
    contribution.className,
    contribution.holder,
  ]
  for (const key of keys) {
    if (typeof key === 'string' && PARTY_ALIASES[key]) {
      return PARTY_ALIASES[key]
    }
  }
  return null
}

const computeSpanInDays = (contribution, nowDate) => {
  if (!contribution) return 0

  if (contribution.capitalDays != null) {
    const capitalDays = toNumber(contribution.capitalDays)
    return capitalDays > 0 ? capitalDays : 0
  }

  let days = 0
  const explicitDays =
    contribution.days ?? contribution.durationDays ?? contribution.capitalDayMultiplier
  if (explicitDays != null) {
    days = Math.max(0, toNumber(explicitDays))
  } else {
    const start = toDate(contribution.start ?? contribution.from ?? contribution.deployedOn)
    if (!start) {
      return 0
    }
    const endCandidate =
      toDate(contribution.end ?? contribution.to ?? contribution.until ?? contribution.withdrawnOn) ??
      nowDate

    const effectiveEnd = endCandidate > nowDate ? nowDate : endCandidate
    const diff = effectiveEnd.getTime() - start.getTime()
    if (!Number.isFinite(diff) || diff <= 0) {
      if (contribution.includeStartDay) {
        days = 1
      } else {
        return 0
      }
    } else {
      days = diff / MS_PER_DAY
      if (contribution.includeStartDay) {
        days += 1
      }
    }
  }

  const minimumDays = toNumber(contribution.minimumDays)
  if (minimumDays > 0) {
    days = Math.max(days, minimumDays)
  }

  if (!Number.isFinite(days) || days <= 0) {
    return 0
  }

  switch (contribution.round) {
    case 'ceil':
      days = Math.ceil(days)
      break
    case 'floor':
      days = Math.floor(days)
      break
    case 'round':
      days = Math.round(days)
      break
    default:
      break
  }

  return days
}

const computeCapitalDays = (contribution, nowDate) => {
  const spanInDays = computeSpanInDays(contribution, nowDate)
  if (spanInDays <= 0) {
    return 0
  }

  const capital =
    contribution.capital != null
      ? toNumber(contribution.capital)
      : contribution.amount != null
      ? toNumber(contribution.amount)
      : toNumber(contribution.value)

  if (capital <= 0) {
    return spanInDays
  }

  return capital * spanInDays
}

export const normalizeClasses = (rawWeights = {}, classKeys = DEFAULT_CLASS_KEYS) => {
  const raw = {}
  let total = 0

  for (const key of classKeys) {
    const numeric = Math.max(0, toNumber(rawWeights?.[key]))
    raw[key] = numeric
    total += numeric
  }

  const normalized = {}
  if (total > 0) {
    for (const key of classKeys) {
      normalized[key] = raw[key] / total
    }
  } else {
    for (const key of classKeys) {
      normalized[key] = 0
    }
  }

  return { raw, total, normalized }
}

export const computeCapitalDayWeights = (contributions = [], now = new Date()) => {
  const nowDate = toDate(now) ?? new Date()
  const capitalDays = { F: 0, L: 0, D: 0 }

  for (const contribution of contributions) {
    const alias = getAlias(contribution)
    if (!alias) {
      continue
    }

    const capitalDayValue = computeCapitalDays(contribution, nowDate)
    if (capitalDayValue <= 0) {
      continue
    }

    capitalDays[alias] += capitalDayValue
  }

  const totalCapitalDays = capitalDays.F + capitalDays.L + capitalDays.D

  const weights = totalCapitalDays > 0
    ? {
        F: capitalDays.F / totalCapitalDays,
        L: capitalDays.L / totalCapitalDays,
        D: capitalDays.D / totalCapitalDays,
      }
    : { F: 0, L: 0, D: 0 }

  return { weights, capitalDays, totalCapitalDays }
}
