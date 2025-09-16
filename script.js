(() => {
  'use strict';

  // Fixed capital-day weights for two scenarios:
  // Scenario A: Damon not deployed → weights (Founders=340/515, Laura=175/515, Damon=0/515)
  // Scenario B: Damon deployed (Aug 2, 2025; 5,000) → weights (Founders=340/570, Laura=175/570, Damon=55/570)
  const WEIGHTS = {
    notdeployed: { F: 340 / 515, L: 175 / 515, D: 0 / 515 },
    deployed: { F: 340 / 570, L: 175 / 570, D: 55 / 570 }
  };

  const profitInput = document.getElementById('profitInput');
  const carryInput = document.getElementById('carryInput');
  const scenarioSel = document.getElementById('scenario');
  const weightsInfo = document.getElementById('weightsInfo');
  const barsEl = document.getElementById('bars');
  const segF = document.getElementById('segFounders');
  const segL = document.getElementById('segLaura');
  const segD = document.getElementById('segDamon');
  const stackLabel = document.getElementById('stackLabel');
  const recalcBtn = document.getElementById('recalcBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  function fmt(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function pct(n) {
    return (n * 100).toFixed(2) + '%';
  }

  function calcSplit(profit, carryPct, scenario) {
    const safeScenario = WEIGHTS[scenario] ? scenario : 'notdeployed';
    const c = (carryPct || 0) / 100;
    const weights = WEIGHTS[safeScenario];
    const founders = profit * (weights.F + c * (weights.L + weights.D));
    const laura = profit * ((1 - c) * weights.L);
    const damon = profit * ((1 - c) * weights.D);
    return { founders, laura, damon, weights };
  }

  function render() {
    const profit = Math.max(0, Number(profitInput.value || 0));
    const carryPct = Math.min(100, Math.max(0, Number(carryInput.value || 0)));
    const scenario = scenarioSel.value;
    const { founders, laura, damon, weights } = calcSplit(profit, carryPct, scenario);
    const total = founders + laura + damon;

    const weightsSumPct = ((weights.F + weights.L + weights.D) * 100).toFixed(2);
    weightsInfo.textContent = `Weights → Founders: ${pct(weights.F)}, Laura: ${pct(weights.L)}, Damon: ${pct(weights.D)} (sum ${weightsSumPct}%)`;

    barsEl.innerHTML = '';

    const rows = [
      { label: 'Founders (Yoni+Spence)', value: founders, className: 'founders' },
      { label: 'Laura', value: laura, className: 'laura' },
      { label: 'Damon', value: damon, className: 'damon' }
    ];

    rows.forEach(rowInfo => {
      const row = document.createElement('div');
      row.className = 'bar-row';

      const label = document.createElement('div');
      label.className = 'bar-label';
      label.textContent = rowInfo.label;

      const track = document.createElement('div');
      track.className = 'bar-track';

      const fill = document.createElement('div');
      fill.className = 'bar-fill ' + rowInfo.className;
      const pctWidth = total > 0 ? (rowInfo.value / total) * 100 : 0;
      fill.style.width = pctWidth.toFixed(4) + '%';

      const value = document.createElement('div');
      value.className = 'bar-value';
      value.textContent = fmt(rowInfo.value);

      track.appendChild(fill);
      row.append(label, track, value);
      barsEl.appendChild(row);
    });

    const foundersPct = total > 0 ? (founders / total) * 100 : 0;
    const lauraPct = total > 0 ? (laura / total) * 100 : 0;
    const damonPct = total > 0 ? (damon / total) * 100 : 0;

    segF.style.width = foundersPct.toFixed(4) + '%';
    segL.style.width = lauraPct.toFixed(4) + '%';
    segD.style.width = damonPct.toFixed(4) + '%';
    stackLabel.textContent = fmt(total);
  }

  function toCsv() {
    const profit = Math.max(0, Number(profitInput.value || 0));
    const carryPct = Math.min(100, Math.max(0, Number(carryInput.value || 0)));
    const scenario = scenarioSel.value;
    const { founders, laura, damon, weights } = calcSplit(profit, carryPct, scenario);

    const rows = [
      ['Party', 'Amount', 'Profit', 'Carry_%', 'Scenario', 'W_Founders', 'W_Laura', 'W_Damon'],
      [
        'Founders (Yoni+Spence)',
        founders.toFixed(2),
        profit.toFixed(2),
        carryPct,
        scenario,
        (weights.F * 100).toFixed(4) + '%',
        (weights.L * 100).toFixed(4) + '%',
        (weights.D * 100).toFixed(4) + '%'
      ],
      ['Laura', laura.toFixed(2), profit.toFixed(2), carryPct, scenario, '', '', ''],
      ['Damon', damon.toFixed(2), profit.toFixed(2), carryPct, scenario, '', '', '']
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profit_split_founders_laura_damon.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  recalcBtn.addEventListener('click', render);
  downloadBtn.addEventListener('click', toCsv);
  profitInput.addEventListener('input', render);
  carryInput.addEventListener('input', render);
  scenarioSel.addEventListener('change', render);

  render();
})();
