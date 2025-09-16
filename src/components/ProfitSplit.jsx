import { useCallback, useState } from 'react';
import styles from './ProfitSplit.module.css';

const WEIGHTS = {
  notdeployed: { F: 340 / 515, L: 175 / 515, D: 0 / 515 },
  deployed: { F: 340 / 570, L: 175 / 570, D: 55 / 570 },
};

const SCENARIOS = [
  { value: 'notdeployed', label: 'Not deployed (0 weight)' },
  { value: 'deployed', label: 'Deployed on 2025-08-02 (5,000 capital)' },
];

const DEFAULT_PROFIT = '4113';
const DEFAULT_CARRY = '20';

const formatCurrency = (value) =>
  `$${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const formatPercent = (fraction) => `${(fraction * 100).toFixed(2)}%`;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeProfit = (value) => Math.max(0, toNumber(value));
const sanitizeCarry = (value) => {
  const numeric = Math.max(0, toNumber(value));
  return Math.min(100, numeric);
};

function ProfitSplit() {
  const [profitInput, setProfitInput] = useState(DEFAULT_PROFIT);
  const [carryInput, setCarryInput] = useState(DEFAULT_CARRY);
  const [scenario, setScenario] = useState('notdeployed');

  const profit = sanitizeProfit(profitInput);
  const carryPct = sanitizeCarry(carryInput);
  const carryDecimal = carryPct / 100;
  const weights = WEIGHTS[scenario] ?? WEIGHTS.notdeployed;

  const founders = profit * (weights.F + carryDecimal * (weights.L + weights.D));
  const laura = profit * ((1 - carryDecimal) * weights.L);
  const damon = profit * ((1 - carryDecimal) * weights.D);
  const total = founders + laura + damon;

  const foundersShare = total > 0 ? (founders / total) * 100 : 0;
  const lauraShare = total > 0 ? (laura / total) * 100 : 0;
  const damonShare = total > 0 ? (damon / total) * 100 : 0;

  const weightsSummary = `Weights → Founders: ${formatPercent(weights.F)}, Laura: ${formatPercent(weights.L)}, Damon: ${formatPercent(
    weights.D,
  )} (sum ${( (weights.F + weights.L + weights.D) * 100 ).toFixed(2)}%)`;

  const handleProfitChange = (event) => {
    setProfitInput(event.target.value);
  };

  const handleProfitBlur = (event) => {
    setProfitInput(String(sanitizeProfit(event.target.value)));
  };

  const handleCarryChange = (event) => {
    setCarryInput(event.target.value);
  };

  const handleCarryBlur = (event) => {
    setCarryInput(String(sanitizeCarry(event.target.value)));
  };

  const handleScenarioChange = (event) => {
    setScenario(event.target.value);
  };

  const handleRecalculate = useCallback(() => {
    setProfitInput((value) => String(sanitizeProfit(value)));
    setCarryInput((value) => String(sanitizeCarry(value)));
  }, []);

  const handleDownload = useCallback(() => {
    const csvRows = [
      ['Party', 'Amount', 'Profit', 'Carry_%', 'Scenario', 'W_Founders', 'W_Laura', 'W_Damon'],
      [
        'Founders (Yoni+Spence)',
        founders.toFixed(2),
        profit.toFixed(2),
        carryPct,
        scenario,
        `${(weights.F * 100).toFixed(4)}%`,
        `${(weights.L * 100).toFixed(4)}%`,
        `${(weights.D * 100).toFixed(4)}%`,
      ],
      ['Laura', laura.toFixed(2), profit.toFixed(2), carryPct, scenario, '', '', ''],
      ['Damon', damon.toFixed(2), profit.toFixed(2), carryPct, scenario, '', '', ''],
    ];
    const csv = csvRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'profit_split_founders_laura_damon.csv';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [carryPct, damon, founders, laura, profit, scenario, weights]);

  const barRows = [
    { key: 'founders', label: 'Founders (Yoni+Spence)', value: founders, className: styles.founders },
    { key: 'laura', label: 'Laura', value: laura, className: styles.laura },
    { key: 'damon', label: 'Damon', value: damon, className: styles.damon },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.control}>
          <label className={styles.controlLabel} htmlFor="profitInput">
            Profit (P)
          </label>
          <input
            id="profitInput"
            type="number"
            min="0"
            step="1"
            value={profitInput}
            onChange={handleProfitChange}
            onBlur={handleProfitBlur}
            className={styles.controlInput}
          />
        </div>
        <div className={styles.control}>
          <label className={styles.controlLabel} htmlFor="carryInput">
            Carry on Laura &amp; Damon (%)
          </label>
          <input
            id="carryInput"
            type="number"
            min="0"
            max="100"
            step="1"
            value={carryInput}
            onChange={handleCarryChange}
            onBlur={handleCarryBlur}
            className={styles.controlInput}
          />
        </div>
        <div className={styles.control}>
          <label className={styles.controlLabel} htmlFor="scenario">
            Damon status
          </label>
          <select
            id="scenario"
            value={scenario}
            onChange={handleScenarioChange}
            className={styles.controlInput}
          >
            {SCENARIOS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={styles.weights}>{weightsSummary}</div>
        </div>
        <div className={styles.control}>
          <label className={styles.controlLabel} htmlFor="actions">
            &nbsp;
          </label>
          <div className={styles.inlineControls}>
            <button type="button" onClick={handleRecalculate} className={styles.button}>
              Recalculate
            </button>
            <button type="button" onClick={handleDownload} className={styles.button}>
              Download CSV
            </button>
          </div>
        </div>
      </div>

      <div className={styles.bars}>
        {barRows.map((row) => {
          const width = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <div key={row.key} className={styles.barRow}>
              <div className={styles.barLabel}>{row.label}</div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${row.className}`}
                  style={{ width: `${width.toFixed(4)}%` }}
                />
              </div>
              <div className={styles.barValue}>{formatCurrency(row.value)}</div>
            </div>
          );
        })}
      </div>

      <div className={styles.stacked}>
        <div className={styles.barRow}>
          <div className={styles.barLabel}>Stacked (Total Profit)</div>
          <div className={`${styles.barTrack} ${styles.stackedTrack}`}>
            <div
              className={`${styles.segment} ${styles.founders}`}
              style={{ width: `${foundersShare.toFixed(4)}%` }}
            />
            <div className={`${styles.segment} ${styles.laura}`} style={{ width: `${lauraShare.toFixed(4)}%` }} />
            <div className={`${styles.segment} ${styles.damon}`} style={{ width: `${damonShare.toFixed(4)}%` }} />
          </div>
          <div className={styles.barValue}>{formatCurrency(total)}</div>
        </div>
      </div>

      <div className={styles.formulas}>
        <div>Formulas (P = profit, c = carry as decimal):</div>
        <div>Founders = P·W<sub>F</sub> + c·P·(W<sub>L</sub> + W<sub>D</sub>)</div>
        <div>Laura = (1 − c)·P·W<sub>L</sub></div>
        <div>Damon = (1 − c)·P·W<sub>D</sub></div>
      </div>
    </div>
  );
}

export default ProfitSplit;
