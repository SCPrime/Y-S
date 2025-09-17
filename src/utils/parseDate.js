const monthIndexByName = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

const monthNamePattern =
  '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'

const ordinalSuffixRegex = /(st|nd|rd|th)$/i

const normalizeYear = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return null
  }
  if (numeric < 0) {
    return null
  }
  if (numeric < 100) {
    return 2000 + numeric
  }
  if (numeric >= 1000 && numeric <= 9999) {
    return numeric
  }
  return null
}

const normalizeMonth = (value) => {
  if (value == null) {
    return null
  }
  const cleaned = String(value).trim().toLowerCase().replace(/\.$/, '')
  const mapped = monthIndexByName[cleaned]
  if (mapped) {
    return mapped
  }
  const numeric = Number(cleaned)
  if (!Number.isInteger(numeric)) {
    return null
  }
  if (numeric < 1 || numeric > 12) {
    return null
  }
  return numeric
}

const normalizeDay = (value) => {
  if (value == null) {
    return null
  }
  const cleaned = String(value).trim().replace(ordinalSuffixRegex, '')
  const numeric = Number(cleaned)
  if (!Number.isInteger(numeric)) {
    return null
  }
  if (numeric < 1 || numeric > 31) {
    return null
  }
  return numeric
}

const isValidDate = (year, month, day) => {
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const buildIsoDate = (yearInput, monthInput, dayInput) => {
  const year = normalizeYear(yearInput)
  const month = normalizeMonth(monthInput)
  const day = normalizeDay(dayInput)
  if (year == null || month == null || day == null) {
    return ''
  }
  if (!isValidDate(year, month, day)) {
    return ''
  }
  const isoYear = String(year).padStart(4, '0')
  const isoMonth = String(month).padStart(2, '0')
  const isoDay = String(day).padStart(2, '0')
  return `${isoYear}-${isoMonth}-${isoDay}`
}

const isoDateRegex = /\b\d{4}-\d{2}-\d{2}\b/
const slashDateRegex = /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/
const monthDateRegex = new RegExp(
  `\\b(?<month>${monthNamePattern})(?:\\.)?\\s+(?<day>\\d{1,2}(?:st|nd|rd|th)?)?,?\\s+(?<year>\\d{2,4})\\b`,
  'i',
)

export const parseDate = (text) => {
  if (!text) {
    return ''
  }

  const isoMatch = text.match(isoDateRegex)
  if (isoMatch?.[0]) {
    return isoMatch[0]
  }

  const slashMatch = text.match(slashDateRegex)
  if (slashMatch?.[0]) {
    const [monthPart, dayPart, yearPart] = slashMatch[0].split(/[/-]/)
    const normalized = buildIsoDate(yearPart, monthPart, dayPart)
    if (normalized) {
      return normalized
    }
  }

  const monthMatch = monthDateRegex.exec(text)
  if (monthMatch) {
    const groups = monthMatch.groups || {}
    const monthPart = groups.month || monthMatch[1]
    const dayPart = groups.day || monthMatch[2]
    const yearPart = groups.year || monthMatch[3]
    const normalized = buildIsoDate(yearPart, monthPart, dayPart)
    if (normalized) {
      return normalized
    }
  }

  return ''
}

export default parseDate
