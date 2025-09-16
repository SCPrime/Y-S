import { describe, it, expect } from 'vitest';
import { calcSplit } from '../calcSplit.js';

const PROFIT = 4113;
const CARRY = 20;

describe('calcSplit', () => {
  it('calculates distribution for notdeployed scenario', () => {
    const result = calcSplit(PROFIT, CARRY, 'notdeployed');
    expect(result.founders).toBeCloseTo(2994.902913, 6);
    expect(result.laura).toBeCloseTo(1118.097087, 6);
    expect(result.damon).toBeCloseTo(0, 6);
    expect(result.founders + result.laura + result.damon).toBeCloseTo(PROFIT, 6);
  });

  it('calculates distribution for deployed scenario', () => {
    const result = calcSplit(PROFIT, CARRY, 'deployed');
    expect(result.founders).toBeCloseTo(2785.294737, 6);
    expect(result.laura).toBeCloseTo(1010.210526, 6);
    expect(result.damon).toBeCloseTo(317.494737, 6);
    expect(result.founders + result.laura + result.damon).toBeCloseTo(PROFIT, 6);
  });
});
