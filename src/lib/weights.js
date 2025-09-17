const SCENARIO_WEIGHTS = {
  notdeployed: { F: 340 / 515, L: 175 / 515, D: 0 / 515 },
  deployed: { F: 340 / 570, L: 175 / 570, D: 55 / 570 },
}

const ZERO_NORMALIZED_WEIGHTS = { founder: 0, investor: 0, moonbag: 0 }

export const getWeights = (scenarioKey) => SCENARIO_WEIGHTS[scenarioKey] ?? SCENARIO_WEIGHTS.notdeployed

export const parseWeightInputs = (inputs = {}) => ({
  founder: Math.max(0, Number(inputs.founder) || 0),
  investor: Math.max(0, Number(inputs.investor) || 0),
  moonbag: Math.max(0, Number(inputs.moonbag) || 0),
})

export const normalizeWeightNumbers = (numbers) => {
  const sum = numbers.founder + numbers.investor + numbers.moonbag
  if (sum <= 0) {
    return { ...ZERO_NORMALIZED_WEIGHTS }
  }

  return {
    founder: numbers.founder / sum,
    investor: numbers.investor / sum,
    moonbag: numbers.moonbag / sum,
  }
}

export const normalizeWeightInputs = (inputs = {}) => {
  const numbers = parseWeightInputs(inputs)
  const sum = numbers.founder + numbers.investor + numbers.moonbag
  const normalized = sum > 0 ? normalizeWeightNumbers(numbers) : { ...ZERO_NORMALIZED_WEIGHTS }

  return { numbers, normalized, sum }
}

export { SCENARIO_WEIGHTS }
