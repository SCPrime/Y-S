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

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

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

const winLossKeywords = ['win', 'wins', 'winning', 'loss', 'losses', 'losing', 'lost', 'lose', 'loses', 'won']

const hasWinLossKeyword = (value) => {
  if (!value) return false
  const lower = value.toLowerCase()
  return winLossKeywords.some((keyword) => lower.includes(keyword))
}

const hasTradeSummaryIndicator = (value) => {
  if (!value) return false
  const lower = value.toLowerCase()
  if (!lower.includes('trade')) {
    return false
  }
  if (hasWinLossKeyword(lower)) {
    return false
  }
  if (/\btotal\b/.test(lower)) {
    return true
  }
  if (/\boverall\b/.test(lower)) {
    return true
  }
  if (/\bcount\b/.test(lower) || /\bcounts\b/.test(lower)) {
    return true
  }
  if (/\bnumber\b/.test(lower)) {
    return true
  }
  if (/\bno\.?\b/.test(lower)) {
    return true
  }
  if (lower.includes('#')) {
    return true
  }
  return false
}

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
    const regex = new RegExp(`\\b${escapeRegex(label)}\\b[\\s:=\u2013-]*${numericTokenRegex.source}`, 'gi')
    let match = regex.exec(text)
    while (match) {
      const normalized = normalizeMagnitude(match[1])
      if (normalized) {
        return normalized
      }
      match = regex.exec(text)
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
    const regex = new RegExp(`\\b${escapeRegex(label)}\\b[\\s:=\u2013-]*${percentTokenRegex.source}`, 'gi')
    let match = regex.exec(text)
    while (match) {
      if (match?.[1]) {
        return match[1]
      }
      match = regex.exec(text)
    }
  }

  return ''
}

const MONTH_NAME_MAP = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
}

const normalizeYear = (value) => {
  if (!value) return ''
  let numeric = Number(value)
  if (Number.isNaN(numeric)) return ''
  if (value.length === 2) {
    numeric += numeric >= 50 ? 1900 : 2000
  }
  if (numeric < 1000 || numeric > 9999) return ''
  return String(numeric).padStart(4, '0')
}

const toIsoDate = (year, month, day) => {
  const normalizedYear = normalizeYear(year)
  const monthNumber = Number(month)
  const dayNumber = Number(day)

  if (!normalizedYear) return ''
  if (!Number.isInteger(monthNumber) || monthNumber < 1 || monthNumber > 12) return ''
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 31) return ''

  const monthPart = String(monthNumber).padStart(2, '0')
  const dayPart = String(dayNumber).padStart(2, '0')
  return `${normalizedYear}-${monthPart}-${dayPart}`
}

const parseMonthToken = (token) => {
  if (!token) return ''
  const normalized = token.replace(/\./g, '').toLowerCase()
  const key = normalized.slice(0, 3)
  return MONTH_NAME_MAP[key] ?? ''
}

const parseDate = (text) => {
  if (!text) return ''

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) {
    const [, year, month, day] = iso
    const normalized = toIsoDate(year, month, day)
    if (normalized) return normalized
  }

  const slash = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (slash) {
    const [, month, day, year] = slash
    const normalized = toIsoDate(year, month, day)
    if (normalized) return normalized
  }

  const month = text.match(
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(\d{2,4})\b/i,
  )
  if (month) {
    const [, monthToken, day, year] = month
    const monthValue = parseMonthToken(monthToken)
    if (monthValue) {
      const normalized = toIsoDate(year, monthValue, day)
      if (normalized) return normalized
    }
  }

  return ''
}

const parseTotalTrades = (text) => {
  if (!text) return ''
  const lines = text.split(/\r?\n/).map((line) => line.trim())

  const parseFromLine = (line) => {
    if (!hasTradeSummaryIndicator(line)) {
      return ''
    }
    const inlineMatch = line.match(numericTokenRegex)
    if (inlineMatch?.[1]) {
      const normalized = normalizeMagnitude(inlineMatch[1])
      if (normalized) {
        return normalized
      }
    }
    return ''
  }

  for (let index = 0; index < lines.length; index += 1) {
    const current = lines[index]
    if (!current) {
      continue
    }
    const currentResult = parseFromLine(current)
    if (currentResult) {
      const currentLower = current.toLowerCase()
      if (currentLower && currentLower.includes('total') && !currentLower.match(/\d/)) {
        const nextLine = lines[index + 1]
        if (nextLine && !hasWinLossKeyword(nextLine)) {
          const nextMatch = nextLine.match(numericTokenRegex)
          if (nextMatch?.[1]) {
            const normalized = normalizeMagnitude(nextMatch[1])
            if (normalized) {
              return normalized
            }
          }
        }
      } else {
        return currentResult
      }
    }

    const currentLower = current.toLowerCase()
    if (/\btotal\b/.test(currentLower) && !currentLower.includes('trade')) {
      const nextLine = lines[index + 1]
      if (nextLine) {
        const nextLower = nextLine.toLowerCase()
        if (nextLower.includes('trade') && !hasWinLossKeyword(nextLower)) {
          const nextResult = parseFromLine(nextLine)
          if (nextResult) {
            return nextResult
          }
          const inlineNextMatch = nextLine.match(numericTokenRegex)
          if (inlineNextMatch?.[1]) {
            const normalized = normalizeMagnitude(inlineNextMatch[1])
            if (normalized) {
              return normalized
            }
          }
          const following = lines[index + 2]
          if (following && !hasWinLossKeyword(following)) {
            const followingMatch = following.match(numericTokenRegex)
            if (followingMatch?.[1]) {
              const normalized = normalizeMagnitude(followingMatch[1])
              if (normalized) {
                return normalized
              }
            }
          }
        }
      }
    }

    if (hasTradeSummaryIndicator(currentLower)) {
      const nextLine = lines[index + 1]
      if (nextLine && !hasWinLossKeyword(nextLine)) {
        const nextMatch = nextLine.match(numericTokenRegex)
        if (nextMatch?.[1]) {
          const normalized = normalizeMagnitude(nextMatch[1])
          if (normalized) {
            return normalized
          }
        }
      }
    }
  }

  const regexes = [
    new RegExp(
      `\\btotal(?:\\s+\\w+){0,3}\\s+trades?\\b[\\s:=\u2013-]*${numericTokenRegex.source}`,
      'gi',
    ),
    new RegExp(
      `\\btrades?\\b(?:\\s+\\w+){0,3}\\s+total\\b[\\s:=\u2013-]*${numericTokenRegex.source}`,
      'gi',
    ),
  ]

  for (const regex of regexes) {
    let match = regex.exec(text)
    while (match) {
      const segment = match[0]?.toLowerCase?.() ?? ''
      if (!segment || hasWinLossKeyword(segment)) {
        match = regex.exec(text)
        continue
      }
      const normalized = normalizeMagnitude(match[1])
      if (normalized) {
        return normalized
      }
      match = regex.exec(text)
    }
  }

  return ''
}

export const parseDate = (text) => {
  if (!text) return ''

  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (iso) {
    const [, year, month, day] = iso
    const normalized = toIsoDate(year, month, day)
    if (normalized) return normalized
  }

  const slash = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/)
  if (slash) {
    const [, month, day, year] = slash
    const normalized = toIsoDate(year, month, day)
    if (normalized) return normalized
  }

  const month = text.match(
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,\s*|\s+)(\d{2,4})\b/i,
  )
  if (month) {
    const [, monthToken, day, year] = month
    const monthValue = parseMonthToken(monthToken)
    if (monthValue) {
      const normalized = toIsoDate(year, monthValue, day)
      if (normalized) return normalized
    }
  }

  return ''
}

export const extractAdvancedFields = (text) => {
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

  const winTrades = parseLabeledNumber(normalizedText, [
    'win trades',
    'winning trades',
    'win trade count',
    'winning trade count',
    'win count',
    'wins',
  ])
  const lossTrades = parseLabeledNumber(normalizedText, [
    'loss trades',
    'losing trades',
    'loss trade count',
    'losing trade count',
    'loss count',
    'losses',
  ])
  const totalTrades =
    parseTotalTrades(normalizedText) ||
    parseLabeledNumber(normalizedText, [
      'total trade count',
      'count of trades',
      'number of trades',
    ])

  const carryRaw = parsePercentage(normalizedText, ['carry', 'carry %', 'carry percent'])
  const carry = carryRaw ? String(clamp(Number(carryRaw) || 0, 0, 100)) : ''
  const date = parseDate(text)

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