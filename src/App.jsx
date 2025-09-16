import { useEffect, useMemo, useState } from 'react'
import Tesseract from 'tesseract.js'
import './App.css'

const PARTIES = [
  { key: 'founders', label: 'Founders (Yoni+Spence)', className: 'founders' },
  { key: 'laura', label: 'Laura', className: 'laura' },
  { key: 'damon', label: 'Damon', className: 'damon' },
]

const PARTY_WEIGHT_KEYS = {
  founders: 'F',
  laura: 'L',
  damon: 'D',
}

const PARTY_LOOKUP = Object.fromEntries(PARTIES.map((party) => [party.key, party]))

const SCENARIOS = [
  {
    key: 'notdeployed',
    label: 'Not deployed (0 weight)',
    summary:
      'Damon is not deployed; his capital weight is zero so his carry routes to Founders.',
    evaluationDate: '2025-01-18',
    capitalHistory: {
      founders: [
        { amount: 10000, date: '2024-12-15' },
      ],
      laura: [
        { amount: 5000, date: '2024-12-14' },
      ],
      damon: [],
    },
  },
  {
    key: 'deployed',
    label: 'Deployed on 2025-08-02 (5,000 capital)',
    summary:
      'Damon is actively deployed and receives a positive weight based on his 5,000 capital contribution.',
    evaluationDate: '2025-10-01',
    capitalHistory: {
      founders: [
        { amount: 10000, date: '2025-08-28' },
      ],
      laura: [
        { amount: 5000, date: '2025-08-27' },
      ],
      damon: [
        { amount: 5000, date: '2025-09-20' },
      ],
    },
  },
]

const SCENARIO_LOOKUP = Object.fromEntries(SCENARIOS.map((scenario) => [scenario.key, scenario]))

const MS_PER_DAY = 86_400_000

const parseIsoDate = (value) => {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }
  return new Date(Date.UTC(year, month - 1, day))
}

const calculateDaysActive = (startDate, endDate) => {
  const start = parseIsoDate(startDate)
  const end = parseIsoDate(endDate)
  if (!start || !end) return 0
  const diff = end.getTime() - start.getTime()
  if (diff <= 0) return 0
  return diff / MS_PER_DAY
}

const computeCapitalDays = (entries = [], evaluationDate) =>
  entries.reduce((total, entry) => {
    if (!entry) return total
    const amount = Number(entry.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return total
    }
    const daysActive = calculateDaysActive(entry.date, evaluationDate)
    if (daysActive <= 0) {
      return total
    }
    return total + amount * daysActive
  }, 0)

const getScenarioAnalysis = (scenarioKey) => {
  const config = SCENARIO_LOOKUP[scenarioKey] ?? SCENARIO_LOOKUP.notdeployed
  const { capitalHistory, evaluationDate } = config
  const capitalDays = {
    founders: computeCapitalDays(capitalHistory.founders, evaluationDate),
    laura: computeCapitalDays(capitalHistory.laura, evaluationDate),
    damon: computeCapitalDays(capitalHistory.damon, evaluationDate),
  }
  const totalCapitalDays = capitalDays.founders + capitalDays.laura + capitalDays.damon
  const weights = totalCapitalDays > 0
    ? {
        F: capitalDays.founders / totalCapitalDays,
        L: capitalDays.laura / totalCapitalDays,
        D: capitalDays.damon / totalCapitalDays,
      }
    : { F: 1, L: 0, D: 0 }
  const investorCapitalDays = capitalDays.laura + capitalDays.damon
  const investorWeights = investorCapitalDays > 0
    ? {
        laura: capitalDays.laura / investorCapitalDays,
        damon: capitalDays.damon / investorCapitalDays,
      }
    : { laura: 0, damon: 0 }

  return {
    config,
    capitalDays,
    weights,
    totalCapitalDays,
    investorWeights,
    investorCapitalDays,
  }
}

const TABS = [
  { key: 'calculator', label: 'Profit split calculator' },
  { key: 'ai', label: 'AI query & OCR hub' },
]

const ADVANCED_CLASSES = [
  {
    key: 'founder',
    label: 'Entry class → Founders',
    description: 'Routes carry and entry dollars to Founders (Yoni+Spence).',
    className: 'founders',
  },
  {
    key: 'investor',
    label: 'Management class → Laura',
    description: 'Management allocations flow to Laura as the active investor.',
    className: 'laura',
  },
  {
    key: 'moonbag',
    label: 'Moonbag class → Damon',
    description: 'Moonbag reserves accrue to Damon when he is deployed.',
    className: 'damon',
  },
]

const initialAdvancedInputs = {
  walletSize: '',
  pnl: '',
  unrealizedPnl: '',
  totalTrades: '',
  winTrades: '',
  lossTrades: '',
  date: '',
  carry: '',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const formatCurrency = (value) => currencyFormatter.format(value)
const formatPercent = (value) => percentFormatter.format(value)
const formatInteger = (value) => integerFormatter.format(value)

const formatWeightForCsv = (value) => `${(value * 100).toFixed(4)}%`

const calcSplit = (profit, carryPct, weights) => {
  const carry = (carryPct || 0) / 100
  const founders = profit * (weights.F + carry * (weights.L + weights.D))
  const laura = profit * ((1 - carry) * weights.L)
  const damon = profit * ((1 - carry) * weights.D)
  const total = founders + laura + damon

  return { founders, laura, damon, total }
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

const extractAdvancedFields = (text) => {
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

const sanitizeNumericInput = (value) => {
  if (!value) return ''
  const sanitized = value.replace(/[^0-9.+-]/g, '')
  if (!sanitized || sanitized === '+' || sanitized === '-') return ''
  return sanitized
}

const buildCompletionsUrl = (baseUrl) => {
  if (!baseUrl) return ''
  const trimmed = baseUrl.replace(/\/$/, '')
  if (trimmed.endsWith('/chat/completions')) {
    return trimmed
  }
  return `${trimmed}/chat/completions`
}

function AdvancedFieldsSection({
  title,
  description,
  advancedInputs,
  normalizedWeights,
  advancedDistribution,
  advancedNumbers,
  combinedProfit,
  roi,
  winRate,
  lossRate,
  profitPerTrade,
  onAdvancedChange,
  onAdvancedBlur,
  capitalDays,
  investorPoolWeights,
  capitalHistory,
  evaluationDate,
  baseFounderPortion,
  investorPortion,
  isWide = false,
}) {
  const panelClasses = ['panel', 'ai-panel', 'advanced-panel']
  if (isWide) {
    panelClasses.push('full-span')
  }

  const snapshotLabel = advancedInputs.date ? `Snapshot: ${advancedInputs.date}` : 'Snapshot date pending'
  const totalInvestorCapitalDays = capitalDays.laura + capitalDays.damon
  const capitalCutoffLabel = evaluationDate ? `Capital-day cutoff: ${evaluationDate}` : 'Capital-day cutoff pending'
  const investorMessage = totalInvestorCapitalDays > 0
    ? `${capitalCutoffLabel}. ${formatPercent(baseFounderPortion)} of the moonshot amount routes to Founders; the remaining ${formatPercent(
        investorPortion,
      )} follows investor capital-days.`
    : `${capitalCutoffLabel}. No investor capital-days recorded, so the full moonshot allocation routes to Founders.`
  const partyKeys = ['founders', 'laura', 'damon']

  return (
    <section className={panelClasses.join(' ')}>
      <div className="panel-header">
        <h2>{title}</h2>
        <span className="pill subtle" aria-live="polite">
          {snapshotLabel}
        </span>
      </div>
      <p className="muted">{description}</p>

      <div className="advanced-grid">
        <div className="field">
          <label htmlFor="walletSize">Wallet size (USD)</label>
          <input
            id="walletSize"
            name="walletSize"
            type="text"
            inputMode="decimal"
            value={advancedInputs.walletSize}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="5000"
          />
        </div>
        <div className="field">
          <label htmlFor="pnl">Realized PnL</label>
          <input
            id="pnl"
            name="pnl"
            type="text"
            inputMode="decimal"
            value={advancedInputs.pnl}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="4113"
          />
        </div>
        <div className="field">
          <label htmlFor="unrealizedPnl">Unrealized PnL</label>
          <input
            id="unrealizedPnl"
            name="unrealizedPnl"
            type="text"
            inputMode="decimal"
            value={advancedInputs.unrealizedPnl}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="1200"
          />
        </div>
        <div className="field">
          <label htmlFor="totalTrades">Total trades</label>
          <input
            id="totalTrades"
            name="totalTrades"
            type="text"
            inputMode="numeric"
            value={advancedInputs.totalTrades}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="24"
          />
        </div>
        <div className="field">
          <label htmlFor="winTrades">Win trades</label>
          <input
            id="winTrades"
            name="winTrades"
            type="text"
            inputMode="numeric"
            value={advancedInputs.winTrades}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="18"
          />
        </div>
        <div className="field">
          <label htmlFor="lossTrades">Loss trades</label>
          <input
            id="lossTrades"
            name="lossTrades"
            type="text"
            inputMode="numeric"
            value={advancedInputs.lossTrades}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="6"
          />
        </div>
        <div className="field">
          <label htmlFor="carryAdvanced">Carry (%)</label>
          <input
            id="carryAdvanced"
            name="carry"
            type="text"
            inputMode="decimal"
            value={advancedInputs.carry}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="20"
          />
        </div>
        <div className="field">
          <label htmlFor="reportDate">Snapshot date</label>
          <input
            id="reportDate"
            name="date"
            type="text"
            value={advancedInputs.date}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="2025-01-18"
          />
        </div>
      </div>

      <div className="weights-grid">
        <div className="field">
          <label>Founder share (locked)</label>
          <span className="pill">{formatPercent(normalizedWeights.founder)}</span>
          <p className="help muted">
            {totalInvestorCapitalDays > 0
              ? `Baseline share fixed at ${formatPercent(baseFounderPortion)} of the moonshot amount.`
              : 'Investors are inactive for this snapshot, so Founders absorb the full allocation.'}
          </p>
        </div>
        <div className="field">
          <label>Laura investor share</label>
          <span className="pill">{formatPercent(normalizedWeights.investor)}</span>
          <p className="help muted">
            Capital-days: {formatInteger(capitalDays.laura)}{' '}
            {totalInvestorCapitalDays > 0
              ? `(pool share ${formatPercent(investorPoolWeights.laura)})`
              : '(no active capital)'}
          </p>
        </div>
        <div className="field">
          <label>Damon moonbag share</label>
          <span className="pill">{formatPercent(normalizedWeights.moonbag)}</span>
          <p className="help muted">
            Capital-days: {formatInteger(capitalDays.damon)}{' '}
            {totalInvestorCapitalDays > 0
              ? `(pool share ${formatPercent(investorPoolWeights.damon)})`
              : '(no active capital)'}
          </p>
        </div>
        <div className="weights-summary muted" aria-live="polite">
          {investorMessage}
        </div>
      </div>

      <div className="advanced-note muted">
        <p>
          Capital contributions used for capital-day math:
        </p>
        <ul>
          {partyKeys.map((partyKey) => {
            const partyMeta = PARTY_LOOKUP[partyKey]
            const entries = capitalHistory?.[partyKey] ?? []
            return (
              <li key={partyKey}>
                <strong>{partyMeta?.label ?? partyKey}:</strong>{' '}
                {entries.length > 0
                  ? entries
                      .map((entry) => `${formatCurrency(entry.amount)} on ${entry.date}`)
                      .join('; ')
                  : 'No deposits recorded.'}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="stat-cards">
        {ADVANCED_CLASSES.map((classification) => (
          <article key={classification.key} className={`stat-card ${classification.className}`}>
            <header className="stat-header">{classification.label}</header>
            <p className="stat-description">{classification.description}</p>
            <div className="stat-amount">{formatCurrency(advancedDistribution[classification.key])}</div>
            <dl className="stat-meta">
              <div>
                <dt>Weight</dt>
                <dd>{formatPercent(normalizedWeights[classification.key])}</dd>
              </div>
              <div>
                <dt>Share of combined PnL</dt>
                <dd>
                  {combinedProfit !== 0
                    ? formatPercent((advancedDistribution[classification.key] / combinedProfit || 0))
                    : formatPercent(0)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="advanced-metrics">
        <dl>
          <div>
            <dt>Wallet size</dt>
            <dd>{formatCurrency(advancedNumbers.walletSize)}</dd>
          </div>
          <div>
            <dt>Realized PnL</dt>
            <dd>{formatCurrency(advancedNumbers.pnl)}</dd>
          </div>
          <div>
            <dt>Unrealized PnL</dt>
            <dd>{formatCurrency(advancedNumbers.unrealizedPnl)}</dd>
          </div>
          <div>
            <dt>Combined PnL</dt>
            <dd>{formatCurrency(combinedProfit)}</dd>
          </div>
          <div>
            <dt>ROI vs. wallet</dt>
            <dd>{formatPercent(roi)}</dd>
          </div>
          <div>
            <dt>Profit per trade</dt>
            <dd>{formatCurrency(profitPerTrade)}</dd>
          </div>
          <div>
            <dt>Total trades</dt>
            <dd>{formatInteger(advancedNumbers.totalTrades)}</dd>
          </div>
          <div>
            <dt>Win trades</dt>
            <dd>{formatInteger(advancedNumbers.winTrades)}</dd>
          </div>
          <div>
            <dt>Loss trades</dt>
            <dd>{formatInteger(advancedNumbers.lossTrades)}</dd>
          </div>
          <div>
            <dt>Win rate</dt>
            <dd>{formatPercent(winRate)}</dd>
          </div>
          <div>
            <dt>Loss rate</dt>
            <dd>{formatPercent(lossRate)}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('calculator')
  const [profitInput, setProfitInput] = useState('4113')
  const [carryInput, setCarryInput] = useState('20')
  const [scenario, setScenario] = useState('notdeployed')
  const [advancedInputs, setAdvancedInputs] = useState(initialAdvancedInputs)
  const [ocrStatus, setOcrStatus] = useState('idle')
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrText, setOcrText] = useState('')
  const [ocrError, setOcrError] = useState('')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [aiKey, setAiKey] = useState('')
  const [aiBaseUrl, setAiBaseUrl] = useState('https://api.openai.com/v1')
  const [aiModel, setAiModel] = useState('gpt-4o-mini')
  const [aiTemperature, setAiTemperature] = useState('0.2')
  const [aiStatus, setAiStatus] = useState('idle')
  const [aiError, setAiError] = useState('')
  const [aiReport, setAiReport] = useState('')

  useEffect(() => () => {
    if (uploadedImage && typeof URL !== 'undefined') {
      URL.revokeObjectURL(uploadedImage)
    }
  }, [uploadedImage])

  const handleProfitChange = (event) => {
    setProfitInput(event.target.value)
  }

  const handleProfitBlur = () => {
    const normalized = Math.max(0, Number(profitInput) || 0)
    setProfitInput(String(normalized))
  }

  const handleCarryChange = (event) => {
    setCarryInput(event.target.value)
  }

  const handleCarryBlur = () => {
    const normalized = clamp(Number(carryInput) || 0, 0, 100)
    setCarryInput(String(normalized))
  }

  const handleScenarioChange = (event) => {
    setScenario(event.target.value)
  }

  const handleRecalc = () => {
    handleProfitBlur()
    handleCarryBlur()
  }

  const handleAdvancedChange = (event) => {
    const { name, value } = event.target
    setAdvancedInputs((previous) => ({ ...previous, [name]: value }))
  }

  const handleAdvancedBlur = (event) => {
    const { name, value } = event.target
    if (name === 'date') {
      setAdvancedInputs((previous) => ({ ...previous, [name]: value.trim() }))
      return
    }

    const sanitized = sanitizeNumericInput(value)
    if (name === 'carry') {
      const numeric = sanitized ? clamp(Number(sanitized) || 0, 0, 100) : ''
      setAdvancedInputs((previous) => ({ ...previous, [name]: numeric === '' ? '' : String(numeric) }))
      if (numeric !== '') {
        setCarryInput(String(numeric))
      }
      return
    }

    setAdvancedInputs((previous) => ({ ...previous, [name]: sanitized }))
  }

  const scenarioAnalysis = useMemo(() => getScenarioAnalysis(scenario), [scenario])

  const handleDownload = () => {
    const profitValue = Math.max(0, Number(profitInput) || 0)
    const carryValue = clamp(Number(carryInput) || 0, 0, 100)
    const { founders, laura, damon } = calcSplit(profitValue, carryValue, scenarioAnalysis.weights)

    const rows = [
      [
        'Party',
        'Amount',
        'Profit',
        'Carry_%',
        'Scenario',
        'Capital_Days',
        'Scenario_Weight',
        'Moonshot_Weight',
      ],
      [
        'Founders (Yoni+Spence)',
        founders.toFixed(2),
        profitValue.toFixed(2),
        carryValue.toFixed(2),
        scenario,
        scenarioAnalysis.capitalDays.founders.toFixed(2),
        formatWeightForCsv(scenarioAnalysis.weights.F),
        formatWeightForCsv(normalizedWeights.founder),
      ],
      [
        'Laura',
        laura.toFixed(2),
        profitValue.toFixed(2),
        carryValue.toFixed(2),
        scenario,
        scenarioAnalysis.capitalDays.laura.toFixed(2),
        formatWeightForCsv(scenarioAnalysis.weights.L),
        formatWeightForCsv(normalizedWeights.investor),
      ],
      [
        'Damon',
        damon.toFixed(2),
        profitValue.toFixed(2),
        carryValue.toFixed(2),
        scenario,
        scenarioAnalysis.capitalDays.damon.toFixed(2),
        formatWeightForCsv(scenarioAnalysis.weights.D),
        formatWeightForCsv(normalizedWeights.moonbag),
      ],
    ]

    const csvContent = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'profit_split_founders_laura_damon.csv'
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const profitValue = Math.max(0, Number(profitInput) || 0)
  const carryValue = clamp(Number(carryInput) || 0, 0, 100)
  const { founders, laura, damon, total } = calcSplit(
    profitValue,
    carryValue,
    scenarioAnalysis.weights,
  )
  const totalWeight =
    scenarioAnalysis.weights.F + scenarioAnalysis.weights.L + scenarioAnalysis.weights.D
  const partyValues = { founders, laura, damon }
  const partyShares = {
    founders: total > 0 ? founders / total : 0,
    laura: total > 0 ? laura / total : 0,
    damon: total > 0 ? damon / total : 0,
  }
  const scenarioDetails = scenarioAnalysis.config

  const advancedNumbers = useMemo(
    () => ({
      walletSize: Number(advancedInputs.walletSize) || 0,
      pnl: Number(advancedInputs.pnl) || 0,
      unrealizedPnl: Number(advancedInputs.unrealizedPnl) || 0,
      totalTrades: Number(advancedInputs.totalTrades) || 0,
      winTrades: Number(advancedInputs.winTrades) || 0,
      lossTrades: Number(advancedInputs.lossTrades) || 0,
      carry: Number(advancedInputs.carry) || 0,
    }),
    [advancedInputs],
  )

  const combinedProfit = advancedNumbers.pnl + advancedNumbers.unrealizedPnl
  const investorPortion = 0.25
  const baseFounderPortion = 0.75
  const hasInvestorCapital = scenarioAnalysis.investorCapitalDays > 0
  const normalizedWeights = hasInvestorCapital
    ? {
        founder: baseFounderPortion,
        investor: investorPortion * scenarioAnalysis.investorWeights.laura,
        moonbag: investorPortion * scenarioAnalysis.investorWeights.damon,
      }
    : { founder: 1, investor: 0, moonbag: 0 }
  const investorPoolWeights = hasInvestorCapital
    ? scenarioAnalysis.investorWeights
    : { laura: 0, damon: 0 }

  const advancedDistribution = {
    founder: combinedProfit * normalizedWeights.founder,
    investor: combinedProfit * normalizedWeights.investor,
    moonbag: combinedProfit * normalizedWeights.moonbag,
  }

  const winRate = advancedNumbers.totalTrades > 0 ? advancedNumbers.winTrades / advancedNumbers.totalTrades : 0
  const lossRate = advancedNumbers.totalTrades > 0 ? advancedNumbers.lossTrades / advancedNumbers.totalTrades : 0
  const profitPerTrade = advancedNumbers.totalTrades > 0 ? advancedNumbers.pnl / advancedNumbers.totalTrades : 0
  const roi = advancedNumbers.walletSize > 0 ? combinedProfit / advancedNumbers.walletSize : 0

  const handleOcrUpload = async (event) => {
    const inputElement = event.target
    const file = inputElement.files?.[0]
    if (!file) {
      return
    }

    if (uploadedImage && typeof URL !== 'undefined') {
      URL.revokeObjectURL(uploadedImage)
    }

    const previewUrl = URL.createObjectURL(file)
    setUploadedImage(previewUrl)
    setActiveTab('ai')
    setOcrStatus('processing')
    setOcrProgress(0)
    setOcrError('')
    setOcrText('')

    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (message) => {
          if (message.status === 'recognizing text') {
            setOcrProgress(Math.round((message.progress || 0) * 100))
          }
        },
      })

      const text = result.data.text ?? ''
      setOcrText(text)
      const extracted = extractAdvancedFields(text)
      setAdvancedInputs((previous) => {
        const next = { ...previous }
        Object.entries(extracted).forEach(([key, value]) => {
          if (value !== '') {
            next[key] = value
          }
        })
        return next
      })

      if (extracted.pnl) {
        const pnlValue = Math.max(0, Number(extracted.pnl) || 0)
        setProfitInput(String(pnlValue))
      }

      if (extracted.carry) {
        setCarryInput(extracted.carry)
      }

      setOcrStatus('done')
    } catch (error) {
      setOcrStatus('error')
      setOcrError(error instanceof Error ? error.message : 'Failed to process the screenshot')
    } finally {
      inputElement.value = ''
    }
  }

  const handleResetOcr = () => {
    setAdvancedInputs(initialAdvancedInputs)
    setOcrStatus('idle')
    setOcrProgress(0)
    setOcrText('')
    setOcrError('')
    setAiReport('')
    if (uploadedImage && typeof URL !== 'undefined') {
      URL.revokeObjectURL(uploadedImage)
    }
    setUploadedImage(null)
  }

  const applyPnlToCalculator = () => {
    if (advancedInputs.pnl) {
      const pnlValue = Math.max(0, Number(advancedInputs.pnl) || 0)
      setProfitInput(String(pnlValue))
    }
    if (advancedInputs.carry) {
      const carryValueFromAdvanced = clamp(Number(advancedInputs.carry) || 0, 0, 100)
      setCarryInput(String(carryValueFromAdvanced))
    }
  }

  const handleGenerateReport = async () => {
    if (!aiKey) {
      setAiError('An API key is required to generate the executive report.')
      return
    }

    const endpoint = buildCompletionsUrl(aiBaseUrl)
    if (!endpoint) {
      setAiError('Provide a valid base URL for the AI provider.')
      return
    }

    setAiStatus('loading')
    setAiError('')

    const structuredData = {
      snapshotDate: advancedInputs.date || null,
      walletSize: advancedNumbers.walletSize,
      realizedPnl: advancedNumbers.pnl,
      unrealizedPnl: advancedNumbers.unrealizedPnl,
      totalTrades: advancedNumbers.totalTrades,
      winTrades: advancedNumbers.winTrades,
      lossTrades: advancedNumbers.lossTrades,
      carryPercent: advancedInputs.carry ? Number(advancedInputs.carry) : carryValue,
      roi,
      winRate,
      lossRate,
      profitPerTrade,
      founderWeight: normalizedWeights.founder,
      investorWeight: normalizedWeights.investor,
      moonbagWeight: normalizedWeights.moonbag,
      founderAllocation: advancedDistribution.founder,
      investorAllocation: advancedDistribution.investor,
      moonbagAllocation: advancedDistribution.moonbag,
      scenarioWeights: scenarioAnalysis.weights,
      capitalDays: scenarioAnalysis.capitalDays,
      totalCapitalDays: scenarioAnalysis.totalCapitalDays,
      investorCapitalDays: scenarioAnalysis.investorCapitalDays,
      investorPoolWeights,
      baseFounderPortion,
      investorPortion,
      capitalHistory: scenarioAnalysis.config.capitalHistory,
      capitalEvaluationDate: scenarioAnalysis.config.evaluationDate,
      scenario,
      calculator: {
        profitInput: profitValue,
        carryInput: carryValue,
        founders,
        laura,
        damon,
      },
    }

    const payload = {
      model: aiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are an executive assistant that explains quantitative trading performance and allocation outcomes in concise business terms.',
        },
        {
          role: 'user',
          content: [
            'Using the extracted Figment trading data below, craft a polished executive summary. Include:',
            '- A paragraph summarizing portfolio health, profit trends, and ROI.',
            '- Bullet points highlighting wallet size, realized vs. unrealized PnL, trade win/loss counts, and win rate.',
            '- Commentary on the founder / investor / moonbag allocation using the advanced distribution weights.',
            '- Insight that ties the allocation back to the current calculator scenario for Founders, Laura, and Damon.',
            '- Recommended next steps for the team.',
            '',
            'Data:',
            JSON.stringify(structuredData, null, 2),
          ].join('\n'),
        },
      ],
      temperature: clamp(Number(aiTemperature) || 0, 0, 1),
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null)
        const message = errorPayload?.error?.message || response.statusText || 'Failed to generate report.'
        throw new Error(message)
      }

      const json = await response.json()
      const content = json?.choices?.[0]?.message?.content
      if (!content) {
        throw new Error('The AI response did not contain any content.')
      }

      setAiReport(content)
      setAiStatus('done')
    } catch (error) {
      setAiStatus('error')
      setAiError(error instanceof Error ? error.message : 'Unable to generate the report.')
    }
  }

  return (
    <div className="app">
      <div className="status" aria-live="polite">
        <span className="dot ok" aria-hidden="true" />
        <div className="status-text">
          <strong>Toolkit ready.</strong>
          <span className="muted">
            Use the calculator for manual adjustments or switch to the AI hub to ingest screenshots and auto-build reports.
          </span>
        </div>
        <div className="status-actions" role="group" aria-label="Calculator actions">
          <button type="button" className="btn primary" onClick={handleRecalc}>
            Recalculate
          </button>
          <button type="button" className="btn ghost" onClick={handleDownload}>
            Download CSV
          </button>
          <button
            type="button"
            className={`btn ghost ${activeTab === 'ai' ? 'active' : ''}`.trim()}
            onClick={() => setActiveTab('ai')}
          >
            Open AI query
          </button>
        </div>
      </div>

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Founders Fund</p>
          <h1>Time-weighted profit split &amp; AI insight center</h1>
          <p className="muted">
            Based on capital-days and a configurable carry on Laura &amp; Damon profits (carry routes to Founders). Damon can be
            toggled between deployed or not deployed. The AI query hub can parse Figment screenshots, auto-populate the advanced
            metrics, and draft an executive report backed by ChatGPT-compatible models.
          </p>
        </div>
      </header>

      <div className="tabs" role="tablist" aria-label="Application views">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`${tab.key}-tab`}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`${tab.key}-panel`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' ? (
        <div className="layout" role="tabpanel" id="calculator-panel" aria-labelledby="calculator-tab">
          <section className="panel inputs">
            <h2>Allocation inputs</h2>
            <p className="muted">
              Set the realized profit, the carry percentage allocated to Founders, and Damon&apos;s deployment status. Recalculate to lock
              values within their allowed ranges.
            </p>

            <div className="grid">
              <div className="field">
                <label htmlFor="profitInput">Profit (P)</label>
                <input
                  id="profitInput"
                  type="number"
                  step="1"
                  min="0"
                  value={profitInput}
                  onChange={handleProfitChange}
                  onBlur={handleProfitBlur}
                />
              </div>

              <div className="field">
                <label htmlFor="carryInput">Carry on Laura &amp; Damon (%)</label>
                <input
                  id="carryInput"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={carryInput}
                  onChange={handleCarryChange}
                  onBlur={handleCarryBlur}
                />
              </div>

              <div className="field">
                <label htmlFor="scenario">Damon status</label>
                <select id="scenario" value={scenario} onChange={handleScenarioChange} aria-describedby="scenarioDescription">
                  {SCENARIOS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="help muted" id="scenarioDescription">
                  {scenarioDetails.summary}
                </p>
              </div>
            </div>

            <div className="weights muted" aria-live="polite">
              Weights → Founders: {formatPercent(scenarioAnalysis.weights.F)}, Laura: {formatPercent(
                scenarioAnalysis.weights.L,
              )}, Damon: {formatPercent(scenarioAnalysis.weights.D)} (sum {(totalWeight * 100).toFixed(2)}%)
            </div>
          </section>

          <section className="panel results">
            <h2>Distribution overview</h2>
            <p className="muted">
              Scenario: <span className="pill">{scenarioDetails.label}</span>
            </p>
            <p className="muted">
              Investor-class weights for this snapshot come from the capital-day ledger below. The moonshot pool locks 75% to the
              Founders and distributes the remaining 25% across Laura and Damon based on their time-weighted capital.
            </p>

            <div className="legend" role="list" aria-label="Party color legend">
              {PARTIES.map((party) => {
                const weightKey = PARTY_WEIGHT_KEYS[party.key]
                return (
                  <span key={party.key} className="lg" role="listitem">
                    <span className={`sw ${party.className}`} aria-hidden="true" />
                    <span>
                      {party.label} • Weight {formatPercent(scenarioAnalysis.weights[weightKey])}
                    </span>
                  </span>
                )
              })}
            </div>

            <div className="stat-cards">
              {PARTIES.map((party) => {
                const value = partyValues[party.key]
                const share = partyShares[party.key]
                const weightKey = PARTY_WEIGHT_KEYS[party.key]
                const weightValue = scenarioAnalysis.weights[weightKey]
                return (
                  <article key={party.key} className={`stat-card ${party.className}`}>
                    <header className="stat-header">{party.label}</header>
                    <div className="stat-amount">{formatCurrency(value)}</div>
                    <dl className="stat-meta">
                      <div>
                        <dt>Share of profit</dt>
                        <dd>{formatPercent(share)}</dd>
                      </div>
                      <div>
                        <dt>Scenario weight</dt>
                        <dd>{formatPercent(weightValue)}</dd>
                      </div>
                    </dl>
                  </article>
                )
              })}
            </div>

            <div className="bars" role="list" aria-label="Profit share by party">
              {PARTIES.map((party) => {
                const value = partyValues[party.key]
                const width = total > 0 ? (value / total) * 100 : 0
                return (
                  <div className="bar-row" role="listitem" key={party.key}>
                    <div className="bar-label">{party.label}</div>
                    <div className="bar-track" aria-hidden="true">
                      <div className={`bar-fill ${party.className}`} style={{ width: `${width}%` }} />
                    </div>
                    <div className="bar-value">{formatCurrency(value)}</div>
                  </div>
                )
              })}
            </div>

            <div className="stacked">
              <div className="bar-row">
                <div className="bar-label">Stacked (Total Profit)</div>
                <div className="bar-track" aria-hidden="true">
                  <div className="segment founders" style={{ width: `${total > 0 ? (founders / total) * 100 : 0}%` }} />
                  <div className="segment laura" style={{ width: `${total > 0 ? (laura / total) * 100 : 0}%` }} />
                  <div className="segment damon" style={{ width: `${total > 0 ? (damon / total) * 100 : 0}%` }} />
                </div>
                <div className="bar-value">{formatCurrency(total)}</div>
              </div>
            </div>

            <div className="formulas muted" aria-live="polite">
              <div className="formula-head">Formulas (P = profit, c = carry as decimal)</div>
              <ul>
                <li>
                  Founders = P×W<sub>F</sub> + c×P×(W<sub>L</sub> + W<sub>D</sub>)
                </li>
                <li>
                  Laura = (1 − c)×P×W<sub>L</sub>
                </li>
                <li>
                  Damon = (1 − c)×P×W<sub>D</sub>
                </li>
              </ul>
            </div>
          </section>
          <AdvancedFieldsSection
            title="Investor class allocations"
            description="Snapshot metrics drive a locked 75% / 25% moonshot allocation. Founders receive the base share while investor capital-days split the remaining pool across Laura and Damon."
            advancedInputs={advancedInputs}
            normalizedWeights={normalizedWeights}
            advancedDistribution={advancedDistribution}
            advancedNumbers={advancedNumbers}
            combinedProfit={combinedProfit}
            roi={roi}
            winRate={winRate}
            lossRate={lossRate}
            profitPerTrade={profitPerTrade}
            onAdvancedChange={handleAdvancedChange}
            onAdvancedBlur={handleAdvancedBlur}
            capitalDays={scenarioAnalysis.capitalDays}
            investorPoolWeights={investorPoolWeights}
            capitalHistory={scenarioAnalysis.config.capitalHistory}
            evaluationDate={scenarioAnalysis.config.evaluationDate}
            baseFounderPortion={baseFounderPortion}
            investorPortion={investorPortion}
            isWide
          />
        </div>
      ) : (
        <div className="ai-layout" role="tabpanel" id="ai-panel" aria-labelledby="ai-tab">
          <section className="panel ai-panel">
            <h2>Upload &amp; OCR</h2>
            <p className="muted">
              Drop a Figment dashboard screenshot to automatically extract wallet size, PnL, trade counts, and carry. All OCR runs in the
              browser via Tesseract.js.
            </p>
            <label className={`upload-zone ${ocrStatus === 'processing' ? 'uploading' : ''}`}>
              <input type="file" accept="image/*" onChange={handleOcrUpload} />
              <span>
                <strong>Click to upload</strong>
                <span className="muted">PNG, JPG, and GIF files supported. Drag &amp; drop is welcome.</span>
              </span>
            </label>
            {ocrStatus === 'processing' ? (
              <div className="progress" role="status" aria-live="polite">
                <div className="progress-track" aria-hidden="true">
                  <div className="progress-bar" style={{ width: `${ocrProgress}%` }} />
                </div>
                <span className="progress-text">Recognizing text… {ocrProgress}%</span>
              </div>
            ) : null}
            {ocrStatus === 'done' ? (
              <p className="muted" role="status">
                OCR complete. Review the extracted metrics below and adjust anything that needs refinement.
              </p>
            ) : null}
            {ocrStatus === 'error' ? (
              <p className="error-text" role="alert">
                {ocrError}
              </p>
            ) : null}
            {uploadedImage ? (
              <div className="preview">
                <img src={uploadedImage} alt="Uploaded Figment screenshot" className="ocr-preview" />
              </div>
            ) : null}
            {ocrText ? (
              <div className="ocr-output-wrapper">
                <label htmlFor="ocrText" className="muted">
                  Raw OCR output
                </label>
                <textarea id="ocrText" className="ocr-output" value={ocrText} readOnly />
              </div>
            ) : null}
            <div className="upload-actions">
              <button type="button" className="btn ghost" onClick={handleResetOcr}>
                Reset OCR data
              </button>
              <button type="button" className="btn primary" onClick={applyPnlToCalculator}>
                Apply to calculator inputs
              </button>
            </div>
          </section>

          <AdvancedFieldsSection
            title="Advanced calculator fields"
            description="Values pulled from OCR are editable. The resulting moonshot allocation is locked to 75% Founders / 25% investor pool, with the investor share weighted by capital-days."
            advancedInputs={advancedInputs}
            normalizedWeights={normalizedWeights}
            advancedDistribution={advancedDistribution}
            advancedNumbers={advancedNumbers}
            combinedProfit={combinedProfit}
            roi={roi}
            winRate={winRate}
            lossRate={lossRate}
            profitPerTrade={profitPerTrade}
            onAdvancedChange={handleAdvancedChange}
            onAdvancedBlur={handleAdvancedBlur}
            capitalDays={scenarioAnalysis.capitalDays}
            investorPoolWeights={investorPoolWeights}
            capitalHistory={scenarioAnalysis.config.capitalHistory}
            evaluationDate={scenarioAnalysis.config.evaluationDate}
            baseFounderPortion={baseFounderPortion}
            investorPortion={investorPortion}
            isWide
          />

          <section className="panel ai-panel">
            <h2>AI-generated executive report</h2>
            <p className="muted">
              Use your own OpenAI-compatible API key. Nothing is sent until you press generate. Responses are stored only in this browser
              session.
            </p>
            <div className="advanced-grid ai-config">
              <div className="field">
                <label htmlFor="aiKey">API key</label>
                <input
                  id="aiKey"
                  type="password"
                  value={aiKey}
                  onChange={(event) => setAiKey(event.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="field">
                <label htmlFor="aiBaseUrl">Base URL</label>
                <input
                  id="aiBaseUrl"
                  type="text"
                  value={aiBaseUrl}
                  onChange={(event) => setAiBaseUrl(event.target.value)}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="field">
                <label htmlFor="aiModel">Model</label>
                <input
                  id="aiModel"
                  type="text"
                  value={aiModel}
                  onChange={(event) => setAiModel(event.target.value)}
                  placeholder="gpt-4o-mini"
                />
              </div>
              <div className="field">
                <label htmlFor="aiTemperature">Temperature</label>
                <input
                  id="aiTemperature"
                  type="text"
                  inputMode="decimal"
                  value={aiTemperature}
                  onChange={(event) => setAiTemperature(event.target.value)}
                  placeholder="0.2"
                />
              </div>
            </div>
            <div className="ai-report">
              <label htmlFor="aiReport" className="muted">
                Executive report draft
              </label>
              <textarea
                id="aiReport"
                value={aiReport}
                onChange={(event) => setAiReport(event.target.value)}
                placeholder="Generate a report to populate this area."
              />
            </div>
            {aiError ? (
              <p className="error-text" role="alert">
                {aiError}
              </p>
            ) : null}
            {aiStatus === 'loading' ? (
              <p className="muted" role="status">
                Generating executive summary…
              </p>
            ) : null}
            <div className="upload-actions">
              <button
                type="button"
                className="btn primary"
                onClick={handleGenerateReport}
                disabled={aiStatus === 'loading'}
              >
                {aiStatus === 'loading' ? 'Working…' : 'Generate executive report'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
