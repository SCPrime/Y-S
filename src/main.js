import { calcSplit, WEIGHTS } from './calcSplit.js';
import { Controls } from './components/Controls.js';
import { Bars } from './components/Bars.js';

const scenarioOptions = [
  { value: 'notdeployed', label: 'Not deployed (0 weight)' },
  { value: 'deployed', label: 'Deployed on 2025-08-02 (5,000 capital)' }
];

const DEFAULTS = {
  profit: 4113,
  carry: 20,
  scenario: 'notdeployed'
};

const controlsRoot = document.getElementById('controlsRoot');
const barsMount = document.getElementById('barsMount');
const segFounders = document.getElementById('segFounders');
const segLaura = document.getElementById('segLaura');
const segDamon = document.getElementById('segDamon');
const stackLabel = document.getElementById('stackLabel');

const controls = Controls({
  profit: DEFAULTS.profit,
  carry: DEFAULTS.carry,
  scenario: DEFAULTS.scenario,
  scenarioOptions,
  weightsText: formatWeights(WEIGHTS[DEFAULTS.scenario]),
  onProfitChange: render,
  onCarryChange: render,
  onScenarioChange: render,
  onRecalc: render,
  onDownload: toCsv
});

if (controlsRoot) {
  controlsRoot.replaceChildren(controls.element);
}

render();

function fmt(value) {
  const n = Number(value || 0);
  return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function pct(value) {
  return (value * 100).toFixed(2) + '%';
}

function formatWeights(W) {
  if (!W) return '';
  const sum = ((W.F + W.L + W.D) * 100).toFixed(2);
  return `Weights → Founders: ${pct(W.F)}, Laura: ${pct(W.L)}, Damon: ${pct(W.D)} (sum ${sum}%)`;
}

function render() {
  if (!controls || !barsMount) return;

  const profit = Math.max(0, Number(controls.profitInput.value || 0));
  const carryPct = Math.min(100, Math.max(0, Number(controls.carryInput.value || 0)));
  const scenario = controls.scenarioSelect.value;

  const { founders, laura, damon, W } = calcSplit(profit, carryPct, scenario);
  const total = founders + laura + damon;

  controls.weightsInfo.textContent = formatWeights(W);

  const rows = [
    { label: 'Founders (Yoni+Spence)', value: founders, className: 'founders' },
    { label: 'Laura', value: laura, className: 'laura' },
    { label: 'Damon', value: damon, className: 'damon' }
  ];

  const barsElement = Bars({
    id: 'bars',
    rows,
    total,
    formatValue: fmt
  });
  barsMount.replaceChildren(barsElement);

  updateStacked({ founders, laura, damon, total });
}

function updateStacked({ founders, laura, damon, total }) {
  if (!segFounders || !segLaura || !segDamon || !stackLabel) return;

  const safeTotal = total > 0 ? total : 0;
  const pF = safeTotal > 0 ? (founders / safeTotal) * 100 : 0;
  const pL = safeTotal > 0 ? (laura / safeTotal) * 100 : 0;
  const pD = safeTotal > 0 ? (damon / safeTotal) * 100 : 0;

  segFounders.style.width = `${pF.toFixed(4)}%`;
  segLaura.style.width = `${pL.toFixed(4)}%`;
  segDamon.style.width = `${pD.toFixed(4)}%`;
  stackLabel.textContent = fmt(safeTotal);
}

function toCsv(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const profit = Math.max(0, Number(controls.profitInput.value || 0));
  const carryPct = Math.min(100, Math.max(0, Number(controls.carryInput.value || 0)));
  const scenario = controls.scenarioSelect.value;

  const { founders, laura, damon, W } = calcSplit(profit, carryPct, scenario);

  const rows = [
    ['Party', 'Amount', 'Profit', 'Carry_%', 'Scenario', 'W_Founders', 'W_Laura', 'W_Damon'],
    [
      'Founders (Yoni+Spence)',
      founders.toFixed(2),
      profit.toFixed(2),
      carryPct,
      scenario,
      (W.F * 100).toFixed(4) + '%',
      (W.L * 100).toFixed(4) + '%',
      (W.D * 100).toFixed(4) + '%'
    ],
    ['Laura', laura.toFixed(2), profit.toFixed(2), carryPct, scenario, '', '', ''],
    ['Damon', damon.toFixed(2), profit.toFixed(2), carryPct, scenario, '', '', '']
  ];

  const csv = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profit_split_founders_laura_damon.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
