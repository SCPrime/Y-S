export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export const initialAdvancedInputs = {
  walletSize: '',
  pnl: '',
  unrealizedPnl: '',
  totalTrades: '',
  winTrades: '',
  lossTrades: '',
  date: '',
  carry: '',
}

const hasValue = (value) => {
  if (value == null) {
    return false
  }
  if (typeof value === 'string') {
    return value.trim() !== ''
  }
  return true
}

const toSanitizedString = (value) => {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return String(value ?? '')
}

export const sanitizeParsedMetrics = (previousInputs, parsedMetrics) => {
  const next = { ...previousInputs }

  if (!parsedMetrics) {
    return next
  }

  const assignIfPresent = (key, rawValue) => {
    if (!hasValue(rawValue)) {
      return
    }
    const normalized = toSanitizedString(rawValue)
    if (normalized !== '') {
      next[key] = normalized
    }
  }

  assignIfPresent('walletSize', parsedMetrics.walletSize)
  assignIfPresent('pnl', parsedMetrics.pnl)
  assignIfPresent('unrealizedPnl', parsedMetrics.unrealizedPnl)
  assignIfPresent('totalTrades', parsedMetrics.totalTrades)
  assignIfPresent('winTrades', parsedMetrics.winTrades)
  assignIfPresent('lossTrades', parsedMetrics.lossTrades)
  assignIfPresent('date', parsedMetrics.date)

  if (hasValue(parsedMetrics.carry)) {
    const carryValue = clamp(Number(parsedMetrics.carry) || 0, 0, 100)
    next.carry = String(carryValue)
  }

  return next
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeMagnitude = (raw) => {
  if (!raw) return ''
  const trimmed = raw.trim()
  const magnitudeMatch = trimmed.match(/([kKmM])$/)
  const isNegative = trimmed.startsWith('(') && trimmed.endsWith(')')
  const sanitized = trimmed.replace(/[^0-9.+-]/g, '')
  if (!sanitized) return ''
  let numeric = Number(sanitized)
  if (Number.isNaN(numeric)) return ''
  if (isNegative && numeric > 0) {
    numeric *= -1
  }
  if (!magnitudeMatch) {
    return String(numeric)
  }
  const mag = magnitudeMatch[1].toLowerCase()
  const multiplier = mag === 'k' ? 1_000 : 1_000_000
  return String(numeric * multiplier)
}

const numericTokenRegex = /([-+]?[$]?\d[\d,]*(?:\.\d+)?(?:\s?[kKmM])?)/
const percentTokenRegex = /([-+]?\d+(?:\.\d+)?)\s*%/

const parseLabeledNumber = (text, labels) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim())

  for (const label of labels) {
    const labelLower = label.toLowerCase()
    for (let index = 0; index < lines.length; index += 1) {
      const current = lines[index]
      const currentLower = current.toLowerCase()
      if (!currentLower.includes(labelLower)) {
        continue
      }
      const inlineMatch = current.match(numericTokenRegex)
      if (inlineMatch?.[1]) {
        const normalized = normalizeMagnitude(inlineMatch[1])
        if (normalized) return normalized
      }
      const nextLine = lines[index + 1]
      if (nextLine) {
        const nextMatch = nextLine.match(numericTokenRegex)
        if (nextMatch?.[1]) {
          const normalized = normalizeMagnitude(nextMatch[1])
          if (normalized) return normalized
        }
      }
    }
  }

  for (const label of labels) {
    const regex = new RegExp(`\\b${escapeRegex(label)}\\b[\\s:=\u2013-]*${numericTokenRegex.source}`, 'i')
    const match = regex.exec(text)
    if (match?.[1]) {
      const normalized = normalizeMagnitude(match[1])
      if (normalized) return normalized
    }
  }

  return ''
}

const parsePercentage = (text, labels) => {
  const lines = text.split(/\r?\n/).map((line) => line.trim())

  for (const label of labels) {
    const labelLower = label.toLowerCase()
    for (let index = 0; index < lines.length; index += 1) {
      const current = lines[index]
      const currentLower = current.toLowerCase()
      if (!currentLower.includes(labelLower)) {
        continue
      }
      const inlineMatch = current.match(percentTokenRegex)
      if (inlineMatch?.[1]) {
        return inlineMatch[1]
      }
      const nextLine = lines[index + 1]
      if (nextLine) {
        const nextMatch = nextLine.match(percentTokenRegex)
        if (nextMatch?.[1]) {
          return nextMatch[1]
        }
      }
    }
  }

  for (const label of labels) {
    const regex = new RegExp(`\\b${escapeRegex(label)}\\b[\\s:=\u2013-]*${percentTokenRegex.source}`, 'i')
    const match = regex.exec(text)
    if (match?.[1]) {
      return match[1]
    }
  }

  return ''
}

const parseDateToken = (text) => {
  const iso = text.match(/\b\d{4}-\d{2}-\d{2}\b/)
  if (iso) return iso[0]

  const slash = text.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/)
  if (slash) return slash[0]

  const month = text.match(
    /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4}\b/i,
  )
  if (month) return month[0]

  return ''
}

export const parseMetrics = (text) => {
  if (!text) {
    return initialAdvancedInputs
  }

  const normalizedText = text.replace(/\r?\n/g, '\n')

  const walletSize = parseLabeledNumber(normalizedText, [
    'wallet size',
    'wallet balance',
    'wallet',
  ])
  const pnl = parseLabeledNumber(normalizedText, [
    'realized pnl',
    'net pnl',
    'pnl',
    'p/l',
    'profit',
  ])
  const unrealizedPnl = parseLabeledNumber(normalizedText, [
    'unrealized pnl',
    'unrealized p/l',
    'unrealized',
  ])
  const totalTrades = parseLabeledNumber(normalizedText, [
    'total trades',
    'trades total',
    'trade count',
    'trades',
  ])
  const winTrades = parseLabeledNumber(normalizedText, [
    'win trades',
    'winning trades',
    'wins',
  ])
  const lossTrades = parseLabeledNumber(normalizedText, [
    'loss trades',
    'losing trades',
    'losses',
  ])
  const carryRaw = parsePercentage(normalizedText, ['carry', 'carry %', 'carry percent'])
  const carry = carryRaw ? String(clamp(Number(carryRaw) || 0, 0, 100)) : ''
  const date = parseDateToken(text)

  return {
    walletSize,
    pnl,
    unrealizedPnl,
    totalTrades,
    winTrades,
    lossTrades,
    date,
    carry,
  }
}
