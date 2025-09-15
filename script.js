// Fixed capital-day weights for two scenarios:
// Scenario A: Damon not deployed → weights (Founders=340/515, Laura=175/515, Damon=0/515)
// Scenario B: Damon deployed (Aug 2, 2025; 5,000) → weights (Founders=340/570, Laura=175/570, Damon=55/570)
const WEIGHTS = {
  notdeployed: { F: 340/515, L: 175/515, D: 0/515 },
  deployed:    { F: 340/570, L: 175/570, D: 55/570 }
};

const parties = [
  { key: 'Founders (Yoni+Spence)', className: 'founders', id: 'Founders' },
  { key: 'Laura',  className: 'laura',  id: 'Laura' },
  { key: 'Damon',  className: 'damon',  id: 'Damon' }
];

const profitInput = document.getElementById('profitInput');
const carryInput = document.getElementById('carryInput');
const scenarioSel = document.getElementById('scenario');
const weightsInfo = document.getElementById('weightsInfo');
const barsEl = document.getElementById('bars');

function fmt(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pct(n) { return (n*100).toFixed(2) + '%'; }

function calcSplit(P, carryPct, scenario) {
  const c = (carryPct || 0)/100.0;
  const W = WEIGHTS[scenario];
  const founders = P*(W.F + c*(W.L + W.D));
  const laura    = P*((1 - c)*W.L);
  const damon    = P*((1 - c)*W.D);
  return { founders, laura, damon, W };
}

function render() {
  const P = Math.max(0, Number(profitInput.value || 0));
  const carryPct = Math.min(100, Math.max(0, Number(carryInput.value || 0)));
  const scenario = scenarioSel.value;
  const { founders, laura, damon, W } = calcSplit(P, carryPct, scenario);
  const total = founders + laura + damon;

  // Show current weights
  weightsInfo.textContent = `Weights → Founders: ${pct(W.F)}, Laura: ${pct(W.L)}, Damon: ${pct(W.D)} (sum ${( (W.F+W.L+W.D)*100 ).toFixed(2)}%)`;

  // Clear bars
  barsEl.innerHTML = '';

  const rows = [
    { label: 'Founders (Yoni+Spence)', value: founders, className: 'founders' },
    { label: 'Laura', value: laura, className: 'laura' },
    { label: 'Damon', value: damon, className: 'damon' }
  ];

  rows.forEach(r => {
    const row = document.createElement('div');
    row.className = 'bar-row';

    const label = document.createElement('div');
    label.className = 'bar-label';
    label.textContent = r.label;

    const track = document.createElement('div');
    track.className = 'bar-track';

    const fill = document.createElement('div');
    fill.className = 'bar-fill ' + r.className;
    const pctw = total > 0 ? (r.value / total) * 100 : 0;
    fill.style.width = pctw.toFixed(4) + '%';

    const value = document.createElement('div');
    value.className = 'bar-value';
    value.textContent = fmt(r.value);

    track.appendChild(fill);
    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(value);
    barsEl.appendChild(row);
  });

  // Stacked
  const segF = document.getElementById('segFounders');
  const segL = document.getElementById('segLaura');
  const segD = document.getElementById('segDamon');
  const stackLabel = document.getElementById('stackLabel');

  const pF = total > 0 ? (founders / total) * 100 : 0;
  const pL = total > 0 ? (laura / total) * 100 : 0;
  const pD = total > 0 ? (damon / total) * 100 : 0;

  segF.style.width = pF.toFixed(4) + '%';
  segL.style.width = pL.toFixed(4) + '%';
  segD.style.width = pD.toFixed(4) + '%';
  stackLabel.textContent = fmt(total);
}

function toCsv() {
  const P = Math.max(0, Number(profitInput.value || 0));
  const carryPct = Math.min(100, Math.max(0, Number(carryInput.value || 0)));
  const scenario = scenarioSel.value;
  const { founders, laura, damon, W } = calcSplit(P, carryPct, scenario);

  const rows = [
    ['Party','Amount','Profit','Carry_%','Scenario','W_Founders','W_Laura','W_Damon'],
    ['Founders (Yoni+Spence)', founders.toFixed(2), P.toFixed(2), carryPct, scenario, (W.F*100).toFixed(4)+'%', (W.L*100).toFixed(4)+'%', (W.D*100).toFixed(4)+'%'],
    ['Laura', laura.toFixed(2), P.toFixed(2), carryPct, scenario, '', '', ''],
    ['Damon', damon.toFixed(2), P.toFixed(2), carryPct, scenario, '', '', '']
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'profit_split_founders_laura_damon.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.getElementById('recalcBtn').addEventListener('click', render);
document.getElementById('downloadBtn').addEventListener('click', toCsv);
profitInput.addEventListener('input', render);
carryInput.addEventListener('input', render);
scenarioSel.addEventListener('change', render);

render();
