const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const clampPercent = (percent) => {
  if (!Number.isFinite(percent)) return 0
  if (percent < 0) return 0
  if (percent > 1) return 1
  return percent
}

export const applyFees = (
  amount,
  { entryFeePercent = 0, managementFeePercent = 0 } = {},
) => {
  const baseAmount = amount != null ? toNumber(amount) : 0
  if (baseAmount <= 0) {
    return {
      originalAmount: 0,
      netAmount: 0,
      entryFee: 0,
      managementFee: 0,
      totalFees: 0,
      afterEntry: 0,
      rates: {
        entryFee: 0,
        managementFee: 0,
      },
    }
  }

  const entryRate = clampPercent(toNumber(entryFeePercent) / 100)
  const entryFee = baseAmount * entryRate
  const afterEntry = baseAmount - entryFee

  const managementRate = clampPercent(toNumber(managementFeePercent) / 100)
  const managementFee = afterEntry * managementRate
  const netAmount = afterEntry - managementFee

  return {
    originalAmount: baseAmount,
    netAmount,
    entryFee,
    managementFee,
    totalFees: entryFee + managementFee,
    afterEntry,
    rates: {
      entryFee: entryRate,
      managementFee: managementRate,
    },
  }
}
