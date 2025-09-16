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

const parseDate = (text) => {
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
