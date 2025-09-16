export function Controls({
  profit = 0,
  carry = 0,
  scenario = '',
  scenarioOptions = [],
  weightsText = '',
  onProfitChange,
  onCarryChange,
  onScenarioChange,
  onRecalc,
  onDownload
} = {}) {
  const container = document.createElement('div');
  container.className = 'controls';

  const profitControl = document.createElement('div');
  profitControl.className = 'control';
  const profitLabel = document.createElement('label');
  profitLabel.setAttribute('for', 'profitInput');
  profitLabel.textContent = 'Profit (P)';
  const profitInput = document.createElement('input');
  profitInput.id = 'profitInput';
  profitInput.type = 'number';
  profitInput.step = '1';
  profitInput.min = '0';
  profitInput.value = profit != null ? String(profit) : '';
  if (typeof onProfitChange === 'function') {
    profitInput.addEventListener('input', onProfitChange);
  }
  profitControl.appendChild(profitLabel);
  profitControl.appendChild(profitInput);

  const carryControl = document.createElement('div');
  carryControl.className = 'control';
  const carryLabel = document.createElement('label');
  carryLabel.setAttribute('for', 'carryInput');
  carryLabel.textContent = 'Carry on Laura & Damon (%)';
  const carryInput = document.createElement('input');
  carryInput.id = 'carryInput';
  carryInput.type = 'number';
  carryInput.step = '1';
  carryInput.min = '0';
  carryInput.max = '100';
  carryInput.value = carry != null ? String(carry) : '';
  if (typeof onCarryChange === 'function') {
    carryInput.addEventListener('input', onCarryChange);
  }
  carryControl.appendChild(carryLabel);
  carryControl.appendChild(carryInput);

  const scenarioControl = document.createElement('div');
  scenarioControl.className = 'control';
  const scenarioLabel = document.createElement('label');
  scenarioLabel.setAttribute('for', 'scenario');
  scenarioLabel.textContent = 'Damon status';
  const scenarioSelect = document.createElement('select');
  scenarioSelect.id = 'scenario';
  scenarioOptions.forEach((opt) => {
    const optionEl = document.createElement('option');
    optionEl.value = opt.value;
    optionEl.textContent = opt.label;
    if (opt.value === scenario) {
      optionEl.selected = true;
    }
    scenarioSelect.appendChild(optionEl);
  });
  if (scenarioSelect.options.length === 0 && scenario) {
    const optionEl = document.createElement('option');
    optionEl.value = scenario;
    optionEl.textContent = scenario;
    optionEl.selected = true;
    scenarioSelect.appendChild(optionEl);
  }
  if (typeof onScenarioChange === 'function') {
    scenarioSelect.addEventListener('change', onScenarioChange);
  }
  const weightsInfo = document.createElement('div');
  weightsInfo.className = 'weights muted';
  weightsInfo.id = 'weightsInfo';
  weightsInfo.textContent = weightsText ?? '';
  scenarioControl.appendChild(scenarioLabel);
  scenarioControl.appendChild(scenarioSelect);
  scenarioControl.appendChild(weightsInfo);

  const buttonControl = document.createElement('div');
  buttonControl.className = 'control';
  const spacerLabel = document.createElement('label');
  spacerLabel.innerHTML = '&nbsp;';
  const inlineWrapper = document.createElement('div');
  inlineWrapper.className = 'inline';
  const recalcBtn = document.createElement('button');
  recalcBtn.id = 'recalcBtn';
  recalcBtn.type = 'button';
  recalcBtn.textContent = 'Recalculate';
  if (typeof onRecalc === 'function') {
    recalcBtn.addEventListener('click', onRecalc);
  }
  const downloadBtn = document.createElement('button');
  downloadBtn.id = 'downloadBtn';
  downloadBtn.type = 'button';
  downloadBtn.textContent = 'Download CSV';
  if (typeof onDownload === 'function') {
    downloadBtn.addEventListener('click', onDownload);
  }
  inlineWrapper.appendChild(recalcBtn);
  inlineWrapper.appendChild(downloadBtn);
  buttonControl.appendChild(spacerLabel);
  buttonControl.appendChild(inlineWrapper);

  container.appendChild(profitControl);
  container.appendChild(carryControl);
  container.appendChild(scenarioControl);
  container.appendChild(buttonControl);

  return {
    element: container,
    profitInput,
    carryInput,
    scenarioSelect,
    weightsInfo,
    recalcBtn,
    downloadBtn
  };
}
