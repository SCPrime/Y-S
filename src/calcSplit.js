export const WEIGHTS = {
  notdeployed: { F: 340 / 515, L: 175 / 515, D: 0 / 515 },
  deployed: { F: 340 / 570, L: 175 / 570, D: 55 / 570 }
};

export function calcSplit(P, carryPct, scenario) {
  const c = (carryPct || 0) / 100;
  const W = WEIGHTS[scenario] ?? WEIGHTS.notdeployed;
  const founders = P * (W.F + c * (W.L + W.D));
  const laura = P * ((1 - c) * W.L);
  const damon = P * ((1 - c) * W.D);
  return { founders, laura, damon, W };
}
