export function Bars({ id, rows = [], total = 0, formatValue = (value) => String(value ?? '') } = {}) {
  const container = document.createElement('div');
  container.className = 'bars';
  if (id) {
    container.id = id;
  }

  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'bar-row';

    const labelEl = document.createElement('div');
    labelEl.className = 'bar-label';
    labelEl.textContent = row.label ?? '';

    const trackEl = document.createElement('div');
    trackEl.className = 'bar-track';

    const fillEl = document.createElement('div');
    const fillClass = ['bar-fill', row.className || ''].join(' ').trim();
    fillEl.className = fillClass;
    const rowValue = Number(row.value || 0);
    const widthPct = total > 0 ? (rowValue / total) * 100 : 0;
    fillEl.style.width = `${widthPct.toFixed(4)}%`;

    const valueEl = document.createElement('div');
    valueEl.className = 'bar-value';
    valueEl.textContent = formatValue(rowValue);

    trackEl.appendChild(fillEl);
    rowEl.appendChild(labelEl);
    rowEl.appendChild(trackEl);
    rowEl.appendChild(valueEl);
    container.appendChild(rowEl);
  });

  return container;
}
