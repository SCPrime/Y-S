import { useEffect, useMemo, useState } from 'react'
codex/expand-parsedate-for-new-regex-patterns
import Tesseract from 'tesseract.js'
import { useEffect, useMemo, useState } from 'react'
import { runOcr, clamp, initialAdvancedInputs, parseMetrics, sanitizeParsedMetrics } from './lib/ocr'
import './App.css'
import { normalizeWeightInputs } from './lib/weights'
import { calcSplit, calculateAdvancedMetrics, parseAdvancedInputs } from './lib/alloc'

// weights used by the scenarios UI
const WEIGHTS = {
  notdeployed: { F: 340 / 515, L: 175 / 515, D: 0 / 515 },
  deployed:    { F: 340 / 570, L: 175 / 570, D: 55 / 570 },
}

import { llmOcrTextExtract, llmVisionExtractFromImage } from './lib/ai'


codex/create-image-preprocessing-and-metrics-parser
import { runOcr, clamp, initialAdvancedInputs, parseMetrics, sanitizeParsedMetrics } from './lib/ocr.js'
 main

import { useEffect, useMemo, useState } from 'react'
import { runOcr, clamp, initialAdvancedInputs, parseMetrics, sanitizeParsedMetrics } from './lib/ocr'
import './App.css'

// weights + allocation helpers
import { normalizeWeightInputs, computeCapitalDayWeights, normalizeClasses } from './lib/weights'
import { calcSplit, calculateAdvancedMetrics, parseAdvancedInputs, allocateProfit, computeMoonshotDistribution } from './lib/alloc'
import { applyFees } from './lib/fees'

// weights used by the scenarios UI
main
main
const WEIGHTS = {
  notdeployed: { F: 340 / 515, L: 175 / 515, D: 0 / 515 },
  deployed:    { F: 340 / 570, L: 175 / 570, D: 55 / 570 },
}
codex/expand-parsedate-for-new-regex-patterns


main


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

const SCENARIOS = [
  {
    key: 'notdeployed',
    label: 'Not deployed (0 weight)',
    summary:
      'Damon is not deployed; his capital weight is zero so his carry routes to Founders.',
    damonDeployed: false,
    asOf: '2025-12-31',
    contributions: [
      { party: 'founders', capitalDays: 340 },
      { party: 'laura', capitalDays: 175 },
    ],
  },
  {
    key: 'deployed',
    label: 'Deployed on 2025-08-02 (5,000 capital)',
    summary:
      'Damon is actively deployed and receives a positive weight based on his 5,000 capital contribution.',
    damonDeployed: true,
    asOf: '2025-12-31',
    contributions: [
      { party: 'founders', capitalDays: 340 },
      { party: 'laura', capitalDays: 175 },
      { party: 'damon', capitalDays: 55 },
    ],
  },
]

const TABS = [
  { key: 'calculator', label: 'Profit split calculator' },
  { key: 'ai', label: 'AI query & OCR hub' },
]

const SCENARIO_LOOKUP = Object.fromEntries(SCENARIOS.map((scenario) => [scenario.key, scenario]))

const SCENARIO_WEIGHT_RESULTS = Object.fromEntries(
  SCENARIOS.map((scenario) => [
    scenario.key,
    computeCapitalDayWeights(scenario.contributions ?? [], scenario.asOf ?? new Date()),
  ]),
)

const DEFAULT_WEIGHT_RESULT = {
  weights: { F: 0, L: 0, D: 0 },
  capitalDays: { F: 0, L: 0, D: 0 },
  totalCapitalDays: 0,
}

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
  entryFee: '',
  managementFee: '',
}

const initialWeightInputs = {
  founder: '50',
  investor: '35',
  moonbag: '15',
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
  const date = parseDate(normalizedText)

      }
    }
  }


 main

  return {
    walletSize,
    pnl,
    unrealizedPnl,
    totalTrades,
    winTrades,
    lossTrades,
    date,
    carry,
codex/expand-parsedate-for-new-regex-patterns
  }
}


main

    entryFee,
    managementFee,
  }
}


main
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
  weightInputs,
  normalizedWeights,
  weightSum,
  advancedDistribution,
  advancedNumbers,
  combinedProfit,
  netAdvancedProfit,
  feeBreakdown,
  roi,
  netRoi,
  winRate,
  lossRate,
  profitPerTrade,
  moonshotDistribution,
  onAdvancedChange,
  onAdvancedBlur,
  onWeightChange,
  onWeightBlur,
  damonDeployed,
  isWide = false,
}) {
  const panelClasses = ['panel', 'ai-panel', 'advanced-panel']
  if (isWide) {
    panelClasses.push('full-span')
  }

  const snapshotLabel = advancedInputs.date ? `Snapshot: ${advancedInputs.date}` : 'Snapshot date pending'

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
          <label htmlFor="entryFee">Entry fee (%)</label>
          <input
            id="entryFee"
            name="entryFee"
            type="text"
            inputMode="decimal"
            value={advancedInputs.entryFee}
            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="2"
          />
        </div>
        <div className="field">
          <label htmlFor="managementFee">Management fee (%)</label>
          <input
            id="managementFee"
const advancedNumbers = useMemo(
  () => parseAdvancedInputs(advancedInputs),
  [advancedInputs],
)

            onChange={onAdvancedChange}
            onBlur={onAdvancedBlur}
            placeholder="2025-01-18"
          />
        </div>
      </div>

      <div className="weights-grid">
        <div className="field">
          <label htmlFor="founderWeight">Founder weight</label>
          <input
            id="founderWeight"
            name="founder"
            type="text"
            inputMode="decimal"
            value={weightInputs.founder}
            onChange={onWeightChange}
            onBlur={onWeightBlur}
          />
        </div>
        <div className="field">
          <label htmlFor="investorWeight">Investor weight</label>
          <input
            id="investorWeight"
            name="investor"
            type="text"
            inputMode="decimal"
            value={weightInputs.investor}
            onChange={onWeightChange}
            onBlur={onWeightBlur}
          />
        </div>
        <div className="field">
          <label htmlFor="moonbagWeight">Moonbag weight</label>
          <input
            id="moonbagWeight"
            name="moonbag"
            type="text"
            inputMode="decimal"
            value={weightInputs.moonbag}
            onChange={onWeightChange}
            onBlur={onWeightBlur}
          />
        </div>
        <div className="weights-summary muted" aria-live="polite">
          Normalized weights (raw sum {weightSum.toFixed(2)}) → Founder {formatPercent(normalizedWeights.founder)}, Investor{' '}
          {formatPercent(normalizedWeights.investor)}, Moonbag {formatPercent(normalizedWeights.moonbag)}
        </div>
      </div>

      <p className="advanced-note muted">
        Entry and management fees reduce the combined pool before weights are applied. Entry dollars map to Founders, management
        dollars map to Laura, and the moonbag routes to Damon.
      </p>

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
                <dt>Share of net pool</dt>
                <dd>
                  {netAdvancedProfit !== 0
                    ? formatPercent((advancedDistribution[classification.key] / netAdvancedProfit || 0))
                    : formatPercent(0)}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="moonshot-section">
        <h3>Moonshot 75/25 distribution</h3>
        <p className="muted moonshot-note">
          75% of the net pool routes to investor classes using the management and moonbag weights. Damon&apos;s share routes to
          Founders when he is not deployed.
        </p>
        <div className="stat-cards">
          {PARTIES.map((party) => {
            const moonshotValue = moonshotDistribution[party.key] || 0
            const moonshotShare =
              moonshotDistribution.total > 0 ? moonshotValue / moonshotDistribution.total : 0
            return (
              <article key={`moonshot-${party.key}`} className={`stat-card ${party.className}`}>
                <header className="stat-header">{party.label}</header>
                <div className="stat-amount">{formatCurrency(moonshotValue)}</div>
                <dl className="stat-meta">
                  <div>
                    <dt>Share of moonshot pool</dt>
                    <dd>{formatPercent(moonshotShare)}</dd>
                  </div>
                  {party.key === 'founders' ? (
                    <>
                      <div>
                        <dt>Base 25%</dt>
                        <dd>{formatCurrency(moonshotDistribution.baseFounderShare)}</dd>
                      </div>
                      {moonshotDistribution.routed.investorPoolToFounders > 0 ||
                      moonshotDistribution.routed.damonToFounders > 0 ? (
                        <div>
                          <dt>Additional routing</dt>
                          <dd>
                            {formatCurrency(
                              moonshotDistribution.routed.investorPoolToFounders +
                                moonshotDistribution.routed.damonToFounders,
                            )}
                          </dd>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {party.key === 'damon' && !damonDeployed ? (
                    <div>
                      <dt>Routed to Founders</dt>
                      <dd>{formatCurrency(moonshotDistribution.routed.damonToFounders)}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            )
          })}
        </div>
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
            <dt>Entry fee</dt>
            <dd>
              {formatCurrency(feeBreakdown.entryFee)} ({formatPercent(feeBreakdown.rates.entryFee)})
            </dd>
          </div>
          <div>
            <dt>Management fee</dt>
            <dd>
              {formatCurrency(feeBreakdown.managementFee)} ({formatPercent(feeBreakdown.rates.managementFee)})
            </dd>
          </div>
          <div>
            <dt>Total fees</dt>
            <dd>{formatCurrency(feeBreakdown.totalFees)}</dd>
          </div>
          <div>
            <dt>Net PnL after fees</dt>
            <dd>{formatCurrency(netAdvancedProfit)}</dd>
          </div>
          <div>
            <dt>ROI vs. wallet (gross)</dt>
            <dd>{formatPercent(roi)}</dd>
          </div>
          <div>
            <dt>ROI vs. wallet (net)</dt>
            <dd>{formatPercent(netRoi)}</dd>
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
  const [weightInputs, setWeightInputs] = useState(initialWeightInputs)
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
  const [useAiVision, setUseAiVision] = useState(false)
  const [useAiExtraction, setUseAiExtraction] = useState(false)

  const aiConfig = useMemo(() => {
    const apiKey = aiKey.trim()
    const baseUrl = aiBaseUrl.trim().replace(/\/+$/, '')
    const model = aiModel.trim()
    return { apiKey, baseUrl, model }
  }, [aiKey, aiBaseUrl, aiModel])

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

    if (name === 'entryFee' || name === 'managementFee') {
      const numeric = sanitized ? clamp(Number(sanitized) || 0, 0, 100) : ''
      setAdvancedInputs((previous) => ({ ...previous, [name]: numeric === '' ? '' : String(numeric) }))
      return
    }

    setAdvancedInputs((previous) => ({ ...previous, [name]: sanitized }))
  }

  const handleWeightChange = (event) => {
    const { name, value } = event.target
    setWeightInputs((previous) => ({ ...previous, [name]: value }))
  }

  const handleWeightBlur = (event) => {
    const { name, value } = event.target
    const sanitized = sanitizeNumericInput(value)
    setWeightInputs((previous) => ({ ...previous, [name]: sanitized }))
  }

  const handleDownload = () => {
    const profitValue = Math.max(0, Number(profitInput) || 0)
    const carryValue = clamp(Number(carryInput) || 0, 0, 100)
    const scenarioDetailsDownload = SCENARIO_LOOKUP[scenario] ?? SCENARIOS[0]
    const weightResult =
      SCENARIO_WEIGHT_RESULTS[scenarioDetailsDownload.key] ?? DEFAULT_WEIGHT_RESULT
    const allocationResult = allocateProfit({
      realizedPnl: profitValue,
      carryPercent: carryValue,
      weights: weightResult.weights,
      damonDeployed: scenarioDetailsDownload.damonDeployed,
    })

    const {
      founders: calcFounders,
      laura: calcLaura,
      damon: calcDamon,
      weights: splitWeights = {},
      breakdown: splitBreakdown = {},
    } = calcSplit(profitValue, carryValue, scenario) ?? {}

    const formatBreakdownValue = (value) => {
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toFixed(2) : ''
      }
      if (value === null || value === undefined) {
        return ''
      }
      return String(value)
    }

    const formatAmount = (value, fallback) => {
      const numeric = Number(value)
      if (Number.isFinite(numeric)) {
        return numeric.toFixed(2)
      }
      const fallbackNumeric = Number(fallback)
      return Number.isFinite(fallbackNumeric) ? fallbackNumeric.toFixed(2) : '0.00'
    }

    const mergedWeights = {
      F:
        typeof splitWeights?.F === 'number'
          ? splitWeights.F
          : weightResult.weights?.F ?? 0,
      L:
        typeof splitWeights?.L === 'number'
          ? splitWeights.L
          : weightResult.weights?.L ?? 0,
      D:
        typeof splitWeights?.D === 'number'
          ? splitWeights.D
          : weightResult.weights?.D ?? 0,
    }

    const formattedWeights = {
      F: formatWeightForCsv(mergedWeights.F ?? 0),
      L: formatWeightForCsv(mergedWeights.L ?? 0),
      D: formatWeightForCsv(mergedWeights.D ?? 0),
    }

    const fallbackBreakdown = {
      founders: {
        netAmount: allocationResult.parties.founders,
        baseOrGross: allocationResult.founders?.base ?? 0,
        preFeeAmount:
          (allocationResult.founders?.base ?? 0) +
          (allocationResult.founders?.routedFromDamon ?? 0) +
          (allocationResult.carryBreakdown?.total ?? 0),
        carryToFounders: allocationResult.carryBreakdown?.total ?? 0,
        entryFeeComponent: 0,
        managementFeeComponent: 0,
      },
      laura: {
        netAmount: allocationResult.investorBreakdown.laura?.net ?? 0,
        baseOrGross: allocationResult.investorBreakdown.laura?.gross ?? 0,
        preFeeAmount: allocationResult.investorBreakdown.laura?.gross ?? 0,
        carryToFounders: allocationResult.investorBreakdown.laura?.carry ?? 0,
        entryFeeComponent: 0,
        managementFeeComponent: 0,
      },
      damon: {
        netAmount: allocationResult.investorBreakdown.damon?.net ?? 0,
        baseOrGross: allocationResult.investorBreakdown.damon?.gross ?? 0,
        preFeeAmount:
          allocationResult.investorBreakdown.damon?.effectiveGross ??
          allocationResult.investorBreakdown.damon?.gross ??
          0,
        carryToFounders:
          (allocationResult.investorBreakdown.damon?.carry ?? 0) +
          (allocationResult.investorBreakdown.damon?.routedToFounders ?? 0),
        entryFeeComponent: 0,
        managementFeeComponent: 0,
      },
    }

    const mergedBreakdown = {
      founders: {
        ...fallbackBreakdown.founders,
        ...(splitBreakdown.founders ?? {}),
      },
      laura: {
        ...fallbackBreakdown.laura,
        ...(splitBreakdown.laura ?? {}),
      },
      damon: {
        ...fallbackBreakdown.damon,
        ...(splitBreakdown.damon ?? {}),
      },
    }

    const formattedProfit = profitValue.toFixed(2)
    const formattedCarry = carryValue.toFixed(2)
    const totals = allocationResult.totals
    const capitalDays = weightResult.capitalDays

    const header = [
      'Party',
      'Net_Amount',
      'Base_or_Gross',
      'Pre_Fee_Amount',
      'Carry_To_Founders',
      'Entry_Fee_Component',
      'Mgmt_Fee_Component',
      'Amount',
      'Profit',
      'Carry_%',
      'Scenario',
      'W_Founders',
      'W_Laura',
      'W_Damon',
      'Carry_Total',
      'Profit_After_Carry',
      'Investor_Net',
      'CapitalDays_F',
      'CapitalDays_L',
      'CapitalDays_D',
    ]

    const rows = [
      header,
      [
        'Founders (Yoni+Spence)',
        formatBreakdownValue(mergedBreakdown.founders.netAmount),
        formatBreakdownValue(mergedBreakdown.founders.baseOrGross),
        formatBreakdownValue(mergedBreakdown.founders.preFeeAmount),
        formatBreakdownValue(mergedBreakdown.founders.carryToFounders),
        formatBreakdownValue(mergedBreakdown.founders.entryFeeComponent),
        formatBreakdownValue(mergedBreakdown.founders.managementFeeComponent),
        formatAmount(calcFounders, allocationResult.parties.founders),
        formattedProfit,
        formattedCarry,
        scenario,
        formattedWeights.F,
        formattedWeights.L,
        formattedWeights.D,
        totals.carry.toFixed(2),
        totals.afterCarry.toFixed(2),
        totals.investorNet.toFixed(2),
        capitalDays.F.toFixed(2),
        capitalDays.L.toFixed(2),
        capitalDays.D.toFixed(2),
      ],
      [
        'Laura',
        formatBreakdownValue(mergedBreakdown.laura.netAmount),
        formatBreakdownValue(mergedBreakdown.laura.baseOrGross),
        formatBreakdownValue(mergedBreakdown.laura.preFeeAmount),
        formatBreakdownValue(mergedBreakdown.laura.carryToFounders),
        formatBreakdownValue(mergedBreakdown.laura.entryFeeComponent),
        formatBreakdownValue(mergedBreakdown.laura.managementFeeComponent),
        formatAmount(calcLaura, allocationResult.parties.laura),
        formattedProfit,
        formattedCarry,
        scenario,
        formattedWeights.F,
        formattedWeights.L,
        formattedWeights.D,
        totals.carry.toFixed(2),
        totals.afterCarry.toFixed(2),
        totals.investorNet.toFixed(2),
        capitalDays.F.toFixed(2),
        capitalDays.L.toFixed(2),
        capitalDays.D.toFixed(2),
      ],
      [
        'Damon',
        formatBreakdownValue(mergedBreakdown.damon.netAmount),
        formatBreakdownValue(mergedBreakdown.damon.baseOrGross),
        formatBreakdownValue(mergedBreakdown.damon.preFeeAmount),
        formatBreakdownValue(mergedBreakdown.damon.carryToFounders),
        formatBreakdownValue(mergedBreakdown.damon.entryFeeComponent),
        formatBreakdownValue(mergedBreakdown.damon.managementFeeComponent),
        formatAmount(calcDamon, allocationResult.parties.damon),
        formattedProfit,
        formattedCarry,
        scenario,
        formattedWeights.F,
        formattedWeights.L,
        formattedWeights.D,
        totals.carry.toFixed(2),
        totals.afterCarry.toFixed(2),
        totals.investorNet.toFixed(2),
        capitalDays.F.toFixed(2),
        capitalDays.L.toFixed(2),
        capitalDays.D.toFixed(2),
      ],
    ]

    const csvContent = rows
      .map((row) =>
        row
          .map((value) => {
            const stringValue = value === null || value === undefined ? '' : String(value)
            return `"${stringValue.replace(/"/g, '""')}"`
          })
          .join(','),
      )
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const downloadUrl = URL.createObjectURL(blob)
    const downloadLink = document.createElement('a')
    downloadLink.href = downloadUrl
    downloadLink.setAttribute('download', `profit_split_${scenario}.csv`)
    downloadLink.click()
    URL.revokeObjectURL(downloadUrl)
  }

  const handleResetOcr = () => {
    setAdvancedInputs(initialAdvancedInputs)
    setWeightInputs(initialWeightInputs)
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
    if (!aiConfig.apiKey) {
      setAiError('An API key is required to generate the executive report.')
      return
    }

    if (!aiConfig.model) {
      setAiError('Provide a valid model for the AI provider.')
      return
    }

    const endpoint = buildCompletionsUrl(aiConfig.baseUrl)
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
      entryFeePercent: advancedNumbers.entryFee,
      managementFeePercent: advancedNumbers.managementFee,
      combinedProfit,
      netAdvancedProfit,
      feeBreakdown,
      roi,
      netRoi,
      winRate,
      lossRate,
      profitPerTrade,
      classWeights: normalizedWeights,
      rawWeightSum: weightSum,
      advancedDistribution,
      moonshotDistribution,
      capitalDayWeights: weights,
      capitalDayTotals: capitalDays,
      scenario,
      damonDeployed: scenarioDetails.damonDeployed,
      allocation: {
        parties: allocation.parties,
        totals: allocation.totals,
        carryBreakdown: allocation.carryBreakdown,
        investorBreakdown: allocation.investorBreakdown,
        founders: allocation.founders,
      },
      calculator: {
        profitInput: profitValue,
        carryInput: carryValue,
        distribution: allocation.parties,
        carryRouted: allocation.carryBreakdown.total,
      },
    }

    const payload = {
      model: aiConfig.model,
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
          Authorization: `Bearer ${aiConfig.apiKey}`,
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
              Capital-day weights → Founders: {formatPercent(weights.F)} ({capitalDays.F.toFixed(0)} units), Laura:{' '}
              {formatPercent(weights.L)} ({capitalDays.L.toFixed(0)} units), Damon: {formatPercent(weights.D)} ({capitalDays.D.toFixed(0)}
              {' '}units) (sum {(totalWeight * 100).toFixed(2)}%, total {totalCapitalDays.toFixed(0)} units)
            </div>
          </section>

          <section className="panel results">
            <h2>Distribution overview</h2>
            <p className="muted">
              Scenario: <span className="pill">{scenarioDetails.label}</span>
            </p>
            <p className="muted">
              Investor-class weights for this snapshot come from the section below. Use the entry, management, and moonbag inputs
              to align Founders, Laura, and Damon allocations with the current calculator state.
            </p>

            <div className="legend" role="list" aria-label="Party color legend">
              {PARTIES.map((party) => {
                const weightKey = PARTY_WEIGHT_KEYS[party.key]
                return (
                  <span key={party.key} className="lg" role="listitem">
                    <span className={`sw ${party.className}`} aria-hidden="true" />
                    <span>
                      {party.label} • Weight {formatPercent(weights[weightKey])}
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
                const weightValue = weights[weightKey]
                return (
                  <article key={party.key} className={`stat-card ${party.className}`}>
                    <header className="stat-header">{party.label}</header>
                    <div className="stat-amount">{formatCurrency(value)}</div>
                    <dl className="stat-meta">
                      <div>
                        <dt>Capital weight</dt>
                        <dd>{formatPercent(weightValue)}</dd>
                      </div>
                      <div>
                        <dt>Share of profit</dt>
                        <dd>{formatPercent(share)}</dd>
                      </div>
                      {party.key === 'founders' ? (
                        <>
                          <div>
                            <dt>Carry captured</dt>
                            <dd>{formatCurrency(allocation.carryBreakdown.total)}</dd>
                          </div>
                          {allocation.founders.routedFromDamon > 0 ? (
                            <div>
                              <dt>Routed from Damon</dt>
                              <dd>{formatCurrency(allocation.founders.routedFromDamon)}</dd>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                      {party.key === 'laura' ? (
                        <>
                          <div>
                            <dt>Gross before carry</dt>
                            <dd>{formatCurrency(allocation.investorBreakdown.laura.gross)}</dd>
                          </div>
                          <div>
                            <dt>Carry paid</dt>
                            <dd>{formatCurrency(allocation.investorBreakdown.laura.carry)}</dd>
                          </div>
                        </>
                      ) : null}
                      {party.key === 'damon'
                        ? scenarioDetails.damonDeployed
                          ? (
                              <>
                                <div>
                                  <dt>Gross before carry</dt>
                                  <dd>{formatCurrency(allocation.investorBreakdown.damon.effectiveGross)}</dd>
                                </div>
                                <div>
                                  <dt>Carry paid</dt>
                                  <dd>{formatCurrency(allocation.investorBreakdown.damon.carry)}</dd>
                                </div>
                              </>
                            )
                          : (
                              <div>
                                <dt>Routed to Founders</dt>
                                <dd>{formatCurrency(allocation.investorBreakdown.damon.routedToFounders)}</dd>
                              </div>
                            )
                        : null}
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
                  <div
                    className="segment founders"
                    style={{ width: `${total > 0 ? (partyValues.founders / total) * 100 : 0}%` }}
                  />
                  <div
                    className="segment laura"
                    style={{ width: `${total > 0 ? (partyValues.laura / total) * 100 : 0}%` }}
                  />
                  <div
                    className="segment damon"
                    style={{ width: `${total > 0 ? (partyValues.damon / total) * 100 : 0}%` }}
                  />
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
            description="Assign snapshot dollars, dates, and weights for the entry, management, and moonbag classes. These values drive the allocations that flow to Founders, Laura, and Damon."
            advancedInputs={advancedInputs}
            weightInputs={weightInputs}
            normalizedWeights={normalizedWeights}
            weightSum={weightSum}
            advancedDistribution={advancedDistribution}
            advancedNumbers={advancedNumbers}
            combinedProfit={combinedProfit}
            netAdvancedProfit={netAdvancedProfit}
            feeBreakdown={feeBreakdown}
            roi={roi}
            netRoi={netRoi}
            winRate={winRate}
            lossRate={lossRate}
            profitPerTrade={profitPerTrade}
            moonshotDistribution={moonshotDistribution}
            onAdvancedChange={handleAdvancedChange}
            onAdvancedBlur={handleAdvancedBlur}
            onWeightChange={handleWeightChange}
            onWeightBlur={handleWeightBlur}
            damonDeployed={scenarioDetails.damonDeployed}
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
            <div className="ai-options" role="group" aria-label="AI extraction options">
              <label className="ai-toggle">
                <input
                  type="checkbox"
                  checked={useAiVision}
                  onChange={(event) => setUseAiVision(event.target.checked)}
                />
                <span>
                  <strong>Use AI vision extraction</strong>
                  <span className="muted">
                    Skip on-device OCR and let your BYOK model extract structured values directly from the screenshot.
                  </span>
                </span>
              </label>
              <label className="ai-toggle">
                <input
                  type="checkbox"
                  checked={useAiExtraction}
                  onChange={(event) => setUseAiExtraction(event.target.checked)}
                />
                <span>
                  <strong>Enhance OCR with AI JSON mode</strong>
                  <span className="muted">
                    Run Tesseract locally, then merge any non-null fields returned by your BYOK chat model.
                  </span>
                </span>
              </label>
            </div>
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
            description="Values pulled from OCR are editable. Adjust the distribution weights to drive the entry, management, and moonbag allocations that route dollars to each investor class."
            advancedInputs={advancedInputs}
            weightInputs={weightInputs}
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
            onWeightChange={handleWeightChange}
            onWeightBlur={handleWeightBlur}
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
