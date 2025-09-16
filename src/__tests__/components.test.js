import { describe, it, expect, vi } from 'vitest';
import { Controls } from '../components/Controls.js';
import { Bars } from '../components/Bars.js';

describe('Controls component', () => {
  it('renders input values and wires event handlers', () => {
    const onProfitChange = vi.fn();
    const onCarryChange = vi.fn();
    const onScenarioChange = vi.fn();
    const onRecalc = vi.fn();
    const onDownload = vi.fn();

    const controls = Controls({
      profit: 1234,
      carry: 15,
      scenario: 'deployed',
      scenarioOptions: [
        { value: 'notdeployed', label: 'Not deployed (0 weight)' },
        { value: 'deployed', label: 'Deployed on 2025-08-02 (5,000 capital)' }
      ],
      weightsText: 'Weights → Founders: 50.00%, Laura: 30.00%, Damon: 20.00% (sum 100.00%)',
      onProfitChange,
      onCarryChange,
      onScenarioChange,
      onRecalc,
      onDownload
    });

    expect(controls.element.classList.contains('controls')).toBe(true);
    expect(controls.profitInput.value).toBe('1234');
    expect(controls.carryInput.value).toBe('15');
    expect(controls.scenarioSelect.value).toBe('deployed');
    expect(controls.weightsInfo.textContent).toContain('Weights');

    controls.profitInput.dispatchEvent(new Event('input'));
    controls.carryInput.dispatchEvent(new Event('input'));
    controls.scenarioSelect.dispatchEvent(new Event('change'));
    controls.recalcBtn.dispatchEvent(new Event('click'));
    controls.downloadBtn.dispatchEvent(new Event('click'));

    expect(onProfitChange).toHaveBeenCalledTimes(1);
    expect(onCarryChange).toHaveBeenCalledTimes(1);
    expect(onScenarioChange).toHaveBeenCalledTimes(1);
    expect(onRecalc).toHaveBeenCalledTimes(1);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});

describe('Bars component', () => {
  it('renders rows with formatted values and widths', () => {
    const rows = [
      { label: 'Founders', value: 2800, className: 'founders' },
      { label: 'Laura', value: 1000, className: 'laura' },
      { label: 'Damon', value: 300, className: 'damon' }
    ];
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    const formatValue = (value) => '$' + Number(value).toFixed(2);

    const bars = Bars({ id: 'bars', rows, total, formatValue });

    expect(bars.id).toBe('bars');
    const rowEls = bars.querySelectorAll('.bar-row');
    expect(rowEls).toHaveLength(3);
    expect(rowEls[0].querySelector('.bar-label').textContent).toBe('Founders');
    expect(rowEls[0].querySelector('.bar-value').textContent).toBe('$2800.00');
    expect(rowEls[0].querySelector('.bar-fill').style.width).toBe('68.2927%');
    expect(rowEls[1].querySelector('.bar-fill').style.width).toBe('24.3902%');
    expect(rowEls[2].querySelector('.bar-fill').style.width).toBe('7.3171%');
  });
});
